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
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

interface Order {
  id: string;
  restaurantId: string;
  subTotal: number;
  totalAmount: number;
  createdAt: string;
  status: "NEW" | "COOKING" | "COMPLETED";
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

  // Audio for notification
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create an audio element programmatically
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace("/login-email?redirect=/restaurant/live-orders");
      return;
    }
    
    setLoading(false);

    if (user.restaurantId) {
      // Connect to Socket.io
      const newSocket = io(BACKEND_URL, {
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("Connected to WebSocket Server:", newSocket.id);
        // Join the restaurant's room
        newSocket.emit("join_restaurant", user.restaurantId);
      });

      newSocket.on("NEW_ORDER", (order: Order) => {
        console.log("Nhận đơn hàng mới!", order);
        
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log("Lỗi phát âm thanh (cần tương tác từ user trước):", e));
        }

        // Add to state
        setOrders(prev => [order, ...prev]);
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

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    // Here we would also call an API to update the DB
  };

  const renderColumn = (status: Order["status"], title: string, colorClass: string) => {
    const colOrders = orders.filter(o => o.status === status);
    
    return (
      <div className="flex-1 min-w-[300px] bg-gray-100 dark:bg-[#161B22] rounded-xl p-4 flex flex-col border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
          <h3 className={`font-bold text-sm tracking-wider ${colorClass}`}>{title}</h3>
          <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-full">
            {colOrders.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {colOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm font-medium">Chưa có đơn hàng</div>
          ) : (
            colOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-[#21262D] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">#{order.id.slice(0,6).toUpperCase()}</span>
                    {order.table && (
                      <span className="ml-2 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full">{order.table}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                </div>
                
                <div className="space-y-2 mb-4 border-t border-b border-gray-100 dark:border-gray-800 py-3 my-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{item.quantity}x</span> <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        {item.note && <div className="text-xs text-red-500 dark:text-red-400 italic mt-1 font-medium bg-red-50 dark:bg-red-900/10 inline-block px-2 py-0.5 rounded">Lưu ý: {item.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="font-black text-primary">
                    {order.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                  
                  <div className="flex gap-2">
                    {status === "NEW" && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, "COOKING")}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                      >
                        Bắt đầu nấu
                      </button>
                    )}
                    {status === "COOKING" && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 rounded-lg transition-colors shadow-sm"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
              
              <button 
                onClick={testCreateOrder}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Tạo đơn giả lập (Test)
              </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
              {renderColumn("NEW", "CHỜ XÁC NHẬN", "text-orange-500")}
              {renderColumn("COOKING", "ĐANG CHẾ BIẾN", "text-blue-500")}
              {renderColumn("COMPLETED", "ĐÃ HOÀN THÀNH", "text-green-500")}
            </div>
          </div>
        </main>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
