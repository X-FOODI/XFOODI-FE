"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { Table, Tag, Input, Select, DatePicker, Drawer, Button, Descriptions, Space } from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface AuditLog {
  id: string;
  action: string;
  adminId: string;
  actorEmail: string | null;
  actorName: string | null;
  targetType: string | null;
  targetId: string;
  method: string | null;
  path: string | null;
  ipAddress: string | null;
  status: string;
  reason: string | null;
  metadata: any;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  RESTAURANT_DISABLED: "red",
  RESTAURANT_ENABLED: "green",
  USER_DISABLED: "volcano",
  USER_ENABLED: "green",
  APPLICATION_APPROVED: "blue",
  APPLICATION_REJECTED: "orange",
};

const { RangePicker } = DatePicker;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [actions, setActions] = useState<string[]>([]);

  const [selected, setSelected] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (action) params.action = action;
      if (status) params.status = status;
      if (range) {
        params.from = range[0].startOf("day").toISOString();
        params.to = range[1].endOf("day").toISOString();
      }
      const res = await axiosInstance.get("/admin/audit-logs", { params });
      const d = res.data?.data;
      if (d) {
        setLogs(d.items);
        setTotal(d.total);
      }
    } catch (err) {
      console.error("Lỗi tải nhật ký:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, action, status, range]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    axiosInstance
      .get("/admin/audit-logs/actions")
      .then((res) => setActions(res.data?.data || []))
      .catch(() => {});
  }, []);

  const exportCsv = () => {
    const header = ["Thời gian", "Người thực hiện", "Email", "Hành động", "Loại", "Đối tượng", "Trạng thái", "Lý do", "IP"];
    const rows = logs.map((l) => [
      dayjs(l.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      l.actorName || "",
      l.actorEmail || "",
      l.action,
      l.targetType || "",
      l.targetId || "",
      l.status,
      (l.reason || "").replace(/[\n,]/g, " "),
      l.ipAddress || "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${dayjs().format("YYYYMMDD-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 170,
      render: (v: string) => (
        <div>
          <div>{dayjs(v).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{dayjs(v).format("HH:mm:ss")}</div>
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      key: "actor",
      render: (_: any, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.actorName || "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.actorEmail || r.adminId}</div>
        </div>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      render: (a: string) => <Tag color={ACTION_COLORS[a] || "default"}>{a}</Tag>,
    },
    {
      title: "Đối tượng",
      key: "target",
      render: (_: any, r) => (
        <div>
          {r.targetType && <Tag>{r.targetType}</Tag>}
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.targetId || "—"}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 110,
      render: (s: string) => <Tag color={s === "SUCCESS" ? "green" : "red"}>{s}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, r) => (
        <Button size="small" onClick={() => setSelected(r)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>Nhật ký hệ thống</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          Theo dõi mọi thao tác quản trị quan trọng trên nền tảng.
        </p>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo hành động, email, đối tượng..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => { setPage(1); fetchLogs(); }}
        />
        <Select
          placeholder="Hành động"
          allowClear
          style={{ width: 200 }}
          value={action}
          onChange={(v) => { setAction(v); setPage(1); }}
          options={actions.map((a) => ({ label: a, value: a }))}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { label: "SUCCESS", value: "SUCCESS" },
            { label: "FAILED", value: "FAILED" },
          ]}
        />
        <RangePicker
          value={range as any}
          onChange={(v) => { setRange(v as any); setPage(1); }}
          format="DD/MM/YYYY"
        />
        <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>Làm mới</Button>
        <Button icon={<DownloadOutlined />} onClick={exportCsv} disabled={logs.length === 0}>CSV</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        size="middle"
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          onChange: (p, ps) => { setPage(p); setLimit(ps); },
          showTotal: (t) => `${t} bản ghi`,
        }}
      />

      <Drawer
        title="Chi tiết nhật ký"
        width={480}
        open={!!selected}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Thời gian">{dayjs(selected.createdAt).format("DD/MM/YYYY HH:mm:ss")}</Descriptions.Item>
            <Descriptions.Item label="Hành động"><Tag color={ACTION_COLORS[selected.action] || "default"}>{selected.action}</Tag></Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">{selected.actorName || "—"}</Descriptions.Item>
            <Descriptions.Item label="Email">{selected.actorEmail || "—"}</Descriptions.Item>
            <Descriptions.Item label="Admin ID">{selected.adminId}</Descriptions.Item>
            <Descriptions.Item label="Loại đối tượng">{selected.targetType || "—"}</Descriptions.Item>
            <Descriptions.Item label="Đối tượng (ID)">{selected.targetId || "—"}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag color={selected.status === "SUCCESS" ? "green" : "red"}>{selected.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Lý do">{selected.reason || "—"}</Descriptions.Item>
            <Descriptions.Item label="IP">{selected.ipAddress || "—"}</Descriptions.Item>
            {selected.method && <Descriptions.Item label="Method / Path">{selected.method} {selected.path}</Descriptions.Item>}
            <Descriptions.Item label="Metadata">
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
                {selected.metadata ? JSON.stringify(selected.metadata, null, 2) : "—"}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
