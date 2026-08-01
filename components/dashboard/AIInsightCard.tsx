"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";

interface Insight {
  summary: string;
  suggestions: string[];
  anomaly: string | null;
  metrics: {
    todayOrders: number;
    todayRevenue: number;
    revenueChangePercent: number;
    topDish: string | null;
    lowStockCount: number;
  };
}

export default function AIInsightCard() {
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("/dashboard/restaurant/ai-insight")
      .then((res) => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)", color: "#fff" }}>
            <Sparkles size={16} />
          </div>
          <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Báo cáo AI hôm nay</h3>
        </div>
        <button onClick={fetchData} className="p-1.5 rounded-lg transition-colors hover:bg-black/5" style={{ color: "var(--text-muted)" }} aria-label="Làm mới">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !data ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 rounded" style={{ background: "var(--bg-base)" }} />
          <div className="h-4 w-2/3 rounded" style={{ background: "var(--bg-base)" }} />
        </div>
      ) : !data ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có dữ liệu.</p>
      ) : (
        <div className="space-y-3">
          {data.anomaly && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl text-xs" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{data.anomaly}</span>
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{data.summary}</p>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-lg" style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}>
              {data.metrics.todayOrders} đơn
            </span>
            <span className="px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: "var(--bg-base)", color: data.metrics.revenueChangePercent >= 0 ? "#16a34a" : "#dc2626" }}>
              {data.metrics.revenueChangePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {data.metrics.revenueChangePercent >= 0 ? "+" : ""}{data.metrics.revenueChangePercent}%
            </span>
            {data.metrics.lowStockCount > 0 && (
              <span className="px-2 py-1 rounded-lg" style={{ background: "rgba(234,88,12,0.1)", color: "#ea580c" }}>
                {data.metrics.lowStockCount} nguyên liệu sắp hết
              </span>
            )}
          </div>

          {data.suggestions.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {data.suggestions.map((s, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--primary)" }}>•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
