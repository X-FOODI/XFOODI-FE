"use client";

interface TopDish {
  dishId: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface BestSellingDishesCardProps {
  dishes?: TopDish[];
  loading?: boolean;
}

const getRankClass = (rank: number) => {
  switch (rank) {
    case 1: return "dashboard-rank-1";
    case 2: return "dashboard-rank-2";
    case 3: return "dashboard-rank-3";
    default: return "dashboard-rank-default";
  }
};

import { formatVND } from "@/lib/utils/currency";
import { UtensilsCrossed } from "lucide-react";

export default function BestSellingDishesCard({
  dishes = [],
  loading = false,
}: BestSellingDishesCardProps) {
  if (loading) {
    return (
      <div className="dashboard-data-card">
        <div className="dashboard-data-card-header">
          <h3 className="dashboard-data-card-title">Món bán chạy nhất</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-data-card-item">
              <div className="flex items-center gap-3">
                <div className="dashboard-skeleton" style={{ width: "1.5rem", height: "1.5rem" }} />
                <div className="flex-1 space-y-2">
                  <div className="dashboard-skeleton" style={{ height: "0.875rem", width: "70%" }} />
                  <div className="dashboard-skeleton" style={{ height: "0.625rem", width: "50%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return (
      <div className="dashboard-data-card">
        <div className="dashboard-data-card-header">
          <h3 className="dashboard-data-card-title">Món bán chạy nhất</h3>
        </div>
        <div className="text-center py-8 rounded-lg" style={{ background: "var(--surface)" }}>
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 text-zinc-400 opacity-40" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-data-card">
      <div className="dashboard-data-card-header">
        <h3 className="dashboard-data-card-title">Món bán chạy nhất</h3>
        <span className="dashboard-data-card-badge">Top {dishes.length}</span>
      </div>

      <div className="space-y-2">
        {dishes.map((dish, index) => {
          const rank = index + 1;
          return (
            <div key={dish.dishId} className="dashboard-data-card-item">
              <div className="flex items-center gap-3">
                <div className={`dashboard-rank-badge ${getRankClass(rank)}`}>{rank}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {dish.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs mt-0.5">
                    <span style={{ color: "var(--text-muted)" }}>{dish.quantity} suất</span>
                    <span style={{ color: "var(--border)" }}>|</span>
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>
                      {formatVND(dish.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
