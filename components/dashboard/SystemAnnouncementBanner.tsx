"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
  variant?: "inline" | "floating-top" | "floating-bottom";
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

  // Với banner cố định đầu trang: đẩy header xuống bằng CSS var để không bị che
  useEffect(() => {
    if (variant !== "floating-top") return;
    const h = items.length > 0 ? "46px" : "0px";
    document.documentElement.style.setProperty("--ann-banner-height", h);
    return () => {
      document.documentElement.style.setProperty("--ann-banner-height", "0px");
    };
  }, [variant, items.length]);

  const dismiss = (id: string) => {
    const next = [...getDismissed(), id];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  const dismissAll = () => {
    const next = [...getDismissed(), ...items.map((a) => a.id)];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setItems([]);
  };

  if (items.length === 0) return null;

  const floatingStyle: CSSProperties | undefined =
    variant === "floating-top"
      ? { position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, background: "var(--card)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }
      : variant === "floating-bottom"
        ? { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: "var(--card)", boxShadow: "0 -4px 16px rgba(0,0,0,0.12)" }
        : undefined;

  // Màu nền theo mức độ cao nhất
  const topLevel = items.some((i) => i.level === "CRITICAL")
    ? "CRITICAL"
    : items.some((i) => i.level === "WARNING")
      ? "WARNING"
      : "INFO";
  const s = LEVEL_STYLE[topLevel];
  const Icon = s.Icon;

  // Một "đoạn" chứa toàn bộ thông báo — nhân đôi để chạy vòng liền mạch
  const segment = (dup: number) => (
    <span key={dup} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      {items.map((a) => (
        <span key={a.id + "-" + dup} style={{ display: "inline-flex", alignItems: "center", paddingRight: 48 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: LEVEL_STYLE[a.level]?.color || s.color,
              marginRight: 10,
            }}
          />
          <strong style={{ color: "var(--text)" }}>{a.title}</strong>
          <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{a.content}</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="w-full" style={floatingStyle}>
      <div
        className="flex items-center gap-3 border-b"
        style={{ background: s.bg, borderColor: s.border, overflow: "hidden", padding: "9px 12px" }}
      >
        <Icon size={18} style={{ color: s.color, flexShrink: 0 }} />
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div
            className="ann-marquee-track"
            style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform", fontSize: 14 }}
          >
            {segment(0)}
            {segment(1)}
          </div>
        </div>
        <button
          onClick={dismissAll}
          className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/10"
          style={{ color: "var(--text-muted)" }}
          aria-label="Đóng"
        >
          <X size={16} />
        </button>
      </div>
      <style>{`
        @keyframes annMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ann-marquee-track { animation: annMarquee 22s linear infinite; }
        .ann-marquee-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
