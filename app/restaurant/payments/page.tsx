"use client";

import paymentService, {
  Payment, PaymentStatus, PaymentPurpose,
  PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR,
} from "@/lib/services/paymentService";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { Button, Select, DatePicker } from "antd";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

const PURPOSE_LABEL: Record<number, string> = {
  [PaymentPurpose.ORDER]: "Đơn hàng",
  [PaymentPurpose.DEPOSIT]: "Đặt cọc",
  [PaymentPurpose.REFUND]: "Hoàn tiền",
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  const color = PAYMENT_STATUS_COLOR[status] ?? "#6b7280";
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${color}18`, color }}>
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { showToast } = useToast();

  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [purposeFilter, setPurposeFilter] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();

  const restaurantId = tenant?.id || user?.restaurantId || "";
  const brandColor = tenant?.primaryColor || "#FF380B";

  // Summary stats (compute from loaded items)
  const completedItems = items.filter((p) => p.status === PaymentStatus.COMPLETED);
  const totalRevenue = completedItems.reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount = items.filter((p) => p.status === PaymentStatus.PENDING).length;

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const result = await paymentService.list({
        restaurantId,
        page,
        limit: 25,
        status: statusFilter,
        purpose: purposeFilter,
        from: fromDate,
        to: toDate,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err: any) {
      showToast("error", "Lỗi", err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, page, statusFilter, purposeFilter, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (t: string) => {
    const d = new Date(t);
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} · ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "var(--bg-base)" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Quản lý Thanh toán</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>{total} giao dịch</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Doanh thu (đã thanh toán)", value: `${totalRevenue.toLocaleString("vi-VN")}đ`, color: "#10b981" },
          { label: "Giao dịch thành công", value: String(completedItems.length), color: "#3b82f6" },
          { label: "Chờ thanh toán", value: String(pendingCount), color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: "18px 20px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Select placeholder="Trạng thái" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
          {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
            <Select.Option key={k} value={Number(k)}>{v}</Select.Option>
          ))}
        </Select>
        <Select placeholder="Loại" allowClear value={purposeFilter} onChange={setPurposeFilter} style={{ width: 140 }}>
          {Object.entries(PURPOSE_LABEL).map(([k, v]) => (
            <Select.Option key={k} value={Number(k)}>{v}</Select.Option>
          ))}
        </Select>
        <DatePicker placeholder="Từ ngày" onChange={(d) => setFromDate(d ? d.toISOString() : undefined)} style={{ width: 140 }} />
        <DatePicker placeholder="Đến ngày" onChange={(d) => setToDate(d ? d.toISOString() : undefined)} style={{ width: 140 }} />
        <Button onClick={() => { setPage(1); fetchData(); }} style={{ borderRadius: 8 }}>Lọc</Button>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Đang tải...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
            <p>Không có giao dịch nào</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                  {["ID", "Liên kết", "Phương thức", "Loại", "Số tiền", "Ngày TT", "Trạng thái"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface-faint, transparent)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{p.id.slice(0, 8)}...</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text)" }}>
                      {p.reservation ? (
                        <Link href={`/restaurant/reservations/${p.reservation.id}`} style={{ color: brandColor, fontWeight: 600, textDecoration: "none" }}>
                          RES · {p.reservation.confirmationCode}
                        </Link>
                      ) : p.order ? (
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>ORD · {p.order.reference}</span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text)" }}>{p.paymentMethod?.name ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8, background: "var(--surface)", color: "var(--text-muted)", fontWeight: 600 }}>
                        {PURPOSE_LABEL[p.purpose] ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: p.status === PaymentStatus.COMPLETED ? "#10b981" : "var(--text)" }}>
                        {Number(p.amount).toLocaleString("vi-VN")}đ
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(p.paymentDate)}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
          <span style={{ padding: "6px 16px", color: "var(--text-muted)", fontSize: 13 }}>Trang {page} / {Math.ceil(total / 25)}</span>
          <Button disabled={page >= Math.ceil(total / 25)} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
        </div>
      )}
    </div>
  );
}
