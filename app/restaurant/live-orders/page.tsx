"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";
import paymentService, { PaymentPurpose } from "@/lib/services/paymentService";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
// Strip trailing /api to get socket base URL
const SOCKET_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  // Remove any trailing /api path segment
  return url.replace(/\/api$/, "").replace(/\/api\/$/, "");
})();
console.log("[DEBUG] NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);
console.log("[DEBUG] SOCKET_URL =", SOCKET_URL);

interface OrderItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  price: number;
  note?: string;
  status: string;
}

interface Order {
  id: string;
  reference: string;
  subTotal: number;
  totalAmount: number;
  createdAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  items: OrderItem[];
  table?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  isPaid?: boolean;
  reservationId?: string | null;
  depositPaid?: number; // tiền cọc đã thanh toán, trừ vào bill
}

export default function LiveOrdersPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState<Order["status"] | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashModalOrder, setCashModalOrder] = useState<Order | null>(null);
  const [cashReceived, setCashReceived] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    tableCode: string;
    floorName: string;
    type: string;
    message: string;
    time: string;
    orderId?: string;
    orderReference?: string;
  }>>([]);
  const [pendingPayments, setPendingPayments] = useState<Record<string, boolean>>({});
  const [feedbackOrder, setFeedbackOrder] = useState<{ id: string; reference: string } | null>(null);

  // Audio context for notification chime (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const initAudioContext = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && !audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        // Remove listeners once successfully unlocked/initialized
        document.removeEventListener("click", initAudioContext);
        document.removeEventListener("keydown", initAudioContext);
      } catch (err) {
        console.log("Silent audio unlock failed:", err);
      }
    };

    document.addEventListener("click", initAudioContext);
    document.addEventListener("keydown", initAudioContext);
    return () => {
      document.removeEventListener("click", initAudioContext);
      document.removeEventListener("keydown", initAudioContext);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      let ctx = audioCtxRef.current;
      if (!ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          ctx = new AudioContextClass();
          audioCtxRef.current = ctx;
        }
      }
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const playTone = (freq: number, startTime: number, duration: number) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(523.25, now, 0.4);        // C5
      playTone(659.25, now + 0.08, 0.4); // E5
      playTone(783.99, now + 0.16, 0.5); // G5
    } catch (e) {
      console.log("Lỗi phát âm thanh:", e);
    }
  };

  // Sync selectedOrder with latest orders data to show live updates of items status
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders]);

  // Fetch initial active orders — PENDING, CONFIRMED, and COMPLETED (if unpaid)
  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get("/orders");
      if (res.data?.success) {
        const activeOrders = (res.data.data as Order[]).filter(
          (o) => o.status === "PENDING" || o.status === "CONFIRMED" || (o.status === "COMPLETED" && !o.isPaid)
        );
        setOrders(activeOrders);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace("/login-email?redirect=/restaurant/live-orders");
      return;
    }

    fetchOrders();

    if (user.restaurantId) {
      // Connect to Socket.io — polling only for Render/Cloudflare proxy compatibility
      const newSocket = io(SOCKET_URL, {
        transports: ["polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      newSocket.on("connect", () => {
        console.log("[Socket] Connected:", newSocket.id);
        newSocket.emit("join_restaurant", user.restaurantId);
        console.log("[Socket] Joined room:", user.restaurantId);
      });

      newSocket.on("connect_error", (err) => {
        console.error("[Socket] Connect error:", err.message, err);
      });

      newSocket.on("disconnect", (reason) => {
        console.warn("[Socket] Disconnected:", reason);
      });

      newSocket.on("NEW_ORDER", (order: any) => {
        console.log("Nhận đơn hàng mới!", order);
        
        // Play notification sound
        playNotificationSound();

        // Add or update order in state
        setOrders(prev => {
          const exists = prev.some(o => o.id === order.id);
          if (exists) {
            return prev.map(o => o.id === order.id ? order : o);
          }
          return [order, ...prev];
        });
      });

      newSocket.on("CALL_STAFF", (callData: any) => {
        console.log("Nhận yêu cầu gọi nhân viên:", callData);
        playNotificationSound();
        
        // If cash checkout request, register in state to glow the card on KDS board
        if (callData.type === "CASH_CHECKOUT" && callData.orderId) {
          setPendingPayments(prev => ({ ...prev, [callData.orderId]: true }));
        }

        setNotifications(prev => [
          {
            id: Math.random().toString(),
            tableCode: callData.tableCode,
            floorName: callData.floorName,
            type: callData.type,
            message: callData.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            orderId: callData.orderId,
            orderReference: callData.orderReference,
          },
          ...prev
        ]);
      });

      newSocket.on("ORDER_STATUS_CHANGED", ({ orderId, status, isPaid }: { orderId: string, status: string, isPaid?: boolean }) => {
        // If status is CANCELLED or if it is COMPLETED and already paid, remove it from KDS board
        if (status === "CANCELLED" || (status === "COMPLETED" && isPaid)) {
          setOrders(prev => prev.filter(o => o.id !== orderId));
          setPendingPayments(prev => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
          // Also close detail panel if this order is open
          setSelectedOrder(prev => prev?.id === orderId ? null : prev);
        } else {
          // If status is COMPLETED but NOT paid yet, we update its status to COMPLETED (it moves to the completed/unpaid column)
          setOrders(prev => {
            const exists = prev.some(o => o.id === orderId);
            if (!exists && status === "COMPLETED" && !isPaid) {
              fetchOrders();
              return prev;
            }
            return prev.map(o => o.id === orderId ? { ...o, status: status as any, isPaid: isPaid ?? o.isPaid } : o);
          });
        }
      });

      newSocket.on("ORDER_ITEM_STATUS_CHANGED", () => {
        // Reload order items statuses if needed
        fetchOrders();
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthReady, user, router]);

  const testCreateOrder = async () => {
    try {
      await axiosInstance.post("/orders/test");
    } catch (error) {
      console.error(error);
      alert("Lỗi tạo đơn giả lập");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (response.data?.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
      alert("Không thể cập nhật trạng thái đơn hàng");
    }
  };

  /** Mở modal thu tiền từ notification popup */
  const handlePayFromNotification = async (notif: { id: string; orderId?: string; orderReference?: string }) => {
    if (!notif.orderId) return;
    // Tìm đơn hàng trong state hiện tại
    let order = orders.find(o => o.id === notif.orderId);
    if (!order) {
      // Nếu không có trong state (đã bị filter), fetch lại từ API
      try {
        const res = await axiosInstance.get(`/orders/${notif.orderId}`);
        if (res.data?.success) order = res.data.data as Order;
      } catch {}
    }
    if (!order) {
      alert('Không tìm thấy đơn hàng. Có thể đã được xử lý rồi.');
      return;
    }
    // Xóa notification
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    // Mở cash modal
    setCashModalOrder(order);
    const amountDueNotif = Math.max(0, order.totalAmount - (order.depositPaid ?? 0));
    setCashReceived(amountDueNotif);
    setIsCashModalOpen(true);
  };

  /** Mở modal xác nhận thu tiền mặt giống như RestX */
  const openCashPaymentModal = (order: Order) => {
    setCashModalOrder(order);
    const amountDue = Math.max(0, order.totalAmount - (order.depositPaid ?? 0));
    setCashReceived(amountDue);
    setIsCashModalOpen(true);
  };

  /** Staff xác nhận đã thu tiền mặt → gọi /payments/cash → backend tự hoàn thành đơn + trả bàn */
  const handleCashPayment = async () => {
    if (!cashModalOrder || confirmingPayment) return;
    try {
      setConfirmingPayment(true);
      await paymentService.payCash({
        orderId: cashModalOrder.id,
        cashReceive: cashReceived,
        purpose: PaymentPurpose.ORDER,
      });
      // Payment done → remove order from KDS immediately
      setOrders(prev => prev.filter(o => o.id !== cashModalOrder.id));
      setPendingPayments(prev => {
        const next = { ...prev };
        delete next[cashModalOrder.id];
        return next;
      });
      if (selectedOrder?.id === cashModalOrder.id) {
        setSelectedOrder(null);
      }
      setIsCashModalOpen(false);
      setCashModalOrder(null);
    } catch (error: any) {
      console.error("Lỗi xác nhận thanh toán tiền mặt:", error);
      alert(error?.response?.data?.message || "Không thể xác nhận thanh toán tiền mặt");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const updateOrderItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const response = await axiosInstance.patch(`/orders/items/${itemId}/status`, {
        status: newStatus,
      });
      if (response.data?.success) {
        setSelectedOrder(prev => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map(item => item.id === itemId ? { ...item, status: newStatus } : item)
          };
        });
        fetchOrders();
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái món ăn:", error);
      alert("Không thể cập nhật trạng thái món ăn");
    }
  };

  const getItemStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return { label: "Chờ làm", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
      case "COOKING": return { label: "Đang làm", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
      case "COMPLETED": return { label: "Hoàn thành", color: "bg-green-500/10 text-green-500 border-green-500/20" };
      case "SERVED": return { label: "Đã phục vụ", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "CANCELLED": return { label: "Đã hủy", color: "bg-zinc-800 text-zinc-500 border-zinc-700/50" };
      default: return { label: status, color: "bg-zinc-850 text-zinc-400 border-zinc-800" };
    }
  };

  const renderColumn = (status: Order["status"], title: string, colorClass: string) => {
    const colOrders = orders.filter(o => o.status === status);
    
    return (
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragOverColumn(status)}
        onDragLeave={() => setDragOverColumn(prev => prev === status ? null : prev)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOverColumn(null);
          const orderId = e.dataTransfer.getData("text/plain");
          if (!orderId) return;

          const orderToUpdate = orders.find(o => o.id === orderId);
          if (orderToUpdate && orderToUpdate.status !== status) {
            await updateOrderStatus(orderId, status);
          }
        }}
        className={`flex-1 min-w-[340px] rounded-2xl p-5 flex flex-col border transition-all duration-300 shadow-lg ${
          dragOverColumn === status 
            ? "bg-zinc-800/60 border-amber-500/50 scale-[1.01] ring-2 ring-amber-500/10" 
            : "bg-zinc-900/50 border-zinc-800/80"
        }`}
      >
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              status === "PENDING" ? "bg-amber-500 animate-pulse" :
              status === "CONFIRMED" ? "bg-blue-500 animate-pulse" : "bg-emerald-500"
            }`} />
            <h3 className={`font-black text-xs tracking-widest uppercase ${colorClass}`}>{title}</h3>
          </div>
          <span className="bg-zinc-800 text-zinc-300 text-xs font-black px-2.5 py-1 rounded-lg border border-zinc-700/30">
            {colOrders.length} đơn
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {colOrders.length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-sm font-semibold italic">Chưa có đơn hàng</div>
          ) : (
            colOrders.map(order => (
              <div 
                key={order.id} 
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", order.id);
                }}
                onClick={() => setSelectedOrder(order)}
                className={`bg-zinc-900 border p-4 rounded-xl shadow-md hover:border-zinc-700 transition-all duration-350 cursor-pointer hover:shadow-lg hover:scale-[1.01] animate-fade-in-up ${
                  pendingPayments[order.id]
                    ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30 animate-pulse-border"
                    : "border-zinc-800/80 hover:shadow-amber-500/5"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-zinc-100 bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700/50">
                        #{order.reference || order.id.slice(0,6).toUpperCase()}
                      </span>
                      {order.table && (
                        <span className="text-xs font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          {order.table}
                        </span>
                      )}
                    </div>
                    {order.customerName && (
                      <div className="mt-2 text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                        <span className="text-zinc-500">👤</span>
                        <span>{order.customerName}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-zinc-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
                
                {/* List items with images */}
                <div className="space-y-3 mb-4 border-t border-b border-zinc-800/50 py-3 my-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-zinc-850 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg flex-shrink-0">
                          🍳
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <p className="text-xs font-extrabold text-zinc-200 truncate leading-tight">
                            {item.name}
                          </p>
                          <span className="text-xs font-black text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            x{item.quantity}
                          </span>
                        </div>
                        {item.note && (
                          <div className="text-[10px] text-rose-400 italic mt-1 font-bold bg-rose-500/10 inline-block px-1.5 py-0.5 rounded border border-rose-500/20">
                            Lưu ý: {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Tổng thanh toán</p>
                    <span className="font-black text-sm text-amber-500">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {pendingPayments[order.id] ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openCashPaymentModal(order);
                        }}
                        className="px-3.5 py-2 text-xs font-black text-black bg-emerald-400 hover:bg-emerald-350 rounded-lg transition-all shadow-md shadow-emerald-400/20 active:scale-95 flex items-center gap-1"
                      >
                        💵 Thu tiền
                      </button>
                    ) : (
                      <>
                        {status === "PENDING" && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, "CONFIRMED");
                            }}
                            className="px-3.5 py-2 text-xs font-black text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-md shadow-amber-500/10 active:scale-95"
                          >
                            Bắt đầu nấu
                          </button>
                        )}
                        {status === "CONFIRMED" && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, "COMPLETED");
                            }}
                            className="px-3.5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
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

        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col h-full max-w-[1400px] mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Màn hình Bếp (Live Orders)</span>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">Đơn hàng mới sẽ tự động nảy lên và phát âm thanh.</p>
              </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
              {renderColumn("PENDING", "CHỜ XÁC NHẬN", "text-orange-500")}
              {renderColumn("CONFIRMED", "ĐANG CHẾ BIẾN", "text-blue-500")}
              {renderColumn("COMPLETED", "CHỜ THANH TOÁN", "text-emerald-500")}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Notifications */}
      {notifications.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-80 space-y-3">
          {notifications.map(notif => (
            <div key={notif.id} className="bg-white dark:bg-[#21262D] p-4 rounded-xl border-l-4 border-yellow-500 shadow-xl border border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3 animate-slide-in-right">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                    {notif.type === "CASH_CHECKOUT" ? "💰 Thanh toán tiền mặt" : "Gọi nhân viên"}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{notif.time}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">{notif.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.floorName}</p>
                {/* Nút thu tiền nếu là yêu cầu thanh toán */}
                {notif.type === "CASH_CHECKOUT" && notif.orderId && (
                  <button
                    onClick={() => handlePayFromNotification(notif)}
                    className="mt-2 w-full py-1.5 rounded-lg text-xs font-black text-black bg-amber-500 hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    💵 Thu tiền mặt {notif.orderReference ? `(${notif.orderReference})` : ""}
                  </button>
                )}
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-lg text-zinc-100 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/50">
                  #{selectedOrder.reference || selectedOrder.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-sm font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-md">
                  {selectedOrder.table || "Mang đi"}
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${
                  selectedOrder.status === "PENDING" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  selectedOrder.status === "CONFIRMED" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}>
                  {selectedOrder.status === "PENDING" ? "Chờ xác nhận" :
                   selectedOrder.status === "CONFIRMED" ? "Đang chế biến" : "Đã hoàn thành"}
                </span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 p-2 rounded-full border border-zinc-800 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer and Order summary Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">Thông tin khách hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tên khách hàng:</span>
                      <span className="font-extrabold text-zinc-200">{selectedOrder.customerName || "Khách vãng lai"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Số điện thoại:</span>
                      <span className="font-semibold text-zinc-350">{selectedOrder.customerPhone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Email:</span>
                      <span className="font-medium text-zinc-450">{selectedOrder.customerEmail || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">Chi tiết thanh toán</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Giờ đặt:</span>
                      <span className="font-semibold text-zinc-200">
                        {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ""}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-850 pt-2 mt-1">
                      <span className="text-zinc-500">Tổng thanh toán:</span>
                      <span className="font-black text-amber-500 text-base">
                        {selectedOrder.totalAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">Món ăn trong đơn ({selectedOrder.items?.length || 0})</h4>
                
                <div className="border border-zinc-800/60 rounded-2xl overflow-hidden divide-y divide-zinc-900">
                  {selectedOrder.items?.map((item, idx) => {
                    const statusInfo = getItemStatusLabel(item.status);
                    return (
                      <div key={idx} className="bg-zinc-900/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-16 h-16 rounded-xl object-cover border border-zinc-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-2xl flex-shrink-0">
                              🍳
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-sm text-zinc-100 leading-snug">{item.name}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="font-black text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/30">
                                Số lượng: x{item.quantity}
                              </span>
                              <span className="font-semibold text-zinc-500">
                                {Number(item.price).toLocaleString('vi-VN')} đ / phần
                              </span>
                            </div>
                            {item.note && (
                              <div className="text-[11px] text-rose-400 italic mt-2 font-bold bg-rose-500/5 inline-block px-2 py-1 rounded border border-rose-500/10">
                                Lưu ý: {item.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800/80 bg-zinc-900/30 flex justify-between items-center">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 text-xs font-extrabold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-all"
              >
                Đóng
              </button>

              <div className="flex gap-2">
                {selectedOrder.status === "PENDING" && (
                  <button 
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "CONFIRMED");
                      setSelectedOrder(prev => prev ? { ...prev, status: "CONFIRMED" } : null);
                    }}
                    className="px-5 py-2.5 text-xs font-black text-black bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/10"
                  >
                    Bắt đầu nấu
                  </button>
                )}
                {selectedOrder.status === "CONFIRMED" && (
                  <button 
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "COMPLETED");
                      setSelectedOrder(prev => prev ? { ...prev, status: "COMPLETED" } : null);
                    }}
                    className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-650/20 active:scale-95"
                  >
                    Hoàn thành
                  </button>
                )}
                {selectedOrder.status === "COMPLETED" && (
                  <>
                    {/* Nút thu tiền mặt vẫn hiện khi bếp xong nhưng chưa thu tiền */}
                    <button 
                      disabled={confirmingPayment}
                      onClick={() => openCashPaymentModal(selectedOrder)}
                      className="px-5 py-2.5 text-xs font-black text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all shadow-md shadow-emerald-500/10 disabled:opacity-60 flex items-center gap-1.5"
                    >
                      💵 Thu tiền mặt
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cash Payment Modal giống như RestX */}
      {isCashModalOpen && cashModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-900/20">
              <h3 className="font-extrabold text-base text-zinc-100 flex items-center gap-2">
                <span>💵 Xác nhận tiền mặt</span>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                  #{cashModalOrder.reference}
                </span>
              </h3>
              <button 
                onClick={() => {
                  setIsCashModalOpen(false);
                  setCashModalOrder(null);
                }}
                className="text-zinc-450 hover:text-white bg-zinc-900/80 p-2 rounded-full border border-zinc-800 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Tổng hoá đơn</span>
                  <span className="font-bold text-zinc-300">
                    {cashModalOrder.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {(cashModalOrder.depositPaid ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span className="text-sm">✓ Đã đặt cọc</span>
                    <span className="font-bold">
                      -{cashModalOrder.depositPaid!.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                  <span className="text-zinc-300 text-sm font-semibold">
                    {(cashModalOrder.depositPaid ?? 0) > 0 ? 'Còn lại phải thu' : 'Tổng tiền thanh toán'}
                  </span>
                  <span className="font-black text-xl text-amber-500">
                    {Math.max(0, cashModalOrder.totalAmount - (cashModalOrder.depositPaid ?? 0)).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Input for cash received */}
              <div className="space-y-2">
                <label className="block text-xs font-black tracking-widest text-zinc-450 uppercase">
                  Số tiền khách đưa
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={cashReceived === 0 ? '' : cashReceived.toLocaleString('vi-VN')}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, '');
                      setCashReceived(cleanValue ? Number(cleanValue) : 0);
                    }}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white text-lg font-bold focus:outline-none focus:border-amber-500/80 transition-all text-right pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-450 font-bold text-sm">
                    đ
                  </span>
                </div>
              </div>

              {/* Suggestions — dựa trên amountDue sau khi trừ cọc */}
              {(() => {
                const amountDue = Math.max(0, cashModalOrder.totalAmount - (cashModalOrder.depositPaid ?? 0));
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setCashReceived(amountDue)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        cashReceived === amountDue
                          ? "bg-amber-500 border-amber-500 text-black" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850"
                      }`}
                    >
                      Đúng số tiền ({amountDue.toLocaleString('vi-VN')}đ)
                    </button>
                    {[100000, 200000, 500000].map((amt) => (
                      <button 
                        key={amt}
                        disabled={amt < amountDue}
                        onClick={() => setCashReceived(amt)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                          cashReceived === amt 
                            ? "bg-amber-500 border-amber-500 text-black" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850"
                        }`}
                      >
                        {amt.toLocaleString('vi-VN')} đ
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Change (Cashback) block */}
              {(() => {
                const amountDue = Math.max(0, cashModalOrder.totalAmount - (cashModalOrder.depositPaid ?? 0));
                return (
                  <div className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${
                    cashReceived >= amountDue 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-rose-500/5 border-rose-500/20"
                  }`}>
                    <span className="text-zinc-400 text-xs font-bold">
                      {cashReceived >= amountDue ? "Tiền thối lại" : "Còn thiếu"}
                    </span>
                    <span className={`font-black text-base ${
                      cashReceived >= amountDue ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {Math.abs(cashReceived - amountDue).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-900 bg-zinc-900/20 flex gap-3">
              <button
                onClick={() => {
                  setIsCashModalOpen(false);
                  setCashModalOrder(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-all active:scale-95"
              >
                Hủy
              </button>
              <button
                disabled={cashReceived < Math.max(0, cashModalOrder.totalAmount - (cashModalOrder.depositPaid ?? 0)) || confirmingPayment}
                onClick={handleCashPayment}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {confirmingPayment && <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />}
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback được hiện phía khách hàng trong /menu/[tableId]/checkout sau khi thanh toán xong */}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-pulse-border {
          animation: pulseBorder 2s infinite ease-in-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseBorder {
          0%, 100% { border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 0 10px rgba(16, 185, 129, 0.1); }
          50% { border-color: rgba(16, 185, 129, 0.9); box-shadow: 0 0 20px rgba(16, 185, 129, 0.35); }
        }
      `}} />
    </div>
  );
}
