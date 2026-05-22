"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import KPICard from "@/components/dashboard/KPICard";
import OrdersBarChart from "@/components/dashboard/OrdersBarChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import {
  MOCK_ADMIN_ORDER_TREND,
  MOCK_ADMIN_REVENUE_TREND,
  MOCK_ADMIN_SUMMARY,
  MOCK_RECENT_TENANT_REQUESTS,
  MOCK_TOP_RESTAURANTS,
} from "@/lib/mock/dashboardMockData";
import { formatVND } from "@/lib/utils/currency";
import { useMemo, useState } from "react";

type FilterOption = "day" | "week" | "month" | "year";

const FILTER_LABELS: Record<FilterOption, string> = {
  day: "Hôm nay",
  week: "Tuần này",
  month: "Tháng này",
  year: "Năm nay",
};

const STATUS_MAP = {
  active: { label: "Hoạt động", bg: "var(--success-soft)", color: "var(--success)", border: "var(--success-border)" },
  inactive: { label: "Tạm ngưng", bg: "var(--warning-soft)", color: "#b45309", border: "var(--warning-border)" },
};

const REQUEST_STATUS_MAP = {
  pending: { label: "Chờ duyệt", bg: "var(--warning-soft)", color: "#b45309", border: "var(--warning-border)" },
  approved: { label: "Đã duyệt", bg: "var(--success-soft)", color: "var(--success)", border: "var(--success-border)" },
  rejected: { label: "Từ chối", bg: "var(--danger-soft)", color: "var(--danger)", border: "var(--danger-border)" },
};

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<FilterOption>("week");
  const summary = MOCK_ADMIN_SUMMARY;

  const scale = filter === "day" ? 0.14 : filter === "week" ? 1 : filter === "month" ? 4.3 : 52;
  const scaledSummary = useMemo(() => ({
    ...summary,
    totalRevenue: { ...summary.totalRevenue, total: Math.round(summary.totalRevenue.total * scale) },
    totalOrders: { ...summary.totalOrders, total: Math.round(summary.totalOrders.total * scale) },
    totalUsers: { ...summary.totalUsers, total: Math.round(summary.totalUsers.total * scale) },
  }), [filter]);

  const totalRevenue = MOCK_ADMIN_REVENUE_TREND.reduce((s, p) => s + p.value, 0);
  const totalOrders = MOCK_ADMIN_ORDER_TREND.reduce((s, p) => s + p.total, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="admin"
        userName="Super Admin"
        title="XFoodi Platform"
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="admin"
          userName="Super Admin"
          userEmail="admin@xfoodi.com"
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
          <div className="space-y-6">
            {/* Page title + filters */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                  Tổng quan nền tảng
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  XFoodi Platform · Cập nhật: {new Date().toLocaleString("vi-VN")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(Object.keys(FILTER_LABELS) as FilterOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFilter(opt)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                    style={{
                      background: filter === opt ? "var(--primary)" : "var(--card)",
                      color: filter === opt ? "#fff" : "var(--text)",
                      border: filter === opt ? "1px solid var(--primary)" : "1px solid var(--border)",
                    }}
                  >
                    {FILTER_LABELS[opt]}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="dashboard-animate-in dashboard-animate-in-delay-1 h-full">
                <KPICard
                  title="Tổng doanh thu"
                  value={formatVND(scaledSummary.totalRevenue.total)}
                  subtitle="Toàn nền tảng"
                  trend={{ value: summary.totalRevenue.changePercent, isPositive: summary.totalRevenue.changePercent >= 0 }}
                  iconBg="rgba(34, 197, 94, 0.1)"
                  iconColor="#22c55e"
                  accentClass="dashboard-kpi-card-green"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>

              <div className="dashboard-animate-in dashboard-animate-in-delay-2 h-full">
                <KPICard
                  title="Tổng đơn hàng"
                  value={scaledSummary.totalOrders.total.toLocaleString("vi-VN")}
                  subtitle="Toàn nền tảng"
                  trend={{ value: summary.totalOrders.changePercent, isPositive: true }}
                  iconBg="var(--primary-soft)"
                  iconColor="var(--primary)"
                  accentClass="dashboard-kpi-card-primary"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                />
              </div>

              <div className="dashboard-animate-in dashboard-animate-in-delay-3 h-full">
                <KPICard
                  title="Nhà hàng"
                  value={summary.totalRestaurants.total}
                  subtitle={`${summary.totalRestaurants.active} đang hoạt động`}
                  trend={{ value: summary.totalRestaurants.changePercent, isPositive: true }}
                  iconBg="rgba(59, 130, 246, 0.1)"
                  iconColor="#3b82f6"
                  accentClass="dashboard-kpi-card-blue"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              </div>

              <div className="dashboard-animate-in dashboard-animate-in-delay-4 h-full">
                <KPICard
                  title="Người dùng"
                  value={scaledSummary.totalUsers.total.toLocaleString("vi-VN")}
                  subtitle={`+${summary.totalUsers.newThisMonth} tháng này`}
                  trend={{ value: summary.totalUsers.changePercent, isPositive: true }}
                  iconBg="rgba(168, 85, 247, 0.1)"
                  iconColor="#a855f7"
                  accentClass="dashboard-kpi-card-purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
              </div>
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart
                data={MOCK_ADMIN_REVENUE_TREND}
                totalRevenue={totalRevenue}
                subtitle="7 ngày gần nhất · Toàn nền tảng"
                title="Doanh thu nền tảng"
              />
              <OrdersBarChart
                data={MOCK_ADMIN_ORDER_TREND}
                totalOrders={totalOrders}
                subtitle="7 ngày gần nhất · Toàn nền tảng"
                title="Đơn hàng nền tảng"
              />
            </section>

            {/* Bottom section: Top Restaurants + Pending Requests */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Restaurants */}
              <div className="dashboard-data-card">
                <div className="dashboard-data-card-header">
                  <h3 className="dashboard-data-card-title">Nhà hàng doanh thu cao nhất</h3>
                  <span className="dashboard-data-card-badge">Top {MOCK_TOP_RESTAURANTS.length}</span>
                </div>

                <div className="space-y-2">
                  {MOCK_TOP_RESTAURANTS.map((r, index) => {
                    const st = STATUS_MAP[r.status];
                    const rank = index + 1;
                    const rankClass = rank === 1
                      ? "dashboard-rank-1"
                      : rank === 2
                      ? "dashboard-rank-2"
                      : rank === 3
                      ? "dashboard-rank-3"
                      : "dashboard-rank-default";
                    return (
                      <div key={r.id} className="dashboard-data-card-item">
                        <div className="flex items-center gap-3">
                          <div className={`dashboard-rank-badge ${rankClass}`}>{rank}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                                {r.name}
                              </p>
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                              >
                                {st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              <span style={{ color: "var(--text-muted)" }}>
                                {r.orders.toLocaleString("vi-VN")} đơn
                              </span>
                              <span style={{ color: "var(--border)" }}>|</span>
                              <span style={{ color: "#faad14" }}>★ {r.rating}</span>
                              <span style={{ color: "var(--border)" }}>|</span>
                              <span className="font-semibold" style={{ color: "var(--primary)" }}>
                                {formatVND(r.revenue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <a
                    href="/admin/restaurants"
                    className="text-xs font-medium hover:underline transition-colors"
                    style={{ color: "var(--primary)" }}
                  >
                    Xem tất cả nhà hàng →
                  </a>
                </div>
              </div>

              {/* Pending Tenant Requests */}
              <div className="dashboard-data-card">
                <div className="dashboard-data-card-header">
                  <h3 className="dashboard-data-card-title">Yêu cầu đăng ký nhà hàng</h3>
                  <span
                    className="dashboard-data-card-badge"
                    style={{ background: "var(--warning-soft)", color: "#b45309", border: "1px solid var(--warning-border)" }}
                  >
                    {MOCK_RECENT_TENANT_REQUESTS.filter((r) => r.status === "pending").length} chờ duyệt
                  </span>
                </div>

                <div className="space-y-2">
                  {MOCK_RECENT_TENANT_REQUESTS.map((req) => {
                    const st = REQUEST_STATUS_MAP[req.status];
                    const now = new Date();
                    const created = new Date(req.requestedAt);
                    const diffMs = now.getTime() - created.getTime();
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffHours / 24);
                    const timeAgo = diffHours < 24 ? `${diffHours} giờ trước` : `${diffDays} ngày trước`;

                    return (
                      <div key={req.id} className="dashboard-data-card-item">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                          >
                            {req.restaurantName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                                {req.restaurantName}
                              </p>
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                              >
                                {st.label}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {req.ownerName} · {req.phone}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>{timeAgo}</p>
                          </div>
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-2 mt-2">
                            <button
                              className="flex-1 py-1 text-xs font-semibold rounded-lg transition-colors"
                              style={{
                                background: "var(--success-soft)",
                                color: "var(--success)",
                                border: "1px solid var(--success-border)",
                              }}
                            >
                              Duyệt
                            </button>
                            <button
                              className="flex-1 py-1 text-xs font-semibold rounded-lg transition-colors"
                              style={{
                                background: "var(--danger-soft)",
                                color: "var(--danger)",
                                border: "1px solid var(--danger-border)",
                              }}
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <a
                    href="/admin/tenant-requests"
                    className="text-xs font-medium hover:underline transition-colors"
                    style={{ color: "var(--primary)" }}
                  >
                    Xem tất cả yêu cầu →
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
