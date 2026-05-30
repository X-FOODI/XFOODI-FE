"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import restaurantApplicationService, {
  RestaurantApplication,
} from "@/lib/services/restaurantApplicationService";
import { CheckCircle as CheckCircleIcon, Cancel as CancelIcon, TaskAlt as TaskAltIcon } from "@mui/icons-material";

// ── Confirm Dialog ──────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmDanger = false,
  loading = false,
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onCancel();
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 0" }}>
          {icon && (
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: confirmDanger ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}>
              {icon}
            </div>
          )}
          <h3 style={{
            margin: "0 0 8px",
            fontSize: "17px",
            fontWeight: 700,
            color: "var(--text)",
          }}>
            {title}
          </h3>
          <p style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}>
            {description}
          </p>
        </div>

        {/* Actions */}
        <div style={{ padding: "20px 24px 24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "none",
              background: confirmDanger ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "opacity 0.15s",
            }}
          >
            {loading && (
              <div style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                animation: "spin 0.6s linear infinite",
                flexShrink: 0,
              }} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────
export default function AdminApplicationDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<RestaurantApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dialog state
  const [dialog, setDialog] = useState<{
    open: boolean;
    type: "approve" | "reject" | null;
  }>({ open: false, type: null });

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await restaurantApplicationService.getDetail(id);
      setApplication(data);
    } catch {
      setError("Không thể tải thông tin đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setError("");
    setDialog({ open: true, type: "approve" });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { setError("Vui lòng nhập lý do từ chối"); return; }
    setError("");
    setDialog({ open: true, type: "reject" });
  };

  const handleDialogConfirm = async () => {
    setActionLoading(true);
    try {
      if (dialog.type === "approve") {
        await restaurantApplicationService.approve(id);
        setSuccessMsg("Đã duyệt thành công. Email thông báo đã được gửi đến người dùng.");
      } else {
        await restaurantApplicationService.reject(id, rejectReason.trim());
        setSuccessMsg("Đã từ chối đơn. Email thông báo đã được gửi đến người dùng.");
        setShowRejectForm(false);
      }
      setDialog({ open: false, type: null });
      fetchDetail();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đã có lỗi xảy ra");
      setDialog({ open: false, type: null });
    } finally {
      setActionLoading(false);
    }
  };

  const DocLink = ({ label, url }: { label: string; url: string | null | undefined }) => (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" style={{ color: url ? "var(--primary)" : "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</span>
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid var(--primary)" }}>
          Xem file
        </a>
      ) : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Chưa tải lên</span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>Không tìm thấy đơn</p>
          <Link href="/admin/applications" className="text-sm" style={{ color: "var(--primary)" }}>← Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  const isPending = application.status === "PENDING";

  return (
    <div className="p-6">
      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialog.open}
        type={dialog.type}
        loading={actionLoading}
        title={dialog.type === "approve" ? "Xác nhận phê duyệt" : "Xác nhận từ chối"}
        description={
          dialog.type === "approve"
            ? `Bạn sắp phê duyệt đơn của "${application.restaurantName}". Nhà hàng sẽ được tạo và quyền Owner sẽ được cấp cho người dùng. Email xác nhận sẽ được gửi ngay.`
            : `Bạn sắp từ chối đơn của "${application.restaurantName}". Người dùng sẽ nhận được email thông báo lý do từ chối.`
        }
        confirmLabel={dialog.type === "approve" ? "Phê duyệt" : "Từ chối"}
        confirmDanger={dialog.type === "reject"}
        icon={
          dialog.type === "approve"
            ? <CheckCircleIcon sx={{ fontSize: 24, color: "#22c55e" }} />
            : <CancelIcon sx={{ fontSize: 24, color: "#ef4444" }} />
        }
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog({ open: false, type: null })}
      />

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          <Link href="/admin/applications" className="hover:underline" style={{ color: "var(--primary)" }}>
            Danh sách đơn
          </Link>
          <span>/</span>
          <span>{application.restaurantName}</span>
        </div>

        {/* Success / Error messages */}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 rounded-xl mb-4 text-sm"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
            <TaskAltIcon sx={{ fontSize: 18 }} />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            {error}
          </div>
        )}

        {/* Main card */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{application.restaurantName}</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>/{application.slug}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold`}
              style={{
                background: isPending ? "rgba(245,158,11,0.15)" : application.status === "APPROVED" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: isPending ? "#f59e0b" : application.status === "APPROVED" ? "#22c55e" : "#ef4444",
              }}>
              {isPending ? "Đang chờ duyệt" : application.status === "APPROVED" ? "Đã duyệt" : "Đã từ chối"}
            </span>
          </div>

          {/* Applicant info */}
          <section className="mb-6">
            <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Người nộp đơn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Họ tên", value: application.user?.fullName },
                { label: "Email", value: application.user?.email },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text)" }}>{value || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Restaurant info */}
          <section className="mb-6">
            <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Thông tin nhà hàng</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Địa chỉ", value: application.address },
                { label: "Số điện thoại", value: application.phone },
                { label: "Email liên hệ", value: application.email },
                { label: "Ngày nộp", value: new Date(application.createdAt).toLocaleDateString("vi-VN") },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text)" }}>{value || "—"}</p>
                </div>
              ))}
            </div>
            {application.description && (
              <div className="mt-3 p-3 rounded-xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Mô tả</p>
                <p className="text-sm" style={{ color: "var(--text)" }}>{application.description}</p>
              </div>
            )}
          </section>

          {/* Legal documents */}
          <section className="mb-6">
            <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Chứng từ pháp lý</h2>
            <div className="space-y-2">
              <DocLink label="Giấy phép kinh doanh" url={application.documents?.businessLicenseUrl} />
              <DocLink label="Giấy tờ sở hữu / hợp đồng mặt bằng" url={application.documents?.ownershipProofUrl} />
              <DocLink label="CCCD — Mặt trước" url={application.documents?.nationalIdFrontUrl} />
              <DocLink label="CCCD — Mặt sau" url={application.documents?.nationalIdBackUrl} />
            </div>
          </section>

          {/* Rejection note if rejected */}
          {application.status === "REJECTED" && application.reviewNote && (
            <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>Lý do từ chối</p>
              <p className="text-sm" style={{ color: "var(--text)" }}>{application.reviewNote}</p>
              {application.reviewer && (
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  Bởi: {application.reviewer.fullName} · {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString("vi-VN") : ""}
                </p>
              )}
            </div>
          )}

          {/* Action buttons (only for PENDING) */}
          {isPending && (
            <section>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Quyết định</h2>

              {!showRejectForm ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: "#22c55e" }}>
                    <CheckCircleIcon sx={{ fontSize: 18 }} /> Phê duyệt
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ border: "2px solid #ef4444", color: "#ef4444", background: "transparent" }}>
                    <CancelIcon sx={{ fontSize: 18, verticalAlign: 'middle', marginRight: '6px' }} /> Từ chối
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                      Lý do từ chối <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Nhập lý do từ chối rõ ràng để người dùng có thể bổ sung và nộp lại..."
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowRejectForm(false); setError(""); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                      style={{ border: "1px solid var(--border)", color: "var(--text)", background: "transparent" }}>
                      Huỷ
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ background: "#ef4444" }}>
                      Xác nhận từ chối
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
