"use client";

import reservationService, { Reservation } from "@/lib/services/reservationService";
import paymentService, { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from "@/lib/services/paymentService";
import EditReservationForm from "@/components/reservations/EditReservationForm";
import QRScannerModal from "@/components/reservations/QRScannerModal";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { Button } from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#10b981",
  CHECKED_IN: "#6366f1",
  COMPLETED: "#3b82f6",
  CANCELLED: "#6b7280",
};

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const router = useRouter();

  const [res, setRes] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  const brandColor = tenant?.primaryColor || "#FF380B";

  useEffect(() => {
    reservationService.getById(id).then(setRes).catch(() => showToast("error", "Lỗi", "Không tìm thấy đặt bàn")).finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: "CONFIRMED" | "CANCELLED" | "CHECKED_IN") => {
    if (!res) return;
    setActionLoading(true);
    try {
      const updated = await reservationService.updateStatus(res.id, action);
      setRes((r) => r ? { ...r, statusValue: updated.statusValue } : r);
      showToast("success", "Đã cập nhật", action === "CONFIRMED" ? "Đặt bàn đã được xác nhận" : "Đặt bàn đã bị huỷ");
    } catch (err: any) {
      showToast("error", "Lỗi", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCashDeposit = async () => {
    if (!res || !cashAmount) return;
    setActionLoading(true);
    try {
      await paymentService.payCash({
        reservationId: res.id,
        cashReceive: Number(cashAmount),
        purpose: 1, // DEPOSIT
      });
      showToast("success", "Thanh toán cọc", "Đã xác nhận tiền mặt");
      setShowCashModal(false);
      const updated = await reservationService.getById(id);
      setRes(updated);
    } catch (err: any) {
      showToast("error", "Lỗi", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!res) return;
    setCompleteLoading(true);
    try {
      const updated = await reservationService.complete(res.id);
      setRes((r) => r ? { ...r, statusValue: updated.statusValue, completedAt: (updated as any).completedAt } : r);
      showToast("success", "Hoàn thành", "Reservation đã được đóng");
    } catch (err: any) {
      showToast("error", "Lỗi", err.message);
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleCheckInByCode = async (code: string) => {
    try {
      const updated = await reservationService.checkIn(code);
      setRes((r) => r ? { ...r, statusValue: updated.statusValue, checkedInAt: (updated as any).checkedInAt } : r);
      showToast("success", "Check-in thành công", `Khách ${res?.customer?.user?.fullName ?? ""} đã check-in`);
      setShowQRScanner(false);
    } catch (err: any) {
      showToast("error", "Check-in thất bại", err.message);
      setShowQRScanner(false);
    }
  };

  const fmt = (t: string) => {
    const d = new Date(t);
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} · ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Đang tải...</div>
    </div>
  );

  if (!res) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>❌</div>
        <p style={{ color: "var(--text-muted)" }}>Không tìm thấy đặt bàn</p>
        <Link href="/restaurant/reservations"><Button>← Quay lại</Button></Link>
      </div>
    </div>
  );

  const statusColor = STATUS_COLOR[res.statusValue?.code] ?? "#6b7280";
  const depositPaid = res.payments?.some((p) => p.status === 1 && p.paymentMethod);
  const totalDeposit = res.payments?.filter((p) => p.status === 1).reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Back */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/restaurant/reservations" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>← Danh sách đặt bàn</Link>
        </div>

        {/* Header card */}
        <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mã xác nhận</p>
              <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: brandColor, fontFamily: "monospace", letterSpacing: "0.1em" }}>{res.confirmationCode}</p>
            </div>
            <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: `${statusColor}18`, color: statusColor }}>
              {res.statusValue?.name ?? res.statusValue?.code}
            </span>
          </div>

          {/* Actions */}
          {res.statusValue?.code === "PENDING" && (
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <Button type="primary" loading={actionLoading} onClick={() => handleAction("CONFIRMED")}
                style={{ background: "#10b981", borderColor: "#10b981", borderRadius: 10, fontWeight: 700 }}>
                ✓ Xác nhận đặt bàn
              </Button>
              <Button danger loading={actionLoading} onClick={() => handleAction("CANCELLED")} style={{ borderRadius: 10 }}>
                ✕ Huỷ đặt bàn
              </Button>
            </div>
          )}
          {/* CONFIRMED actions */}
          {res.statusValue?.code === "CONFIRMED" && (
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <Button onClick={() => setShowQRScanner(true)}
                style={{ background: "#10b981", borderColor: "#10b981", color: "#fff", borderRadius: 10, fontWeight: 700 }}>
                📷 Quét QR Check-in
              </Button>
              <Button onClick={() => handleAction("CANCELLED")} danger loading={actionLoading} style={{ borderRadius: 10 }}>
                ✕ Huỷ đặt bàn
              </Button>
            </div>
          )}
          {/* CHECKED_IN actions */}
          {res.statusValue?.code === "CHECKED_IN" && (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button type="primary" loading={completeLoading} onClick={handleComplete}
                style={{ background: "#3b82f6", borderColor: "#3b82f6", borderRadius: 10, fontWeight: 700 }}>
                ✓ Đóng reservation
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer info */}
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Khách hàng</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${brandColor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: brandColor, flexShrink: 0 }}>
                {res.customer?.user?.fullName?.[0] ?? "K"}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{res.customer?.user?.fullName ?? "—"}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{res.customer?.user?.phoneNumber ?? ""}</p>
              </div>
            </div>
            {res.customer?.user?.email && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>✉️ {res.customer.user.email}</p>}
          </div>

          {/* Reservation info */}
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Chi tiết đặt bàn</h3>
            {[
              { label: "Thời gian", value: fmt(res.time) },
              { label: "Số khách", value: `${res.numberOfGuests} người` },
              { label: "Bàn", value: res.tables?.length > 0 ? res.tables.map((t) => t.table.code).join(", ") : "Chưa phân bàn" },
              { label: "Check-in", value: res.checkedInAt ? fmt(res.checkedInAt) : "Chưa check-in" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.value}</span>
              </div>
            ))}
            {res.specialRequests && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "var(--surface)", fontSize: 13, color: "var(--text-muted)" }}>
                💬 {res.specialRequests}
              </div>
            )}
            <EditReservationForm
              reservation={res}
              onSave={(updated) => { setRes(updated); showToast("success", "Đã cập nhật", "Thông tin đặt bàn đã được thay đổi"); }}
              brandColor={brandColor}
            />
          </div>
        </div>

        {/* Deposit / Payment */}
        <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 20, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Đặt cọc</h3>
            {Number(res.depositAmount) > 0 && !depositPaid && (
              <Button size="small" onClick={() => setShowCashModal(true)}
                style={{ borderRadius: 8, fontSize: 12, background: "#10b981", borderColor: "#10b981", color: "#fff" }}>
                + Xác nhận cọc tiền mặt
              </Button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Yêu cầu cọc</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {Number(res.depositAmount) > 0 ? `${Number(res.depositAmount).toLocaleString("vi-VN")}đ` : "Không yêu cầu"}
            </span>
          </div>

          {res.payments && res.payments.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px", fontWeight: 600 }}>Lịch sử thanh toán</p>
              {res.payments.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "var(--surface)", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{Number(p.amount).toLocaleString("vi-VN")}đ</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{p.paymentMethod?.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: (PAYMENT_STATUS_COLOR as any)[p.status] }}>
                    {(PAYMENT_STATUS_LABEL as any)[p.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refund info */}
        {res.refunds && res.refunds.length > 0 && (
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 20, marginTop: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Hoàn cọc</h3>
            {res.refunds.map((refund) => (
              <div key={refund.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "var(--surface)", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>{Number(refund.amount).toLocaleString("vi-VN")}đ</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>Hoàn cọc</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: "#f0fdf4", color: "#22c55e" }}>
                  {refund.status === "PENDING" ? "Đang xử lý" : refund.status === "COMPLETED" ? "Đã hoàn" : refund.status}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* QR Scanner modal */}
      {showQRScanner && (
        <QRScannerModal
          onSuccess={handleCheckInByCode}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Cash deposit modal */}
      {showCashModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--card)", borderRadius: 20, padding: 28, width: 340, boxShadow: "var(--shadow-md)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Xác nhận cọc tiền mặt</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              Yêu cầu cọc: <b style={{ color: brandColor }}>{Number(res.depositAmount).toLocaleString("vi-VN")}đ</b>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Tiền nhận được</label>
              <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                placeholder={String(res.depositAmount)} autoFocus
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 16 }} />
            </div>
            {cashAmount && Number(cashAmount) >= Number(res.depositAmount) && (
              <p style={{ fontSize: 13, color: "#10b981", marginBottom: 12 }}>
                Tiền thối: {(Number(cashAmount) - Number(res.depositAmount)).toLocaleString("vi-VN")}đ
              </p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={() => setShowCashModal(false)} style={{ flex: 1 }}>Huỷ</Button>
              <Button type="primary" loading={actionLoading} onClick={handleCashDeposit} disabled={!cashAmount || Number(cashAmount) < Number(res.depositAmount)}
                style={{ flex: 2, background: "#10b981", borderColor: "#10b981" }}>
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
