"use client";

import React, { useEffect, useState } from "react";
import type { Dish, CreateDishData } from "@/lib/services/dishService";
import type { Category } from "@/lib/services/categoryService";

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  dishToEdit?: Dish | null;
  categories: Category[];
  isSubmitting: boolean;
}

const UNITS = ["phần", "ly", "suất", "cái", "tô", "đĩa", "chai", "lon", "túi"];

export default function DishModal({
  isOpen,
  onClose,
  onSubmit,
  dishToEdit = null,
  categories = [],
  isSubmitting = false,
}: DishModalProps) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [unit, setUnit] = useState("phần");
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [touched, setTouched] = useState({ name: false, price: false, categoryId: false });

  const errors = {
    name: name.trim().length === 0 ? "Tên món ăn không được để trống" : "",
    price: price === "" || isNaN(Number(price)) || Number(price) < 0
      ? "Giá phải là số không âm" : "",
    categoryId: !categoryId ? "Vui lòng chọn danh mục" : "",
  };

  const hasErrors = Object.values(errors).some(Boolean);

  useEffect(() => {
    if (!isOpen) return;
    if (dishToEdit) {
      setCategoryId(dishToEdit.categoryId);
      setName(dishToEdit.name);
      setDescription(dishToEdit.description || "");
      setPrice(dishToEdit.price);
      setUnit(dishToEdit.unit || "phần");
      setIsVegetarian(dishToEdit.isVegetarian);
      setIsSpicy(dishToEdit.isSpicy);
      setIsBestSeller(dishToEdit.isBestSeller);
      setIsActive(dishToEdit.isActive);
    } else {
      setCategoryId(categories[0]?.id || "");
      setName("");
      setDescription("");
      setPrice("");
      setUnit("phần");
      setIsVegetarian(false);
      setIsSpicy(false);
      setIsBestSeller(false);
      setIsActive(true);
    }
    setTouched({ name: false, price: false, categoryId: false });
  }, [isOpen, dishToEdit, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, price: true, categoryId: true });
    if (hasErrors) return;

    await onSubmit({
      categoryId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      unit,
      isVegetarian,
      isSpicy,
      isBestSeller,
      isActive,
    });
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium text-sm";
  const inputStyle = (hasErr: boolean) => ({
    background: "var(--surface)",
    borderColor: hasErr ? "#ef4444" : "var(--border)",
    color: "var(--text)",
  });

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{label}</span>
      <div className="relative" onClick={() => !isSubmitting && onChange(!checked)}>
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--primary-soft)" }}>
              <svg className="w-5 h-5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              {dishToEdit ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
            </h3>
          </div>
          <button onClick={!isSubmitting ? onClose : undefined}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.07)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = ""}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}>
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setTouched((p) => ({ ...p, categoryId: true })); }}
                className={`${inputClass} appearance-none`}
                style={inputStyle(touched.categoryId && !!errors.categoryId)}
                disabled={isSubmitting}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.filter(c => c.isActive).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {touched.categoryId && errors.categoryId && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.categoryId}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}>
                Tên món ăn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setTouched((p) => ({ ...p, name: true })); }}
                placeholder="VD: Cơm chiên dương châu, Phở bò tái"
                className={inputClass}
                style={inputStyle(touched.name && !!errors.name)}
                disabled={isSubmitting}
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}>Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về món ăn..."
                rows={2}
                className={`${inputClass} resize-none`}
                style={inputStyle(false)}
                disabled={isSubmitting}
              />
            </div>

            {/* Price & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-muted)" }}>
                  Giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => { setPrice(e.target.value); setTouched((p) => ({ ...p, price: true })); }}
                    placeholder="0"
                    min={0}
                    step={500}
                    className={`${inputClass} pr-12`}
                    style={inputStyle(touched.price && !!errors.price)}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: "var(--text-muted)" }}>₫</span>
                </div>
                {touched.price && errors.price && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-muted)" }}>Đơn vị</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`${inputClass} appearance-none`}
                  style={inputStyle(false)}
                  disabled={isSubmitting}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Boolean toggles */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}>Thuộc tính</label>
              <div className="grid grid-cols-2 gap-2">
                <Toggle label="🌿 Món chay" checked={isVegetarian} onChange={setIsVegetarian} />
                <Toggle label="🌶️ Món cay" checked={isSpicy} onChange={setIsSpicy} />
                <Toggle label="⭐ Bán chạy" checked={isBestSeller} onChange={setIsBestSeller} />
                <Toggle label="✅ Hoạt động" checked={isActive} onChange={setIsActive} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
            style={{ borderColor: "var(--border)" }}>
            {/* Price preview */}
            {price && !isNaN(Number(price)) && Number(price) > 0 && (
              <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>
                {Number(price).toLocaleString("vi-VN")}₫ / {unit}
              </span>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={!isSubmitting ? onClose : undefined}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border transition-all"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: "var(--primary)" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  dishToEdit ? "Lưu thay đổi" : "Thêm món ăn"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
