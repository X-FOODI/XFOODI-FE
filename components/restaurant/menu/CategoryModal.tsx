"use client";

import React, { useEffect, useState } from "react";
import type { Category } from "@/lib/services/categoryService";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  categoryToEdit?: Category | null;
  categoriesList: Category[];
  isSubmitting: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categoryToEdit = null,
  categoriesList = [],
  isSubmitting = false,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const [nameTouched, setNameTouched] = useState(false);
  const nameError = name.trim().length === 0 ? "Tên danh mục không được để trống" : "";

  // Reset or populate fields when modal opens/changes edit target
  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setDescription(categoryToEdit.description || "");
        setImageUrl(categoryToEdit.imageUrl || "");
        setParentId(categoryToEdit.parentId || "");
        setDisplayOrder(categoryToEdit.displayOrder || 0);
        setIsActive(categoryToEdit.isActive);
      } else {
        setName("");
        setDescription("");
        setImageUrl("");
        setParentId("");
        setDisplayOrder(0);
        setIsActive(true);
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
      description: description.trim(),
      imageUrl: imageUrl.trim() || null,
      parentId: parentId || null,
      displayOrder,
      isActive,
    };

    await onSubmit(payload);
  };

  // Filter out the current category being edited from parent choices to prevent cyclical parent reference
  const eligibleParents = categoriesList.filter(
    (c) => !categoryToEdit || c.id !== categoryToEdit.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content Wrapper */}
      <div 
        className="relative w-full max-w-lg rounded-2xl border transition-all duration-300 transform scale-100 flex flex-col shadow-2xl overflow-hidden"
        style={{ 
          background: "var(--card)", 
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {categoryToEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                placeholder="Nhập tên danh mục (VD: Món chiên, Khai vị)"
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium"
                style={{
                  background: "var(--surface)",
                  borderColor: nameTouched && nameError ? "#ef4444" : "var(--border)",
                  color: "var(--text)",
                }}
                disabled={isSubmitting}
              />
              {nameTouched && nameError && (
                <p className="mt-1 text-xs text-red-500 font-medium">{nameError}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả ngắn cho danh mục này..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium resize-none"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Danh mục cha (Tùy chọn)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium appearance-none"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                disabled={isSubmitting}
              >
                <option value="">-- Không có danh mục cha --</option>
                {eligibleParents.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Display Order */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* Status active toggle */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center h-[46px] px-3.5 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <label className="flex items-center cursor-pointer w-full justify-between">
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Hoạt động</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                        disabled={isSubmitting}
                      />
                      <div 
                        className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Đường dẫn hình ảnh (Tùy chọn)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
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
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-90"
              style={{
                background: "var(--primary)",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
