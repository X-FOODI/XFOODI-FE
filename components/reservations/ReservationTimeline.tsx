"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CalendarCheck,
  Utensils,
  PartyPopper,
  Check,
} from "lucide-react";

export const RESERVATION_STEPS = [
  { code: "PENDING", label: "Gửi yêu cầu", desc: "Nhà hàng đang kiểm tra bàn trống", Icon: CalendarDays },
  { code: "CONFIRMED", label: "Đã xác nhận", desc: "Bàn đặt đã được duyệt thành công", Icon: CalendarCheck },
  { code: "CHECKED_IN", label: "Đã nhận bàn", desc: "Chúc quý khách ngon miệng!", Icon: Utensils },
  { code: "COMPLETED", label: "Hoàn thành", desc: "Buổi tiệc kết thúc tốt đẹp", Icon: PartyPopper },
] as const;

function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Note 1: E5 (659.25 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.5);
    
    // Note 2: A5 (880.00 Hz) after 120ms
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.7);
      } catch (err) {
        console.warn("Chime note 2 fail", err);
      }
    }, 120);
  } catch (err) {
    console.warn("Web Audio API Chime error", err);
  }
}

function stepIndex(code: string): number {
  const i = RESERVATION_STEPS.findIndex((s) => s.code === code);
  return i === -1 ? 0 : i;
}

interface ReservationTimelineProps {
  currentStatus: string;
}

export default function ReservationTimeline({ currentStatus }: ReservationTimelineProps) {
  const currentIndex = stepIndex(currentStatus);
  const isCancelled = currentStatus === "CANCELLED";

  const prevStatusRef = React.useRef(currentStatus);

  React.useEffect(() => {
    if (prevStatusRef.current !== currentStatus) {
      playNotificationChime();
      prevStatusRef.current = currentStatus;
    }
  }, [currentStatus]);

  if (isCancelled) {
    return (
      <div className="rounded-xl bg-rose-500/5 border border-rose-500/25 px-4 py-3 text-center my-4">
        <p className="text-sm font-bold text-rose-400">Yêu cầu đặt bàn này đã bị hủy</p>
      </div>
    );
  }

  return (
    <div className="py-4 w-full overflow-x-auto">
      <ol className="relative flex flex-row justify-between items-center w-full min-w-[320px] px-2">
        {RESERVATION_STEPS.map((step, idx) => {
          const done = idx < currentIndex;
          const active = idx === currentIndex;
          const isLast = idx === RESERVATION_STEPS.length - 1;
          const StepIcon = step.Icon;

          return (
            <li key={step.code} className="relative flex flex-col items-center flex-1 z-10">
              {/* Connector line (Horizontal layout) */}
              {!isLast && (
                <span className="absolute left-[50%] top-[15px] right-[-50%] h-[2px] bg-zinc-800 -z-10">
                  <motion.span
                    className="block h-full bg-emerald-500 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ width: "100%" }}
                  />
                </span>
              )}

              {/* Icon Container */}
              <div className="relative shrink-0 mb-1.5">
                <motion.div
                  animate={
                    active
                      ? { scale: [1, 1.12, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    active
                      ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : active
                        ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20"
                        : "bg-zinc-900 border-zinc-700 text-zinc-650"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {done ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
                      </motion.span>
                    ) : (
                      <motion.span key="icon">
                        <StepIcon className="w-3.5 h-3.5" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Labels & Descriptions */}
              <div className="flex flex-col items-center text-center min-w-0">
                <span
                  className={`text-[10px] sm:text-xs font-bold leading-tight ${
                    active ? "text-amber-400" : done ? "text-emerald-400" : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[8px] text-zinc-500 mt-0.5 max-w-[80px] hidden sm:block">
                  {step.desc}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
