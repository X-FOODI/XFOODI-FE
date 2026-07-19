"use client";

import { useEffect, useState } from "react";
import { X, Info, AlertTriangle, AlertOctagon } from "lucide-react";
import axiosInstance from "@/lib/services/axiosInstance";

interface Announcement {
  id: string;
  title: string;
  content: string;
  level: string;
  createdAt: string;
}

const LEVEL_STYLE: Record<string, { bg: string; border: string; color: string; Icon: any }> = {
  INFO: { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.35)", color: "#2563eb", Icon: Info },
  WARNING: { bg: "rgba(234,88,12,0.10)", border: "rgba(234,88,12,0.35)", color: "#ea580c", Icon: AlertTriangle },
  CRITICAL: { bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.4)", color: "#dc2626", Icon: AlertOctagon },
};

const STORAGE_KEY = "dismissed_announcements";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function SystemAnnouncementBanner({
  variant = "inline",
}: {
  variant?: "inline" | "floating-bottom";
}) {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get("/announcements/active")
      .then((res) => {
        if (cancelled) return;
        const all: Announcement[] = res.data?.data || [];
        const dismissed = getDismissed();
        setItems(all.filter((a) => !dismissed.includes(a.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = (id: string) => {
    const next = [...getDismissed(), id];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  if (items.length === 0) return null;

  const floating = variant === "floating-bottom";

  return (
    <div
      className="w-full"
      style={
        floating
          ? {
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 60,
              background: "var(--card)",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
            }
          : undefined
      }
    >
      {items.map((a) => {
        const s = LEVEL_STYLE[a.level] || LEVEL_STYLE.INFO;
        const Icon = s.Icon;
        return (
          <div
            key={a.id}
            className="flex items-start gap-3 px-4 sm:px-6 py-2.5 border-b"
            style={{ background: s.bg, borderColor: s.border }}
          >
            <Icon size={18} style={{ color: s.color, marginTop: 1, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                {a.title}
              </span>
              <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
                {a.content}
              </span>
            </div>
            <button
              onClick={() => dismiss(a.id)}
              className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/10"
              style={{ color: "var(--text-muted)" }}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
