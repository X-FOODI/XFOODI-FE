"use client";

import React from "react";
import { Plus, Sparkles, Flame, Loader2 } from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import {
  fetchFrequentlyBought,
  fetchMenuRecommendations,
  type RecommendedDish,
} from "@/lib/services/recommendationApi";

interface RecommendationsProps {
  variant: "frequently-bought" | "for-cart";
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
        } else {
          if (!cartDishIds || cartDishIds.length === 0) {
            setItems([]);
            return;
          }
          data = await fetchMenuRecommendations(restaurantId, cartDishIds);
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
  const title = isCart ? "Gợi ý cho bạn" : "Thường được gọi kèm";
  const Icon = isCart ? Sparkles : Flame;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${isCart ? "text-amber-400" : "text-orange-500"}`} />
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {isCart && (
          <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400 px-1.5 py-0.5 bg-amber-500/10 rounded">
            AI
          </span>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-36 h-40 rounded-2xl bg-zinc-900/60 border border-zinc-850 animate-pulse shrink-0"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {items.map((dish) => (
            <div
              key={dish.id}
              className="w-36 shrink-0 snap-start rounded-2xl bg-zinc-900/70 border border-zinc-850 overflow-hidden flex flex-col"
            >
              <div className="h-20 bg-zinc-950 relative">
                {dish.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>
              <div className="p-2.5 flex flex-col flex-1 gap-1">
                <p className="text-xs font-semibold text-zinc-100 leading-tight line-clamp-2">
                  {dish.name}
                </p>
                {dish.reason && (
                  <p className="text-[10px] text-amber-400/80 italic leading-tight line-clamp-2">
                    {dish.reason}
                  </p>
                )}
                {dish.flavors && (
                  <div className="py-1 mt-1 border-t border-zinc-800/60 space-y-1">
                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 text-[8px] text-zinc-400 font-medium">
                      <div className="flex items-center gap-1">
                        <span title="Ngọt">🍭</span>
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full" style={{ width: `${(dish.flavors.sweet / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span title="Cay">🔥</span>
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${(dish.flavors.spicy / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span title="Đậm đà">🍲</span>
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(dish.flavors.savory / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span title="Cồn">🍺</span>
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(dish.flavors.alcohol / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 border-t border-zinc-800/20">
                  <span className="text-xs font-bold text-amber-400">{formatVND(dish.price)}</span>
                  <button
                    onClick={() => onAdd(dish.id)}
                    className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 active:scale-90 transition-all shrink-0"
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
