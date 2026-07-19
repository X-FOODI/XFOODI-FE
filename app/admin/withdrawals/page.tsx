"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { App, Table, Tag, Select, Button, Modal, Input, Space, Descriptions } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatVND } from "@/lib/utils/currency";

interface Withdrawal {
  id: string;
  amount: string | number;
  status: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  adminNote: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string;
  wallet?: { restaurant?: { name: string; slug: string } };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "gold",
  PROCESSING: "blue",
  COMPLETED: "green",
  FAILED: "red",
  CANCELLED: "default",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

export default function AdminWithdrawalsPage() {
  const { message, modal } = App.useApp();
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<string | undefined>("PENDING");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (status) params.status = status;
      const res = await axiosInstance.get("/wallet/admin/withdrawals", { params });
      const d = res.data?.data ?? res.data;
      if (d?.items) {
        setItems(d.items);
        setTotal(d.total);
      }
    } catch (err) {
      console.error("Lỗi tải yêu cầu rút tiền:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approve = (w: Withdrawal) => {
    let note = "";
    modal.confirm({
      title: `Duyệt rút ${formatVND(Number(w.amount))}?`,
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 8 }}>
            {w.wallet?.restaurant?.name} → {w.bankCode} · {w.accountNumber} ({w.accountName})
          </p>
          <Input.TextArea placeholder="Ghi chú (tùy chọn)" rows={2} onChange={(e) => (note = e.target.value)} />
        </div>
      ),
      okText: "Duyệt & giải ngân",
      cancelText: "Hủy",
      onOk: async () => {
        setActing(w.id);
        try {
          await axiosInstance.post(`/wallet/admin/withdrawals/${w.id}/approve`, { adminNote: note });
          message.success("Đã duyệt yêu cầu rút tiền");
          fetchData();
        } catch (err: any) {
          message.error(err?.response?.data?.message || "Không duyệt được");
          throw err;
        } finally {
          setActing(null);
        }
      },
    });
  };

  const reject = (w: Withdrawal) => {
    let reason = "";
    modal.confirm({
      title: `Từ chối yêu cầu rút tiền?`,
      content: (
        <div style={{ marginTop: 12 }}>
          <Input.TextArea placeholder="Lý do từ chối (bắt buộc)" rows={3} onChange={(e) => (reason = e.target.value)} />
        </div>
      ),
      okText: "Từ chối",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        if (!reason.trim()) {
          message.error("Vui lòng nhập lý do từ chối");
          return Promise.reject();
        }
        setActing(w.id);
        try {
          await axiosInstance.post(`/wallet/admin/withdrawals/${w.id}/reject`, { reason: reason.trim() });
          message.success("Đã từ chối yêu cầu");
          fetchData();
        } catch (err: any) {
          message.error(err?.response?.data?.message || "Không từ chối được");
          throw err;
        } finally {
          setActing(null);
        }
      },
    });
  };

  const columns: ColumnsType<Withdrawal> = [
    {
      title: "Nhà hàng",
      key: "restaurant",
      render: (_: any, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.wallet?.restaurant?.name || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.wallet?.restaurant?.slug}</div>
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      align: "right",
      render: (v) => <span style={{ fontWeight: 700, color: "var(--primary)" }}>{formatVND(Number(v))}</span>,
    },
    {
      title: "Tài khoản nhận",
      key: "bank",
      render: (_: any, r) => (
        <div>
          <div>{r.bankCode} · {r.accountNumber}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.accountName}</div>
        </div>
      ),
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "createdAt",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s: string) => <Tag color={STATUS_COLORS[s] || "default"}>{STATUS_LABELS[s] || s}</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_: any, r) =>
        r.status === "PENDING" ? (
          <Space>
            <Button type="primary" size="small" loading={acting === r.id} onClick={() => approve(r)}>
              Duyệt
            </Button>
            <Button danger size="small" disabled={acting === r.id} onClick={() => reject(r)}>
              Từ chối
            </Button>
          </Space>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.rejectionReason ? `Lý do: ${r.rejectionReason}` : r.adminNote || "—"}
          </span>
        ),
    },
  ];

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>Duyệt yêu cầu rút tiền</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          Xét duyệt và giải ngân các yêu cầu rút tiền từ ví doanh thu của nhà hàng.
        </p>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 180 }}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={Object.keys(STATUS_LABELS).map((k) => ({ label: STATUS_LABELS[k], value: k }))}
        />
        <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>Làm mới</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        size="middle"
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setLimit(ps); },
          showTotal: (t) => `${t} yêu cầu`,
        }}
      />
    </div>
  );
}
