"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BestSellingDishesCard from "@/components/dashboard/BestSellingDishesCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import KPICard from "@/components/dashboard/KPICard";
import LatestFeedbacksCard from "@/components/dashboard/LatestFeedbacksCard";
import OrdersBarChart from "@/components/dashboard/OrdersBarChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import {
  MOCK_RESTAURANT_FEEDBACKS,
  MOCK_RESTAURANT_ORDER_TREND,
  MOCK_RESTAURANT_REVENUE_TREND,
  MOCK_RESTAURANT_SUMMARY,
  MOCK_TOP_DISHES,
} from "@/lib/mock/dashboardMockData";
import { formatVND } from "@/lib/utils/currency";
import { useAuth } from "@/lib/contexts/AuthContext";
import axiosInstance from "@/lib/services/axiosInstance";
import { useTenant } from "@/lib/contexts/TenantContext";

type FilterOption = "day" | "week" | "month" | "year";

const FILTER_LABELS: Record<FilterOption, string> = {
  day: "Hôm nay",
  week: "Tuần này",
  month: "Tháng này",
  year: "Năm nay",
};

interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  owner: {
    id: string;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}

export default function RestaurantDashboardPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterOption>("week");
  const [unauthorized, setUnauthorized] = useState(false);
  const summary = MOCK_RESTAURANT_SUMMARY;

  // Dữ liệu thật: thông tin nhà hàng
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);

  // Scale mock data (hooks phải luôn ở trên early return)
  const filterKey = filter as FilterOption; // explicit typed alias — fix implicit-any index
  const scale = filterKey === "day" ? 0.14 : filterKey === "week" ? 1 : filterKey === "month" ? 4.3 : 52;
  const scaledSummary = useMemo(() => ({
    ...summary,
    revenue: { ...summary.revenue, total: Math.round(summary.revenue.total * scale) },
    orders: { ...summary.orders, total: Math.round(summary.orders.total * scale), completed: Math.round(summary.orders.completed * scale) },
    reservations: { ...summary.reservations, total: Math.round(summary.reservations.total * scale) },
    newCustomers: { ...summary.newCustomers, total: Math.round(summary.newCustomers.total * scale) },
  }), [filter]);

  const totalRevenue = MOCK_RESTAURANT_REVENUE_TREND.reduce((sum, p) => sum + p.value, 0);
  const totalOrders = MOCK_RESTAURANT_ORDER_TREND.reduce((sum, p) => sum + p.total, 0);

  // Auth + role guard
  useEffect(() => {
    if (!isAuthReady || tenantLoading) return;
    if (!user) {
      router.replace("/login?redirect=/restaurant/dashboard");
      return;
    }
    const roles: string[] = user.roles || (user.role ? [user.role] : []);
    if (!roles.includes("Owner") && !roles.includes("Admin") && !roles.includes("SuperAdmin")) {
      router.replace("/register-restaurant");
      return;
    }

    // Check tenant access restriction:
    // If user is Owner, their restaurantId must match current tenant ID (unless they are platform Admin/SuperAdmin)
    const isSystemAdmin = roles.includes("Admin") || roles.includes("SuperAdmin");
    if (!isSystemAdmin) {
      if (!tenant) {
        // Enforce subdomain access! If user is Owner, redirect to their subdomain dashboard.
        if (user.restaurantSlug && typeof window !== "undefined") {
          const host = window.location.host;
          const protocol = window.location.protocol;
          const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
          const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
          const targetTenantSubdomain = isLocalhost 
            ? `${user.restaurantSlug}.localhost` 
            : `${user.restaurantSlug}.${BASE_DOMAIN}`;
          
          const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
          window.location.href = `${protocol}//${targetTenantSubdomain}${port}/restaurant/dashboard`;
          return;
        }
        setUnauthorized(true);
        return;
      }

      if (user.restaurantId !== tenant.id) {
        setUnauthorized(true);
        return;
      }
    }

    // Fetch thông tin nhà hàng thật
    axiosInstance
      .get<{ success: boolean; data: RestaurantInfo }>("/restaurants/me")
      .then((res: { data: { success: boolean; data: RestaurantInfo } }) =>
        setRestaurantInfo(res.data.data)
      )
      .catch((err: any) => {
        // Trực quan hóa lỗi: nếu backend trả về 403 (không đúng tenant hoặc không có quyền),
        // hiển thị giao diện Access Denied ngay tại Client.
        if (err.response?.status === 403) {
          setUnauthorized(true);
        }
      });
  }, [isAuthReady, user, router, tenant, tenantLoading]);

  if (!isAuthReady || tenantLoading || (!user && !unauthorized)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Truy cập bị từ chối</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Tài khoản của bạn không được phép quản lý nhà hàng này. Mỗi tài khoản chủ cửa hàng chỉ có thể truy cập vào cửa hàng của chính mình.
            </p>
          </div>
          <button
            onClick={() => router.replace("/")}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: "var(--primary)" }}
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="restaurant"
        restaurantName={restaurantInfo?.name ?? ""}
        userName={restaurantInfo?.owner?.fullName ?? user?.fullName ?? user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={restaurantInfo?.name ?? user?.name ?? "đang tải..."}
          userName={restaurantInfo?.owner?.fullName ?? user?.fullName ?? user?.name ?? ""}
          userEmail={restaurantInfo?.owner?.email ?? user?.email ?? ""}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
          <div className="space-y-6">
            {/* Page title + filters */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                  Tổng quan nhà hàng
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {restaurantInfo?.name ?? ""} · Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
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
                  title={`Doanh thu ${FILTER_LABELS[filter as FilterOption].toLowerCase()}`}
                  value={formatVND(scaledSummary.revenue.total)}
                  subtitle={`${summary.fromDate?.slice(0, 10)} - ${summary.toDate?.slice(0, 10)}`}
                  trend={{ value: summary.revenue.changePercent, isPositive: summary.revenue.changePercent >= 0 }}
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
                  title={`Đơn hàng ${FILTER_LABELS[filterKey].toLowerCase()}`}
                  value={scaledSummary.orders.total}
                  subtitle={`${scaledSummary.orders.completed} hoàn thành · ${summary.orders.liveProcessing} đang xử lý`}
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
                  title={`Đặt bàn ${FILTER_LABELS[filterKey].toLowerCase()}`}
                  value={scaledSummary.reservations.total}
                  subtitle={`${summary.reservations.pending} chờ xác nhận`}
                  iconBg="rgba(59, 130, 246, 0.1)"
                  iconColor="#3b82f6"
                  accentClass="dashboard-kpi-card-blue"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>

              <div className="dashboard-animate-in dashboard-animate-in-delay-4 h-full">
                <KPICard
                  title={`Khách mới ${FILTER_LABELS[filterKey].toLowerCase()}`}
                  value={scaledSummary.newCustomers.total}
                  subtitle={`${summary.fromDate?.slice(0, 10)} - ${summary.toDate?.slice(0, 10)}`}
                  trend={{ value: summary.newCustomers.changePercent, isPositive: summary.newCustomers.changePercent >= 0 }}
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
                data={MOCK_RESTAURANT_REVENUE_TREND}
                totalRevenue={totalRevenue}
                subtitle="7 ngày gần nhất"
                title="Doanh thu"
              />
              <OrdersBarChart
                data={MOCK_RESTAURANT_ORDER_TREND}
                totalOrders={totalOrders}
                subtitle="7 ngày gần nhất"
                title="Đơn hàng"
              />
            </section>

            {/* Bottom cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LatestFeedbacksCard
                items={MOCK_RESTAURANT_FEEDBACKS.items}
                averageRating={MOCK_RESTAURANT_FEEDBACKS.averageRating}
                totalCount={MOCK_RESTAURANT_FEEDBACKS.totalCount}
                viewAllHref="/restaurant/feedbacks"
              />
              <BestSellingDishesCard dishes={MOCK_TOP_DISHES} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
