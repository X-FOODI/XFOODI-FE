"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import restaurantApplicationService, {
  RestaurantApplication,
} from "@/lib/services/restaurantApplicationService";

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

  const handleApprove = async () => {
    if (!confirm("Xác nhận duyệt đơn này? Nhà hàng sẽ được tạo và quyền Owner sẽ được cấp cho người dùng.")) return;
    setActionLoading(true);
    setError("");
    try {
      await restaurantApplicationService.approve(id);
      setSuccessMsg("✅ Đã duyệt thành công. Email thông báo đã được gửi đến người dùng.");
      fetchDetail();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đã có lỗi xảy ra");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setError("Vui lòng nhập lý do từ chối"); return; }
    if (!confirm("Xác nhận từ chối đơn này?")) return;
    setActionLoading(true);
    setError("");
    try {
      await restaurantApplicationService.reject(id, rejectReason.trim());
      setSuccessMsg("✅ Đã từ chối đơn. Email thông báo đã được gửi đến người dùng.");
      setShowRejectForm(false);
      fetchDetail();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đã có lỗi xảy ra");
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
                    {actionLoading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                    ✓ Phê duyệt
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ border: "2px solid #ef4444", color: "#ef4444", background: "transparent" }}>
                    ✗ Từ chối
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
                      {actionLoading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
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
