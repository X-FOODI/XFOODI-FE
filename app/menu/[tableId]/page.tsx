"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/services/axiosInstance";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Loader2, 
  ChevronRight, 
  Utensils, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useAuth } from "@/lib/contexts/AuthContext";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  isBestSeller: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface TableInfo {
  id: string;
  code: string;
  floor: { name: string };
  restaurant: {
    id: string;
    name: string;
    logoUrl: string | null;
    address: string | null;
    phone: string | null;
  };
}

interface CartItem {
  dish: Dish;
  quantity: number;
  note: string;
}

interface TrackedOrder {
  id: string;
  reference: string;
  totalAmount: number;
  createdAt: string;
  status: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    note: string | null;
    status: string;
    statusName: string;
  }>;
}

export default function CustomerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthReady, logout } = useAuth();
  const tableId = params.tableId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Tracking active order state
  const [activeOrders, setActiveOrders] = useState<TrackedOrder[]>([]);
  const [showTracker, setShowTracker] = useState(false);

  // Show login/loyalty prompt on load for guest users
  useEffect(() => {
    console.log("LOYALTY DIALOG CHECK:", { isAuthReady, user, hasTable: !!table });
    if (isAuthReady && !user && table) {
      console.log("SHOWING DIALOG");
      setShowLoginPrompt(true);
    }
  }, [isAuthReady, user, table]);

  const handleCheckout = () => {
    submitOrder();
  };

  // Load table & menu
  useEffect(() => {
    if (!tableId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch public table info
        const tableRes = await axiosInstance.get(`/tables/public/${tableId}`);
        if (tableRes.data?.success) {
          const tableData = tableRes.data.data;
          setTable(tableData);

          const restaurantId = tableData.restaurant.id;

          // 2. Fetch categories and dishes for this restaurant
          const [catRes, dishRes] = await Promise.all([
            axiosInstance.get("/categories", { params: { restaurantId } }),
            axiosInstance.get("/dishes", { params: { restaurantId } }),
          ]);

          if (catRes.data?.success) {
            setCategories(catRes.data.data);
          }
          if (dishRes.data?.success) {
            setDishes(dishRes.data.data);
          }

          // 3. Fetch active orders for this table session
          fetchActiveOrders();
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin thực đơn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableId]);

  // Fetch active orders for current table
  const fetchActiveOrders = async () => {
    try {
      // Find orders belonging to this table
      const res = await axiosInstance.get("/orders", { params: { tableId } });
      if (res.data?.success) {
        // Filter out completed/cancelled if we only want active tracking
        setActiveOrders(res.data.data);
        if (res.data.data.length > 0) {
          setShowTracker(true);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải đơn hàng hoạt động:", err);
    }
  };

  // Real-time socket updates for order tracking
  useEffect(() => {
    if (!table?.restaurant.id) return;

    // Establish WebSocket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000", {
      transports: ["websocket"],
    });

    const roomName = `restaurant_${table.restaurant.id}`;
    socket.on("connect", () => {
      socket.emit("join_restaurant", table.restaurant.id);
    });

    // Listen to changes in items/orders status
    const handleUpdate = () => {
      fetchActiveOrders();
    };

    socket.on("NEW_ORDER", handleUpdate);
    socket.on("ORDER_UPDATED", handleUpdate);
    socket.on("ORDER_STATUS_CHANGED", handleUpdate);
    socket.on("ORDER_ITEM_STATUS_CHANGED", handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [table]);

  // Cart Handlers
  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1, note: "" }];
    });
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNote = (dishId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.dish.id === dishId ? { ...item, note } : item))
    );
  };

  // Submit Order
  const submitOrder = async () => {
    if (cart.length === 0) return;
    try {
      setOrderSubmitting(true);
      const itemsPayload = cart.map((item) => ({
        dishId: item.dish.id,
        quantity: item.quantity,
        note: item.note || undefined,
      }));

      const response = await axiosInstance.post("/orders", {
        tableId,
        items: itemsPayload,
      });

      if (response.data?.success) {
        setCart([]);
        setIsCartOpen(false);
        fetchActiveOrders();
        setShowTracker(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi đặt món");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Filter Dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory = selectedCategory === "all" || dish.categoryId === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.dish.price, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-zinc-400 font-medium">Đang tải thực đơn...</p>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center gap-4">
        <XCircle className="w-16 h-16 text-rose-500" />
        <h1 className="text-xl font-bold">Bàn ăn không tồn tại</h1>
        <p className="text-zinc-400 max-w-sm">Mã QR bàn ăn này không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng liên hệ nhân viên để được hỗ trợ.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center pb-24 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Maximum Mobile-Friendly width container */}
      <div className="w-full max-w-md bg-zinc-900/40 min-h-screen flex flex-col relative border-x border-zinc-800/60 shadow-2xl backdrop-blur-2xl">
        
        {/* ─── HEADER ─── */}
        <header className="sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/60 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {table.restaurant.logoUrl ? (
              <img 
                src={table.restaurant.logoUrl} 
                alt={table.restaurant.name} 
                className="w-10 h-10 rounded-full object-cover border border-amber-500/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
                <Utensils className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight text-white">{table.restaurant.name}</h1>
              <p className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> {table.floor.name} • {table.code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeOrders.length > 0 && (
              <button 
                onClick={() => setShowTracker(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/30 transition-all active:scale-95"
              >
                <Clock className="w-3.5 h-3.5" /> Theo dõi món
              </button>
            )}

            {user && (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 focus:outline-none active:scale-95 transition-all"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || "User"} 
                      className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[10px] font-black text-amber-500 uppercase">
                      {user.name?.slice(0, 2) || "KH"}
                    </div>
                  )}
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-2xl z-50">
                      <p className="text-xs font-bold text-white truncate">{user.fullName || user.name}</p>
                      <p className="text-[10px] text-zinc-550 truncate mb-2">{user.email || user.phoneNumber}</p>
                      
                      <div className="pt-2 border-t border-zinc-800 flex flex-col gap-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-md inline-block self-start">
                          Thành viên tích điểm
                        </span>
                        
                        <button 
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                            window.location.reload();
                          }}
                          className="w-full text-left py-1 text-xs text-rose-500 hover:text-rose-450 font-semibold transition-colors mt-1"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ─── SEARCH & HERO ─── */}
        <div className="p-4 space-y-4">
          {/* Loyalty Point Banner */}
          {!user && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 shadow-md flex items-center justify-between gap-3 text-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-2.5 text-zinc-350">
                <span className="text-xl">🎁</span>
                <div>
                  <p className="font-bold text-white leading-tight">Tích lũy điểm thưởng!</p>
                  <p className="text-[10px] text-zinc-450 mt-0.5">Đăng nhập để tích điểm cho hoá đơn này.</p>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/login-email?redirect=${encodeURIComponent(`/menu/${tableId}`)}`)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 text-black font-extrabold text-[10px] shadow-lg shadow-amber-500/10 transition-all active:scale-95 whitespace-nowrap"
              >
                Đăng nhập
              </button>
            </motion.div>
          )}

          {/* Welcome Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 px-2 py-0.5 bg-amber-500/20 rounded-md">Smart Ordering</span>
              <h2 className="text-base font-bold mt-1.5 text-white">Chào mừng quý khách đến với bàn {table.code}!</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Đặt món trực tiếp tại bàn, món ngon chế biến tức thì.</p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-2 translate-y-2">
              <ChefHat className="w-24 h-24 text-amber-500" />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Tìm món ngon, đồ uống..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800/60 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
          </div>
        </div>

        {/* ─── CATEGORIES SCROLL ─── */}
        <div className="sticky top-[73px] z-20 bg-zinc-950/70 backdrop-blur-md border-y border-zinc-900 py-3 overflow-x-auto scrollbar-none flex gap-2.5 px-4">
          <button 
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === "all" 
                ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20" 
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id 
                  ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ─── DISHES LIST ─── */}
        <div className="p-4 space-y-4 flex-1">
          {filteredDishes.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 space-y-2">
              <Utensils className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
              <p className="text-sm">Không tìm thấy món ăn nào</p>
            </div>
          ) : (
            filteredDishes.map((dish) => (
              <motion.div 
                layout
                key={dish.id}
                className="flex gap-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-800 transition-all relative overflow-hidden group"
              >
                {/* Dish content details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">{dish.name}</h3>
                    {dish.isBestSeller && (
                      <span className="text-[9px] font-bold text-black bg-amber-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        ★ Best Seller
                      </span>
                    )}
                    {dish.isVegetarian && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded">
                        Chay
                      </span>
                    )}
                    {dish.isSpicy && (
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded">
                        🌶️ Cay
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{dish.description || "Hương vị đậm đà thơm ngon, được chọn lựa nguyên liệu tươi mới mỗi ngày."}</p>
                  <div className="pt-1 flex items-center justify-between">
                    <div className="text-sm font-extrabold text-amber-400">
                      {dish.price.toLocaleString("vi-VN")}đ <span className="text-[10px] text-zinc-500 font-normal">/ {dish.unit}</span>
                    </div>
                    
                    {/* Add Button */}
                    <button 
                      onClick={() => addToCart(dish)}
                      className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-black flex items-center justify-center font-bold transition-all shadow-md shadow-amber-500/10"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ─── FLOATING CART BAR ─── */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent z-40">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3.5 px-5 rounded-xl font-bold flex items-center justify-between shadow-xl shadow-amber-500/20 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black animate-bounce">
                    {cartItemCount}
                  </span>
                </div>
                <span className="text-sm">Xem giỏ hàng</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-extrabold">
                {cartTotal.toLocaleString("vi-VN")}đ <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>

        {/* ─── CART DRAWER ─── */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                onClick={() => setIsCartOpen(false)}
              />
              
              {/* Right Sidebar Drawer Container */}
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-zinc-900 border-l border-zinc-850 z-50 flex flex-col shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 sticky top-0 backdrop-blur-md z-10">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-white">Giỏ hàng món ăn</h2>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs text-zinc-500 hover:text-white px-2.5 py-1 bg-zinc-800 rounded-lg"
                  >
                    Đóng
                  </button>
                </div>

                {/* Cart Items list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.dish.id} className="space-y-2 pb-4 border-b border-zinc-800/60">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-white">{item.dish.name}</h4>
                          <span className="text-xs text-amber-400 font-extrabold">{item.dish.price.toLocaleString("vi-VN")}đ</span>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-3 bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-700/50">
                          <button 
                            onClick={() => updateQuantity(item.dish.id, -1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.dish.id, 1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Note box */}
                      <div className="relative flex items-center bg-zinc-950 rounded-lg px-3 py-1.5 border border-zinc-800">
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-500 mr-2 flex-shrink-0" />
                        <input 
                          type="text" 
                          placeholder="Ghi chú món ăn (ít cay, không rau...)" 
                          value={item.note}
                          onChange={(e) => updateItemNote(item.dish.id, e.target.value)}
                          className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Section */}
                <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Tạm tính</span>
                      <span>{cartTotal.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Thuế VAT (10%)</span>
                      <span>{(cartTotal * 0.1).toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-zinc-850">
                      <span>Tổng cộng</span>
                      <span className="text-amber-500 font-extrabold">{(cartTotal * 1.1).toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>

                  <button 
                    disabled={orderSubmitting}
                    onClick={handleCheckout}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-black py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 transition-all active:scale-98"
                  >
                    {orderSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Đang đặt món...
                      </>
                    ) : (
                      <>Gọi món ngay ({(cartTotal * 1.1).toLocaleString("vi-VN")}đ)</>
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── REALTIME ORDER TRACKER (MODAL/DRAWER) ─── */}
        <AnimatePresence>
          {showTracker && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                onClick={() => setShowTracker(false)}
              />

              {/* Right Sidebar Tracker Container */}
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-zinc-900 border-l border-zinc-850 z-50 flex flex-col shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 sticky top-0 backdrop-blur-md z-10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-white">Đơn hàng đang chờ phục vụ</h2>
                  </div>
                  <button 
                    onClick={() => setShowTracker(false)}
                    className="text-xs text-zinc-500 hover:text-white px-2.5 py-1 bg-zinc-800 rounded-lg"
                  >
                    Đóng
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 space-y-2">
                      <Clock className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
                      <p className="text-sm">Chưa có đơn hàng nào được đặt</p>
                    </div>
                  ) : (
                    activeOrders.map((order) => (
                      <div key={order.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-4">
                        {/* Header Details */}
                        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                          <div>
                            <span className="text-xs text-zinc-500 font-medium">Mã đơn:</span>
                            <span className="text-xs text-amber-400 font-bold ml-1">{order.reference}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === "PENDING" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                            order.status === "CONFIRMED" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          }`}>
                            {order.status === "PENDING" ? "Chờ xác nhận" :
                             order.status === "CONFIRMED" ? "Đã xác nhận" : "Hoàn thành"}
                          </span>
                        </div>

                        {/* Items list */}
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-xs">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-zinc-200">{item.name}</span>
                                <span className="text-zinc-500 ml-1.5">x{item.quantity}</span>
                                {item.note && (
                                  <p className="text-[10px] text-zinc-500 italic">"{item.note}"</p>
                                )}
                              </div>
                              
                              {/* Item status label */}
                              <div className="flex items-center gap-1.5">
                                {item.status === "PENDING" && (
                                  <span className="text-zinc-500 flex items-center gap-1 text-[10px]">
                                    <Clock className="w-3 h-3 text-amber-500/70" /> Chờ chuẩn bị
                                  </span>
                                )}
                                {item.status === "COOKING" && (
                                  <span className="text-blue-400 flex items-center gap-1 text-[10px] animate-pulse">
                                    <ChefHat className="w-3 h-3 animate-spin" /> Đang chế biến
                                  </span>
                                )}
                                {item.status === "COMPLETED" && (
                                  <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                                    <CheckCircle className="w-3 h-3" /> Đã làm xong
                                  </span>
                                )}
                                {item.status === "SERVED" && (
                                  <span className="text-emerald-500 flex items-center gap-1 text-[10px]">
                                    <CheckCircle className="w-3 h-3" /> Đã phục vụ
                                  </span>
                                )}
                                {item.status === "CANCELLED" && (
                                  <span className="text-rose-500 flex items-center gap-1 text-[10px]">
                                    <XCircle className="w-3 h-3" /> Đã hủy
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer details */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-zinc-850 text-xs">
                          <span className="text-zinc-500">Tổng cộng (gồm VAT)</span>
                          <span className="font-bold text-white">{order.totalAmount.toLocaleString("vi-VN")}đ</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Payment button */}
                <div className="p-4 bg-zinc-950/60 border-t border-zinc-800 text-center">
                  <p className="text-[11px] text-zinc-500 mb-2">Sau khi dùng xong, quý khách vui lòng liên hệ nhân viên hoặc thanh toán tại quầy.</p>
                  <button 
                    onClick={() => router.push(`/menu/${tableId}/checkout`)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-xl border border-amber-500 shadow-md shadow-amber-500/10 transition-all active:scale-98 text-xs"
                  >
                    Xem hoá đơn & Thanh toán
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Dialog nhắc nhở Đăng nhập tích điểm */}
        <AnimatePresence>
          {showLoginPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-[320px] bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center shadow-2xl relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-3.5">
                  <Sparkles className="w-6 h-6 animate-bounce" />
                </div>
                
                <h3 className="text-sm font-extrabold text-white mb-1.5">Tích lũy điểm thưởng?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                  Bạn đang đặt đơn dưới tư cách <span className="text-white font-semibold">Khách vãng lai</span>. Đăng nhập ngay để tích luỹ điểm đổi quà cho hóa đơn này nhé!
                </p>

                <div className="space-y-2">
                  <button 
                    onClick={() => router.push(`/login-email?redirect=${encodeURIComponent(`/menu/${tableId}`)}`)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/10 transition-all active:scale-98"
                  >
                    Đăng nhập & Tích điểm
                  </button>
                  <button 
                    onClick={() => setShowLoginPrompt(false)}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs border border-zinc-700/50 transition-all active:scale-98"
                  >
                    Bỏ qua, xem thực đơn
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

    </div>
  );
}
