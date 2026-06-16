"use client";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  deadline: string | null | undefined; // ISO string
  onExpired: () => void;
}

function formatMMSS(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function PaymentDeadlineCountdown({ deadline, onExpired }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!deadline) {
      // Deadline cleared (payment received) — hide timer
      setSecondsLeft(null);
      expiredRef.current = false;
      return;
    }

    const deadlineMs = new Date(deadline).getTime();

    const tick = () => {
      const remaining = Math.floor((deadlineMs - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpired();
        }
      } else {
        setSecondsLeft(remaining);
      }
    };

    tick(); // immediate first tick
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deadline, onExpired]);

  // Only show if deadline is set and > 10 minutes remaining
  if (!deadline || secondsLeft === null) return null;
  if (secondsLeft > 10 * 60) return null; // Only display when <= 10 min remaining

  const isUrgent = secondsLeft <= 60;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
      borderRadius: 10, marginBottom: 16,
      background: isUrgent ? "#fef2f2" : "#fffbeb",
      border: `1px solid ${isUrgent ? "#fecaca" : "#fde68a"}`,
    }}>
      <span style={{ fontSize: 18 }}>{isUrgent ? "🚨" : "⏳"}</span>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isUrgent ? "#dc2626" : "#b45309" }}>
          {secondsLeft === 0 ? "Hết hạn thanh toán cọc" : `Còn ${formatMMSS(secondsLeft)} để thanh toán cọc`}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: isUrgent ? "#ef4444" : "#d97706" }}>
          {secondsLeft === 0
            ? "Đặt bàn có thể đã bị hủy tự động."
            : "Vui lòng hoàn tất thanh toán để giữ đặt bàn của bạn."}
        </p>
      </div>
    </div>
  );
}
