"use client";

import React from "react";
import { Plus, Sparkles, Flame } from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import {
  fetchFrequentlyBought,
  fetchMenuRecommendations,
  fetchTopSellers,
  type RecommendedDish,
} from "@/lib/services/recommendationApi";

interface RecommendationsProps {
  variant: "frequently-bought" | "for-cart" | "top-sellers";
  restaurantId: string;
  dishId?: string;
  cartDishIds?: string[];
  /** Ẩn các món này khỏi kết quả (vd: món đã có trong giỏ). */
  excludeIds?: string[];
  onAdd: (dishId: string) => void;
}

export default function Recommendations({
  variant,
  restaurantId,
  dishId,
  cartDishIds,
  excludeIds,
  onAdd,
}: RecommendationsProps) {
  const [items, setItems] = React.useState<RecommendedDish[]>([]);
  const [loading, setLoading] = React.useState(false);

  const cartKey = (cartDishIds ?? []).join(",");
  const excludeKey = (excludeIds ?? []).join(",");

  React.useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        let data: RecommendedDish[] = [];
        if (variant === "frequently-bought") {
          if (!dishId) {
            setItems([]);
            return;
          }
          data = await fetchFrequentlyBought(restaurantId, dishId);
        } else if (variant === "top-sellers") {
          data = await fetchTopSellers(restaurantId);
        } else {
          data = await fetchMenuRecommendations(restaurantId, cartDishIds ?? []);
        }
        const exclude = new Set(excludeIds ?? []);
        if (!cancelled) setItems(data.filter((d) => !exclude.has(d.id)));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce cho biến thể theo giỏ (giỏ thay đổi liên tục)
    if (variant === "for-cart") {
      const t = setTimeout(run, 500);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, restaurantId, dishId, cartKey, excludeKey]);

  // Ẩn hẳn section nếu không có gì (và không đang tải lần đầu)
  if (!loading && items.length === 0) return null;

  const isCart = variant === "for-cart";
  const isTopSellers = variant === "top-sellers";
  const title = isCart
    ? "Gợi ý cho bạn"
    : isTopSellers
    ? "Bán chạy & Dành cho bạn"
    : "Thường được gọi kèm";
  const Icon = isCart || isTopSellers ? Sparkles : Flame;
  const iconColor = isCart
    ? "text-amber-500"
    : isTopSellers
    ? "text-purple-500"
    : "text-orange-500";
  const badge = isCart ? "AI" : isTopSellers ? "AI" : null;
  const badgeClass = isTopSellers
    ? "text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-500/20"
    : "text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/20";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
        {badge && (
          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-36 h-44 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse shrink-0"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {items.map((dish) => (
            <div
              key={dish.id}
              className="w-36 shrink-0 snap-start rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Ảnh món */}
              <div className="h-20 bg-[var(--surface)] relative">
                {dish.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>

              {/* Nội dung */}
              <div className="p-2.5 flex flex-col flex-1 gap-1">
                <p className="text-xs font-semibold text-[var(--text)] leading-tight line-clamp-2">
                  {dish.name}
                </p>
                {dish.reason && (
                  <p className="text-[10px] text-amber-500 italic leading-tight line-clamp-2">
                    {dish.reason}
                  </p>
                )}

                {/* Flavor Match Matrix */}
                {dish.flavors && (
                  <div className="py-1 mt-1 border-t border-[var(--border)] space-y-1">
                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 text-[8px] text-[var(--text-muted)] font-medium">
                      <div className="flex items-center gap-1">
                        <span title="Ngọt">🍭</span>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full" style={{ width: `${(dish.flavors.sweet / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span title="Cay">🔥</span>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${(dish.flavors.spicy / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span title="Đậm đà">🍲</span>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(dish.flavors.savory / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span title="Cồn">🍺</span>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(dish.flavors.alcohol / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Giá & Nút thêm */}
                <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 border-t border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--primary)]">{formatVND(dish.price)}</span>
                  <button
                    onClick={() => onAdd(dish.id)}
                    className="w-6 h-6 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-80 active:scale-90 transition-all shrink-0"
                    aria-label="Thêm vào giỏ"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
