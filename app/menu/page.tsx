"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";
import { 
  Search, 
  Loader2, 
  Utensils, 
  ChefHat,
  Sparkles,
  ArrowLeft,
  QrCode
} from "lucide-react";
import { motion } from "framer-motion";

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
  imageUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function PublicMenuPage() {
  const router = useRouter();
  const { tenant, loading: tenantLoading } = useTenant();

  // State
  const [loading, setLoading] = useState(true);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch restaurant details
  useEffect(() => {
    const slug = tenant?.slug || tenant?.prefix || (typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "");
    if (!slug && !tenantLoading) {
      // If no tenant is resolved, we can use a fallback or wait
      setLoading(false);
      return;
    }
    if (!slug) return;

    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/restaurants/${slug}`);
        const result = await res.json();
        if (result.success && result.data) {
          const restaurant = result.data;
          setRestaurantData(restaurant);

          // Fetch categories and dishes using the resolved restaurant ID
          const [catRes, dishRes] = await Promise.all([
            axiosInstance.get("/categories", { params: { restaurantId: restaurant.id } }),
            axiosInstance.get("/dishes", { params: { restaurantId: restaurant.id } }),
          ]);

          if (catRes.data?.success) {
            setCategories(catRes.data.data);
          }
          if (dishRes.data?.success) {
            setDishes(dishRes.data.data);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin thực đơn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndMenu();
  }, [tenant, tenantLoading]);

  // Filter Dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory = selectedCategory === "all" || dish.categoryId === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const brandColor = restaurantData?.primaryColor || "#FF5A2C";

  useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty('--primary', brandColor);
    }
  }, [brandColor]);

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: brandColor }} />
        <p className="text-zinc-400 font-medium">Đang tải thực đơn...</p>
      </div>
    );
  }

  const name = restaurantData?.name || tenant?.name || "Nhà hàng";
  const logoUrl = restaurantData?.logoUrl;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center pb-12 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-md bg-zinc-900/40 min-h-screen flex flex-col relative border-x border-zinc-800/60 shadow-2xl backdrop-blur-2xl">
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/60 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={name} 
                className="w-10 h-10 rounded-full object-cover border"
                style={{ borderColor: `${brandColor}40` }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border text-amber-500" style={{ borderColor: `${brandColor}30` }}>
                <Utensils className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-base leading-tight text-white">{name}</h1>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Thực đơn tham khảo</p>
            </div>
          </div>
        </header>

        {/* INFO & SEARCH */}
        <div className="p-4 space-y-4">
          {/* Order Scan Prompt */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850/80 shadow-lg relative overflow-hidden flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex-shrink-0 mt-0.5">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white leading-snug">Bạn đang ở chế độ xem thực đơn</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Để đặt món trực tiếp tại bàn ăn và được phục vụ tận nơi, vui lòng quét mã QR đặt ngay tại bàn của bạn.
              </p>
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

        {/* CATEGORIES SCROLL */}
        <div className="sticky top-[73px] z-20 bg-zinc-950/70 backdrop-blur-md border-y border-zinc-900 py-3 overflow-x-auto scrollbar-none flex gap-2.5 px-4">
          <button 
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === "all" 
                ? "text-black border-none shadow-md" 
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            style={selectedCategory === "all" ? { backgroundColor: brandColor } : {}}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id 
                  ? "text-black border-none shadow-md" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
              style={selectedCategory === cat.id ? { backgroundColor: brandColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* DISHES LIST */}
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
                className="flex gap-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-800 transition-all relative overflow-hidden group"
              >
                {dish.imageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800">
                    <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">{dish.name}</h3>
                    {dish.isBestSeller && (
                      <span className="text-[9px] font-bold text-black bg-amber-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        ★ Best Seller
                      </span>
                    )}
                    {dish.isVegetarian && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                        Chay
                      </span>
                    )}
                    {dish.isSpicy && (
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded">
                        🌶️ Cay
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{dish.description || "Hương vị đậm đà thơm ngon, được chọn lựa nguyên liệu tươi mới mỗi ngày."}</p>
                  <div className="pt-1.5 flex items-center justify-between">
                    <div className="text-sm font-extrabold text-amber-400">
                      {dish.price.toLocaleString("vi-VN")}đ <span className="text-[10px] text-zinc-500 font-normal">/ {dish.unit}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
