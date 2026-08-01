"use client";

import { useEffect, useState } from "react";
import { Wrench, Clock, RefreshCw } from "lucide-react";

interface Props {
  label: string;
  message?: string;
  estimatedFinish?: string;
}

export default function ModuleMaintenanceScreen({ label, message, estimatedFinish }: Props) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!estimatedFinish) {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const diff = new Date(estimatedFinish).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("sắp xong");
        return;
      }
      const mins = Math.ceil(diff / 60000);
      setRemaining(mins >= 60 ? `~${Math.round(mins / 60)} giờ` : `~${mins} phút`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [estimatedFinish]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-md w-full rounded-3xl border p-8 space-y-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "rgba(234,88,12,0.12)", color: "#ea580c" }}>
          <Wrench size={30} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {label} đang được bảo trì
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {message || "Chức năng này tạm thời gián đoạn để nâng cấp. Các phần khác của hệ thống vẫn hoạt động bình thường."}
          </p>
        </div>

        {remaining && (
          <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}>
            <Clock size={13} /> Dự kiến xong {remaining}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          <RefreshCw size={15} /> Thử lại
        </button>
      </div>
    </div>
  );
}
