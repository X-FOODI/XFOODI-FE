"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star as StarIcon } from "@mui/icons-material";
import KPICard from "@/components/dashboard/KPICard";
import OrdersBarChart from "@/components/dashboard/OrdersBarChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import {
  MOCK_ADMIN_ORDER_TREND,
  MOCK_ADMIN_REVENUE_TREND,
  MOCK_ADMIN_SUMMARY,
  MOCK_TOP_RESTAURANTS,
} from "@/lib/mock/dashboardMockData";
import { formatVND } from "@/lib/utils/currency";
import restaurantApplicationService, {
  RestaurantApplication,
} from "@/lib/services/restaurantApplicationService";

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

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING: { label: "Chờ duyệt", bg: "var(--warning-soft)", color: "#b45309", border: "var(--warning-border)" },
  APPROVED: { label: "Đã duyệt", bg: "var(--success-soft)", color: "var(--success)", border: "var(--success-border)" },
  REJECTED: { label: "Từ chối", bg: "var(--danger-soft)", color: "var(--danger)", border: "var(--danger-border)" },
};

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<FilterOption>("week");
  const summary = MOCK_ADMIN_SUMMARY;

  // Real data: danh sách đơn đăng ký mới nhất
  const [recentApps, setRecentApps] = useState<RestaurantApplication[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    restaurantApplicationService
      .list({ status: undefined, page: 1, limit: 5 })
      .then((data) => {
        setRecentApps(data.items);
        setPendingCount(data.items.filter((a) => a.status === "PENDING").length);
      })
      .catch(console.error)
      .finally(() => setAppsLoading(false));
  }, []);

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
    <div className="p-4 sm:p-6 lg:p-8">
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
                              <span style={{ color: "#faad14", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <StarIcon sx={{ fontSize: 14 }} /> {r.rating}
                              </span>
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

              {/* Pending Restaurant Applications — Dữ liệu thật */}
              <div className="dashboard-data-card">
                <div className="dashboard-data-card-header">
                  <h3 className="dashboard-data-card-title">Yêu cầu đăng ký nhà hàng</h3>
                  <span
                    className="dashboard-data-card-badge"
                    style={{ background: "var(--warning-soft)", color: "#b45309", border: "1px solid var(--warning-border)" }}
                  >
                    {pendingCount} chờ duyệt
                  </span>
                </div>

                {appsLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                  </div>
                ) : recentApps.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>Chưa có đơn nào</p>
                ) : (
                  <div className="space-y-2">
                    {recentApps.map((app) => {
                      const st = STATUS_BADGE[app.status] ?? STATUS_BADGE.PENDING;
                      const now = new Date();
                      const created = new Date(app.createdAt);
                      const diffMs = now.getTime() - created.getTime();
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffHours / 24);
                      const timeAgo = diffHours < 1
                        ? "Vừa xong"
                        : diffHours < 24
                        ? `${diffHours} giờ trước`
                        : `${diffDays} ngày trước`;

                      return (
                        <Link
                          key={app.id}
                          href={`/admin/applications/${app.id}`}
                          className="dashboard-data-card-item block hover:bg-[var(--surface)] transition-colors rounded-xl"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                              style={{ background: "var(--primary)" }}
                            >
                              {app.restaurantName?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                                  {app.restaurantName}
                                </p>
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                                >
                                  {st.label}
                                </span>
                              </div>
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {app.user?.fullName ?? "—"} · {app.phone}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>{timeAgo}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <Link
                    href="/admin/applications"
                    className="text-xs font-medium hover:underline transition-colors"
                    style={{ color: "var(--primary)" }}
                  >
                    Xem tất cả yêu cầu →
                  </Link>
                </div>
              </div>
            </section>
      </div>
    </div>
  );
}
