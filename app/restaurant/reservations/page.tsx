"use client";

import reservationService, { Reservation } from "@/lib/services/reservationService";
import StatsCards from "@/components/reservations/StatsCards";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, DatePicker, Input, Select } from "antd";
import type { Dayjs } from "dayjs";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "CHECKED_IN", label: "Đã check-in" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã huỷ" },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#10b981",
  CHECKED_IN: "#6366f1",
  COMPLETED: "#3b82f6",
  CANCELLED: "#6b7280",
};

function StatusBadge({ code, name }: { code: string; name: string }) {
  const color = STATUS_COLOR[code] ?? "#6b7280";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${color}18`, color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {name}
    </span>
  );
}

function CheckInModal({ code, onConfirm, onClose }: {
  code: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (input.trim().toUpperCase() !== code.toUpperCase()) {
      alert("Mã không đúng");
      return;
    }
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--card)", borderRadius: 20, padding: 28, width: 360, boxShadow: "var(--shadow-md)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Check-in khách hàng</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Nhập mã xác nhận từ khách:</p>
        <Input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="VD: A1B2C3"
          style={{ marginBottom: 16, fontFamily: "monospace", fontSize: 18, textAlign: "center", letterSpacing: "0.1em" }}
          maxLength={6} autoFocus />
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={onClose} style={{ flex: 1 }}>Huỷ</Button>
          <Button type="primary" loading={loading} onClick={handleConfirm} style={{ flex: 2, background: "#10b981", borderColor: "#10b981" }}>
            ✓ Xác nhận check-in
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("pending");
  const [checkInTarget, setCheckInTarget] = useState<Reservation | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Reservation | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const restaurantId = tenant?.id || user?.restaurantId || "";
  const brandColor = tenant?.primaryColor || "#FF380B";

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const result = await reservationService.list({
        restaurantId,
        page,
        limit: 20,
        status: activeTab === "pending" ? "PENDING" : "CONFIRMED",
        search: search || undefined,
        from: dateFrom ? new Date(`${dateFrom}T00:00:00+07:00`).toISOString() : undefined,
        to: dateTo ? new Date(`${dateTo}T23:59:59+07:00`).toISOString() : undefined,
        sortBy: activeTab === "pending" ? "createdAt" : "time",
        sortOrder: "asc",
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err: any) {
      showToast("error", "Lỗi", err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, page, activeTab, search, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto refresh every 15 seconds to sync late arrivals and cancellations
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleDateChange = (from: string, to: string) => {
    if (from && to && new Date(from) > new Date(to)) {
      setDateError("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    setDateError("");
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await reservationService.updateStatus(id, "CONFIRMED");
      showToast("success", "Đã duyệt", "Đặt bàn đã được xác nhận. Email thông báo đã gửi tới khách.");
      fetchData();
    } catch (err: any) {
      showToast("error", "Lỗi", err?.response?.data?.message || err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejectLoading(true);
    try {
      await reservationService.updateStatus(rejectTarget.id, "CANCELLED", rejectReason.trim());
      showToast("success", "Đã từ chối", "Đặt bàn đã bị từ chối. Email thông báo và lý do đã gửi tới khách.");
      setRejectTarget(null);
      setRejectReason("");
      fetchData();
    } catch (err: any) {
      showToast("error", "Lỗi", err?.response?.data?.message || err.message);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await reservationService.updateStatus(id, status);
      showToast("success", "Cập nhật", "Trạng thái đã được thay đổi");
      fetchData();
    } catch (err: any) {
      showToast("error", "Lỗi", err.message);
    }
  };

  const handleCheckIn = async () => {
    if (!checkInTarget) return;
    try {
      await reservationService.checkIn(checkInTarget.confirmationCode);
      showToast("success", "Check-in thành công", `Khách ${checkInTarget.customer?.user?.fullName ?? ""} đã check-in`);
      setCheckInTarget(null);
      fetchData();
    } catch (err: any) {
      showToast("error", "Lỗi check-in", err?.response?.data?.message || err.message);
      // We do not close the modal here so the user can see the error
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await reservationService.complete(id);
      showToast("success", "Hoàn thành", "Reservation đã được đóng");
      fetchData();
    } catch (err: any) {
      showToast("error", "Lỗi", err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader role="restaurant" restaurantName={tenant?.name ?? ""} userName={user?.fullName ?? user?.name ?? ""} />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar role="restaurant" restaurantName={tenant?.name ?? ""} userName={user?.fullName ?? user?.name ?? ""} userEmail={user?.email ?? ""} />
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
          <div style={{ padding: "24px" }}>

      {/* Stats Dashboard */}
      <StatsCards restaurantId={restaurantId} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Duyệt Đặt bàn</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>{total} đặt bàn {activeTab === "pending" ? "chờ duyệt" : "đã xác nhận"}</p>
        </div>
        <Link href="/restaurant/reservations/new">
          <Button type="primary" style={{ background: brandColor, borderColor: brandColor, borderRadius: 10, fontWeight: 700 }}>
            + Đặt bàn mới
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        <button
          onClick={() => { setActiveTab("pending"); setPage(1); }}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            color: activeTab === "pending" ? brandColor : "var(--text-muted)",
            borderBottom: activeTab === "pending" ? `3px solid ${brandColor}` : "3px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          📥 Chờ duyệt {activeTab === "pending" ? `(${total})` : ""}
        </button>
        <button
          onClick={() => { setActiveTab("confirmed"); setPage(1); }}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            color: activeTab === "confirmed" ? brandColor : "var(--text-muted)",
            borderBottom: activeTab === "confirmed" ? `3px solid ${brandColor}` : "3px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ✓ Đã xác nhận {activeTab === "confirmed" ? `(${total})` : ""}
        </button>
      </div>

      {/* Top Banner Alert for Pending Actions */}
      {items.some(r => r.metadata?.noShowAutoPending || r.metadata?.isCancellationManualReviewPending) && (
        <div style={{
          background: "rgba(245, 158, 11, 0.08)",
          border: "1.5px solid rgba(245, 158, 11, 0.3)",
          borderRadius: 16,
          padding: "12px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              Có đặt bàn trễ hẹn hoặc yêu cầu hủy sát giờ cần xử lý. Vui lòng kiểm tra chi tiết.
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", background: "rgba(245, 158, 11, 0.15)", padding: "4px 10px", borderRadius: 12 }}>
            Cần xử lý gấp
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <Input.Search placeholder="Tìm mã xác nhận, tên, SĐT..." value={search} onChange={(e) => setSearch(e.target.value)}
          onSearch={() => { setPage(1); fetchData(); }} style={{ width: 280 }} allowClear />

        {/* Date range filter */}
        <DatePicker.RangePicker
          format="DD/MM/YYYY"
          placeholder={["Từ ngày", "Đến ngày"]}
          style={{ width: 280 }}
          onChange={(_, dateStrings) => {
            const [from, to] = dateStrings as [string, string];
            const fromISO = from ? from.split("/").reverse().join("-") : "";
            const toISO = to ? to.split("/").reverse().join("-") : "";
            handleDateChange(fromISO, toISO);
          }}
        />
        {dateError && <span style={{ fontSize: 12, color: "#ef4444" }}>{dateError}</span>}
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Đang tải...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
            <p>Không có đặt bàn nào</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                  {["Mã xác nhận", "Khách hàng", "Thời gian", "Khách", "Bàn", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface-faint, transparent)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: brandColor }}>{r.confirmationCode}</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {r.metadata?.mustLeaveBy && (
                          <span style={{ display: "inline-block", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#ef4444" }}>
                            ⚠️ Hạn trả: {new Date(r.metadata.mustLeaveBy).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {r.metadata?.isCancellationManualReviewPending && (
                          <span style={{ display: "inline-block", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#d97706" }}>
                            ⏰ Chờ duyệt huỷ
                          </span>
                        )}
                        {r.metadata?.noShowAutoPending && (
                          <span style={{ display: "inline-block", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#ef4444" }}>
                            🚨 Trễ &gt; 30p
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{r.customer?.user?.fullName ?? "—"}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{r.customer?.user?.phoneNumber ?? ""}</p>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text)", whiteSpace: "nowrap" }}>{formatTime(r.time)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text)", textAlign: "center" }}>{r.numberOfGuests}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                      {r.tables?.length > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span>{r.tables.map((t) => t.table.code).join(", ")}</span>
                          {r.metadata?.isAutoAssignment && (
                            <span style={{
                              display: "inline-block",
                              padding: "1px 4px",
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                              background: "rgba(59, 130, 246, 0.08)",
                              border: "1px solid rgba(59, 130, 246, 0.2)",
                              color: "#2563eb",
                              whiteSpace: "nowrap"
                            }}>
                              Tự xếp
                            </span>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge code={r.statusValue?.code ?? ""} name={r.statusValue?.name ?? ""} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="small" onClick={() => router.push(`/restaurant/reservations/${r.id}`)} style={{ borderRadius: 8, fontSize: 12 }}>Chi tiết</Button>
                        {r.statusValue?.code === "PENDING" && (
                          <>
                            <Button size="small" loading={actionLoadingId === r.id} onClick={() => handleApprove(r.id)}
                              style={{ borderRadius: 8, fontSize: 12, color: "#10b981", borderColor: "#10b981" }}>Duyệt</Button>
                            <Button size="small" danger onClick={() => { setRejectTarget(r); setRejectReason(""); }}
                              style={{ borderRadius: 8, fontSize: 12 }}>Từ chối</Button>
                          </>
                        )}
                        {r.statusValue?.code === "CONFIRMED" && !r.checkedInAt && (
                          <Button size="small" onClick={() => setCheckInTarget(r)}
                            style={{ borderRadius: 8, fontSize: 12, background: "#10b981", borderColor: "#10b981", color: "#fff" }}>
                            Check-in
                          </Button>
                        )}
                        {r.statusValue?.code === "CHECKED_IN" && (
                          <Button
                            size="small"
                            loading={actionLoadingId === r.id}
                            onClick={() => handleComplete(r.id)}
                            style={{ borderRadius: 8, fontSize: 12, background: "#3b82f6", borderColor: "#3b82f6", color: "#fff" }}
                          >
                            ✓ Hoàn thành
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
          <span style={{ padding: "6px 16px", color: "var(--text-muted)", fontSize: 13 }}>Trang {page} / {Math.ceil(total / 20)}</span>
          <Button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
        </div>
      )}

      {/* Check-in modal */}
      {checkInTarget && (
        <CheckInModal
          code={checkInTarget.confirmationCode}
          onConfirm={handleCheckIn}
          onClose={() => setCheckInTarget(null)}
        />
      )}

      {/* Reject reservation modal */}
      {rejectTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--card)", borderRadius: 20, padding: 28, width: 440, boxShadow: "var(--shadow-md)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Từ chối đặt bàn</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Khách hàng <strong>{rejectTarget.customer?.user?.fullName ?? ""}</strong> sẽ nhận được email thông báo từ chối kèm theo lý do bạn nhập.
            </p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>
                Lý do từ chối <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối (sẽ được gửi tới khách qua email)..."
                rows={4}
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 13,
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={() => { setRejectTarget(null); setRejectReason(""); }} style={{ flex: 1, borderRadius: 10, height: 40 }}>Huỷ</Button>
              <Button
                danger type="primary"
                loading={rejectLoading}
                disabled={!rejectReason.trim()}
                onClick={handleRejectConfirm}
                style={{ flex: 2, borderRadius: 10, fontWeight: 700, height: 40 }}
              >
                ✕ Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
        </main>
      </div>
    </div>
  );
}
