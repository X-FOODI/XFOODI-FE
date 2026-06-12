"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/lib/contexts/ToastContext";
import dishService from "@/lib/services/dishService";
import type { Dish } from "@/lib/services/dishService";
import categoryService from "@/lib/services/categoryService";
import type { Category } from "@/lib/services/categoryService";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DishTable from "@/components/restaurant/menu/DishTable";
import DishModal from "@/components/restaurant/menu/DishModal";
import axiosInstance from "@/lib/services/axiosInstance";

interface RestaurantInfo {
  id: string;
  name: string;
  owner: { id: string; fullName: string | null; email: string | null; avatarUrl: string | null };
}

export default function DishMenuPage() {
  const { user, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // ── Restaurant context ──
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);

  // ── Categories & Dishes state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [totalDishes, setTotalDishes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ── Filters & Pagination ──
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // ── Modal state ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<Dish | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace("/login-email?redirect=/restaurant/menu");
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
      .catch((err) => {
        console.error(err);
        return null;
      })
      .then((res) => {
        if (res?.data?.data) {
          setRestaurantInfo(res.data.data);
        }
      });
  }, [isAuthReady, user, router]);

  // ── Fetch Categories (dropdown lookup) ──
  const fetchCategories = useCallback(async () => {
    if (!restaurantInfo?.id) return;
    try {
      const res = await categoryService.list({
        page: 1,
        limit: 100, // retrieve all for dropdown usage
        restaurantId: restaurantInfo.id,
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories lookup:", err);
    }
  }, [restaurantInfo?.id]);

  // ── Fetch Dishes ──
  const fetchDishes = useCallback(async () => {
    if (!restaurantInfo?.id) return;
    setIsLoading(true);
    try {
      const result = await dishService.list({
        page,
        limit: LIMIT,
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        status: status !== "all" ? status : undefined,
        restaurantId: restaurantInfo.id,
      });
      setDishes(result.data);
      setTotalDishes(result.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể tải danh sách món ăn";
      showToast("error", "Lỗi tải dữ liệu", msg);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantInfo?.id, page, search, categoryId, status]);

  // Initial load
  useEffect(() => {
    if (restaurantInfo?.id) {
      fetchCategories();
    }
  }, [restaurantInfo?.id, fetchCategories]);

  useEffect(() => {
    if (restaurantInfo?.id) {
      fetchDishes();
    }
  }, [restaurantInfo?.id, fetchDishes]);

  // Handlers for filters
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {}, 300);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  // CRUD Actions
  const handleOpenCreate = () => {
    setDishToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dish: Dish) => {
    setDishToEdit(dish);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (dishToEdit) {
        await dishService.update(dishToEdit.id, data, restaurantInfo?.id);
        showToast("success", "Cập nhật thành công", `Món ăn "${data.name}" đã được cập nhật.`);
      } else {
        await dishService.create(data, restaurantInfo?.id);
        showToast("success", "Tạo thành công", `Món ăn "${data.name}" đã được tạo.`);
      }
      setIsModalOpen(false);
      setDishToEdit(null);
      setPage(1);
      await fetchDishes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Thao tác thất bại";
      showToast("error", "Lỗi", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dishService.delete(id, restaurantInfo?.id);
      showToast("success", "Đã xóa", "Món ăn đã được xóa thành công.");
      if (dishes.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchDishes();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể xóa món ăn";
      showToast("error", "Xóa thất bại", msg);
    }
  };

  // Guard Loading state
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

        {/* Main Content */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                  Quản lý món ăn
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Xem và điều chỉnh các món ăn trong thực đơn của nhà hàng.
                  {totalDishes > 0 && (
                    <span className="ml-2 font-semibold" style={{ color: "var(--primary)" }}>
                      ({totalDishes} món ăn)
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
                Thêm món ăn
              </button>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Tổng số món",
                  value: totalDishes,
                  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                  color: "var(--primary)",
                  bg: "var(--primary-soft)",
                },
                {
                  label: "Món chay 🌿",
                  value: dishes.filter((d) => d.isVegetarian).length,
                  icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
                  color: "#22c55e",
                  bg: "rgba(34,197,94,0.08)",
                },
                {
                  label: "Món cay 🌶️",
                  value: dishes.filter((d) => d.isSpicy).length,
                  icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.08)",
                },
                {
                  label: "Món bán chạy ⭐",
                  value: dishes.filter((d) => d.isBestSeller).length,
                  icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.248.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.77-.579-.371-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z",
                  color: "#eab308",
                  bg: "rgba(234,179,8,0.08)",
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

            {/* Dish list / Table */}
            <div
              className="rounded-2xl border p-6 animate-fadeIn"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <DishTable
                dishes={dishes}
                isLoading={isLoading}
                categories={categories}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                pagination={{
                  total: totalDishes,
                  page,
                  limit: LIMIT,
                  onPageChange: setPage,
                }}
                filters={{
                  search,
                  onSearchChange: handleSearchChange,
                  categoryId,
                  onCategoryChange: handleCategoryChange,
                  status,
                  onStatusChange: handleStatusChange,
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Dish Modal (Add / Edit) */}
      <DishModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDishToEdit(null);
        }}
        onSubmit={handleModalSubmit}
        dishToEdit={dishToEdit}
        categories={categories}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
