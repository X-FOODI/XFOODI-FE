"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { message, Button, Tag, Spin, Breadcrumb } from "antd";
import { ArrowLeftOutlined, SaveOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";
import StructuredOrderItems from "@/components/restaurant/orders/StructuredOrderItems";
import CancelDishConfirmModal from "@/components/restaurant/orders/CancelDishConfirmModal";

interface OrderItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  price: number;
  note?: string | null;
  status?: string;
  statusName?: string;
  dishId?: string | null;
  comboId?: string | null;
  parentId?: string | null;
  comboName?: string | null;
  comboPrice?: number | null;
}

interface Order {
  id: string;
  reference: string;
  subTotal: number;
  taxAmount?: number;
  totalAmount: number;
  createdAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  isPaid: boolean;
  table: string;
  tableId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  
  // Editable items state
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<OrderItem | null>(null);

  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace(`/login?redirect=/restaurant/orders/${orderId}`);
    }
  }, [isAuthReady, user, router, orderId]);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/orders/${orderId}`);
      if (res.data?.success) {
        setOrder(res.data.data);
        setItems(res.data.data.items || []);
        setHasChanges(false);
      } else {
        message.error("Không thể tải thông tin đơn hàng");
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi khi lấy chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
    }
  }, [fetchOrder, user, orderId]);

  // Recalculate totals client-side when items change (for preview)
  const { previewSubTotal, previewTotal } = useMemo(() => {
    let sub = 0;
    // We only sum up top-level items or combo headers.
    // If it's a child of a combo, and comboPrice exists, its price might be 0, but we can just sum up what we have.
    // However, since we grouped combos by parentId, if we sum all items' price * quantity, it should be correct if children have price=0.
    // Wait, combo header itself is virtual (if parentId doesn't exist as a separate item).
    // Let's just sum (price * quantity) of all items if backend returns them this way.
    // Actually, in StructuredOrderItems we displayed comboPrice * comboQuantity.
    // The exact calculation should match backend. But for preview, we can just do a basic sum of all items in the array (assuming combo children are priced correctly or 0).
    const parentIds = new Set(items.map(i => i.parentId).filter(Boolean));
    const processedParents = new Set<string>();

    items.forEach(item => {
      if (item.parentId && parentIds.has(item.parentId)) {
        if (!processedParents.has(item.parentId)) {
          sub += (item.comboPrice || 0) * item.quantity;
          processedParents.add(item.parentId);
        }
        if (item.price > 0) {
           sub += item.price * item.quantity;
        }
      } else {
        sub += item.price * item.quantity;
      }
    });

    const tax = sub * 0.1; // Assuming 10% tax for preview
    return { previewSubTotal: sub, previewTotal: sub + tax };
  }, [items]);

  const handleUpdateStatus = async (nextStatus: string) => {
    try {
      setLoading(true);
      const res = await axiosInstance.patch(`/orders/${orderId}/status`, { status: nextStatus });
      if (res.data?.success) {
        message.success("Cập nhật trạng thái thành công");
        fetchOrder();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItems = (newItems: OrderItem[]) => {
    setItems(newItems);
    setHasChanges(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    // If it's a combo header (has comboName but no such item id in items), we delete all items with this parentId.
    if (itemToDelete.comboName && itemToDelete.parentId) {
      setItems(prev => prev.filter(i => i.parentId !== itemToDelete.parentId));
    } else {
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
    }
    
    setHasChanges(true);
    setItemToDelete(null);
  };

  const saveItemsChanges = async () => {
    try {
      setIsSaving(true);
      // Payload format expected by BE
      const payload = items.map(item => ({
        id: item.id, // we send id if it exists
        dishId: item.dishId,
        quantity: item.quantity,
        note: item.note,
        comboId: item.comboId,
        parentId: item.parentId,
        comboName: item.comboName,
        comboPrice: item.comboPrice
      }));

      const res = await axiosInstance.put(`/orders/${orderId}/items`, { items: payload });
      if (res.data?.success) {
        message.success("Cập nhật món ăn thành công");
        setHasChanges(false);
        fetchOrder(); // Refetch to get exact server calculated totals
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi lưu thay đổi");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Tag color="gold">Chờ xác nhận</Tag>;
      case "CONFIRMED":
        return <Tag color="blue">Đã xác nhận</Tag>;
      case "COMPLETED":
        return <Tag color="green">Hoàn thành</Tag>;
      case "CANCELLED":
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#0A0E14]">
      <DashboardHeader
        role="restaurant"
        restaurantName={tenant?.name ?? "Cửa hàng"}
        userName={user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={tenant?.name ?? "Cửa hàng"}
          userName={user?.name ?? ""}
          userEmail={user?.email ?? ""}
        />

        <main className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-[1000px] mx-auto w-full flex-1 flex flex-col gap-6">
            
            <Breadcrumb
              items={[
                { title: <Link href="/restaurant/orders">Đơn hàng</Link> },
                { title: `Chi tiết đơn ${order?.reference || ""}` },
              ]}
              className="mb-2"
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                  Đơn hàng {order?.reference}
                  {order && getStatusTag(order.status)}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {order && new Date(order.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex gap-2">
                {order && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                  <>
                    {order.status === "PENDING" && (
                      <Button type="primary" icon={<CheckOutlined />} onClick={() => handleUpdateStatus("CONFIRMED")}>
                        Xác nhận đơn
                      </Button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <Button type="primary" className="bg-green-500 hover:bg-green-600 border-none" icon={<CheckOutlined />} onClick={() => handleUpdateStatus("COMPLETED")}>
                        Hoàn thành đơn
                      </Button>
                    )}
                    <Button danger icon={<CloseOutlined />} onClick={() => handleUpdateStatus("CANCELLED")}>
                      Hủy đơn
                    </Button>
                  </>
                )}
              </div>
            </div>

            {loading && !order ? (
              <div className="flex justify-center p-10"><Spin /></div>
            ) : order ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left col: Items */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-gray-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg dark:text-white">Chi tiết món</h3>
                      {hasChanges && (
                        <Tag color="warning">Có thay đổi chưa lưu</Tag>
                      )}
                    </div>
                    
                    <StructuredOrderItems 
                      items={items}
                      isPaid={order.isPaid}
                      onUpdateItems={handleUpdateItems}
                      onDeleteItem={(item) => setItemToDelete(item)}
                    />

                    {/* Summary */}
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                      <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                        <span>Tạm tính (Dự kiến):</span>
                        <span>{previewSubTotal.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-zinc-700">
                        <span>Tổng tiền (Dự kiến):</span>
                        <span className="text-[#FF5A2C]">{previewTotal.toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>

                    {hasChanges && (
                      <div className="mt-6 flex justify-end gap-3">
                        <Button onClick={() => {
                          setItems(order.items);
                          setHasChanges(false);
                        }}>
                          Hủy thay đổi
                        </Button>
                        <Button type="primary" className="bg-[#FF5A2C] hover:bg-[#e04a22] border-none" icon={<SaveOutlined />} loading={isSaving} onClick={saveItemsChanges}>
                          Lưu thay đổi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right col: Info */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-gray-200 dark:border-zinc-800">
                    <h3 className="font-bold text-base dark:text-white mb-4">Thông tin thanh toán</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">TRẠNG THÁI THANH TOÁN</p>
                        {order.isPaid ? <Tag color="success">Đã thanh toán</Tag> : <Tag color="error">Chưa thanh toán</Tag>}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">TỔNG TIỀN ĐÃ LƯU</p>
                        <p className="font-bold text-xl dark:text-white">{order.totalAmount.toLocaleString("vi-VN")}đ</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1E293B] p-5 rounded-xl border border-gray-200 dark:border-zinc-800">
                    <h3 className="font-bold text-base dark:text-white mb-4">Khách hàng & Bàn</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">BÀN</p>
                        <p className="font-semibold dark:text-zinc-200">{order.table || "Mang đi / Giao hàng"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">TÊN KHÁCH HÀNG</p>
                        <p className="font-semibold dark:text-zinc-200">{order.customerName || "Khách vãng lai"}</p>
                      </div>
                      {order.customerPhone && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">SỐ ĐIỆN THOẠI</p>
                          <p className="font-semibold dark:text-zinc-200">{order.customerPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <CancelDishConfirmModal 
        open={!!itemToDelete}
        dishName={itemToDelete?.name || ""}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
