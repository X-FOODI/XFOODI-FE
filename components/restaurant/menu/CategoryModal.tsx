"use client";

import React, { useEffect, useState } from "react";
import type { Category } from "@/lib/services/categoryService";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  categoryToEdit?: Category | null;
  categoriesList?: Category[];
  isSubmitting: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categoryToEdit = null,
  isSubmitting = false,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  
  const nameError = name.trim().length === 0 ? "Tên danh mục không được để trống" : "";

  // Reset or populate fields when modal opens/changes edit target
  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
      } else {
        setName("");
      }
      setNameTouched(false);
    }
  }, [isOpen, categoryToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);

    if (nameError) return;

    const payload = {
      name: name.trim(),
      description: categoryToEdit?.description || "",
      imageUrl: categoryToEdit?.imageUrl || null,
      parentId: categoryToEdit?.parentId || null,
      displayOrder: categoryToEdit?.displayOrder || 0,
      isActive: categoryToEdit ? categoryToEdit.isActive : true,
    };

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content Wrapper */}
      <div 
        className="relative w-full max-w-sm rounded-2xl border transition-all duration-300 transform scale-100 flex flex-col shadow-2xl overflow-hidden"
        style={{ 
          background: "var(--card)", 
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
            {categoryToEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {/* Category Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameTouched(true);
                }}
                placeholder="VD: Khai vị, Món chính, Đồ uống..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium"
                style={{
                  background: "var(--surface)",
                  borderColor: nameTouched && nameError ? "#ef4444" : "var(--border)",
                  color: "var(--text)",
                }}
                disabled={isSubmitting}
                autoFocus
              />
              {nameTouched && nameError && (
                <p className="mt-1 text-xs text-red-500 font-medium">{nameError}</p>
              )}
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
              }}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 hover:opacity-90"
              style={{
                background: "var(--primary)",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                categoryToEdit ? "Lưu thay đổi" : "Tạo danh mục"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
