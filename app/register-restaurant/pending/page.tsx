"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import restaurantApplicationService, {
  RestaurantApplication,
  ApplicationStatus,
} from "@/lib/services/restaurantApplicationService";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: ReactElement }> = {
  PENDING: {
    label: "Đang chờ xét duyệt",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  APPROVED: {
    label: "Đã được phê duyệt",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  REJECTED: {
    label: "Chưa được phê duyệt",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function RegisterRestaurantPendingPage() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<RestaurantApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) { router.replace("/login-email"); return; }

    restaurantApplicationService
      .getMy()
      .then((app) => {
        if (!app) {
          // No application yet
          router.replace("/register-restaurant");
          return;
        }
        setApplication(app);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthReady, user, router]);

  if (loading || !isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  if (!application) return null;

  const cfg = STATUS_CONFIG[application.status as ApplicationStatus];
  const isApproved = application.status === "APPROVED";
  const isRejected = application.status === "REJECTED";

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-lg w-full">
        {/* Status card */}
        <div className="rounded-2xl p-8 shadow-sm text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-4"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </div>

          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
            {isApproved ? "🎉 Chúc mừng!" : isRejected ? "Đơn chưa được duyệt" : "Đơn đang được xét duyệt"}
          </h1>

          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {isApproved && "Nhà hàng của bạn đã được phê duyệt. Đăng nhập lại để vào Dashboard quản lý nhà hàng."}
            {isRejected && "Đơn đăng ký của bạn chưa được phê duyệt lần này. Bạn có thể xem lý do bên dưới và nộp lại."}
            {application.status === "PENDING" && "Chúng tôi đang xem xét đơn của bạn. Thông thường sẽ có kết quả trong 1–3 ngày làm việc."}
          </p>

          {/* Application info */}
          <div className="rounded-xl p-4 mb-6 text-left space-y-3" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Tên nhà hàng</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{application.restaurantName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Ngày nộp</span>
              <span className="text-sm" style={{ color: "var(--text)" }}>
                {new Date(application.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            {application.reviewedAt && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Ngày xét duyệt</span>
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  {new Date(application.reviewedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {isRejected && application.reviewNote && (
            <div className="rounded-xl p-4 mb-6 text-left" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>Lý do từ chối</p>
              <p className="text-sm" style={{ color: "var(--text)" }}>{application.reviewNote}</p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="space-y-3">
            {isApproved && (
              <Link href="/restaurant/dashboard"
                className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-all hover:opacity-90"
                style={{ background: "var(--primary)" }}>
                Vào Dashboard Nhà Hàng
              </Link>
            )}
            {isRejected && (
              <Link href="/register-restaurant"
                className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-all hover:opacity-90"
                style={{ background: "var(--primary)" }}>
                Nộp lại đơn đăng ký
              </Link>
            )}
            {application.status === "PENDING" && (
              <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--border)", borderTopColor: "#f59e0b" }} />
                Đang chờ xét duyệt...
              </div>
            )}
            <Link href="/" className="block text-sm text-center transition-all hover:underline" style={{ color: "var(--text-muted)" }}>
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
