"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Dish, CreateDishData } from "@/lib/services/dishService";
import type { Category } from "@/lib/services/categoryService";
import axiosInstance from "@/lib/services/axiosInstance";

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
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [touched, setTouched] = useState({ name: false, price: false, categoryId: false });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const errors = {
    name: name.trim().length === 0 ? "Tên món ăn không được để trống" : "",
    price: price === "" || isNaN(Number(price)) || Number(price) < 0
      ? "Giá phải là số không âm" : "",
    categoryId: !categoryId ? "Vui lòng chọn danh mục" : "",
  };

  const hasErrors = Object.values(errors).some(Boolean);

  useEffect(() => {
    if (!isOpen) return;
    setIsCategoryDropdownOpen(false);
    setIsUnitDropdownOpen(false);
    if (dishToEdit) {
      setCategoryId(dishToEdit.categoryId);
      setName(dishToEdit.name);
      setDescription(dishToEdit.description || "");
      setPrice(dishToEdit.price);
      setUnit(dishToEdit.unit || "phần");
      setImageUrl(dishToEdit.imageUrl || "");
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
      setImageUrl("");
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
      imageUrl: imageUrl || null,
      isVegetarian,
      isSpicy,
      isBestSeller,
      isActive,
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-all font-medium text-xs";
  const inputStyle = (hasErr: boolean) => ({
    background: "var(--surface)",
    borderColor: hasErr ? "#ef4444" : "var(--border)",
    color: "var(--text)",
  });

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <span className="text-[11px] font-bold" style={{ color: "var(--text)" }}>{label}</span>
      <div className="relative" onClick={() => !isSubmitting && onChange(!checked)}>
        <div className={`w-8 h-4.5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-3.5" : ""}`} />
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-scaleIn"
        style={{ background: "var(--card)", borderColor: "var(--border)", maxHeight: "94vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary-soft)" }}>
              <svg className="w-4.5 h-4.5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {dishToEdit ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
            </h3>
          </div>
          <button onClick={!isSubmitting ? onClose : undefined}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.07)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = ""}>
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Category */}
            <div className="relative" ref={categoryDropdownRef}>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}>
                Danh mục <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-all font-bold text-xs flex items-center justify-between text-left ${
                    touched.categoryId && !!errors.categoryId ? "border-red-500 focus:ring-red-500/20" : "focus:ring-primary/25"
                  }`}
                  style={{
                    background: "var(--surface)",
                    borderColor: touched.categoryId && !!errors.categoryId ? "#ef4444" : "var(--border)",
                    color: categoryId ? "var(--text)" : "var(--text-muted)",
                  }}
                  disabled={isSubmitting}
                >
                  <span>
                    {categories.find((c) => c.id === categoryId)?.name || "-- Chọn danh mục --"}
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoryDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isCategoryDropdownOpen && (
                  <div 
                    className="absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-2xl overflow-hidden animate-fadeIn"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <div className="max-h-48 overflow-y-auto py-1">
                      <div
                        onClick={() => {
                          setCategoryId("");
                          setIsCategoryDropdownOpen(false);
                          setTouched((p) => ({ ...p, categoryId: true }));
                        }}
                        className="px-3 py-2 text-xs font-bold cursor-pointer transition-colors"
                        style={{
                          color: "var(--text-muted)",
                          background: categoryId === "" ? "rgba(255,255,255,0.03)" : "transparent"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = categoryId === "" ? "rgba(255,255,255,0.03)" : "transparent")}
                      >
                        -- Chọn danh mục --
                      </div>
                      {categories.filter((c) => c.isActive).map((c) => {
                        const isSelected = categoryId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setCategoryId(c.id);
                              setIsCategoryDropdownOpen(false);
                              setTouched((p) => ({ ...p, categoryId: true }));
                            }}
                            className="px-3 py-2 text-xs font-bold cursor-pointer transition-colors"
                            style={{
                              color: isSelected ? "var(--primary)" : "var(--text)",
                              background: isSelected ? "var(--primary-soft)" : "transparent"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = isSelected ? "var(--primary-soft)" : "rgba(255,255,255,0.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? "var(--primary-soft)" : "transparent")}
                          >
                            {c.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {touched.categoryId && errors.categoryId && (
                <p className="mt-0.5 text-[10px] text-red-500 font-medium">{errors.categoryId}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
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
                <p className="mt-0.5 text-[10px] text-red-500 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}>
                Hình ảnh món ăn
              </label>
              
              <div className="flex gap-3 items-center">
                <label className="cursor-pointer group relative flex-shrink-0">
                  <div 
                    className="w-16 h-16 rounded-xl border border-dashed flex items-center justify-center overflow-hidden transition-all hover:opacity-85"
                    style={{ 
                      background: "var(--surface)", 
                      borderColor: "var(--border)",
                      width: "64px",
                      height: "64px"
                    }}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)" }} />
                        <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>Tải...</span>
                      </div>
                    ) : imageUrl ? (
                      <img src={imageUrl} alt="Dish" className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[8px] mt-0.5" style={{ color: "var(--text-muted)" }}>Tải ảnh lên</span>
                      </div>
                    )}
                  </div>
                  {!isUploadingImage && !isSubmitting && (
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            setIsUploadingImage(true);
                            const file = e.target.files[0];
                            const data = new FormData();
                            data.append("image", file);
                            data.append("folder", "xfoodi/dishes");
                            const res = await axiosInstance.post("/upload/image", data, {
                              headers: { "Content-Type": "multipart/form-data" }
                            });
                            if (res.data.success) {
                              setImageUrl(res.data.data.url);
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Không thể tải ảnh lên, vui lòng thử lại.");
                          } finally {
                            setIsUploadingImage(false);
                          }
                        }
                      }} 
                    />
                  )}
                </label>
                
                <div className="flex-1 space-y-0.5">
                  <p className="text-[10px] text-zinc-400 font-bold">Hỗ trợ JPG, PNG, WEBP.</p>
                  <p className="text-[9px] text-zinc-500 leading-tight">Tải lên hình ảnh món ăn trực tiếp từ thiết bị của bạn.</p>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-0.5 pt-0.5"
                      disabled={isSubmitting || isUploadingImage}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa ảnh hiện tại
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}>Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về món ăn..."
                rows={1.5}
                className={`${inputClass} resize-none`}
                style={inputStyle(false)}
                disabled={isSubmitting}
              />
            </div>

            {/* Price & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
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
                    className={`${inputClass} pr-8`}
                    style={inputStyle(touched.price && !!errors.price)}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: "var(--text-muted)" }}>₫</span>
                </div>
                {touched.price && errors.price && (
                  <p className="mt-0.5 text-[10px] text-red-500 font-medium">{errors.price}</p>
                )}
              </div>

              <div className="relative" ref={unitDropdownRef}>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-muted)" }}>Đơn vị</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => !isSubmitting && setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all font-bold text-xs flex items-center justify-between text-left"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                    disabled={isSubmitting}
                  >
                    <span>{unit}</span>
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isUnitDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUnitDropdownOpen && (
                    <div 
                      className="absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-2xl overflow-hidden animate-fadeIn"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                      <div className="max-h-40 overflow-y-auto py-1">
                        {UNITS.map((u) => {
                          const isSelected = unit === u;
                          return (
                            <div
                              key={u}
                              onClick={() => {
                                setUnit(u);
                                setIsUnitDropdownOpen(false);
                              }}
                              className="px-3 py-2 text-xs font-bold cursor-pointer transition-colors"
                              style={{
                                color: isSelected ? "var(--primary)" : "var(--text)",
                                background: isSelected ? "var(--primary-soft)" : "transparent"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = isSelected ? "var(--primary-soft)" : "rgba(255,255,255,0.05)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? "var(--primary-soft)" : "transparent")}
                            >
                              {u}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boolean toggles */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5"
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
          <div className="flex items-center justify-between px-4 py-3 border-t flex-shrink-0"
            style={{ borderColor: "var(--border)" }}>
            {/* Price preview */}
            {price && !isNaN(Number(price)) && Number(price) > 0 && (
              <span className="text-[11px] font-bold" style={{ color: "var(--primary)" }}>
                {Number(price).toLocaleString("vi-VN")}₫ / {unit}
              </span>
            )}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={!isSubmitting ? onClose : undefined}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: "var(--primary)" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
