"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import axiosInstance from "@/lib/services/axiosInstance";
import { io } from "socket.io-client";
import DOMPurify from "dompurify";
import {
  Trash2,
  X,
  Send,
  Sparkles,
  ShoppingCart,
  Check,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Tag,
  ClipboardList,
  BookOpen,
  Bell,
  Clock,
  Maximize2,
  Minimize2,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */
interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface AIConfig {
  isChatEnabled: boolean;
  aiModel: string;
  temperature: number;
  welcomeMessage: string;
  systemPrompt: string;
  quickSuggestions: string[];
}

type ChatType = "system" | "restaurant";

/* ─────────────────────────── Helpers ─────────────────────────── */
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/** Strip [ACTION:...] tags, convert markdown → HTML for chat bubbles */
function renderMessageContent(text: string) {
  if (!text && text !== "") return null;
  // Strip ACTION tags
  let clean = text.replace(/\[ACTION:\s*[A-Z_]+(?:\s+\{[\s\S]*?\})?\s*\]/g, "").trim();

  // Escape HTML first
  clean = clean
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Convert markdown to HTML
  clean = clean
    // Code block (```)
    .replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.06);border-radius:8px;padding:8px 10px;margin:6px 0;font-size:12px;overflow-x:auto;white-space:pre-wrap;"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.08);padding:1px 5px;border-radius:4px;font-size:12px;">$1</code>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // H1-H3
    .replace(/^### (.*?)$/gm, '<p style="font-weight:800;font-size:13px;margin:8px 0 4px;">$1</p>')
    .replace(/^## (.*?)$/gm, '<p style="font-weight:800;font-size:14px;margin:8px 0 4px;">$1</p>')
    .replace(/^# (.*?)$/gm, '<p style="font-weight:900;font-size:15px;margin:8px 0 4px;">$1</p>')
    // Numbered list
    .replace(/^(\d+)\. (.*?)$/gm, '<div style="display:flex;gap:6px;margin:2px 0;"><span style="min-width:16px;font-weight:700;color:var(--primary);">$1.</span><span>$2</span></div>')
    // Bullet list
    .replace(/^[-•*] (.*?)$/gm, '<div style="display:flex;gap:6px;margin:2px 0;"><span style="min-width:12px;color:var(--primary);">•</span><span>$1</span></div>')
    // Blockquote
    .replace(/^&gt; (.*?)$/gm, '<div style="border-left:3px solid var(--primary);padding-left:8px;color:var(--text-muted);margin:4px 0;">$1</div>')
    // Blank lines → paragraph break
    .replace(/\n{2,}/g, '</p><p style="margin:6px 0;">')
    // Single newline
    .replace(/\n/g, '<br/>');

  // Input is already HTML-escaped above; sanitize the final markup as defense-in-depth.
  const safeHtml = DOMPurify.sanitize(`<p style="margin:0">${clean}</p>`);
  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}

/* ─────────────────────────── Sub-components ─────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px" }}>
      {[0, 150, 300].map((delay, i) => (
        <span
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--text-muted)",
            display: "inline-block",
            animation: "chatDotBounce 1.2s infinite ease-in-out",
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── A2UI System ─────────────────────────── */
interface UICard { type: string; data: Record<string, any>; }

/** Extract [UI: TYPE {...}] tags from AI response, return clean text + cards */
function extractUICards(text: string): { cleanText: string; cards: UICard[] } {
  const cards: UICard[] = [];
  const re = /\[UI:\s*([A-Z_]+)(?:\s+(\{[\s\S]*?\}))?\s*\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    try {
      cards.push({ type: m[1], data: m[2] ? JSON.parse(m[2]) : {} });
    } catch { /* skip malformed */ }
  }
  const cleanText = text
    .replace(/\[UI:\s*[A-Z_]+(?:\s+\{[\s\S]*?\})?\s*\]/g, "")
    .replace(/\[ACTION:\s*[A-Z_]+(?:\s+\{[\s\S]*?\})?\s*\]/g, "")
    .trim();
  return { cleanText, cards };
}

/* ── PRICING_CARD ── */
function PricingCard({ data, accentColor }: { data: any; accentColor: string }) {
  const isProHighlight = data.highlight === "pro";
  return (
    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {[
        { name: "FREE", price: "0đ", badge: null, features: ["Gọi món QR cơ bản", "Báo cáo đơn giản", "Tối đa 5 bàn", "2MB tài liệu AI"], cta: "Dùng ngay" },
        { name: "PRO", price: "499.000đ/tháng", badge: "🔥 Phổ biến", features: ["Không giới hạn bàn", "Sơ đồ bàn 3D", "AI Chatbot RAG", "Quản lý kho nâng cao", "Tích hợp PayOS"], cta: "Dùng thử 14 ngày" },
      ].map((plan, i) => {
        const isHighlight = (isProHighlight && i === 1) || (!isProHighlight && i === 0);
        return (
          <div key={i} style={{
            borderRadius: 14, padding: "14px 12px",
            background: isHighlight ? accentColor : "var(--surface)",
            border: isHighlight ? "none" : "1px solid var(--border)",
            color: isHighlight ? "white" : "var(--text)",
            position: "relative", overflow: "hidden",
          }}>
            {plan.badge && (
              <div style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: 999, display: "inline-block", marginBottom: 8 }}>{plan.badge}</div>
            )}
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 2 }}>{plan.name}</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, opacity: 0.85 }}>{plan.price}</div>
            {plan.features.map((f, j) => (
              <div key={j} style={{ fontSize: 11, display: "flex", gap: 5, marginBottom: 3, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, opacity: 0.8 }}>✓</span>
                <span style={{ opacity: 0.9 }}>{f}</span>
              </div>
            ))}
            <a href="/register-restaurant" style={{
              display: "block", marginTop: 12, padding: "7px 0",
              borderRadius: 8, textAlign: "center", textDecoration: "none",
              fontSize: 11, fontWeight: 700,
              background: isHighlight ? "rgba(255,255,255,0.2)" : accentColor,
              color: isHighlight ? "white" : "white",
              border: isHighlight ? "1px solid rgba(255,255,255,0.3)" : "none",
            }}>{plan.cta} →</a>
          </div>
        );
      })}
    </div>
  );
}

/* ── FEATURE_CARD ── */
function FeatureCard({ data, accentColor }: { data: any; accentColor: string }) {
  const features: string[] = data.features || [];
  return (
    <div style={{ marginTop: 10, background: "var(--surface)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 800, fontSize: 12, color: "var(--text)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ background: accentColor, color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Sparkles style={{ width: 10, height: 10 }} /> TÍNH NĂNG
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 8px" }}>
        {features.map((f, i) => (
          <div key={i} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5, color: "var(--text)" }}>
            <span style={{ color: accentColor, fontWeight: 800, fontSize: 13 }}>✓</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <a href="/register-restaurant" style={{
        display: "block", marginTop: 12, padding: "8px", borderRadius: 10,
        background: accentColor, color: "white", textAlign: "center",
        fontSize: 12, fontWeight: 700, textDecoration: "none",
      }}>Trải nghiệm tất cả tính năng →</a>
    </div>
  );
}

/* ── CTA_CARD ── */
function CtaCard({ data, accentColor }: { data: any; accentColor: string }) {
  return (
    <div style={{ marginTop: 10, borderRadius: 14, padding: "14px 16px", background: `color-mix(in srgb, ${accentColor} 10%, var(--surface))`, border: `1px solid color-mix(in srgb, ${accentColor} 30%, var(--border))` }}>
      <a href={data.url || "/register-restaurant"} style={{
        display: "block", padding: "10px", borderRadius: 10,
        background: accentColor, color: "white", textAlign: "center",
        fontSize: 13, fontWeight: 800, textDecoration: "none",
        boxShadow: `0 4px 12px ${accentColor}40`,
      }}>
        {data.label || "Đăng ký ngay →"}
      </a>
      {data.note && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", margin: "8px 0 0" }}>
          {data.note}
        </p>
      )}
    </div>
  );
}

/* ── STEPS_CARD ── */
function StepsCard({ data, accentColor }: { data: any; accentColor: string }) {
  const steps: string[] = data.steps || [];
  return (
    <div style={{ marginTop: 10, background: "var(--surface)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 800, fontSize: 11, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quy trình đăng ký</div>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < steps.length - 1 ? 10 : 0, alignItems: "flex-start" }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            background: accentColor, color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800,
          }}>{i + 1}</div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{step}</span>
            {i < steps.length - 1 && (
              <div style={{ width: 1, height: 10, background: "var(--border)", margin: "4px 0 0 -22px", marginLeft: "calc(-10px + 12px)" }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── DISH_CONFIRM ── */
function DishConfirmCard({ data, accentColor, onAddToCart }: { data: any; accentColor: string; onAddToCart?: (d: any) => void }) {
  const [added, setAdded] = useState(false);
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
  return (
    <div style={{ marginTop: 10, background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>{data.name || "Món ăn"}</span>
          <span style={{ fontWeight: 800, fontSize: 13, color: accentColor }}>{fmt(data.price || 0)}</span>
        </div>
        {data.description && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px" }}>{data.description}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              if (onAddToCart) onAddToCart(data);
              setAdded(true);
              setTimeout(() => setAdded(false), 2500);
            }}
            style={{
              flex: 1, padding: "8px", borderRadius: 10, border: "none",
              background: added ? "#22c55e" : accentColor, color: "white",
              fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "background 0.3s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {added ? (
              <>
                <Check style={{ width: 14, height: 14 }} />
                <span>Đã thêm vào giỏ!</span>
              </>
            ) : (
              <>
                <ShoppingCart style={{ width: 14, height: 14 }} />
                <span>Thêm vào giỏ hàng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── BOOKING_FORM ── */
function BookingFormCard({ data, accentColor }: { data: any; accentColor: string }) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [form, setForm] = useState({
    date: "",
    time: "",
    guests: "2",
    note: "",
    fullName: "",
    phoneNumber: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      setError("Vui lòng chọn đầy đủ ngày và giờ đặt bàn.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const restaurantId = tenant?.id || "";
      if (!restaurantId) {
        throw new Error("Không xác định được nhà hàng để đặt bàn.");
      }

      const payload: any = {
        restaurantId,
        numberOfGuests: Number(form.guests),
        time: new Date(`${form.date}T${form.time}:00`).toISOString(),
        specialRequests: form.note || undefined,
      };

      if (!user) {
        payload.fullName = form.fullName;
        payload.phoneNumber = form.phoneNumber;
        payload.email = form.email;
      }

      const response = await axiosInstance.post("/reservations", payload);
      if (response.data?.success && response.data?.data) {
        setConfirmationCode(response.data.data.confirmationCode);
        setSubmitted(true);
      } else {
        throw new Error(response.data?.message || "Lỗi bất thường từ máy chủ.");
      }
    } catch (err: any) {
      console.error("[BookingFormCard] Reservation error:", err);
      setError(err?.response?.data?.message || err?.message || "Đặt bàn không thành công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div style={{ marginTop: 10, borderRadius: 14, padding: "16px", background: "var(--card)", border: "1.5px solid #22c55e", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <CheckCircle2 style={{ width: 28, height: 28, color: "#22c55e" }} />
      </div>
      <p style={{ fontWeight: 800, fontSize: 13, color: "#22c55e", margin: 0 }}>Yêu cầu đặt bàn đã được xác nhận!</p>
      {confirmationCode && (
        <div style={{ margin: "10px auto", padding: "6px 12px", background: "rgba(34,197,94,0.1)", borderRadius: 8, border: "1px dashed #22c55e", display: "inline-block", fontSize: 13, fontWeight: 800, color: "#22c55e", fontFamily: "monospace" }}>
          MÃ XÁC NHẬN: {confirmationCode}
        </div>
      )}
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>Hệ thống đã gửi email xác nhận đặt bàn của bạn.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, background: "var(--surface)", borderRadius: 14, padding: "14px", border: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, color: "var(--text)" }}>
        <span style={{ background: accentColor, color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Calendar style={{ width: 10, height: 10 }} /> ĐẶT BÀN
        </span>
        <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{data.restaurantName}</span>
      </div>
      
      {error && (
        <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444", fontSize: 11.5, marginBottom: 10, lineHeight: 1.4 }}>
          {error}
        </div>
      )}

      {/* Date selector (Ant Design) */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Ngày</label>
        <DatePicker 
          value={form.date ? dayjs(form.date) : null}
          onChange={(val) => setForm(prev => ({ ...prev, date: val ? val.format("YYYY-MM-DD") : "" }))}
          disabledDate={(current) => current && current < dayjs().startOf("day")}
          style={{ width: "100%", height: 38, borderRadius: 8 }}
          placeholder="Chọn ngày đặt bàn"
          format="DD/MM/YYYY"
          allowClear={false}
          inputReadOnly={true}
        />
      </div>

      {/* Time selector (Ant Design) */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Giờ</label>
        <TimePicker 
          value={form.time ? dayjs(form.time, "HH:mm") : null}
          onChange={(val) => setForm(prev => ({ ...prev, time: val ? val.format("HH:mm") : "" }))}
          format="HH:mm"
          minuteStep={15}
          style={{ width: "100%", height: 38, borderRadius: 8 }}
          placeholder="Chọn giờ đến"
          allowClear={false}
          inputReadOnly={true}
        />
      </div>

      {/* Guests Selector (Plus/Minus Counter) */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Số người</label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button 
            type="button"
            onClick={() => setForm(prev => ({ ...prev, guests: String(Math.max(1, Number(prev.guests) - 1)) }))}
            className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xl text-[var(--text)] flex items-center justify-center hover:bg-[var(--border)] transition-colors active:scale-95"
          >
            −
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", minWidth: 24, textAlign: "center" }}>{form.guests}</span>
          <button 
            type="button"
            onClick={() => setForm(prev => ({ ...prev, guests: String(Math.min(100, Number(prev.guests) + 1)) }))}
            className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xl text-[var(--text)] flex items-center justify-center hover:bg-[var(--border)] transition-colors active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Yêu cầu đặc biệt</label>
        <textarea
          rows={2}
          value={form.note}
          placeholder="Ví dụ: Bàn gần cửa sổ, ăn chay..."
          onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
          style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box", outline: "none", resize: "none" }}
        />
      </div>

      {!user && (
        <>
          <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
          <div style={{ fontWeight: 700, fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Thông tin liên hệ (Khách)</div>
          {[
            { label: "Họ và tên", key: "fullName", type: "text", placeholder: "Nhập họ tên của bạn", required: true },
            { label: "Số điện thoại", key: "phoneNumber", type: "tel", placeholder: "Nhập số điện thoại", required: true },
            { label: "Email", key: "email", type: "email", placeholder: "Nhập email liên hệ", required: true },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>{field.label}</label>
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={(form as any)[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box", outline: "none" }}
              />
            </div>
          ))}
        </>
      )}

      <button type="submit" disabled={loading} style={{
        width: "100%", padding: "9px", borderRadius: 10, border: "none",
        background: accentColor, color: "white", fontWeight: 700, fontSize: 12, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        {loading ? (
          "Đang gửi yêu cầu..."
        ) : (
          <>
            <span>Gửi yêu cầu đặt bàn</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </>
        )}
      </button>
    </form>
  );
}

/* ── Card dispatcher ── */
function renderUICard(card: UICard, accentColor: string, onAddToCart?: (d: any) => void) {
  switch (card.type) {
    case "PRICING_CARD":   return <PricingCard data={card.data} accentColor={accentColor} />;
    case "FEATURE_CARD":   return <FeatureCard data={card.data} accentColor={accentColor} />;
    case "CTA_CARD":       return <CtaCard data={card.data} accentColor={accentColor} />;
    case "STEPS_CARD":     return <StepsCard data={card.data} accentColor={accentColor} />;
    case "DISH_CONFIRM":   return <DishConfirmCard data={card.data} accentColor={accentColor} onAddToCart={onAddToCart} />;
    case "BOOKING_FORM":   return <BookingFormCard data={card.data} accentColor={accentColor} />;
    default: return null;
  }
}


const getSuggestionDetails = (chip: string) => {
  const clean = chip.replace(/\s*[^\w\s가-힣\u00C0-\u024F\u1EA0-\u1EF9]+$/u, "").trim();
  let icon: React.ReactNode | undefined;
  if (chip.includes("💡") || clean.toLowerCase().includes("tính năng")) {
    icon = <Sparkles style={{ width: 12, height: 12 }} />;
  } else if (chip.includes("🏷️") || clean.toLowerCase().includes("gói dịch vụ")) {
    icon = <Tag style={{ width: 12, height: 12 }} />;
  } else if (chip.includes("📋") || clean.toLowerCase().includes("đăng ký")) {
    icon = <ClipboardList style={{ width: 12, height: 12 }} />;
  } else if (chip.includes("📜") || clean.toLowerCase().includes("thực đơn")) {
    icon = <BookOpen style={{ width: 12, height: 12 }} />;
  } else if (chip.includes("🕐") || clean.toLowerCase().includes("mở cửa")) {
    icon = <Clock style={{ width: 12, height: 12 }} />;
  } else if (chip.includes("📅") || clean.toLowerCase().includes("đặt bàn")) {
    icon = <Calendar style={{ width: 12, height: 12 }} />;
  } else if (chip.includes("🔔") || clean.toLowerCase().includes("phục vụ")) {
    icon = <Bell style={{ width: 12, height: 12 }} />;
  }
  return { text: clean || chip, icon };
};

interface ChatWindowProps {
  chatType: ChatType;
  history: ChatMessage[];
  isLoading: boolean;
  query: string;
  onQueryChange: (v: string) => void;
  onSend: (overrideText?: string) => void;
  onClear: () => void;
  onClose: () => void;
  config: AIConfig;
  logoUrl: string;
  botName: string;
  accentColor: string;
  onAddToCart?: (data: any) => void;
}

function ChatWindow({
  chatType, history, isLoading, query,
  onQueryChange, onSend, onClear, onClose,
  config, logoUrl, botName, accentColor, onAddToCart,
}: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestions = config.quickSuggestions?.length
    ? config.quickSuggestions
    : chatType === "system"
      ? ["Tính năng XFoodi 💡", "Gói dịch vụ 🏷️", "Cách đăng ký 📋"]
      : ["Xem thực đơn 📜", "Giờ mở cửa 🕐", "Đặt bàn 📅", "Gọi phục vụ 🔔"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      style={{
        position: "fixed",
        bottom: 88,
        right: 24,
        width: isMaximized ? "min(850px, calc(100vw - 32px))" : "min(400px, calc(100vw - 32px))",
        height: isMaximized ? "min(800px, calc(100dvh - 120px))" : "min(580px, calc(100dvh - 120px))",
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
        border: "1px solid var(--border)",
        background: "var(--card)",
        overflow: "hidden",
        zIndex: 9998,
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: `color-mix(in srgb, ${accentColor} 8%, var(--surface))`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={logoUrl}
              alt={botName}
              style={{
                width: 36, height: 36, borderRadius: "50%", objectFit: "cover",
                border: `2px solid ${accentColor}`,
                background: "white",
              }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo/xfoodi-logo.png"; }}
            />
            <span style={{
              position: "absolute", bottom: 0, right: 0,
              width: 10, height: 10, borderRadius: "50%",
              background: "#22c55e",
              border: "2px solid var(--card)",
            }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", lineHeight: 1.2 }}>
              {botName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              ● Trực tuyến
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Thu nhỏ" : "Phóng to"}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "none", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {history.length > 1 && (
            <button
              onClick={onClear}
              title="Xóa lịch sử"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: "none", background: "transparent",
                color: "var(--text-muted)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "none", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Message List ── */}
      <div
        style={{
          flex: 1, overflowY: "auto", padding: "16px 14px",
          display: "flex", flexDirection: "column", gap: 12,
          scrollbarWidth: "thin",
        }}
      >
        {history.map((msg, idx) => {
          const isLastMsg = idx === history.length - 1;
          const isStreaming = isLastMsg && msg.role === "model" && msg.content === "";
          const parsed = msg.role === "model" && !isStreaming ? extractUICards(msg.content) : null;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              {msg.role === "model" && (
                <img
                  src={logoUrl}
                  alt="AI"
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    objectFit: "cover", flexShrink: 0, marginTop: 4,
                    border: "1.5px solid var(--border)", background: "white",
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo/xfoodi-logo.png"; }}
                />
              )}
              <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Text bubble */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: msg.role === "user"
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    ...(msg.role === "user"
                      ? { background: accentColor, color: "white", boxShadow: `0 2px 8px ${accentColor}40` }
                      : { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }),
                  }}
                >
                  {isStreaming
                    ? <TypingDots />
                    : parsed
                      ? (renderMessageContent(parsed.cleanText) ?? parsed.cleanText)
                      : (renderMessageContent(msg.content) ?? msg.content)
                  }
                </div>
                {/* A2UI Cards below bubble */}
                {parsed && parsed.cards.length > 0 && parsed.cards.map((card, ci) => (
                  <div key={ci}>{renderUICard(card, accentColor, onAddToCart)}</div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Removed separate isLoading indicator — the empty optimistic message above handles it */}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick Suggestion Chips ── */}
      <div
        style={{
          padding: "8px 12px",
          display: "flex", flexWrap: "wrap", gap: 6,
          borderTop: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--surface) 60%, var(--card))",
          flexShrink: 0,
        }}
      >
        {suggestions.map((chip, i) => {
          const { text, icon } = getSuggestionDetails(chip);
          return (
            <button
              key={i}
              onClick={() => onSend(text)}
              disabled={isLoading}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                border: `1.5px solid ${i === 0 ? accentColor : "var(--border)"}`,
                background: i === 0 ? `${accentColor}12` : "var(--card)",
                color: i === 0 ? accentColor : "var(--text)",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {icon}
              <span>{text}</span>
            </button>
          );
        })}
      </div>

      {/* ── Input Footer ── */}
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        style={{
          padding: "10px 12px",
          display: "flex", gap: 8, alignItems: "center",
          borderTop: "1px solid var(--border)",
          background: "var(--card)",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Nhập tin nhắn..."
          disabled={isLoading}
          style={{
            flex: 1, padding: "9px 14px",
            borderRadius: 12,
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 13.5,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{
            width: 38, height: 38,
            borderRadius: 11,
            border: "none",
            background: isLoading || !query.trim() ? "var(--border)" : accentColor,
            color: "white",
            cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
            flexShrink: 0,
            boxShadow: !isLoading && query.trim() ? `0 4px 12px ${accentColor}50` : "none",
          }}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */
const DEFAULT_SYSTEM_CONFIG: AIConfig = {
  isChatEnabled: true,
  aiModel: "gemini-2.5-flash",
  temperature: 0.4,
  welcomeMessage: "Trợ lý ảo hỗ trợ tìm hiểu về nền tảng SaaS quản lý nhà hàng XFoodi. Hãy hỏi tôi về các gói dịch vụ, giá thành hoặc cách đăng ký ngay!",
  systemPrompt: "",
  quickSuggestions: ["Tính năng XFoodi 💡", "Gói dịch vụ 🏷️", "Cách đăng ký 📋"],
};

const DEFAULT_RESTAURANT_CONFIG: AIConfig = {
  isChatEnabled: true,
  aiModel: "gemini-2.5-flash",
  temperature: 0.2,
  welcomeMessage: "Chào mừng bạn đến với nhà hàng! Tôi có thể tư vấn món ăn ngon, cách đặt bàn hay kết nối trực tiếp đến nhân viên phục vụ giúp bạn.",
  systemPrompt: "",
  quickSuggestions: ["Xem thực đơn 📜", "Giờ mở cửa 🕐", "Đặt bàn 📅", "Gọi phục vụ 🔔"],
};

export function ChatAssistant() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { cartItems, addToCart, clearCart, openCartModal, orderTableId } = useCart();
  const params = useParams();
  const tableIdFromUrl = params?.tableId as string | undefined;
  const activeTableId = tableIdFromUrl || orderTableId;

  const [tableInfo, setTableInfo] = useState<{ code: string; floor?: { name: string } } | null>(null);

  useEffect(() => {
    if (!activeTableId) {
      setTableInfo(null);
      return;
    }
    axiosInstance.get(`/tables/public/${activeTableId}`)
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setTableInfo(res.data.data);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch table info:", err);
      });
  }, [activeTableId]);

  const handleCallWaiter = useCallback(() => {
    if (!tenant?.id) return;
    if (!activeTableId) {
      alert("Không tìm thấy thông tin bàn của bạn. Vui lòng quét lại mã QR tại bàn để gọi phục vụ.");
      return;
    }

    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socketUrl = api.replace(/\/api\/?$/, "");

    console.log("[ChatAssistant Socket] Initializing connection to:", socketUrl);
    const socket = io(socketUrl, {
      transports: ["polling"],
      withCredentials: true,
    });

    const closeSocket = () => {
      if (socket.connected) socket.disconnect();
      else socket.close();
    };

    socket.on("connect", () => {
      socket.emit("join_restaurant", tenant.id);
      socket.emit("CALL_STAFF", {
        restaurantId: tenant.id,
        tableId: activeTableId,
        tableCode: tableInfo?.code || `Bàn ${activeTableId.slice(0, 4)}`,
        floorName: tableInfo?.floor?.name || "Khu vực chung",
        message: "Khách hàng yêu cầu hỗ trợ tại bàn thông qua AI Chatbot",
        type: "ASSISTANCE"
      });
      // Close as soon as the message is delivered so the socket cannot leak.
      closeSocket();
    });

    socket.on("connect_error", (err: any) => {
      console.error("[ChatAssistant Socket] Connection error:", err);
    });
    // Safety net: tear down even if the socket never connects.
    setTimeout(closeSocket, 5000);
  }, [tenant?.id, activeTableId, tableInfo]);

  /* ── Context detection ──
     - Nếu tenant !== null → đang ở restaurant domain → chỉ show restaurant chat
     - Nếu tenant === null → đang ở landing/system domain → chỉ show system chat
  */
  const isRestaurantDomain = !!(tenant?.id && tenant.id !== "system" && tenant.id !== "demo");
  const isAdminDomain = typeof window !== "undefined" &&
    (window.location.hostname.startsWith("admin.") || window.location.hostname === "admin.localhost");

  /* ── Open state ── */
  const [activeChat, setActiveChat] = useState<ChatType | null>(null);

  /* ── System Chat ── */
  const [historySystem, setHistorySystem] = useState<ChatMessage[]>([]);
  const [querySystem, setQuerySystem] = useState("");
  const [isLoadingSystem, setIsLoadingSystem] = useState(false);
  const [aiConfigSystem, setAiConfigSystem] = useState<AIConfig>(DEFAULT_SYSTEM_CONFIG);

  /* ── Restaurant Chat ── */
  const [historyRestaurant, setHistoryRestaurant] = useState<ChatMessage[]>([]);
  const [queryRestaurant, setQueryRestaurant] = useState("");
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  const [sessionIdRestaurant, setSessionIdRestaurant] = useState("");
  const [aiConfigRestaurant, setAiConfigRestaurant] = useState<AIConfig>(DEFAULT_RESTAURANT_CONFIG);

  /* ─────────────── Fetch AI configs ─────────────── */
  useEffect(() => {
    if (isAdminDomain) return;
    fetch("/api/ai/config?restaurantId=system")
      .then(r => r.json())
      .then(r => { if (r.success && r.data) setAiConfigSystem(prev => ({ ...prev, ...r.data })); })
      .catch(() => { /* keep defaults */ });
  }, [isAdminDomain]);

  useEffect(() => {
    if (!tenant?.id || tenant.id === "demo" || isAdminDomain) return;
    fetch(`/api/ai/config?restaurantId=${tenant.id}`)
      .then(r => r.json())
      .then(r => { if (r.success && r.data) setAiConfigRestaurant(prev => ({ ...prev, ...r.data })); })
      .catch(() => { /* keep defaults */ });
  }, [tenant?.id, isAdminDomain]);

  /* ─────────────── Session & history persistence ─────────────── */
  useEffect(() => {
    if (typeof window === "undefined" || !tenant?.id) return;
    const userKey = user?.id ? `-${user.id}` : "-guest";
    const sessionKey = `xfoodi-chat-session-${tenant.id}${userKey}`;
    let sid = localStorage.getItem(sessionKey);
    if (!sid) {
      sid = generateSessionId();
      localStorage.setItem(sessionKey, sid);
    }
    setSessionIdRestaurant(sid);

    const historyKey = `xfoodi-chat-history-restaurant-${tenant.id}-${sid}`;
    const saved = localStorage.getItem(historyKey);
    if (saved) {
      try {
        setHistoryRestaurant(JSON.parse(saved));
      } catch {
        setHistoryRestaurant([]);
      }
    } else {
      setHistoryRestaurant([]);
    }
  }, [tenant?.id, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("xfoodi-chat-history-system");
    if (saved) { try { setHistorySystem(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  useEffect(() => {
    if (historySystem.length > 0) localStorage.setItem("xfoodi-chat-history-system", JSON.stringify(historySystem));
  }, [historySystem]);

  useEffect(() => {
    if (tenant?.id && sessionIdRestaurant && historyRestaurant.length > 0) {
      localStorage.setItem(`xfoodi-chat-history-restaurant-${tenant.id}-${sessionIdRestaurant}`, JSON.stringify(historyRestaurant));
    }
  }, [historyRestaurant, tenant?.id, sessionIdRestaurant]);

  /* ─────────────── Inject welcome message ─────────────── */
  useEffect(() => {
    if (aiConfigSystem?.welcomeMessage) {
      setHistorySystem(prev => prev.length === 0 ? [{ role: "model", content: aiConfigSystem.welcomeMessage }] : prev);
    }
  }, [aiConfigSystem.welcomeMessage]);

  useEffect(() => {
    if (aiConfigRestaurant?.welcomeMessage && tenant?.id) {
      setHistoryRestaurant(prev => prev.length === 0 ? [{ role: "model", content: aiConfigRestaurant.welcomeMessage }] : prev);
    }
  }, [aiConfigRestaurant.welcomeMessage, tenant?.id]);

  /* ─────────────── A2UI Action executor ─────────────── */
  const executeActions = useCallback((text: string) => {
    const re = /\[ACTION:\s*([A-Z_]+)(?:\s+(\{[\s\S]*?\}))?\s*\]/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      try {
        const args = m[2] ? JSON.parse(m[2]) : {};
        if (m[1] === "ADD_TO_CART" && args.id && args.name && args.price) {
          addToCart({ id: args.id, name: args.name, price: String(args.price), quantity: Number(args.quantity || 1), category: "food", categoryId: args.categoryId || "dish" });
        } else if (m[1] === "CLEAR_CART") {
          clearCart();
        } else if (m[1] === "OPEN_CART") {
          openCartModal();
        } else if (m[1] === "CALL_WAITER") {
          handleCallWaiter();
        }
      } catch { /* ignore parse errors */ }
    }
  }, [addToCart, clearCart, openCartModal, handleCallWaiter]);

  /* ─────────────── Send message ─────────────── */
  const handleSend = useCallback(async (chatType: ChatType, overrideText?: string) => {
    const isSystem = chatType === "system";
    const rawQuery = isSystem ? querySystem : queryRestaurant;
    const text = (overrideText ?? rawQuery).trim();
    if (!text) return;

    // Clear input
    if (!overrideText) {
      if (isSystem) setQuerySystem(""); else setQueryRestaurant("");
    }

    const currentHistory = isSystem ? historySystem : historyRestaurant;
    const newHistory: ChatMessage[] = [...currentHistory, { role: "user", content: text }];
    if (isSystem) { setHistorySystem(newHistory); setIsLoadingSystem(true); }
    else { setHistoryRestaurant(newHistory); setIsLoadingRestaurant(true); }

    // Optimistically add empty bot message for streaming
    if (isSystem) setHistorySystem(prev => [...prev, { role: "model", content: "" }]);
    else setHistoryRestaurant(prev => [...prev, { role: "model", content: "" }]);

    try {
      const endpoint = isSystem ? "/api/ai/chat/system" : "/api/ai/chat/restaurant";
      const body = isSystem
        ? { query: text, history: newHistory.map(m => ({ role: m.role, content: m.content })) }
        : {
          restaurantId: tenant?.id,
          query: text,
          history: newHistory.map(m => ({ role: m.role, content: m.content })),
          userPreferences: user?.fullName ? `Khách hàng: ${user.fullName}` : undefined,
          sessionId: sessionIdRestaurant || undefined,
          cartItems: cartItems.map(item => ({
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
            note: item.note || undefined
          })),
        };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Lỗi kết nối máy chủ.");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Không thể khởi tạo stream.");

      const decoder = new TextDecoder();
      let botResponse = "";
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const json = trimmed.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            if (parsed.error) { botResponse = `Lỗi: ${parsed.error}`; break; }
            if (parsed.text) {
              botResponse += parsed.text;
              const snapshot = botResponse;
              if (isSystem) {
                setHistorySystem(prev => {
                  const next = [...prev];
                  if (next.length > 0) next[next.length - 1] = { role: "model", content: snapshot };
                  return next;
                });
              } else {
                setHistoryRestaurant(prev => {
                  const next = [...prev];
                  if (next.length > 0) next[next.length - 1] = { role: "model", content: snapshot };
                  return next;
                });
              }
            }
          } catch { /* skip bad chunk */ }
        }
      }

      // Execute any A2UI actions in restaurant chat
      if (!isSystem && botResponse.includes("[ACTION:")) {
        executeActions(botResponse);
      }

    } catch (err: any) {
      const errMsg = "Xin lỗi, hệ thống đang bận hoặc có lỗi kết nối. Vui lòng thử lại.";
      const updateHistory = (prev: ChatMessage[]) => {
        const next = [...prev];
        if (next.length > 0 && next[next.length - 1].content === "") next.pop();
        return [...next, { role: "model" as const, content: errMsg }];
      };
      if (isSystem) setHistorySystem(updateHistory);
      else setHistoryRestaurant(updateHistory);
    } finally {
      if (isSystem) setIsLoadingSystem(false);
      else setIsLoadingRestaurant(false);
    }
  }, [querySystem, queryRestaurant, historySystem, historyRestaurant, tenant?.id, user?.fullName, sessionIdRestaurant, executeActions, cartItems]);

  /* ─────────────── Clear history ─────────────── */
  const handleClear = useCallback((chatType: ChatType) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch sử trò chuyện này?")) return;
    const config = chatType === "system" ? aiConfigSystem : aiConfigRestaurant;
    const welcome = config.welcomeMessage ? [{ role: "model" as const, content: config.welcomeMessage }] : [];
    if (chatType === "system") {
      setHistorySystem(welcome);
      localStorage.removeItem("xfoodi-chat-history-system");
    } else {
      setHistoryRestaurant(welcome);
      if (tenant?.id && sessionIdRestaurant) {
        localStorage.removeItem(`xfoodi-chat-history-restaurant-${tenant.id}-${sessionIdRestaurant}`);
      }
    }
  }, [aiConfigSystem, aiConfigRestaurant, tenant?.id, sessionIdRestaurant]);

  /* ─────────────── Visibility logic ─────────────── */
  if (isAdminDomain) return null;

  // Get accent color from CSS variable or tenant primary
  const accentColor = tenant?.primaryColor || "var(--primary)";
  const XFOODI_COLOR = "#FF380B"; // XFoodi system brand color

  /* Restaurant domain: only restaurant chat, no system */
  if (isRestaurantDomain) {
    if (!aiConfigRestaurant.isChatEnabled) return null;

    const logoUrl = tenant?.logoUrl || "/images/logo/xfoodi-logo.png";
    const botName = tenant?.name ? `${tenant.name} AI` : "Restaurant AI";

    return (
      <>
        <style>{`
          @keyframes chatDotBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
            40% { transform: translateY(-6px); opacity: 1; }
          }
          @keyframes chatPing {
            75%, 100% { transform: scale(1.8); opacity: 0; }
          }
        `}</style>

        {/* Floating Restaurant Chat Button */}
        <button
          id="xfoodi-restaurant-chat-toggle"
          onClick={() => setActiveChat(activeChat === "restaurant" ? null : "restaurant")}
          aria-label="Mở chatbot nhà hàng"
          style={{
            position: "fixed", bottom: 24, right: 24,
            width: 56, height: 56,
            borderRadius: "50%",
            border: "none",
            background: "white",
            boxShadow: "0 6px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
            zIndex: 9999,
            padding: 0,
            overflow: "visible",
            transition: "transform 0.2s, box-shadow 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(0,0,0,0.2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)"; }}
        >
          <AnimatePresence mode="wait">
            {activeChat === "restaurant" ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="h-5 w-5 text-[var(--text)]" />
              </motion.div>
            ) : (
              <motion.div key="logo" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ position: "relative", width: 56, height: 56 }}>
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: accentColor, opacity: 0.2,
                  animation: "chatPing 2s cubic-bezier(0,0,0.2,1) infinite",
                }} />
                <img
                  src={logoUrl}
                  alt={botName}
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${accentColor}` }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo/xfoodi-logo.png"; }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {activeChat === "restaurant" && (
            <ChatWindow
              chatType="restaurant"
              history={historyRestaurant}
              isLoading={isLoadingRestaurant}
              query={queryRestaurant}
              onQueryChange={setQueryRestaurant}
              onSend={(t) => handleSend("restaurant", t)}
              onClear={() => handleClear("restaurant")}
              onClose={() => setActiveChat(null)}
              config={aiConfigRestaurant}
              logoUrl={logoUrl}
              botName={botName}
              accentColor={accentColor}
              onAddToCart={(d) => addToCart({ id: d.id, name: d.name, price: String(d.price), quantity: Number(d.quantity || 1), category: "food", categoryId: d.categoryId || "dish" })}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ─────────────── System / Landing domain: only system chat ─────────────── */
  if (!aiConfigSystem.isChatEnabled) return null;

  return (
    <>
      <style>{`
        @keyframes chatDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatPing {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* Floating System Chat Button */}
      <button
        id="xfoodi-system-chat-toggle"
        onClick={() => setActiveChat(activeChat === "system" ? null : "system")}
        aria-label="Mở chatbot hệ thống XFoodi"
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 56, height: 56,
          borderRadius: "50%",
          border: "none",
          background: "white",
          boxShadow: "0 6px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          cursor: "pointer",
          zIndex: 9999,
          padding: 0,
          overflow: "visible",
          transition: "transform 0.2s, box-shadow 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(0,0,0,0.2)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)"; }}
      >
        <AnimatePresence mode="wait">
          {activeChat === "system" ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="h-5 w-5 text-[var(--text)]" />
            </motion.div>
          ) : (
            <motion.div key="logo" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ position: "relative", width: 56, height: 56 }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: XFOODI_COLOR, opacity: 0.18,
                animation: "chatPing 2s cubic-bezier(0,0,0.2,1) infinite",
              }} />
              <img
                src="/images/logo/xfoodi-logo.png"
                alt="XFoodi AI Support"
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${XFOODI_COLOR}` }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {activeChat === "system" && (
          <ChatWindow
            chatType="system"
            history={historySystem}
            isLoading={isLoadingSystem}
            query={querySystem}
            onQueryChange={setQuerySystem}
            onSend={(t) => handleSend("system", t)}
            onClear={() => handleClear("system")}
            onClose={() => setActiveChat(null)}
            config={aiConfigSystem}
            logoUrl="/images/logo/xfoodi-logo.png"
            botName="XFoodi AI Support"
            accentColor={XFOODI_COLOR}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatAssistant;
