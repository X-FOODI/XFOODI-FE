"use client";

import reservationService, { AvailableTable } from "@/lib/services/reservationService";
import paymentService, { TransferInfo } from "@/lib/services/paymentService";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = ["Thời gian & Khách", "Chọn bàn", "Thông tin", "Xác nhận & Cọc"];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < current ? "var(--primary)" : i === current ? "var(--primary)" : "var(--border)",
              color: i <= current ? "#fff" : "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, flexShrink: 0,
              opacity: i > current ? 0.4 : 1,
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 11, marginTop: 4, color: i === current ? "var(--primary)" : "var(--text-muted)", fontWeight: i === current ? 700 : 400, textAlign: "center" }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? "var(--primary)" : "var(--border)", marginBottom: 16, transition: "background 0.3s" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── SePay QR waiting screen ────────────────────────────────────────────────────
function SePayQR({ info, onSuccess, onSkip }: {
  info: TransferInfo;
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const [polling, setPolling] = useState(true);
  const [dots, setDots] = useState(".");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const dotsInterval = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    if (!polling) return;
    intervalRef.current = setInterval(async () => {
      try {
        const { status } = await paymentService.pollStatus(info.paymentId);
        if (status === 1) { // COMPLETED
          setPolling(false);
          clearInterval(intervalRef.current!);
          onSuccess();
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [polling, info.paymentId, onSuccess]);

  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <h3 style={{ color: "var(--text)", marginBottom: 8 }}>Thanh toán đặt cọc</h3>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
        Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
      </p>

      {info.qrUrl ? (
        <img src={info.qrUrl} alt="QR chuyển khoản" style={{ width: 220, height: 220, borderRadius: 12, border: "1px solid var(--border)", display: "block", margin: "0 auto 20px" }} />
      ) : (
        <div style={{ padding: 16, background: "var(--surface)", borderRadius: 12, marginBottom: 20, fontSize: 13 }}>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Chưa cấu hình QR. Chuyển khoản thủ công:</p>
        </div>
      )}

      <div style={{ background: "var(--surface)", borderRadius: 12, padding: "16px 20px", textAlign: "left", marginBottom: 20, fontSize: 13, lineHeight: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Ngân hàng</span>
          <b style={{ color: "var(--text)" }}>{info.bankInfo.bankCode || "—"}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Số tài khoản</span>
          <b style={{ color: "var(--text)" }}>{info.bankInfo.accountNumber || "—"}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Tên tài khoản</span>
          <b style={{ color: "var(--text)" }}>{info.bankInfo.accountName || "—"}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Số tiền</span>
          <b style={{ color: "var(--primary)", fontSize: 16 }}>{info.amount.toLocaleString("vi-VN")}đ</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Nội dung chuyển khoản</span>
          <b style={{ color: "var(--text)", fontFamily: "monospace" }}>{info.transferContent}</b>
        </div>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 20 }}>
        Đang chờ xác nhận thanh toán{dots}
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function NewReservationPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0 — time & guests
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [guests, setGuests] = useState(2);

  // Step 1 — table selection
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

  // Step 2 — personal info
  const [name, setName] = useState(user?.fullName || user?.name || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [email, setEmail] = useState(user?.email || "");
  const [requests, setRequests] = useState("");

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.fullName || user.name || "");
      setPhone((prev) => prev || user.phoneNumber || "");
      setEmail((prev) => prev || user.email || "");
    }
  }, [user]);

  // Step 3 — result
  const [createdId, setCreatedId] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const [depositPaid, setDepositPaid] = useState(false);

  const brandColor = tenant?.primaryColor || "#FF380B";
  const restaurantId = tenant?.id || user?.restaurantId || "";

  // Estimate deposit amount (25k per seat capacity of selected tables, or per guest if auto-arranged)
  const estimatedDeposit = selectedTableIds.length > 0
    ? selectedTableIds.reduce((sum, id) => {
        const tbl = availableTables.find((t) => t.id === id);
        return sum + (tbl ? tbl.seatingCapacity * 25000 : 0);
      }, 0)
    : guests * 25000;

  // ── Step 0 → 1: check available tables ──────────────────────────────────────
  const handleCheckTables = async () => {
    if (!date || !time || !restaurantId) {
      showToast("error", "Thiếu thông tin", "Vui lòng chọn ngày, giờ và nhà hàng");
      return;
    }
    setLoading(true);
    try {
      const isoTime = new Date(`${date}T${time}:00`).toISOString();
      const tables = await reservationService.checkTables({ restaurantId, time: isoTime, numberOfGuests: guests });
      setAvailableTables(tables);
      setStep(1);
    } catch (err: any) {
      showToast("error", "Lỗi", err.message || "Không thể kiểm tra bàn trống");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: submit reservation ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!restaurantId) { showToast("error", "Lỗi", "Không xác định được nhà hàng"); return; }
    if (!email || !email.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập địa chỉ email để nhận thông tin đặt bàn");
      return;
    }
    setLoading(true);
    try {
      const isoTime = new Date(`${date}T${time}:00`).toISOString();
      const res = await reservationService.create({
        restaurantId,
        numberOfGuests: guests,
        time: isoTime,
        specialRequests: requests || undefined,
        tableIds: selectedTableIds,
        fullName: name,
        phoneNumber: phone,
        email: email.trim(),
      });
      setCreatedId(res.id);
      setCreatedCode(res.confirmationCode || "");
      showToast("success", "Đặt bàn thành công", `Mã xác nhận: ${res.confirmationCode}`);

      // Auto-get transfer info if deposit > 0
      if (Number(res.depositAmount) > 0) {
        try {
          const info = await paymentService.getTransferInfo({
            reservationId: res.id,
            amount: Number(res.depositAmount),
            restaurantId,
          });
          setTransferInfo(info);
        } catch { /* optional */ }
      }
      setStep(3);
    } catch (err: any) {
      showToast("error", "Lỗi", err.message || "Không thể đặt bàn");
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSuccess = () => {
    setDepositPaid(true);
    setTransferInfo(null);
    showToast("success", "Đã nhận cọc", "Đặt bàn của bạn đã được xác nhận");
  };

  const today = new Date().toISOString().split("T")[0];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Header />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>

        {/* Breadcrumbs */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>← Trang chủ</Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 16 }}>Đặt bàn</span>
        </div>

        <StepBar current={step} />

        <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>

          {/* Step 0: Time & Guests */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>Thời gian & Số khách</h2>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Ngày đặt bàn</label>
                <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Giờ đến</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14 }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Số khách</label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 20, color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", minWidth: 32, textAlign: "center" }}>{guests}</span>
                  <button onClick={() => setGuests((g) => g + 1)}
                    style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 20, color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
              </div>

              <Button type="primary" block size="large" loading={loading} onClick={handleCheckTables}
                style={{ background: brandColor, borderColor: brandColor, borderRadius: 12, height: 48, fontWeight: 700, fontSize: 15 }}>
                Kiểm tra bàn trống →
              </Button>
            </div>
          )}

          {/* Step 1: Table selection */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>Chọn bàn</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                {availableTables.length > 0 ? `${availableTables.length} bàn trống cho ${guests} khách` : "Không tìm thấy bàn phù hợp"}
              </p>

              {availableTables.length === 0 ? (
                <div style={{ padding: 20, background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 12, textAlign: "center", marginBottom: 20 }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: 700, color: "var(--text)", fontSize: 15 }}>
                    Không tìm thấy bàn đơn lẻ cho {guests} người
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
                    Đừng lo lắng! Nhà hàng sẽ tự động ghép bàn hoặc bố trí không gian phù hợp cho nhóm của bạn. Bạn chỉ cần bấm tiếp tục để hoàn tất đặt cọc và giữ chỗ.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableTables.map((t) => {
                    const selected = selectedTableIds.includes(t.id);
                    return (
                      <button key={t.id} onClick={() => setSelectedTableIds(selected ? selectedTableIds.filter((id) => id !== t.id) : [...selectedTableIds, t.id])}
                        style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${selected ? brandColor : "var(--border)"}`, background: selected ? `${brandColor}12` : "var(--surface)", cursor: "pointer", textAlign: "left" }}>
                        <p style={{ margin: 0, fontWeight: 700, color: selected ? brandColor : "var(--text)", fontSize: 15 }}>Bàn {t.code}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{t.seatingCapacity} chỗ · {t.floor.name}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={() => setStep(0)} style={{ flex: 1, borderRadius: 10, height: 44 }}>← Quay lại</Button>
                <Button type="primary" onClick={() => setStep(2)} disabled={availableTables.length > 0 && selectedTableIds.length === 0}
                  style={{ flex: 2, background: brandColor, borderColor: brandColor, borderRadius: 10, height: 44, fontWeight: 700 }}>
                  {availableTables.length === 0 ? "Tiếp tục đặt bàn →" : (selectedTableIds.length > 0 ? `Tiếp tục (${selectedTableIds.length} bàn)` : "Bỏ qua chọn bàn →")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Personal info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>Thông tin liên hệ</h2>

              {[
                { label: "Họ tên", value: name, setter: setName, type: "text", placeholder: "Nguyễn Văn A" },
                { label: "Số điện thoại", value: phone, setter: setPhone, type: "tel", placeholder: "0905 123 456" },
                { label: "Địa chỉ Email (Nhận mã đặt bàn)", value: email, setter: setEmail, type: "email", placeholder: "example@gmail.com", disabled: !!user },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={f.value} placeholder={f.placeholder} onChange={(e) => f.setter(e.target.value)} disabled={f.disabled}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: f.disabled ? "rgba(0,0,0,0.05)" : "var(--surface)", color: "var(--text)", fontSize: 14 }} />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Yêu cầu đặc biệt (không bắt buộc)</label>
                <textarea value={requests} onChange={(e) => setRequests(e.target.value)} rows={3} placeholder="Ví dụ: ghế cho em bé, bánh sinh nhật..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, resize: "vertical" }} />
              </div>

              {/* Summary */}
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13 }}>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Tóm tắt đặt bàn</p>
                <p style={{ margin: "4px 0", color: "var(--text-muted)" }}>📅 {date} lúc {time}</p>
                <p style={{ margin: "4px 0", color: "var(--text-muted)" }}>👥 {guests} khách</p>
                {selectedTableIds.length > 0 && (
                  <p style={{ margin: "4px 0", color: "var(--text-muted)" }}>🪑 {selectedTableIds.length} bàn đã chọn</p>
                )}
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)", borderTop: "1px dashed var(--border)", paddingTop: 8 }}>
                  💰 Tiền đặt cọc (bắt buộc): <strong style={{ color: brandColor, fontSize: 15 }}>{estimatedDeposit.toLocaleString("vi-VN")}đ</strong>
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={() => setStep(1)} style={{ flex: 1, borderRadius: 10, height: 44 }}>← Quay lại</Button>
                <Button type="primary" loading={loading} onClick={handleSubmit} disabled={!name || !phone || !email}
                  style={{ flex: 2, background: brandColor, borderColor: brandColor, borderRadius: 10, height: 44, fontWeight: 700 }}>
                  Xác nhận đặt bàn
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation + SePay deposit */}
          {step === 3 && (
            <div className="space-y-5">
              {transferInfo && !depositPaid ? (
                <SePayQR info={transferInfo} onSuccess={handleDepositSuccess} onSkip={() => setTransferInfo(null)} />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>{depositPaid ? "🎉" : "✅"}</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>
                    {depositPaid ? "Đặt bàn được xác nhận!" : "Đặt bàn thành công!"}
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 24px" }}>
                    {depositPaid ? "Cọc đã thanh toán. Hẹn gặp bạn tại nhà hàng!" : "Vui lòng đến đúng giờ và mang theo mã xác nhận."}
                  </p>

                  <div style={{ padding: "16px 20px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 24, display: "inline-block" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Mã xác nhận</p>
                    <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: brandColor, fontFamily: "monospace", letterSpacing: "0.1em" }}>{createdCode}</p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                    <Button type="primary" block size="large" onClick={() => router.push("/")}
                      style={{ background: brandColor, borderColor: brandColor, borderRadius: 12, height: 48, fontWeight: 700 }}>
                      Về trang chủ
                    </Button>
                    <Button block onClick={() => router.push(`/restaurant/reservations/${createdId}`)}
                      style={{ borderRadius: 12, height: 44, color: "var(--text)" }}>
                      Xem chi tiết đặt bàn
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
