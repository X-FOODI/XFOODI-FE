// @ts-nocheck
"use client";

import dishService, { ComboSummaryDto } from "@/lib/services/dishService";
import menuService from "@/lib/services/menuService";
import orderService, { OrderRequestDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import type { CartItem } from "@/lib/types/menu";
import { HubConnectionState } from "@microsoft/signalr";
import { message } from "antd";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useTenant } from "./TenantContext";

interface CartContextType {
  // Cart state
  cartItems: CartItem[];
  orderedItems: CartItem[];
  cartModalOpen: boolean;
  activeCartTab: string;
  isSubmittingOrder: boolean;

  // Order context
  orderTableId?: string;
  orderCustomerId?: string;
  setOrderContext: (context: { tableId: string; customerId?: string }) => void;

  // Computed values
  cartItemCount: number;
  totalCartAmount: number;
  totalOrderAmount: number;
  activeOrderId: string | null;

  // Cart actions
  addToCart: (item: CartItem) => void;
  addComboToCart: (combo: ComboSummaryDto, successMessage?: string, dishImageMap?: Record<string, string>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNote: (itemId: string, note: string) => void;
  clearCart: () => void;

  // Order actions
  confirmOrder: () => void;
  requestPayment: () => void;
  fetchOrderedItems: () => Promise<void>;

  // Modal actions
  openCartModal: () => void;
  closeCartModal: () => void;
  setActiveCartTab: (tab: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const [messageApi, contextHolder] = message.useMessage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [orderedSubTotal, setOrderedSubTotal] = useState<number>(0);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [activeCartTab, setActiveCartTabState] = useState<string>("1");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderTableId, setOrderTableId] = useState<string | undefined>();
  const [orderCustomerId, setOrderCustomerId] = useState<string | undefined>();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const loadedOrderTableIdRef = useRef<string | undefined>(undefined);

  // Computed values
  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const totalCartAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const totalOrderAmount = orderedSubTotal;

  // Order context
  const setOrderContext = useCallback(
    (context: { tableId: string; customerId?: string }) => {
      setOrderTableId(context.tableId);
      if (context.customerId) {
        setOrderCustomerId(context.customerId);
      }
    },
    [],
  );

  // Cart actions
  const addToCart = useCallback(
    (item: CartItem) => {
      const rawQuantity = Number(item.quantity ?? 1);
      const quantityToAdd =
        Number.isFinite(rawQuantity) && rawQuantity > 0
          ? Math.floor(rawQuantity)
          : 1;

      setCartItems((prev) => {
        const existingItem = prev.find((cartItem) => cartItem.id === item.id);

        if (existingItem) {
          return prev.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
              : cartItem,
          );
        } else {
          return [...prev, { ...item, quantity: quantityToAdd }];
        }
      });
      messageApi.success(
        quantityToAdd > 1
          ? `Đã thêm ${quantityToAdd} món ${item.name} vào giỏ hàng`
          : `Đã thêm ${item.name} vào giỏ hàng`,
      );
    },
    [messageApi],
  );

  const addComboToCart = useCallback(
    (combo: ComboSummaryDto, successMessage?: string, dishImageMap?: Record<string, string>) => {
      setCartItems((prev) => {
        const existing = prev.find((c) => c.id === combo.id);
        if (existing) {
          return prev.map((c) =>
            c.id === combo.id ? { ...c, quantity: c.quantity + 1 } : c,
          );
        }
        const comboItem: CartItem = {
          id: combo.id,
          name: combo.name,
          price: String(combo.price),
          quantity: 1,
          category: "food",
          categoryId: "combo",
          image: combo.imageUrl ?? undefined,
          comboId: combo.id,
          children: combo.details.map((d: any) => ({
            id: d.dishId,
            name: d.dishName || d.dishId,
            price: String(d.dishPrice ?? 0),
            quantity: d.quantity,
            category: "food" as const,
            categoryId: "combo",
            image: dishImageMap?.[d.dishId] ?? undefined,
          })),
        };
        return [...prev, comboItem];
      });
      messageApi.success(successMessage ?? combo.name);
    },
    [messageApi],
  );

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
    );
  }, []);

  const updateNote = useCallback((itemId: string, note: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, note } : item)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const fetchOrderedItems = useCallback(async () => {
    if (!orderTableId) return;

    try {
      const [orders, menuData, comboData] = await Promise.all([
        orderService.getOrdersByTable(orderTableId),
        menuService.getMenu(),
        dishService.getActiveCombos().catch(() => [] as ComboSummaryDto[]),
      ]);

      // Build dish lookup (id → dish info with image)
      const dishLookup = new Map<
        string,
        {
          name: string;
          price: string;
          categoryId: string;
          categoryName: string;
          image?: string;
        }
      >();
      menuData.forEach((category: any) => {
        category.items?.forEach((dish: any) => {
          dishLookup.set(dish.id, {
            name: dish.name,
            price: dish.price?.toString() || "0",
            categoryId: dish.categoryId || category.categoryId || "",
            categoryName: dish.categoryName || category.categoryName || "",
            image: dish.imageUrl ?? undefined,
          });
        });
      });

      // Build combo lookup (id → combo info with image)
      const comboLookup = new Map(comboData.map((c: any) => [c.id, c]));

      const result: CartItem[] = [];
      const comboAggregated = new Map<string, CartItem>();

      orders.forEach((order: any) => {
        const details = order.orderDetails ?? [];

        // Separate combo parents from children and standalone dishes
        const comboParents = details.filter(
          (d: any) => d.comboId && !d.parentId,
        );
        const childrenByParentId = new Map<string, typeof details>();
        details
          .filter((d: any) => d.parentId)
          .forEach((d: any) => {
            const list = childrenByParentId.get(d.parentId) ?? [];
            list.push(d);
            childrenByParentId.set(d.parentId, list);
          });
        const standaloneDetails = details.filter(
          (d: any) => !d.comboId && !d.parentId,
        );

        // Process combo parents — aggregate same comboId+status across all orders
        comboParents.forEach((detail: any) => {
          const combo = comboLookup.get(detail.comboId);
          const status = detail.status?.trim() || "Pending";
          const key = `combo__${detail.comboId}__${status.toLowerCase()}`;
          const children: CartItem[] = (
            childrenByParentId.get(detail.id) ?? []
          ).map((child: any) => {
            const dish = dishLookup.get(child.dishId);
            return {
              id: child.dishId,
              lineId: child.id,
              name: dish?.name || child.dishName || child.dishId,
              price: dish?.price || String(child.dishPrice ?? 0),
              quantity: child.quantity || 1,
              category: "food" as const,
              categoryId: dish?.categoryId || "",
              categoryName: dish?.categoryName,
              image: dish?.image,
              status,
            };
          });

          const incomingQty = detail.quantity || 1;
          const existing = comboAggregated.get(key);
          if (existing) {
            // Merge quantity; merge children quantities too
            const mergedChildren = [...(existing.children ?? [])];
            children.forEach((newChild) => {
              const existingChild = mergedChildren.find((c) => c.id === newChild.id);
              if (existingChild) {
                existingChild.quantity += newChild.quantity;
              } else {
                mergedChildren.push({ ...newChild });
              }
            });
            comboAggregated.set(key, {
              ...existing,
              quantity: existing.quantity + incomingQty,
              children: mergedChildren,
            });
          } else {
            comboAggregated.set(key, {
              id: detail.comboId,
              lineId: detail.id,
              name: (combo as any)?.name || detail.dishName || detail.comboId,
              price: String(detail.dishPrice ?? (combo as any)?.price ?? 0),
              quantity: incomingQty,
              category: "food" as const,
              categoryId: "combo",
              image: (combo as any)?.imageUrl ?? undefined,
              status,
              note: detail.note || undefined,
              comboId: detail.comboId,
              children,
            });
          }
        });

        // Process standalone dishes (aggregate same dish+status)
        const aggregated = new Map<string, CartItem>();
        standaloneDetails.forEach((detail: any) => {
          const dish = dishLookup.get(detail.dishId);
          const quantity = detail.quantity || 0;
          if (quantity <= 0) return;
          const status = detail.status?.trim() || "Pending";
          const key = `${detail.dishId}__${status.toLowerCase()}`;
          const existing = aggregated.get(key);
          const fallbackPrice =
            typeof detail.dishPrice === "number"
              ? detail.dishPrice.toString()
              : "0";

          if (existing) {
            let combinedNote = existing.note || "";
            if (detail.note) {
              combinedNote = combinedNote
                ? `${combinedNote}; ${detail.note}`
                : detail.note;
            }
            aggregated.set(key, {
              ...existing,
              quantity: existing.quantity + quantity,
              note: combinedNote || undefined,
            });
            return;
          }

          aggregated.set(key, {
            id: detail.dishId,
            name:
              dish?.name ||
              detail.dishName ||
              `Dish ${detail.dishId.slice(0, 8)}`,
            price: dish?.price || fallbackPrice,
            quantity,
            note: detail.note || undefined,
            category: "food",
            categoryId: dish?.categoryId || "",
            categoryName: dish?.categoryName,
            image: dish?.image,
            status,
          });
        });

        result.push(...Array.from(aggregated.values()));
      });

      // Push aggregated combos (merged across all orders)
      result.push(...Array.from(comboAggregated.values()));

      setOrderedItems(result);

      if (orders && orders.length > 0) {
        const active = orders.find(
          (o: any) => o.orderStatusId !== 3 && o.orderStatusId !== 4,
        );
        const target = active ?? orders[orders.length - 1];
        setActiveOrderId(target?.id || null);
      } else {
        setActiveOrderId(null);
      }

      // Tính subTotal FE: chỉ tính item không bị cancelled, không tính combo-child
      // result đã là flat list (combo parent + standalone), không có combo-child
      const subTotalFE = result
        .filter((item) => {
          const status = (item.status ?? "").trim().toLowerCase();
          return status !== "cancelled";
        })
        .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
      setOrderedSubTotal(subTotalFE);
    } catch (error) {
      console.error("Fetch ordered items failed:", error);
    }
  }, [orderTableId]);

  // Order actions
  const confirmOrder = useCallback(async () => {
    if (isSubmittingOrder) {
      return;
    }

    if (cartItems.length === 0) {
      messageApi.warning("Giỏ hàng đang trống!");
      return;
    }

    if (!orderTableId) {
      messageApi.error("Không tìm thấy thông tin bàn. Vui lòng quét lại QR.");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const orderDetails = cartItems.map((cartItem) => ({
        ...(cartItem.comboId
          ? { comboId: cartItem.comboId }
          : { dishId: cartItem.id }),
        quantity: cartItem.quantity,
        note: cartItem.note,
      }));

      const payload: OrderRequestDto = {
        tableId: orderTableId,
        customerId: orderCustomerId,
        orderDetails,
      };

      await orderService.createOrder(payload);

      setCartItems([]);
      messageApi.success(
        "Đặt món thành công! Yêu cầu đã được gửi đến nhân viên.",
      );
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.response?.data;
      console.error("Create order failed:", serverMsg, error);
      messageApi.error(
        typeof serverMsg === "string" && serverMsg.length < 200
          ? `Đặt món thất bại: ${serverMsg}`
          : "Đặt món thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [cartItems, isSubmittingOrder, messageApi, orderTableId, orderCustomerId]);

  const requestPayment = useCallback(() => {
    if (orderedItems.length === 0) {
      messageApi.warning("Chưa có món nào được đặt!");
      return;
    }
    messageApi.success("Yêu cầu thanh toán đã được gửi đến nhân viên!");
    setCartModalOpen(false);
  }, [orderedItems, messageApi]);

  useEffect(() => {
    if (!orderTableId) return;
    if (loadedOrderTableIdRef.current === orderTableId) return;

    loadedOrderTableIdRef.current = orderTableId;
    fetchOrderedItems();
  }, [orderTableId, fetchOrderedItems]);

  useEffect(() => {
    if (!orderTableId || !tenant?.id) return;

    const tenantId = tenant.id;
    let isMounted = true;
    const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

    // Supports multiple payload shapes:
    // - { id, order: {...} }
    // - { id, result: {...} }
    // - { ...order }
    const handleOrderChange = (payload: any) => {
      const orderPayload = payload?.order || payload?.result || payload;
      const changedTableId = orderPayload?.tableId as string | undefined;
      const changedTableIds = orderPayload?.tableIds as string[] | undefined;
      const changedTableSessions = orderPayload?.tableSessions as
        | Array<{ tableId?: string | null }>
        | undefined;

      const matchesDirectTable =
        !!changedTableId &&
        changedTableId !== EMPTY_GUID &&
        changedTableId === orderTableId;

      const matchesTableIds =
        Array.isArray(changedTableIds) &&
        changedTableIds.includes(orderTableId);

      const matchesTableSessions =
        Array.isArray(changedTableSessions) &&
        changedTableSessions.some(
          (session) => session?.tableId === orderTableId,
        );

      // Some events (e.g. delete) may not contain table info; refresh defensively.
      const hasNoTableHints =
        !changedTableId &&
        (!Array.isArray(changedTableIds) || changedTableIds.length === 0) &&
        (!Array.isArray(changedTableSessions) ||
          changedTableSessions.length === 0);

      if (
        !matchesDirectTable &&
        !matchesTableIds &&
        !matchesTableSessions &&
        !hasNoTableHints
      ) {
        return;
      }

      if (!isMounted) return;
      fetchOrderedItems();
    };

    const events = ["orders.created", "orders.updated", "orders.deleted"];

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke("JoinTenantGroup", tenantId);

          events.forEach((event) =>
            orderSignalRService.on(event, handleOrderChange),
          );
          console.log(
            "SignalR: Listening to order events for tenant:",
            tenantId,
          );
        }
      } catch (error) {
        console.error("SignalR: Setup failed", error);
      }
    };

    setupSignalR();

    // Clean up
    return () => {
      isMounted = false;
      events.forEach((event) =>
        orderSignalRService.off(event, handleOrderChange),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenantId).catch(() => {});
    };
  }, [orderTableId, tenant?.id, fetchOrderedItems]);

  const setActiveCartTab = useCallback((tab: string) => {
    setActiveCartTabState(tab);
  }, []);

  // Modal actions
  const openCartModal = useCallback(() => {
    setActiveCartTabState(cartItems.length > 0 ? "1" : "2");
    setCartModalOpen(true);
  }, [cartItems]);

  const closeCartModal = useCallback(() => {
    setCartModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      orderedItems,
      cartModalOpen,
      activeCartTab,
      isSubmittingOrder,
      orderTableId,
      orderCustomerId,
      setOrderContext,
      cartItemCount,
      totalCartAmount,
      totalOrderAmount: orderedSubTotal,
      activeOrderId,
      addToCart,
      addComboToCart,
      removeFromCart,
      updateQuantity,
      updateNote,
      clearCart,
      confirmOrder,
      requestPayment,
      fetchOrderedItems,
      openCartModal,
      closeCartModal,
      setActiveCartTab,
    }),
    [
      cartItems,
      orderedItems,
      cartModalOpen,
      activeCartTab,
      isSubmittingOrder,
      orderTableId,
      orderCustomerId,
      cartItemCount,
      totalCartAmount,
      orderedSubTotal,
      activeOrderId,
      addToCart,
      addComboToCart,
      removeFromCart,
      updateQuantity,
      updateNote,
      clearCart,
      confirmOrder,
      requestPayment,
      fetchOrderedItems,
      openCartModal,
      closeCartModal,
      setActiveCartTab,
      setOrderContext,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {contextHolder}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
