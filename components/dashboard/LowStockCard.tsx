"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { io } from "socket.io-client";
import { useAuth } from "@/lib/contexts/AuthContext";
import { PackageX, RefreshCw } from "lucide-react";

interface LowStockItem {
  id: string;
  name: string;
  unit: string;
  currentQuantity: number;
  minStockLevel: number;
}

export default function LowStockCard() {
  const { user } = useAuth();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("/ingredients/low-stock")
      .then((res) => setItems(res.data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time: cập nhật khi có LOW_STOCK_ALERT
  useEffect(() => {
    const restaurantId = (user as any)?.restaurantId;
    if (!restaurantId) return;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["polling"], withCredentials: true });
    socket.on("connect", () => socket.emit("join_restaurant", restaurantId));
    socket.on("LOW_STOCK_ALERT", () => fetchData());
    return () => {
      socket.disconnect();
    };
  }, [user]);

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <PackageX size={18} style={{ color: "#16a34a" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Cảnh báo tồn kho</h3>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tồn kho ổn định, không có nguyên liệu sắp hết. ✅</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "rgba(234,88,12,0.3)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PackageX size={18} style={{ color: "#ea580c" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Nguyên liệu sắp hết</h3>
          {items.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(234,88,12,0.12)", color: "#ea580c" }}>{items.length}</span>
          )}
        </div>
        <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: "var(--text-muted)" }} aria-label="Làm mới">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--text)" }}>{it.name}</span>
            <span className="text-xs font-mono" style={{ color: it.currentQuantity <= 0 ? "#dc2626" : "#ea580c" }}>
              {it.currentQuantity} / {it.minStockLevel} {it.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
