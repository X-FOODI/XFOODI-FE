"use client";

import React, { useState } from "react";
import type { Category } from "@/lib/services/categoryService";

interface CategoryTableProps {
  categories: Category[];
  isLoading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => Promise<void>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export default function CategoryTable({
  categories = [],
  isLoading = false,
  onEdit,
  onDelete,
  pagination,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: CategoryTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "Danh mục gốc";
  };

  const handleDeleteClick = (id: string) => setDeleteConfirmId(id);

  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="space-y-4">
      {/* ── Filter & Search Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <span
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên danh mục..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Trạng thái:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none font-medium appearance-none min-w-[130px]"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng hoạt động</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="overflow-x-auto rounded-2xl border shadow-sm"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.02)" }}
            >
              {["STT", "Tên danh mục", "Mô tả", "Danh mục cha", "Thứ tự", "Trạng thái", "Hành động"].map(
                (col, i) => (
                  <th
                    key={col}
                    className={`px-6 py-4 font-bold text-xs uppercase tracking-wider ${
                      i >= 4 ? "text-center" : ""
                    } ${i === 6 ? "text-right" : ""}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b" style={{ borderColor: "var(--border)" }}>
                  {[6, 32, 48, 24, 8, 20, 16].map((w, i) => (
                    <td key={i} className="px-6 py-4">
                      <div
                        className="h-4 rounded"
                        style={{ width: `${w * 4}px`, background: "rgba(0,0,0,0.07)", margin: i >= 4 ? "0 auto" : undefined }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--primary-soft)" }}
                    >
                      <svg className="w-8 h-8" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                      Không tìm thấy danh mục nào
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Thử thay đổi bộ lọc hoặc tạo danh mục mới.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className="border-b transition-colors"
                  style={{
                    borderColor: "var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "rgba(0,0,0,0.015)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "";
                  }}
                >
                  {/* STT */}
                  <td className="px-6 py-4 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                    {(pagination.page - 1) * pagination.limit + idx + 1}
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                        >
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                        {cat.name}
                      </span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 max-w-[200px]">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--text-muted)" }}
                      title={cat.description}
                    >
                      {cat.description || <span className="italic opacity-50">Chưa có mô tả</span>}
                    </p>
                  </td>

                  {/* Parent */}
                  <td className="px-6 py-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {getParentName(cat.parentId)}
                  </td>

                  {/* Display Order */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold"
                      style={{ background: "var(--surface)", color: "var(--text)" }}
                    >
                      {cat.displayOrder}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        cat.isActive
                          ? "border-green-500/20 bg-green-500/10 text-green-600"
                          : "border-red-400/20 bg-red-400/10 text-red-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          cat.isActive ? "bg-green-500" : "bg-red-400"
                        }`}
                      />
                      {cat.isActive ? "Hoạt động" : "Ngưng"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {deleteConfirmId === cat.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs font-semibold mr-1" style={{ color: "var(--text-muted)" }}>
                          Xác nhận?
                        </span>
                        <button
                          onClick={() => handleConfirmDelete(cat.id)}
                          disabled={isDeleting}
                          className="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60"
                        >
                          {isDeleting ? "..." : "Xóa"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                          className="px-3 py-1 text-xs font-bold rounded-lg border transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => onEdit(cat)}
                          title="Chỉnh sửa"
                          className="p-2 rounded-lg transition-all"
                          style={{ color: "var(--primary)" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-soft)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "";
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.73z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteClick(cat.id)}
                          title="Xóa"
                          className="p-2 rounded-lg transition-all text-red-500"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "";
                          }}
                        >
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
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            trong <span className="font-bold" style={{ color: "var(--text)" }}>{pagination.total}</span> danh mục
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
                className="p-2 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                const isCurrent = pNum === pagination.page;
                return (
                  <button
                    key={pNum}
                    onClick={() => pagination.onPageChange(pNum)}
                    disabled={isLoading}
                    className="w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isCurrent ? "var(--primary)" : undefined,
                      color: isCurrent ? "#fff" : "var(--text)",
                      border: isCurrent ? "none" : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "";
                    }}
                  >
                    {pNum}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages || isLoading}
                className="p-2 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
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
