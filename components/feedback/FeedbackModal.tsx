"use client";

import feedbackService from "@/lib/services/feedbackService";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";

interface FeedbackModalProps {
  orderId: string;
  orderReference?: string;
  restaurantName?: string;
  brandColor?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const EMOJI_MAP = ["😞", "😕", "😐", "😊", "🤩"];
const LABEL_MAP = ["Rất tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời!"];

export default function FeedbackModal({
  orderId,
  orderReference,
  restaurantName = "Nhà hàng",
  brandColor = "#FF380B",
  onClose,
  onSubmitted,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeRating = hoverRating || rating;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await feedbackService.create(orderId, {
        rating,
        comment: comment.trim() || undefined,
        isAnonymous,
      });
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--card)",
            borderRadius: 24,
            border: "1px solid var(--border)",
            padding: 28,
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          {submitted ? (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "8px 0" }}
            >
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>
                Cảm ơn bạn!
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                Đánh giá của bạn giúp chúng tôi ngày càng phục vụ tốt hơn.
              </p>
            </motion.div>
          ) : (
            <>
              {/* ── Header ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                    Đánh giá bữa ăn
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    {restaurantName}
                    {orderReference && (
                      <span style={{ marginLeft: 6, fontFamily: "monospace", color: brandColor, fontWeight: 700 }}>
                        #{orderReference}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 8 }}
                >
                  ✕
                </button>
              </div>

              {/* ── Star rating ── */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  {activeRating > 0 ? (
                    <motion.span
                      key={activeRating}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ fontSize: 52 }}
                    >
                      {EMOJI_MAP[activeRating - 1]}
                    </motion.span>
                  ) : (
                    <span style={{ fontSize: 52, opacity: 0.3 }}>⭐</span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 36, padding: "2px 4px", lineHeight: 1,
                        transition: "transform 0.15s",
                        transform: star <= activeRating ? "scale(1.15)" : "scale(1)",
                        filter: star <= activeRating ? "none" : "grayscale(100%) opacity(0.3)",
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                {activeRating > 0 && (
                  <motion.p
                    key={activeRating}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: 14, fontWeight: 700, color: brandColor, margin: 0 }}
                  >
                    {LABEL_MAP[activeRating - 1]}
                  </motion.p>
                )}
              </div>

              {/* ── Comment ── */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Nhận xét (không bắt buộc)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Món ăn ngon, phục vụ nhiệt tình... Chia sẻ cảm nhận của bạn!"
                  rows={3}
                  maxLength={500}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--surface)",
                    color: "var(--text)", fontSize: 14, resize: "none",
                    lineHeight: 1.6, boxSizing: "border-box",
                  }}
                />
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", textAlign: "right" }}>
                  {comment.length}/500
                </p>
              </div>

              {/* ── Anonymous toggle ── */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                <div
                  onClick={() => setIsAnonymous((v) => !v)}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: isAnonymous ? brandColor : "var(--border)",
                    position: "relative", transition: "background 0.2s",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: isAnonymous ? 20 : 2,
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
                  }} />
                </div>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Gửi ẩn danh
                </span>
              </label>

              {/* ── Actions ── */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 12,
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Để sau
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || loading}
                  style={{
                    flex: 2, padding: "11px 0", borderRadius: 12,
                    border: "none",
                    background: rating === 0 ? "var(--border)" : brandColor,
                    color: rating === 0 ? "var(--text-muted)" : "#fff",
                    fontSize: 14, fontWeight: 700,
                    cursor: rating === 0 ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Đang gửi..." : "Gửi đánh giá ✓"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
