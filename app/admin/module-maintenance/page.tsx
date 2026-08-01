"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { App, Switch, Input, DatePicker, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface ModuleRow {
  key: string;
  label: string;
  state: { enabled: boolean; message?: string; estimatedFinish?: string };
}

export default function AdminModuleMaintenancePage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { message: string; finish: dayjs.Dayjs | null }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings/admin/modules");
      const data: ModuleRow[] = res.data?.data || [];
      setRows(data);
      const d: Record<string, { message: string; finish: dayjs.Dayjs | null }> = {};
      data.forEach((r) => {
        d[r.key] = { message: r.state.message || "", finish: r.state.estimatedFinish ? dayjs(r.state.estimatedFinish) : null };
      });
      setDrafts(d);
    } catch {
      message.error("Không tải được trạng thái module");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const save = async (key: string, enabled: boolean) => {
    setSaving(key);
    try {
      const draft = drafts[key] || { message: "", finish: null };
      await axiosInstance.put("/settings/admin/modules", {
        key,
        enabled,
        message: draft.message || undefined,
        estimatedFinish: draft.finish ? draft.finish.toISOString() : undefined,
      });
      message.success(enabled ? "Đã bật bảo trì module" : "Đã tắt bảo trì module");
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, state: { ...r.state, enabled, message: draft.message, estimatedFinish: draft.finish?.toISOString() } } : r)));
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>Bảo trì theo module</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Tạm dừng từng chức năng (khách sẽ thấy màn bảo trì); nhân viên nhà hàng và admin vẫn thao tác được.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Làm mới</Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.key} style={{ border: "1px solid var(--border)", background: "var(--card)", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: r.state.enabled ? 12 : 0 }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{r.key}</div>
              </div>
              <Switch
                checked={r.state.enabled}
                loading={saving === r.key}
                onChange={(v) => save(r.key, v)}
                checkedChildren="Bảo trì"
                unCheckedChildren="Hoạt động"
              />
            </div>

            {r.state.enabled && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Input
                  placeholder="Thông báo hiển thị cho khách"
                  style={{ flex: 1, minWidth: 240 }}
                  value={drafts[r.key]?.message || ""}
                  onChange={(e) => setDrafts((p) => ({ ...p, [r.key]: { ...p[r.key], message: e.target.value } }))}
                />
                <DatePicker
                  showTime
                  placeholder="Dự kiến xong (tùy chọn)"
                  format="DD/MM/YYYY HH:mm"
                  value={drafts[r.key]?.finish || null}
                  disabledDate={(d) => !!d && d.isBefore(dayjs().startOf("day"))}
                  onChange={(v) => setDrafts((p) => ({ ...p, [r.key]: { ...p[r.key], finish: v } }))}
                />
                <Button type="primary" loading={saving === r.key} onClick={() => save(r.key, true)}>Lưu</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
