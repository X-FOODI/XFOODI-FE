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
import {
  dashboardService,
  RestaurantDashboardSummary,
  TrendPoint,
  OrderTrendPoint,
  TopDish,
  FeedbacksResponse
} from "@/lib/services/dashboardService";
import { formatVND } from "@/lib/utils/currency";
import { useAuth } from "@/lib/contexts/AuthContext";
import axiosInstance from "@/lib/services/axiosInstance";
import { useTenant } from "@/lib/contexts/TenantContext";
import { DollarSign, ClipboardList, Calendar, Users } from "lucide-react";

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

  // States for API statistics
  const [summaryData, setSummaryData] = useState<RestaurantDashboardSummary | null>(null);
  const [trends, setTrends] = useState<{ revenueTrend: TrendPoint[]; orderTrend: OrderTrendPoint[] } | null>(null);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbacksResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isAuthReady || tenantLoading || !user) return;
    setLoadingStats(true);
    Promise.all([
      dashboardService.getRestaurantSummary(filter),
      dashboardService.getRestaurantTrends(filter),
      dashboardService.getRestaurantTopDishes(),
      dashboardService.getRestaurantLatestFeedbacks()
    ]).then(([sData, tData, dData, fData]) => {
      setSummaryData(sData);
      setTrends(tData);
      setTopDishes(dData);
      setFeedbackData(fData);
    }).catch(err => {
      console.error("Failed to load restaurant dashboard stats:", err);
    }).finally(() => {
      setLoadingStats(false);
    });
  }, [filter, isAuthReady, tenantLoading, user]);

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

  // Combine real data and mock data as fallback
  const finalSummary = summaryData || scaledSummary;
  const finalRevenueTrend = trends?.revenueTrend || MOCK_RESTAURANT_REVENUE_TREND;
  const finalOrderTrend = trends?.orderTrend || MOCK_RESTAURANT_ORDER_TREND;
  const finalTopDishes = topDishes.length > 0 ? topDishes : MOCK_TOP_DISHES;
  const finalFeedbacks = feedbackData || MOCK_RESTAURANT_FEEDBACKS;

  const totalRevenue = finalRevenueTrend.reduce((sum, p) => sum + p.value, 0);
  const totalOrders = finalOrderTrend.reduce((sum, p) => sum + p.total, 0);

  // ── Auth guard: role-based only ────────────────────────────────────────────
  // Owner/Staff are allowed on any subdomain (admin.localhost or demo.localhost).
  // No cross-subdomain redirect needed for local development.
  useEffect(() => {
    if (!isAuthReady || tenantLoading) return;

    if (!user) {
      router.replace("/login?redirect=/restaurant/dashboard");
      return;
    }

    const roles: string[] = user.roles || (user.role ? [user.role] : []);
    const isRestaurantRole = roles.includes("Owner") || roles.includes("Staff");
    const isSystemAdmin = roles.includes("Admin") || roles.includes("SuperAdmin") || roles.includes("System Admin");

    if (!isRestaurantRole && !isSystemAdmin) {
      // Not a restaurant user — redirect to registration
      router.replace("/register-restaurant");
      return;
    }

    // Check tenant access restriction:
    // If user is Owner, their restaurantId must match current tenant ID (unless they are platform Admin/SuperAdmin)
    if (!isSystemAdmin) {
      if (!tenant) {
        // Enforce subdomain access! If user is Owner, redirect to their subdomain dashboard.
        if (user.restaurantSlug && typeof window !== "undefined") {
          const host = window.location.host;
          const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;
          const protocol = window.location.protocol;
          const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
          const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
          const targetTenantSubdomain = isLocalhost 
            ? `${user.restaurantSlug}.localhost` 
            : `${user.restaurantSlug}.${BASE_DOMAIN}`;
          
          if (hostWithoutPort !== targetTenantSubdomain) {
            const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
            window.location.href = `${protocol}//${targetTenantSubdomain}${port}/restaurant/dashboard`;
            return;
          }
        }
        // Tạm thời comment lại để có thể xem giao diện dashboard
        // setUnauthorized(true);
        // return;
      }

      if (tenant && user.restaurantId && user.restaurantId !== tenant.id) {
        // Tạm thời comment lại để xem giao diện
        // setUnauthorized(true);
        // return;
      }
    }
    axiosInstance
      .get<{ success: boolean; data: RestaurantInfo }>("/restaurants/me")
      .then((res: { data: { success: boolean; data: RestaurantInfo } }) =>
        setRestaurantInfo(res.data.data)
      )
      .catch(() => {
        // API not available or returned error — show dashboard anyway with fallback data
      });
  }, [isAuthReady, user, router, tenant, tenantLoading]);

  if (!isAuthReady || (!user && !unauthorized)) {
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
              Tài khoản của bạn không có quyền quản lý nhà hàng.
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


  // Check if user is staff
  const isOwner = user?.roles?.includes("Owner") || user?.role === "Owner";
  const isAdminUser = user?.roles?.some(r => ["Admin", "SuperAdmin", "System Admin"].includes(r)) || ["Admin", "SuperAdmin", "System Admin"].includes(user?.role || "");
  const isStaff = !isOwner && !isAdminUser;
  const staffRole = user?.role || (user?.roles && user?.roles[0]) || "";
  const staffPosition = (user as any)?.position || "";

  const isKitchen = /kitchen|bếp|chef/i.test(staffRole) || /kitchen|bếp|chef/i.test(staffPosition);
  const isWaiter = /waiter|phục vụ/i.test(staffRole) || /waiter|phục vụ/i.test(staffPosition);
  const isCashier = /cashier|thu ngân/i.test(staffRole) || /cashier|thu ngân/i.test(staffPosition);

  if (isStaff) {

    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <DashboardHeader
          role="restaurant"
          restaurantName={tenant?.name ?? "Cửa hàng"}
          userName={user?.fullName ?? user?.name ?? ""}
        />

        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar
            role="restaurant"
            restaurantName={tenant?.name ?? "Cửa hàng"}
            userName={user?.fullName ?? user?.name ?? ""}
            userEmail={user?.email ?? ""}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Welcome Banner */}
              <div className="p-6 sm:p-8 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6" 
                   style={{ 
                     background: "linear-gradient(135deg, rgba(255, 90, 44, 0.1) 0%, rgba(255, 90, 44, 0.02) 100%)", 
                     borderColor: "var(--primary-border)" 
                   }}>
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>
                    Xin chào, {user?.fullName || user?.name || "Nhân viên"}! 👋
                  </h1>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Chúc bạn có một ngày làm việc tuyệt vời. Bạn đang đăng nhập với vai trò:{" "}
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>
                      {isKitchen ? "Nhân viên Bếp" : isWaiter ? "Nhân viên Phục vụ" : isCashier ? "Thu ngân" : staffRole || "Nhân viên"}
                    </span>
                  </p>
                </div>
                <div className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider" 
                     style={{ 
                       background: "var(--primary)", 
                       color: "#fff" 
                     }}>
                  Ca trực hoạt động
                </div>
              </div>

              {/* Role specific quick access cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {isKitchen && (
                  <div className="p-6 rounded-2xl border transition-all hover:scale-[1.02] space-y-4" 
                       style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255, 90, 44, 0.1)", color: "var(--primary)" }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Màn hình Bếp (KDS)</h3>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Theo dõi các món ăn cần chế biến, cập nhật trạng thái món phục vụ khách hàng.</p>
                    </div>
                    <button
                      onClick={() => router.push("/restaurant/live-orders")}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                      style={{ background: "var(--primary)" }}
                    >
                      Vào màn hình Bếp
                    </button>
                  </div>
                )}

                {isWaiter && (
                  <>
                    <div className="p-6 rounded-2xl border transition-all hover:scale-[1.02] space-y-4" 
                         style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Đặt bàn</h3>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Theo dõi danh sách khách đặt trước, check-in khi khách đến nhà hàng.</p>
                      </div>
                      <button
                        onClick={() => router.push("/restaurant/reservations")}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ background: "var(--primary)" }}
                      >
                        Xem danh sách đặt bàn
                      </button>
                    </div>

                    <div className="p-6 rounded-2xl border transition-all hover:scale-[1.02] space-y-4" 
                         style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Sơ đồ bàn ăn</h3>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Xem vị trí và trạng thái bàn (Đang trống, Đang ăn, Đang dọn dẹp).</p>
                      </div>
                      <button
                        onClick={() => router.push("/restaurant/tables")}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ background: "var(--primary)" }}
                      >
                        Xem sơ đồ bàn
                      </button>
                    </div>
                  </>
                )}

                {isCashier && (
                  <>
                    <div className="p-6 rounded-2xl border transition-all hover:scale-[1.02] space-y-4" 
                         style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Hóa đơn & Đơn hàng</h3>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Xem lịch sử đơn, in hóa đơn và kiểm soát các giao dịch gọi món.</p>
                      </div>
                      <button
                        onClick={() => router.push("/restaurant/orders")}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ background: "var(--primary)" }}
                      >
                        Xem lịch sử đơn
                      </button>
                    </div>

                    <div className="p-6 rounded-2xl border transition-all hover:scale-[1.02] space-y-4" 
                         style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Thanh toán</h3>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Quản lý cổng thanh toán, đối soát doanh thu ca trực nhanh chóng.</p>
                      </div>
                      <button
                        onClick={() => router.push("/restaurant/payments")}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ background: "var(--primary)" }}
                      >
                        Quản lý thanh toán
                      </button>
                    </div>
                  </>
                )}

                {!isKitchen && !isWaiter && !isCashier && (
                  <div className="p-6 rounded-2xl border transition-all hover:scale-[1.02] space-y-4 col-span-2" 
                       style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Trang chủ nhân viên</h3>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Vui lòng sử dụng thanh menu bên trái để truy cập các tính năng phù hợp với vị trí của bạn.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
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
                  value={formatVND(finalSummary.revenue.total)}
                  subtitle={`${finalSummary.fromDate?.slice(0, 10)} - ${finalSummary.toDate?.slice(0, 10)}`}
                  trend={{ value: finalSummary.revenue.changePercent, isPositive: finalSummary.revenue.changePercent >= 0 }}
                  iconBg="rgba(34, 197, 94, 0.1)"
                  iconColor="#22c55e"
                  accentClass="dashboard-kpi-card-green"
                  icon={
                    <DollarSign size={20} />
                  }
                />
              </div>

              <div className="dashboard-animate-in dashboard-animate-in-delay-2 h-full">
                <KPICard
                  title={`Đơn hàng ${FILTER_LABELS[filterKey].toLowerCase()}`}
                  value={finalSummary.orders.total}
                  subtitle={`${finalSummary.orders.completed} hoàn thành · ${finalSummary.orders.liveProcessing} đang xử lý`}
                  iconBg="var(--primary-soft)"
                  iconColor="var(--primary)"
                  accentClass="dashboard-kpi-card-primary"
                  icon={
                    <ClipboardList size={20} />
                  }
                />
              </div>

              <div className="dashboard-animate-in dashboard-animate-in-delay-3 h-full">
                <KPICard
                  title={`Đặt bàn ${FILTER_LABELS[filterKey].toLowerCase()}`}
                  value={finalSummary.reservations.total}
                  subtitle={`${finalSummary.reservations.pending} chờ xác nhận`}
                  iconBg="rgba(59, 130, 246, 0.1)"
                  iconColor="#3b82f6"
                  accentClass="dashboard-kpi-card-blue"
                  icon={
                    <Calendar size={20} />
                  }
                />
              </div>

              <div className="dashboard-animate-in dashboard-animate-in-delay-4 h-full">
                <KPICard
                  title={`Khách mới ${FILTER_LABELS[filterKey].toLowerCase()}`}
                  value={finalSummary.newCustomers.total}
                  subtitle={`${finalSummary.fromDate?.slice(0, 10)} - ${finalSummary.toDate?.slice(0, 10)}`}
                  trend={{ value: finalSummary.newCustomers.changePercent, isPositive: finalSummary.newCustomers.changePercent >= 0 }}
                  iconBg="rgba(168, 85, 247, 0.1)"
                  iconColor="#a855f7"
                  accentClass="dashboard-kpi-card-purple"
                  icon={
                    <Users size={20} />
                  }
                />
              </div>
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart
                data={finalRevenueTrend}
                totalRevenue={totalRevenue}
                subtitle="7 ngày gần nhất"
                title="Doanh thu"
              />
              <OrdersBarChart
                data={finalOrderTrend}
                totalOrders={totalOrders}
                subtitle="7 ngày gần nhất"
                title="Đơn hàng"
              />
            </section>

            {/* Bottom cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LatestFeedbacksCard
                items={finalFeedbacks.items}
                averageRating={finalFeedbacks.averageRating}
                totalCount={finalFeedbacks.totalCount}
                viewAllHref="/restaurant/feedbacks"
              />
              <BestSellingDishesCard dishes={finalTopDishes} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
