"use client";

import React, { useState } from "react";
import type { Category } from "@/lib/services/categoryService";
import type { Dish } from "@/lib/services/dishService";

interface MenuPreviewProps {
  restaurantName: string;
  logoUrl?: string | null;
  categories: Category[];
  dishes: Dish[];
  isLoading: boolean;
}

export default function MenuPreview({
  restaurantName,
  logoUrl = null,
  categories = [],
  dishes = [],
  isLoading,
}: MenuPreviewProps) {
  const [viewMode, setViewMode] = useState<"mobile" | "laptop">("mobile");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<Array<{ dish: Dish; quantity: number }>>([]);

  const activeDishes = dishes.filter(d => d.isActive);

  // Filter dishes based on selection
  const filteredDishes = activeDishes.filter((dish) => {
    const matchesCategory = selectedCategory === "all" || dish.categoryId === selectedCategory;
    const matchesSearch = 
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleAddMockToCart = (dish: Dish) => {
    setCartItems((prev) => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item => 
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const handleRemoveMockFromCart = (dishId: string) => {
    setCartItems((prev) => 
      prev.map(item => {
        if (item.dish.id === dishId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const handleResetCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.dish.price), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col items-center justify-center py-4 px-2">
      
      {/* View Mode Toggle & Explanation Banner */}
      <div className="w-full max-w-4xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl border bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-3 text-xs">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-soft)" }}>
            <svg className="w-4 h-4 text-primary" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <p className="font-bold" style={{ color: "var(--text)" }}>Chế độ xem trước thực đơn thực tế</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Chọn chế độ hiển thị trên Điện thoại hoặc Laptop của khách hàng khi truy cập menu.
            </p>
          </div>
        </div>

        {/* Toggle Mode buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-black/10 dark:bg-white/5 rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === "mobile"
                ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            style={viewMode === "mobile" ? { color: "var(--primary)" } : {}}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Điện thoại
          </button>
          <button
            onClick={() => setViewMode("laptop")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === "laptop"
                ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            style={viewMode === "laptop" ? { color: "var(--primary)" } : {}}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Laptop / Tablet
          </button>
        </div>
      </div>

      {/* ─── 1. MOBILE VIEW ─── */}
      {viewMode === "mobile" && (
        <div 
          className="relative w-[360px] h-[720px] rounded-[3rem] border-[10px] border-zinc-800 dark:border-zinc-700 shadow-2xl flex flex-col overflow-hidden bg-zinc-950 text-zinc-100 transition-all select-none"
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)" }}
        >
          {/* Dynamic Notch / Speaker */}
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-center z-50 pointer-events-none">
            <div className="w-28 h-4.5 bg-zinc-800 rounded-b-xl flex items-center justify-center">
              <div className="w-12 h-1 bg-black/60 rounded-full" />
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full ml-3 border border-zinc-800" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 flex flex-col pt-6 overflow-hidden relative">
            <header className="bg-zinc-900/95 border-b border-zinc-800 p-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={restaurantName} className="w-8 h-8 rounded-full object-cover border border-amber-500/40" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
                <div className="overflow-hidden">
                  <h1 className="font-bold text-xs leading-tight text-white truncate w-[160px]">{restaurantName}</h1>
                  <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">★ Bàn A01</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">Mở</span>
              </div>
            </header>

            {/* Search Box */}
            <div className="p-3 bg-zinc-900/50 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Tìm món ngon, nước uống..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            {/* Categories scrollbar */}
            <div className="bg-zinc-950 py-2 border-y border-zinc-900 overflow-x-auto scrollbar-none flex gap-2 px-3 flex-shrink-0">
              <button 
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === "all" ? "bg-amber-500 text-black border-amber-500" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id ? "bg-amber-500 text-black border-amber-500" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dishes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-zinc-950/40">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">Đang tải danh sách...</span>
                </div>
              ) : filteredDishes.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 space-y-2">
                  <p className="text-[11px]">Không có món nào hiển thị</p>
                </div>
              ) : (
                filteredDishes.map((dish) => (
                  <div key={dish.id} className="flex gap-2.5 p-2 rounded-xl bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 transition-all relative items-center">
                    {/* Dish Image Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-850 flex-shrink-0 bg-zinc-950 flex items-center justify-center text-xs">
                      {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                      ) : (
                        "🍔"
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <h3 className="font-bold text-xs text-white truncate max-w-[140px]">{dish.name}</h3>
                        {dish.isBestSeller && <span className="text-[7px] font-bold text-black bg-amber-500 px-0.5 rounded">★</span>}
                        {dish.isVegetarian && <span className="text-[7px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-0.5 rounded">Chay</span>}
                        {dish.isSpicy && <span className="text-[7px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-0.5 rounded">🌶️</span>}
                      </div>
                      {dish.description && <p className="text-[9px] text-zinc-500 truncate">{dish.description}</p>}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-xs font-extrabold text-amber-400">{Number(dish.price).toLocaleString("vi-VN")}₫</span>
                        <span className="text-[9px] text-zinc-500">/{dish.unit || "phần"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center flex-shrink-0">
                      <button
                        onClick={() => handleAddMockToCart(dish)}
                        className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center shadow-md active:scale-90 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mini shopping cart */}
            {cartCount > 0 && (
              <div className="absolute bottom-4 inset-x-3 bg-amber-500 text-black rounded-xl p-2.5 flex items-center justify-between shadow-lg z-30 animate-slideUp">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-black/10 rounded-full flex items-center justify-center font-extrabold text-[10px]">{cartCount}</div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase opacity-85">Đã chọn</span>
                    <span className="text-xs font-black">{cartTotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
                <button onClick={handleResetCart} className="text-[10px] font-bold px-2 py-1 bg-black/10 rounded-md">Đặt lại</button>
              </div>
            )}
          </div>
          <div className="h-4 bg-zinc-950 flex justify-center items-center flex-shrink-0 border-t border-zinc-900">
            <div className="w-24 h-1 bg-zinc-700 rounded-full" />
          </div>
        </div>
      )}

      {/* ─── 2. LAPTOP VIEW ─── */}
      {viewMode === "laptop" && (
        <div 
          className="relative w-full max-w-4xl rounded-2xl border-[6px] border-zinc-800 dark:border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col overflow-hidden aspect-[16/10] transition-all select-none"
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)" }}
        >
          {/* Browser Mockup Tab Bar */}
          <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            
            {/* Address Bar */}
            <div className="w-3/5 max-w-lg bg-zinc-950/80 border border-zinc-850 rounded-lg py-1 px-3 text-[10px] text-zinc-400 text-center truncate select-all flex items-center justify-center gap-1 font-mono">
              <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              https://xfoodi.vn/menu/A01 (Chế độ xem trước)
            </div>
            
            <div className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] text-zinc-500">Live Preview</span>
            </div>
          </div>

          {/* Browser Workspace */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Category Sidebar */}
            <aside className="w-44 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0 p-3 space-y-1.5 overflow-y-auto">
              <div className="px-2 py-1">
                <h3 className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Danh mục thực đơn</h3>
              </div>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  selectedCategory === "all" ? "bg-amber-500 text-black" : "text-zinc-400 hover:bg-zinc-850 hover:text-white"
                }`}
              >
                <span>Tất cả</span>
                <span className="text-[10px] opacity-70">({activeDishes.length})</span>
              </button>
              {categories.map((cat) => {
                const count = activeDishes.filter(d => d.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      selectedCategory === cat.id ? "bg-amber-500 text-black" : "text-zinc-400 hover:bg-zinc-850 hover:text-white"
                    }`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </aside>

            {/* Central Dishes Grid */}
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/20">
              {/* Top Bar inside page */}
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500 flex-shrink-0">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs text-white truncate">{restaurantName}</h2>
                    <p className="text-[9px] text-zinc-500 truncate">Menu số hóa dành cho máy tính để bàn</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative w-44 flex-shrink-0">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Tìm món ngon..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-1 pl-8 pr-2.5 text-[11px] text-zinc-200 focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>

              {/* Grid content */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredDishes.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                    <p className="text-xs">Không có món ăn nào hiển thị khớp với bộ lọc</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {filteredDishes.map((dish) => (
                      <div 
                        key={dish.id} 
                        className="p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-850 hover:border-zinc-800 transition-all flex items-center justify-between gap-3"
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Dish Image Thumbnail */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 flex-shrink-0 bg-zinc-900 flex items-center justify-center text-xs">
                            {dish.imageUrl ? (
                              <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                            ) : (
                              "🍔"
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-xs text-white truncate leading-tight">{dish.name}</h4>
                              {dish.isBestSeller && <span className="text-[7px] font-bold text-black bg-amber-500 px-1 rounded-sm">★ Bán chạy</span>}
                              {dish.isVegetarian && <span className="text-[7px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded-sm">Chay</span>}
                              {dish.isSpicy && <span className="text-[7px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 rounded-sm">🌶️ Cay</span>}
                            </div>
                            {dish.description && (
                              <p className="text-[10px] text-zinc-500 line-clamp-1">{dish.description}</p>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-extrabold text-amber-400">{Number(dish.price).toLocaleString("vi-VN")}₫</span>
                              <span className="text-[9px] text-zinc-500">/{dish.unit || "phần"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleAddMockToCart(dish)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black active:scale-95 transition-all shadow-md"
                          >
                            Chọn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Cart Sidebar (Desktop Style) */}
            <aside className="w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col flex-shrink-0 overflow-hidden">
              <div className="p-4 border-b border-zinc-850 flex items-center justify-between flex-shrink-0">
                <h3 className="font-extrabold text-xs text-white">Giỏ hàng của bàn</h3>
                {cartCount > 0 && (
                  <button onClick={handleResetCart} className="text-[10px] text-zinc-400 hover:text-white font-bold transition-all">Đặt lại</button>
                )}
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-16">
                    <svg className="w-8 h-8 opacity-20 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-[10px] max-w-[160px]">Giỏ hàng của bàn hiện chưa có món nào chọn</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.dish.id} className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="font-bold text-[11px] text-white truncate">{item.dish.name}</h4>
                        <span className="text-[10px] text-amber-500 font-extrabold">{(Number(item.dish.price) * item.quantity).toLocaleString("vi-VN")}₫</span>
                      </div>
                      
                      {/* Quantity selector */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button 
                          onClick={() => handleRemoveMockFromCart(item.dish.id)}
                          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-750 text-white flex items-center justify-center text-xs font-bold transition-all"
                        >
                          -
                        </button>
                        <span className="text-[11px] font-bold text-zinc-200 min-w-[14px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => handleAddMockToCart(item.dish)}
                          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-750 text-white flex items-center justify-center text-xs font-bold transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              <div className="p-4 border-t border-zinc-850 bg-zinc-950/60 flex-shrink-0">
                <div className="flex justify-between items-center mb-4 text-xs">
                  <span className="font-bold text-zinc-400">Tổng cộng</span>
                  <span className="font-black text-amber-400 text-sm">{cartTotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <button
                  disabled={cartCount === 0}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Gửi yêu cầu đặt món (Mock)
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
