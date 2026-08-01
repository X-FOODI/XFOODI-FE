"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { Smile, Frown, Meh, RefreshCw, MessageSquareQuote } from "lucide-react";

interface Sentiment {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  averageRating: number;
  themes: { theme: string; sentiment: string; count: number }[];
  highlights: { quote: string; sentiment: string }[];
}

const SENT_COLOR: Record<string, string> = { positive: "#16a34a", negative: "#dc2626", neutral: "#6b7280" };

export default function SentimentCard() {
  const [data, setData] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("/feedbacks/sentiment")
      .then((res) => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pct = (n: number) => (data && data.total > 0 ? Math.round((n / data.total) * 100) : 0);

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquareQuote size={18} style={{ color: "var(--primary)" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Phân tích cảm xúc đánh giá (AI)</h3>
        </div>
        <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: "var(--text-muted)" }} aria-label="Làm mới">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !data ? (
        <div className="h-20 rounded-xl animate-pulse" style={{ background: "var(--bg-base)" }} />
      ) : !data || data.total === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có đánh giá để phân tích.</p>
      ) : (
        <div className="space-y-4">
          {/* Breakdown */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: "var(--text)" }}>{data.averageRating}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>★ trung bình ({data.total})</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                { key: "positive", label: "Tích cực", n: data.positive, Icon: Smile },
                { key: "neutral", label: "Trung tính", n: data.neutral, Icon: Meh },
                { key: "negative", label: "Tiêu cực", n: data.negative, Icon: Frown },
              ].map(({ key, label, n, Icon }) => (
                <div key={key} className="flex items-center gap-2">
                  <Icon size={14} style={{ color: SENT_COLOR[key] }} />
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct(n)}%`, background: SENT_COLOR[key] }} />
                  </div>
                  <span className="text-xs w-16 text-right" style={{ color: "var(--text-muted)" }}>{label} {pct(n)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Themes */}
          {data.themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.themes.map((t, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border" style={{ color: SENT_COLOR[t.sentiment] || "var(--text-muted)", borderColor: "var(--border)" }}>
                  {t.theme} ({t.count})
                </span>
              ))}
            </div>
          )}

          {/* Highlights */}
          {data.highlights.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              {data.highlights.map((h, i) => (
                <p key={i} className="text-xs italic pt-1.5" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: SENT_COLOR[h.sentiment] }}>“</span>{h.quote}<span style={{ color: SENT_COLOR[h.sentiment] }}>”</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
