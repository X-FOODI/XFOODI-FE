"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  CheckCircle2,
  ChefHat,
  Bell,
  PartyPopper,
  Check,
} from "lucide-react";

/**
 * Vòng đời đơn hàng phía khách (kiểu Grab/ShopeeFood):
 * PENDING → CONFIRMED → PREPARING → READY → COMPLETED
 */
export const ORDER_STEPS = [
  { code: "PENDING", label: "Đã đặt món", desc: "Đơn hàng đã được gửi đến nhà bếp", Icon: ClipboardList },
  { code: "CONFIRMED", label: "Đã xác nhận", desc: "Nhà hàng đã tiếp nhận đơn", Icon: CheckCircle2 },
  { code: "PREPARING", label: "Đang chế biến", desc: "Đầu bếp đang chuẩn bị món của bạn", Icon: ChefHat },
  { code: "READY", label: "Sẵn sàng phục vụ", desc: "Món đã xong, sắp được mang ra", Icon: Bell },
  { code: "COMPLETED", label: "Hoàn thành", desc: "Chúc quý khách ngon miệng!", Icon: PartyPopper },
] as const;

const PREP_MINUTES_PER_ITEM = 3;
const MIN_PREP_MINUTES = 5;

/** Tính ETA phía client, mirror logic backend, dùng khi payload không kèm estimatedReadyAt. */
export function computeEta(createdAt: string, itemCount: number, statusCode: string): string | null {
  if (statusCode !== "CONFIRMED" && statusCode !== "PREPARING") return null;
  const minutes = Math.max(MIN_PREP_MINUTES, itemCount * PREP_MINUTES_PER_ITEM);
  return new Date(new Date(createdAt).getTime() + minutes * 60_000).toISOString();
}

function stepIndex(code: string): number {
  const i = ORDER_STEPS.findIndex((s) => s.code === code);
  return i === -1 ? 0 : i;
}

interface OrderTimelineProps {
  currentStatus: string;
  estimatedReadyAt?: string | null;
  compact?: boolean;
}

export default function OrderTimeline({ currentStatus, estimatedReadyAt, compact }: OrderTimelineProps) {
  const currentIndex = stepIndex(currentStatus);
  const isCancelled = currentStatus === "CANCELLED";

  const [minutesLeft, setMinutesLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!estimatedReadyAt) {
      setMinutesLeft(null);
      return;
    }
    const tick = () => {
      const diffMs = new Date(estimatedReadyAt).getTime() - Date.now();
      setMinutesLeft(Math.max(0, Math.ceil(diffMs / 60_000)));
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [estimatedReadyAt]);

  if (isCancelled) {
    return (
      <div className="rounded-xl bg-rose-500/5 border border-rose-500/25 px-4 py-3 text-center">
        <p className="text-sm font-bold text-rose-400">Đơn hàng đã bị hủy</p>
      </div>
    );
  }

  const showEta =
    minutesLeft !== null && currentStatus !== "READY" && currentStatus !== "COMPLETED";

  return (
    <div className={compact ? "" : "space-y-3"}>
      {showEta && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/25 py-2 text-xs font-semibold text-amber-400">
          <ChefHat className="w-3.5 h-3.5" />
          {minutesLeft && minutesLeft > 0
            ? `Dự kiến xong sau ~${minutesLeft} phút`
            : "Sắp hoàn tất..."}
        </div>
      )}

      <ol className="relative">
        {ORDER_STEPS.map((step, idx) => {
          const done = idx < currentIndex;
          const active = idx === currentIndex;
          const isLast = idx === ORDER_STEPS.length - 1;
          const StepIcon = step.Icon;

          return (
            <li key={step.code} className="relative flex gap-3 pb-5 last:pb-0">
              {/* Connector line */}
              {!isLast && (
                <span className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-zinc-800 overflow-hidden">
                  <motion.span
                    className="block w-full bg-emerald-500 origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: done ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ height: "100%" }}
                  />
                </span>
              )}

              {/* Node */}
              <div className="relative z-10 shrink-0">
                <motion.div
                  animate={
                    active
                      ? { scale: [1, 1.15, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    active
                      ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : active
                        ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20"
                        : "bg-zinc-900 border-zinc-700 text-zinc-600"
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
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </motion.span>
                    ) : (
                      <motion.span key="icon">
                        <StepIcon className="w-4 h-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Text */}
              <div className="pt-0.5 min-w-0">
                <p
                  className={`text-sm font-bold leading-tight transition-colors ${
                    done ? "text-emerald-400" : active ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {step.label}
                </p>
                {!compact && (active || done) && (
                  <p className="text-[11px] text-zinc-500 mt-0.5">{step.desc}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
