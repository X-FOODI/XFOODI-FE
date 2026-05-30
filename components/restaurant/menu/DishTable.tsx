"use client";

import React, { useState } from "react";
import type { Dish } from "@/lib/services/dishService";
import type { Category } from "@/lib/services/categoryService";

interface DishTableProps {
  dishes: Dish[];
  isLoading: boolean;
  categories: Category[];
  onEdit: (dish: Dish) => void;
  onDelete: (id: string) => Promise<void>;
  pagination: { total: number; page: number; limit: number; onPageChange: (p: number) => void };
  filters: {
    search: string; onSearchChange: (v: string) => void;
    categoryId: string; onCategoryChange: (v: string) => void;
    status: string; onStatusChange: (v: string) => void;
  };
}

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("vi-VN") + "₫";
}

export default function DishTable({
  dishes = [],
  isLoading = false,
  categories = [],
  onEdit,
  onDelete,
  pagination,
  filters,
}: DishTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    try { await onDelete(id); }
    finally { setIsDeleting(false); setDeleteId(null); }
  };

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => filters.onSearchChange(e.target.value)}
            placeholder="Tìm món ăn..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        {/* Category filter */}
        <select
          value={filters.categoryId}
          onChange={(e) => filters.onCategoryChange(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none font-medium appearance-none min-w-[140px]"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => filters.onStatusChange(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none font-medium appearance-none min-w-[130px]"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngưng</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border shadow-sm"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.02)" }}>
              {["STT", "Món ăn", "Danh mục", "Giá", "Đơn vị", "Thuộc tính", "Trạng thái", "Hành động"].map((col, i) => (
                <th key={col}
                  className={`px-4 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${i >= 5 ? "text-center" : ""} ${i === 7 ? "text-right" : ""}`}
                  style={{ color: "var(--text-muted)" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b" style={{ borderColor: "var(--border)" }}>
                  {[4, 36, 20, 16, 8, 20, 16, 12].map((w, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 rounded" style={{ width: `${w * 4}px`, background: "rgba(0,0,0,0.07)" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : dishes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--primary-soft)" }}>
                      <svg className="w-8 h-8" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Không tìm thấy món ăn nào</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Thử điều chỉnh bộ lọc hoặc thêm món ăn mới.</p>
                  </div>
                </td>
              </tr>
            ) : (
              dishes.map((dish, idx) => (
                <tr key={dish.id} className="border-b transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(0,0,0,0.015)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}>

                  {/* STT */}
                  <td className="px-4 py-3.5 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                    {(pagination.page - 1) * pagination.limit + idx + 1}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{dish.name}</p>
                    {dish.description && (
                      <p className="text-xs mt-0.5 max-w-[180px] truncate" style={{ color: "var(--text-muted)" }}
                        title={dish.description}>{dish.description}</p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold"
                      style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                      {dish.category?.name || "—"}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                      {formatPrice(dish.price)}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-lg border"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      {dish.unit}
                    </span>
                  </td>

                  {/* Attributes badges */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {dish.isVegetarian && (
                        <span className="text-base" title="Món chay">🌿</span>
                      )}
                      {dish.isSpicy && (
                        <span className="text-base" title="Món cay">🌶️</span>
                      )}
                      {dish.isBestSeller && (
                        <span className="text-base" title="Bán chạy">⭐</span>
                      )}
                      {!dish.isVegetarian && !dish.isSpicy && !dish.isBestSeller && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      dish.isActive
                        ? "border-green-500/20 bg-green-500/10 text-green-600"
                        : "border-red-400/20 bg-red-400/10 text-red-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dish.isActive ? "bg-green-500" : "bg-red-400"}`} />
                      {dish.isActive ? "Hoạt động" : "Ngưng"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    {deleteId === dish.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs font-semibold mr-1" style={{ color: "var(--text-muted)" }}>Xác nhận?</span>
                        <button onClick={() => handleConfirmDelete(dish.id)} disabled={isDeleting}
                          className="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60">
                          {isDeleting ? "..." : "Xóa"}
                        </button>
                        <button onClick={() => setDeleteId(null)} disabled={isDeleting}
                          className="px-3 py-1 text-xs font-bold rounded-lg border transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEdit(dish)} title="Sửa"
                          className="p-2 rounded-lg transition-all" style={{ color: "var(--primary)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-soft)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.73z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteId(dish.id)} title="Xóa"
                          className="p-2 rounded-lg transition-all text-red-500"
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Hiển thị{" "}
            <span className="font-bold" style={{ color: "var(--text)" }}>
              {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            trong <span className="font-bold" style={{ color: "var(--text)" }}>{pagination.total}</span> món
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
                className="p-2 rounded-xl border transition-all disabled:opacity-30"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                const isCurrent = pNum === pagination.page;
                return (
                  <button key={pNum} onClick={() => pagination.onPageChange(pNum)} disabled={isLoading}
                    className="w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center transition-all"
                    style={{ backgroundColor: isCurrent ? "var(--primary)" : undefined, color: isCurrent ? "#fff" : "var(--text)" }}
                    onMouseEnter={(e) => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)"; }}
                    onMouseLeave={(e) => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = ""; }}>
                    {pNum}
                  </button>
                );
              })}
              <button onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages || isLoading}
                className="p-2 rounded-xl border transition-all disabled:opacity-30"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
