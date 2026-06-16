"use client";
import React, { useEffect, useRef, useState } from "react";
import reservationService, {
  ReservationStats,
  StatsPeriod,
} from "@/lib/services/reservationService";

interface Props {
  restaurantId: string;
}

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "this_week", label: "Tuần này" },
  { value: "this_month", label: "Tháng này" },
];

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export default function StatsCards({ restaurantId }: Props) {
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>("today");
  const [loading, setLoading] = useState(true);
  const [staleWarning, setStaleWarning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = async (showLoading = false) => {
    if (!restaurantId) return;
    if (showLoading) setLoading(true);
    try {
      const data = await reservationService.getStats(restaurantId, period);
      setStats(data);
      setStaleWarning(false);
    } catch {
      if (stats) setStaleWarning(true); // retain last values
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(true);
    // Auto-refresh every 5 minutes
    intervalRef.current = setInterval(() => fetchStats(false), 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, period]);

  const cards: StatCard[] = stats
    ? [
        {
          label: "Tổng đặt bàn",
          value: stats.totalReservations,
          icon: "📋",
          color: "#6366f1",
        },
        {
          label: "Đã xác nhận",
          value: stats.confirmedCount,
          icon: "✅",
          color: "#10b981",
        },
        {
          label: "Đã check-in",
          value: stats.checkedInCount,
          icon: "🏃",
          color: "#f59e0b",
        },
        {
          label: "Hoàn thành",
          value: stats.completedCount,
          icon: "🎉",
          color: "#3b82f6",
        },
        {
          label: "Đã hủy",
          value: stats.cancelledCount,
          icon: "❌",
          color: "#6b7280",
        },
        {
          label: "Tỷ lệ check-in",
          value: `${stats.checkInRate}%`,
          icon: "📊",
          color: "#8b5cf6",
        },
        {
          label: "Doanh thu cọc",
          value: `${stats.totalDepositCollected.toLocaleString("vi-VN")}đ`,
          icon: "💰",
          color: "#ef4444",
        },
      ]
    : [];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Period selector */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <span
          style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}
        >
          Thống kê:
        </span>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${
                period === p.value ? "#6366f1" : "var(--border)"
              }`,
              background:
                period === p.value ? "#6366f112" : "var(--surface)",
              color: period === p.value ? "#6366f1" : "var(--text-muted)",
            }}
          >
            {p.label}
          </button>
        ))}
        {staleWarning && (
          <span style={{ fontSize: 12, color: "#f59e0b", marginLeft: 8 }}>
            ⚠️ Không thể cập nhật số liệu
          </span>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                borderRadius: 12,
                padding: "16px 14px",
                height: 80,
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "var(--card)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>{card.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {card.label}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: card.color,
                }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
