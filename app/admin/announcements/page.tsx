"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { App, Table, Tag, Button, Modal, Input, Select, DatePicker, Switch, Space } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Announcement {
  id: string;
  title: string;
  content: string;
  level: string;
  isActive: boolean;
  actorName: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const LEVEL_COLORS: Record<string, string> = { INFO: "blue", WARNING: "orange", CRITICAL: "red" };
const LEVEL_LABELS: Record<string, string> = { INFO: "Thông tin", WARNING: "Cảnh báo", CRITICAL: "Khẩn cấp" };

export default function AdminAnnouncementsPage() {
  const { message, modal } = App.useApp();
  const [items, setItems] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [level, setLevel] = useState("INFO");
  const [expiresAt, setExpiresAt] = useState<dayjs.Dayjs | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/announcements", { params: { page, limit: 20 } });
      const d = res.data?.data;
      if (d) { setItems(d.items); setTotal(d.total); }
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      message.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post("/admin/announcements", {
        title: title.trim(),
        content: content.trim(),
        level,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      });
      message.success("Đã phát thông báo tới toàn hệ thống");
      setOpen(false);
      setTitle(""); setContent(""); setLevel("INFO"); setExpiresAt(null);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không tạo được thông báo");
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (a: Announcement) => {
    try {
      await axiosInstance.patch(`/admin/announcements/${a.id}`, { isActive: !a.isActive });
      fetchData();
    } catch {
      message.error("Không cập nhật được");
    }
  };

  const remove = (a: Announcement) => {
    modal.confirm({
      title: "Xóa thông báo này?",
      content: a.title,
      okText: "Xóa", okButtonProps: { danger: true }, cancelText: "Hủy",
      onOk: async () => {
        try {
          await axiosInstance.delete(`/admin/announcements/${a.id}`);
          message.success("Đã xóa");
          fetchData();
        } catch {
          message.error("Không xóa được");
        }
      },
    });
  };

  const columns: ColumnsType<Announcement> = [
    {
      title: "Tiêu đề",
      key: "title",
      render: (_: any, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.content}</div>
        </div>
      ),
    },
    { title: "Mức độ", dataIndex: "level", width: 120, render: (l: string) => <Tag color={LEVEL_COLORS[l] || "default"}>{LEVEL_LABELS[l] || l}</Tag> },
    { title: "Người tạo", dataIndex: "actorName", width: 140, render: (v: string) => v || "—" },
    { title: "Hết hạn", dataIndex: "expiresAt", width: 140, render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "Không") },
    { title: "Tạo lúc", dataIndex: "createdAt", width: 140, render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm") },
    {
      title: "Bật",
      key: "active",
      width: 80,
      render: (_: any, r) => <Switch checked={r.isActive} onChange={() => toggle(r)} size="small" />,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, r) => <Button size="small" danger onClick={() => remove(r)}>Xóa</Button>,
    },
  ];

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>Thông báo hệ thống</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Phát thông báo tới toàn bộ nhà hàng trên nền tảng.</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Tạo thông báo</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} thông báo` }}
      />

      <Modal
        title="Tạo thông báo hệ thống"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={submitting}
        okText="Phát thông báo"
        cancelText="Hủy"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <Input placeholder="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          <Input.TextArea placeholder="Nội dung" rows={4} value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} />
          <Space>
            <Select
              value={level}
              onChange={setLevel}
              style={{ width: 160 }}
              options={Object.keys(LEVEL_LABELS).map((k) => ({ label: LEVEL_LABELS[k], value: k }))}
            />
            <DatePicker
              showTime
              placeholder="Hết hạn (để trống = không hết hạn)"
              value={expiresAt}
              onChange={setExpiresAt}
              format="DD/MM/YYYY HH:mm"
              disabledDate={(d) => !!d && d.isBefore(dayjs().startOf("day"))}
            />
          </Space>
        </div>
      </Modal>
    </div>
  );
}
