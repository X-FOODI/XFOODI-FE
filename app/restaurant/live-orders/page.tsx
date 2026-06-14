"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
}

export default function LiveOrdersPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState<Order["status"] | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    tableCode: string;
    floorName: string;
    type: string;
    message: string;
    time: string;
  }>>([]);

  // Audio for notification
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create an audio element programmatically
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  }, []);

  // Fetch initial active orders
  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get("/orders");
      if (res.data?.success) {
        setOrders(res.data.data);
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
      // Connect to Socket.io
      const newSocket = io(BACKEND_URL.replace("/api", ""), {
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("Connected to WebSocket Server:", newSocket.id);
        // Join the restaurant's room
        newSocket.emit("join_restaurant", user.restaurantId);
      });

      newSocket.on("NEW_ORDER", (order: any) => {
        console.log("Nhận đơn hàng mới!", order);
        
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log("Lỗi phát âm thanh:", e));
        }

        // Add to state if not already present
        setOrders(prev => {
          if (prev.some(o => o.id === order.id)) return prev;
          return [order, ...prev];
        });
      });

      newSocket.on("CALL_STAFF", (callData: any) => {
        console.log("Nhận yêu cầu gọi nhân viên:", callData);
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log("Lỗi phát âm thanh:", e));
        }
        setNotifications(prev => [
          {
            id: Math.random().toString(),
            tableCode: callData.tableCode,
            floorName: callData.floorName,
            type: callData.type,
            message: callData.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev
        ]);
      });

      newSocket.on("ORDER_STATUS_CHANGED", ({ orderId, status }: { orderId: string, status: string }) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
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
                className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl shadow-md hover:border-zinc-700 transition-all duration-350 cursor-grab active:cursor-grabbing hover:scale-[1.01] animate-fade-in-up"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-extrabold text-sm text-zinc-100 bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700/50">
                      #{order.reference || order.id.slice(0,6).toUpperCase()}
                    </span>
                    {order.table && (
                      <span className="ml-2 text-xs font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        {order.table}
                      </span>
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
                    {status === "PENDING" && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                        className="px-3.5 py-2 text-xs font-black text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-md shadow-amber-500/10 active:scale-95"
                      >
                        Bắt đầu nấu
                      </button>
                    )}
                    {status === "CONFIRMED" && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                        className="px-3.5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                      >
                        Hoàn thành
                      </button>
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
              {renderColumn("COMPLETED", "ĐÀ HOÀN THÀNH", "text-green-500")}
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
                  <span className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">Gọi nhân viên</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{notif.time}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">{notif.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.floorName}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
