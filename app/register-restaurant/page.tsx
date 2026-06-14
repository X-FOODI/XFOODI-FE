"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import restaurantApplicationService, {
  CreateApplicationData,
} from "@/lib/services/restaurantApplicationService";
import type { MapPosition, AddressResult } from "@/app/components/MapLocationPicker";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

const MapLocationPicker = dynamic(() => import("@/app/components/MapLocationPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 360, borderRadius: 16, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Đang tải bản đồ...</p>
    </div>
  ),
});

type Step = 1 | 2;

const SLUG_RE = /^[a-z0-9-]+$/;

export default function RegisterRestaurantPage() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [error, setError] = useState("");

  // Step 1 fields
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [restaurantImagePreview, setRestaurantImagePreview] = useState<string | null>(null);
  const restaurantImageRef = useRef<HTMLInputElement>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cuisineType, setCuisineType] = useState<string>("other");

  // Step 2 files
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [ownershipProof, setOwnershipProof] = useState<File | null>(null);
  const [nationalId, setNationalId] = useState<File | null>(null);
  const [nationalIdBack, setNationalIdBack] = useState<File | null>(null);

  const blRef = useRef<HTMLInputElement>(null);
  const opRef = useRef<HTMLInputElement>(null);
  const niRef = useRef<HTMLInputElement>(null);
  const nibRef = useRef<HTMLInputElement>(null);

  const hasLoadedRef = useRef(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("xfoodi_registration_draft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.restaurantName !== undefined) setRestaurantName(data.restaurantName);
        if (data.slug !== undefined) setSlug(data.slug);
        if (data.description !== undefined) setDescription(data.description);
        if (data.address !== undefined) setAddress(data.address);
        if (data.phone !== undefined) setPhone(data.phone);
        if (data.email !== undefined) setEmail(data.email);
        if (data.cuisineType !== undefined) setCuisineType(data.cuisineType);
        if (data.latitude !== undefined) setLatitude(data.latitude);
        if (data.longitude !== undefined) setLongitude(data.longitude);
        if (data.step !== undefined) setStep(data.step);
      } catch (e) {
        console.error("Failed to load registration draft:", e);
      }
    }
    hasLoadedRef.current = true;
  }, []);

  // Save form data to localStorage on change
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const formData = {
      restaurantName,
      slug,
      description,
      address,
      phone,
      email,
      cuisineType,
      latitude,
      longitude,
      step,
    };
    localStorage.setItem("xfoodi_registration_draft", JSON.stringify(formData));
  }, [
    restaurantName,
    slug,
    description,
    address,
    phone,
    email,
    cuisineType,
    latitude,
    longitude,
    step,
  ]);

  // Auth guard + check existing application
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace("/login?redirect=/register-restaurant");
      return;
    }
    restaurantApplicationService
      .getMy()
      .then((app) => {
        if (app) {
          // Already has an application — redirect to pending/approved page
          router.replace("/register-restaurant/pending");
        }
      })
      .catch(() => {})
      .finally(() => setCheckingApplication(false));
  }, [isAuthReady, user, router]);

  // Auto-generate slug from restaurant name
  useEffect(() => {
    const generated = restaurantName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setSlug(generated);
  }, [restaurantName]);

  const validateStep1 = (): boolean => {
    if (!restaurantName.trim()) { setError("Vui lòng nhập tên nhà hàng"); return false; }
    if (!slug.trim() || !SLUG_RE.test(slug)) { setError("Slug chỉ được chứa chữ thường, số và dấu gạch ngang"); return false; }
    if (!address.trim()) { setError("Vui lòng nhập địa chỉ"); return false; }
    if (!phone.trim()) { setError("Vui lòng nhập số điện thoại"); return false; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Email không hợp lệ"); return false; }
    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (!businessLicense) { setError("Vui lòng tải lên giấy phép kinh doanh"); return; }
    if (!ownershipProof) { setError("Vui lòng tải lên giấy tờ sở hữu / hợp đồng mặt bằng"); return; }
    if (!nationalId) { setError("Vui lòng tải lên CCCD mặt trước"); return; }
    if (!nationalIdBack) { setError("Vui lòng tải lên CCCD mặt sau"); return; }

    setLoading(true);
    try {
      const data: CreateApplicationData = {
        restaurantName: restaurantName.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        cuisineType,
        restaurantImage: restaurantImage ?? undefined,
        businessLicense,
        ownershipProof,
        nationalId,
        nationalIdBack: nationalIdBack ?? undefined,
      };
      await restaurantApplicationService.create(data);
      localStorage.removeItem("xfoodi_registration_draft");
      router.replace("/register-restaurant/pending");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const FileInput = ({
    label,
    desc,
    file,
    ref: inputRef,
    onChange,
    required,
  }: {
    label: string;
    desc: string;
    file: File | null;
    ref: React.RefObject<HTMLInputElement | null>;
    onChange: (f: File | null) => void;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{desc}</p>
      <div
        className="relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all hover:border-[var(--primary)] flex items-center gap-3"
        style={{
          borderColor: file ? "var(--primary)" : "var(--border)",
          background: file ? "var(--primary-soft)" : "var(--card)",
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: file ? "var(--primary)" : "var(--bg-base)" }}>
          {file ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {file ? (
            <>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--primary)" }}>{file.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Nhấn để chọn file · JPG, PNG, PDF · Tối đa 10 MB
            </p>
          )}
        </div>
        {file && (
          <button
            type="button"
            className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
          >
            <svg className="w-4 h-4" style={{ color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  if (!isAuthReady || checkingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-[var(--primary)] animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <PageTransition minimumLoadingTime={1500}>
      <Header />
      <div className="min-h-screen pt-28 pb-12 px-4" style={{ background: "var(--bg-base)" }}>
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && document.referrer && !document.referrer.includes("/login") && !document.referrer.includes("/register-restaurant")) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[rgba(255,56,11,0.08)]"
            style={{ color: "var(--primary)", border: "1px solid var(--border)", background: "var(--card)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang trước
          </button>

          {/* Header */}
          <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "var(--primary)" }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Đăng ký mở nhà hàng</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Hoàn thành 2 bước để gửi đơn đăng ký lên XFoodi
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {([1, 2] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "text-white" : ""}`}
                  style={{
                    background: step >= s ? "var(--primary)" : "var(--border)",
                    color: step >= s ? "#fff" : "var(--text-muted)",
                  }}>
                  {step > s ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                <span className="text-sm font-medium hidden sm:block" style={{ color: step >= s ? "var(--text)" : "var(--text-muted)" }}>
                  {s === 1 ? "Thông tin nhà hàng" : "Chứng từ pháp lý"}
                </span>
              </div>
              {i < 1 && (
                <div className="flex-1 h-0.5 rounded" style={{ background: step > s ? "var(--primary)" : "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Tên nhà hàng <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="VD: Phở Hà Nội"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Slug (URL nhà hàng) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <span className="px-3 py-2.5 text-sm border-r" style={{ background: "var(--bg-base)", color: "var(--text-muted)", borderColor: "var(--border)" }}>
                    xfoodi.vn/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="pho-ha-noi"
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-base)", color: "var(--text)" }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Chỉ chữ thường, số và dấu gạch ngang. Không thể thay đổi sau khi đăng ký.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Giới thiệu ngắn về nhà hàng của bạn..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Địa chỉ <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: 123 Lê Lợi, Quận 1, TP.HCM"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                    Số điện thoại <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901 234 567"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                    Email nhà hàng <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@nhahangyou.com"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
                  Ảnh đại diện nhà hàng
                </label>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Ảnh sẽ hiển thị trên trang chủ XFoodi · JPG, PNG, WebP · Tối đa 5 MB</p>
                <div
                  className="relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-[var(--primary)]"
                  style={{
                    borderColor: restaurantImage ? "var(--primary)" : "var(--border)",
                    background: restaurantImage ? "var(--primary-soft)" : "var(--bg-base)",
                    minHeight: 160,
                  }}
                  onClick={() => restaurantImageRef.current?.click()}
                >
                  <input
                    ref={restaurantImageRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setRestaurantImage(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setRestaurantImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setRestaurantImagePreview(null);
                      }
                    }}
                  />
                  {restaurantImagePreview ? (
                    <div className="relative w-full flex items-center justify-center" style={{ height: 220, background: "rgba(0,0,0,0.3)" }}>
                      <img
                        src={restaurantImagePreview}
                        alt="preview"
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-semibold">Nhấn để thay đổi ảnh</p>
                      </div>
                      <button
                        type="button"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRestaurantImage(null);
                          setRestaurantImagePreview(null);
                          if (restaurantImageRef.current) restaurantImageRef.current.value = "";
                        }}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--border)" }}>
                        <svg className="w-7 h-7" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Nhấn để tải ảnh nhà hàng lên</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Map vị trí nhà hàng */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Vị trí trên bản đồ
                </label>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Ghim vị trí chính xác để hiển thị trên bản đồ của XFoodi · Click vào bản đồ hoặc tìm kiếm địa điểm
                </p>
                <MapLocationPicker
                  height={360}
                  onPositionChange={(pos) => {
                    setLatitude(pos.lat);
                    setLongitude(pos.lng);
                  }}
                  onAddressChange={(addr) => {
                    if (!address && addr.formattedAddress) {
                      setAddress(addr.formattedAddress);
                    }
                  }}
                />
                {latitude && longitude && (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--primary)" }}>
                    <CheckCircleIcon sx={{ fontSize: 14 }} />
                    Đã chọn vị trí: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--primary)" }}
              >
                Tiếp tục → Tải lên chứng từ
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "var(--text)" }}>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#3b82f6" }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p style={{ color: "var(--text-muted)" }}>
                    Tài liệu của bạn được <strong style={{ color: "var(--text)" }}>mã hóa AES-256</strong> và chỉ có admin được xét duyệt mới có thể xem. Chúng tôi cam kết bảo mật thông tin của bạn.
                  </p>
                </div>
              </div>

              <FileInput
                label="Giấy phép kinh doanh"
                desc="File đăng ký kinh doanh hợp lệ do cơ quan có thẩm quyền cấp"
                file={businessLicense}
                ref={blRef}
                onChange={setBusinessLicense}
                required
              />
              <FileInput
                label="Giấy tờ sở hữu / hợp đồng mặt bằng"
                desc="Giấy chứng nhận sở hữu hoặc hợp đồng thuê địa điểm nhà hàng"
                file={ownershipProof}
                ref={opRef}
                onChange={setOwnershipProof}
                required
              />
              <FileInput
                label="CCCD / Căn cước công dân — Mặt trước"
                desc="Ảnh mặt trước CCCD / Hộ chiếu của người đại diện pháp nhân"
                file={nationalId}
                ref={niRef}
                onChange={setNationalId}
                required
              />
              <FileInput
                label="CCCD / Căn cước công dân — Mặt sau"
                desc="Ảnh mặt sau CCCD / Hộ chiếu của người đại diện pháp nhân"
                file={nationalIdBack}
                ref={nibRef}
                onChange={setNationalIdBack}
                required
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                  style={{ border: "1px solid var(--border)", color: "var(--text)", background: "transparent" }}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: "var(--primary)" }}
                >
                  {loading && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  {loading ? "Đang gửi đơn..." : "Gửi đơn đăng ký"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          Đơn sẽ được xét duyệt trong <strong>1–3 ngày làm việc</strong>. Bạn sẽ nhận email thông báo kết quả.
        </p>
      </div>
    </div>
    <Footer />
    </PageTransition>
  );
}
