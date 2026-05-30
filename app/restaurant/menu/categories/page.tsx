"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/lib/contexts/ToastContext";
import categoryService from "@/lib/services/categoryService";
import type { Category } from "@/lib/services/categoryService";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import CategoryTable from "@/components/restaurant/menu/CategoryTable";
import CategoryModal from "@/components/restaurant/menu/CategoryModal";
import axiosInstance from "@/lib/services/axiosInstance";

interface RestaurantInfo {
  id: string;
  name: string;
  owner: { id: string; fullName: string | null; email: string | null; avatarUrl: string | null };
}

export default function CategoriesPage() {
  const { user, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // ── Restaurant context ─────────────────────────────────────────────────────
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);

  // ── Categories state ───────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ── Filters / pagination ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce ref for search
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace("/login-email?redirect=/restaurant/menu/categories");
      return;
    }
    const roles: string[] = user.roles || (user.role ? [user.role] : []);
    if (!roles.includes("Owner") && !roles.includes("Admin") && !roles.includes("SuperAdmin")) {
      router.replace("/register-restaurant");
      return;
    }
    // Fetch restaurant info
    axiosInstance
      .get<{ success: boolean; data: RestaurantInfo }>("/restaurants/me")
      .then((res) => setRestaurantInfo(res.data.data))
      .catch(console.error);
  }, [isAuthReady, user, router]);

  // ── Fetch categories ───────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    if (!restaurantInfo?.id) return;
    setIsLoading(true);
    try {
      const result = await categoryService.list({
        page,
        limit: LIMIT,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        restaurantId: restaurantInfo.id,
      });
      setCategories(result.data);
      setTotal(result.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể tải danh mục";
      showToast("error", "Lỗi tải dữ liệu", msg);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantInfo?.id, page, searchQuery, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {}, 300); // trigger via dependency chain
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await categoryService.update(categoryToEdit.id, data, restaurantInfo?.id);
        showToast("success", "Cập nhật thành công", `Danh mục "${data.name}" đã được cập nhật.`);
      } else {
        await categoryService.create(data, restaurantInfo?.id);
        showToast("success", "Tạo thành công", `Danh mục "${data.name}" đã được tạo.`);
      }
      setIsModalOpen(false);
      setCategoryToEdit(null);
      setPage(1);
      await fetchCategories();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Thao tác thất bại";
      showToast("error", "Lỗi", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.delete(id, restaurantInfo?.id);
      showToast("success", "Đã xóa", "Danh mục đã được xóa thành công.");
      // If we deleted the last item on this page, go back one page
      if (categories.length === 1 && page > 1) setPage((p) => p - 1);
      else await fetchCategories();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể xóa danh mục";
      showToast("error", "Xóa thất bại", msg);
    }
  };

  // ── Loading skeleton (auth not ready) ─────────────────────────────────────
  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <DashboardHeader
        role="restaurant"
        restaurantName={restaurantInfo?.name ?? ""}
        userName={restaurantInfo?.owner?.fullName ?? user?.fullName ?? user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar
          role="restaurant"
          restaurantName={restaurantInfo?.name ?? user?.name ?? "đang tải..."}
          userName={restaurantInfo?.owner?.fullName ?? user?.fullName ?? user?.name ?? ""}
          userEmail={restaurantInfo?.owner?.email ?? user?.email ?? ""}
        />

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="space-y-6 max-w-7xl mx-auto">

            {/* ── Page Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                  Quản lý danh mục
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Tổ chức thực đơn nhà hàng theo danh mục món ăn.
                  {total > 0 && (
                    <span className="ml-2 font-semibold" style={{ color: "var(--primary)" }}>
                      ({total} danh mục)
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
                style={{ background: "var(--primary)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm danh mục
              </button>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Tổng danh mục",
                  value: total,
                  icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
                  color: "var(--primary)",
                  bg: "var(--primary-soft)",
                },
                {
                  label: "Hoạt động",
                  value: categories.filter((c) => c.isActive).length,
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                  color: "#22c55e",
                  bg: "rgba(34,197,94,0.08)",
                },
                {
                  label: "Ngưng hoạt động",
                  value: categories.filter((c) => !c.isActive).length,
                  icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.08)",
                },
                {
                  label: "Trang hiện tại",
                  value: `${page} / ${Math.max(1, Math.ceil(total / LIMIT))}`,
                  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                  color: "#a855f7",
                  bg: "rgba(168,85,247,0.08)",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-4 border flex items-center gap-3"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: stat.bg }}
                  >
                    <svg className="w-5 h-5" style={{ color: stat.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Category Table ── */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <CategoryTable
                categories={categories}
                isLoading={isLoading}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                pagination={{
                  total,
                  page,
                  limit: LIMIT,
                  onPageChange: setPage,
                }}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
              />
            </div>
          </div>
        </main>
      </div>

      {/* ── Category Modal ── */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCategoryToEdit(null); }}
        onSubmit={handleModalSubmit}
        categoryToEdit={categoryToEdit}
        categoriesList={categories}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
