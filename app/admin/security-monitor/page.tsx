"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/services/axiosInstance";
import { Table, Card, Statistic, Row, Col, Progress, Tag, Button } from "antd";
import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Overview {
  failedLogins24h: number;
  failedLogins7d: number;
  totalUsers: number;
  twoFactorEnabled: number;
  twoFactorPercent: number;
  recentFailed: {
    id: string;
    actorEmail: string | null;
    ipAddress: string | null;
    reason: string | null;
    createdAt: string;
  }[];
}

export default function AdminSecurityMonitorPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("/admin/security/overview")
      .then((res) => setData(res.data?.data || null))
      .catch((err) => console.error("Lỗi tải tổng quan bảo mật:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnsType<Overview["recentFailed"][number]> = [
    { title: "Thời gian", dataIndex: "createdAt", render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm:ss") },
    { title: "Email", dataIndex: "actorEmail", render: (v: string) => v || "—" },
    { title: "IP", dataIndex: "ipAddress", render: (v: string) => v || "—" },
    { title: "Lý do", dataIndex: "reason", render: (v: string) => <Tag color="red">{v || "—"}</Tag> },
  ];

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>Giám sát bảo mật</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Theo dõi đăng nhập thất bại và mức độ áp dụng 2FA.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Làm mới</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đăng nhập thất bại (24h)"
              value={data?.failedLogins24h ?? 0}
              prefix={<ShieldAlert size={18} style={{ verticalAlign: "-3px", color: "#f5222d" }} />}
              valueStyle={{ color: (data?.failedLogins24h ?? 0) > 0 ? "#f5222d" : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Đăng nhập thất bại (7 ngày)" value={data?.failedLogins7d ?? 0} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Progress type="circle" size={72} percent={data?.twoFactorPercent ?? 0} strokeColor="#22c55e" />
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Áp dụng 2FA</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  <ShieldCheck size={16} style={{ verticalAlign: "-3px", color: "#22c55e" }} /> {data?.twoFactorEnabled ?? 0}/{data?.totalUsers ?? 0}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Đăng nhập thất bại gần đây" size="small">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.recentFailed || []}
          loading={loading}
          size="small"
          pagination={false}
          locale={{ emptyText: "Chưa ghi nhận đăng nhập thất bại" }}
        />
      </Card>
    </div>
  );
}
