"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { io } from "socket.io-client";
import { App, Switch, Input, DatePicker, Button, Tag, InputNumber } from "antd";
import { ReloadOutlined, ThunderboltOutlined, ExperimentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface ModuleRow {
  key: string;
  label: string;
  state: { enabled: boolean; message?: string; estimatedFinish?: string; auto?: boolean; tripAt?: string };
}
interface CbConfig { threshold: number; windowSec: number; cooldownSec: number; }
interface LogEntry { time: string; text: string; kind: "trip" | "recover"; }

export default function AdminModuleMaintenancePage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cb, setCb] = useState<CbConfig | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { message: string; finish: dayjs.Dayjs | null; errCount: number }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        axiosInstance.get("/settings/admin/modules"),
        axiosInstance.get("/settings/admin/modules/cb-config"),
      ]);
      const data: ModuleRow[] = mRes.data?.data || [];
      setRows(data);
      setCb(cRes.data?.data || null);
      setDrafts((prev) => {
        const d = { ...prev };
        data.forEach((r) => {
          if (!d[r.key]) d[r.key] = { message: r.state.message || "", finish: r.state.estimatedFinish ? dayjs(r.state.estimatedFinish) : null, errCount: 5 };
        });
        return d;
      });
    } catch {
      message.error("Không tải được trạng thái module");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Socket real-time: nghe sự kiện circuit breaker auto trip/recover
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["polling"], withCredentials: true });
    socket.on("MODULE_AUTO_MAINTENANCE", (data: any) => {
      const now = dayjs().format("HH:mm:ss");
      setLog((prev) => [
        { time: now, kind: (data.tripped ? "trip" : "recover") as LogEntry["kind"], text: data.tripped ? `⚡ Tự BẬT bảo trì "${data.label || data.module}" (lỗi vượt ngưỡng)` : `✅ Tự KHÔI PHỤC "${data.label || data.module}" (half-open)` },
        ...prev,
      ].slice(0, 20));
      fetchData();
    });
    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToggle = async (key: string, enabled: boolean) => {
    setBusy(key);
    try {
      const draft = drafts[key];
      await axiosInstance.put("/settings/admin/modules", { key, enabled, message: draft?.message || undefined, estimatedFinish: draft?.finish ? draft.finish.toISOString() : undefined });
      message.success(enabled ? "Đã bật bảo trì" : "Đã tắt bảo trì");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi");
    } finally { setBusy(null); }
  };

  const simulate = async (key: string, action: "errors" | "recover", count?: number) => {
    setBusy(key);
    try {
      const res = await axiosInstance.post("/settings/admin/modules/simulate", { key, action, count });
      message.success(res.data?.message || "OK");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi mô phỏng");
    } finally { setBusy(null); }
  };

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>Bảo trì theo module + Test Panel</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Toggle thủ công hoặc mô phỏng lỗi để xem circuit breaker tự bật/tự khôi phục.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Làm mới</Button>
      </div>

      {cb && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
          <ExperimentOutlined /> Circuit breaker: tự bật khi <b style={{ color: "var(--text)" }}>{cb.threshold}</b> lỗi 500 trong <b style={{ color: "var(--text)" }}>{cb.windowSec}s</b>, tự khôi phục sau <b style={{ color: "var(--text)" }}>{cb.cooldownSec}s</b> (half-open).
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        {/* Danh sách module */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => (
            <div key={r.key} style={{ border: "1px solid var(--border)", background: "var(--card)", borderRadius: 16, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                    {r.label}
                    {r.state.enabled && (r.state.auto
                      ? <Tag color="volcano">Auto (breaker)</Tag>
                      : <Tag color="orange">Thủ công</Tag>)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{r.key}{r.state.tripAt ? ` · trip ${dayjs(r.state.tripAt).format("HH:mm:ss")}` : ""}</div>
                </div>
                <Switch checked={r.state.enabled} loading={busy === r.key} onChange={(v) => saveToggle(r.key, v)} checkedChildren="Bảo trì" unCheckedChildren="Hoạt động" />
              </div>

              {r.state.enabled && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <Input placeholder="Thông báo cho khách" style={{ flex: 1, minWidth: 200 }} value={drafts[r.key]?.message || ""} onChange={(e) => setDrafts((p) => ({ ...p, [r.key]: { ...p[r.key], message: e.target.value } }))} />
                  <DatePicker showTime placeholder="Dự kiến xong" format="DD/MM/YYYY HH:mm" value={drafts[r.key]?.finish || null} disabledDate={(d) => !!d && d.isBefore(dayjs().startOf("day"))} onChange={(v) => setDrafts((p) => ({ ...p, [r.key]: { ...p[r.key], finish: v } }))} />
                  <Button loading={busy === r.key} onClick={() => saveToggle(r.key, true)}>Lưu</Button>
                </div>
              )}

              {/* Test controls */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Mô phỏng:</span>
                <InputNumber size="small" min={1} max={20} value={drafts[r.key]?.errCount ?? 5} onChange={(v) => setDrafts((p) => ({ ...p, [r.key]: { ...p[r.key], errCount: Number(v) || 5 } }))} style={{ width: 64 }} />
                <Button size="small" danger icon={<ThunderboltOutlined />} loading={busy === r.key} onClick={() => simulate(r.key, "errors", drafts[r.key]?.errCount ?? 5)}>Bơm lỗi 500</Button>
                {r.state.auto && r.state.enabled && (
                  <Button size="small" type="primary" ghost loading={busy === r.key} onClick={() => simulate(r.key, "recover")}>Khôi phục ngay</Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Log real-time */}
        <div style={{ border: "1px solid var(--border)", background: "var(--card)", borderRadius: 16, padding: 16, position: "sticky", top: 16 }}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Nhật ký sự kiện (real-time)</div>
          {log.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Chưa có sự kiện. Bấm "Bơm lỗi 500" để thấy breaker tự bật.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 8, background: "var(--bg-base)", color: l.kind === "trip" ? "#dc2626" : "#16a34a" }}>
                  <span style={{ color: "var(--text-muted)", marginRight: 6 }}>{l.time}</span>{l.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
