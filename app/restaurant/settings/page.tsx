"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";

interface RestaurantMetadata {
  coverImage?: string;
  operatingHours?: {
    [day: string]: {
      isOpen: boolean;
      open: string;
      close: string;
    };
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  gallery?: string[];
  reservationConfig?: {
    opening_time?: string;
    closing_time?: string;
    last_booking_before_close_minutes?: number;
    min_advance_booking_hours?: number;
    max_advance_booking_days?: number;
    closed_dates?: string[];
    early_checkin_minutes?: number;
    late_checkin_minutes?: number;
    deposit_enabled?: boolean;
    deposit_amount?: number | null;
    deposit_confirmation_timeout_minutes?: number;
    free_cancellation_hours?: number;
  };
}

interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  metadata: RestaurantMetadata | null;
  owner: {
    id: string;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Thứ 2" },
  { key: "tuesday", label: "Thứ 3" },
  { key: "wednesday", label: "Thứ 4" },
  { key: "thursday", label: "Thứ 5" },
  { key: "friday", label: "Thứ 6" },
  { key: "saturday", label: "Thứ 7" },
  { key: "sunday", label: "Chủ nhật" },
];

export default function RestaurantSettingsPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "reservation">("general");
  const [newClosedDate, setNewClosedDate] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    logoUrl: "",
    primaryColor: "#FF380B",
    coverImage: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    operatingHours: DAYS_OF_WEEK.reduce((acc, day) => ({
      ...acc,
      [day.key]: { isOpen: true, open: "08:00", close: "22:00" }
    }), {} as Record<string, { isOpen: boolean, open: string, close: string }>),
    gallery: [] as string[],
    reservationConfig: {
      opening_time: "10:00",
      closing_time: "22:00",
      last_booking_before_close_minutes: 60,
      min_advance_booking_hours: 1,
      max_advance_booking_days: 30,
      closed_dates: [] as string[],
      early_checkin_minutes: 15,
      late_checkin_minutes: 30,
      deposit_enabled: false,
      deposit_amount: "" as string | number,
      deposit_confirmation_timeout_minutes: 120,
      free_cancellation_hours: 12,
    },
  });

  useEffect(() => {
    if (!isAuthReady || tenantLoading) return;
    if (!user) {
      router.replace("/login-email?redirect=/restaurant/settings");
      return;
    }
    
    axiosInstance
      .get<{ success: boolean; data: RestaurantInfo }>("/restaurants/me")
      .then((res) => {
        const data = res.data.data;
        setRestaurantInfo(data);
        const meta = data.metadata || {};
        const config = meta.reservationConfig || {};
        
        setFormData({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          logoUrl: data.logoUrl || "",
          primaryColor: data.primaryColor || "#FF380B",
          coverImage: meta.coverImage || "",
          facebook: meta.socialLinks?.facebook || "",
          instagram: meta.socialLinks?.instagram || "",
          tiktok: meta.socialLinks?.tiktok || "",
          operatingHours: meta.operatingHours || DAYS_OF_WEEK.reduce((acc, day) => ({
            ...acc,
            [day.key]: { isOpen: true, open: "08:00", close: "22:00" }
          }), {} as any),
          gallery: meta.gallery || [],
          reservationConfig: {
            opening_time: config.opening_time || "10:00",
            closing_time: config.closing_time || "22:00",
            last_booking_before_close_minutes: config.last_booking_before_close_minutes ?? 60,
            min_advance_booking_hours: config.min_advance_booking_hours ?? 1,
            max_advance_booking_days: config.max_advance_booking_days ?? 30,
            closed_dates: config.closed_dates || [],
            early_checkin_minutes: config.early_checkin_minutes ?? 15,
            late_checkin_minutes: config.late_checkin_minutes ?? 30,
            deposit_enabled: config.deposit_enabled ?? false,
            deposit_amount: config.deposit_amount !== null && config.deposit_amount !== undefined ? config.deposit_amount : "",
            deposit_confirmation_timeout_minutes: config.deposit_confirmation_timeout_minutes ?? 120,
            free_cancellation_hours: config.free_cancellation_hours ?? 12,
          }
        });
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthReady, user, router, tenantLoading]);

  const handleUploadImage = async (file: File, fieldName: 'logoUrl' | 'coverImage' | 'gallery') => {
    try {
      setSaving(true);
      const data = new FormData();
      data.append('image', file);
      data.append('folder', `xfoodi/restaurants/${restaurantInfo?.slug || 'unknown'}`);
      
      const res = await axiosInstance.post('/upload/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        const url = res.data.data.url;
        if (fieldName === 'gallery') {
          setFormData(prev => ({ ...prev, gallery: [...prev.gallery, url] }));
        } else {
          setFormData(prev => ({ ...prev, [fieldName]: url }));
        }
      } else {
        alert(res.data.message || 'Lỗi tải ảnh');
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        metadata: {
          coverImage: formData.coverImage,
          operatingHours: formData.operatingHours,
          socialLinks: {
            facebook: formData.facebook,
            instagram: formData.instagram,
            tiktok: formData.tiktok,
          },
          gallery: formData.gallery,
          reservationConfig: {
            ...formData.reservationConfig,
            deposit_amount: formData.reservationConfig.deposit_amount === "" ? null : Number(formData.reservationConfig.deposit_amount),
          }
        }
      };

      await axiosInstance.put("/restaurants/me", payload);
      alert("Lưu cài đặt thành công!");
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  };

  const updateOperatingHour = (day: string, field: "isOpen" | "open" | "close", value: any) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="restaurant"
        restaurantName={restaurantInfo?.name ?? ""}
        userName={restaurantInfo?.owner?.fullName ?? user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={restaurantInfo?.name ?? user?.name ?? "đang tải..."}
          userName={restaurantInfo?.owner?.fullName ?? user?.name ?? ""}
          userEmail={restaurantInfo?.owner?.email ?? user?.email ?? ""}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt Cửa hàng</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý thông tin và giao diện trang nhà hàng của bạn.</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("general")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "general" 
                    ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Thông tin chung & Hoạt động
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "appearance" 
                    ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Cá nhân hóa Giao diện
              </button>
              <button
                onClick={() => setActiveTab("reservation")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "reservation" 
                    ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Cấu hình Đặt bàn
              </button>
            </div>

            {/* Content: General */}
            {activeTab === "general" && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin cơ bản</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tên nhà hàng <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email liên hệ</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại (Hotline)</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
                      <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Câu chuyện nhà hàng (Mô tả)</label>
                      <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent resize-none" placeholder="Kể câu chuyện về nhà hàng của bạn..." />
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Giờ hoạt động</h2>
                  <div className="space-y-3">
                    {DAYS_OF_WEEK.map((day) => {
                      const current = formData.operatingHours[day.key];
                      return (
                        <div key={day.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                          <div className="flex items-center gap-3 w-1/3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={current.isOpen} onChange={(e) => updateOperatingHour(day.key, "isOpen", e.target.checked)} />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-20">{day.label}</span>
                          </div>
                          
                          {current.isOpen ? (
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <input type="time" value={current.open} onChange={(e) => updateOperatingHour(day.key, "open", e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
                              <span className="text-gray-500">-</span>
                              <input type="time" value={current.close} onChange={(e) => updateOperatingHour(day.key, "close", e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
                            </div>
                          ) : (
                            <div className="flex-1 text-right text-sm text-gray-400 italic">Đóng cửa</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mạng xã hội</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                        Facebook
                      </label>
                      <input type="url" placeholder="https://facebook.com/..." value={formData.facebook} onChange={(e) => setFormData({...formData, facebook: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        Instagram
                      </label>
                      <input type="url" placeholder="https://instagram.com/..." value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <svg className="w-4 h-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                        TikTok
                      </label>
                      <input type="url" placeholder="https://tiktok.com/@..." value={formData.tiktok} onChange={(e) => setFormData({...formData, tiktok: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content: Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hình ảnh Thương hiệu</h2>
                    <p className="text-sm text-gray-500 mt-1">Logo và ảnh bìa hiển thị trên trang chủ nhà hàng.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer group relative">
                          <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                            {formData.logoUrl ? (
                              <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                            ) : (
                              <svg className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            )}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">Tải ảnh lên</span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) handleUploadImage(e.target.files[0], 'logoUrl');
                          }} />
                        </label>
                        <div className="flex-1 space-y-2">
                          <input type="text" placeholder="URL của Logo" value={formData.logoUrl} onChange={(e) => setFormData({...formData, logoUrl: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-sm" />
                          <p className="text-xs text-gray-500">Nhấn vào ô vuông để tải ảnh lên hoặc dán URL.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ảnh bìa (Cover Image)</label>
                      <label className="cursor-pointer group block">
                        <div className="w-full h-32 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden relative group-hover:opacity-80 transition-opacity">
                          {formData.coverImage ? (
                            <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <svg className="w-8 h-8 text-gray-400 mx-auto group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-xs text-gray-500 mt-1 block">Tải ảnh bìa lên</span>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-lg shadow-lg">Tải ảnh lên</span>
                          </div>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleUploadImage(e.target.files[0], 'coverImage');
                        }} />
                      </label>
                      <input type="text" placeholder="URL của Ảnh bìa" value={formData.coverImage} onChange={(e) => setFormData({...formData, coverImage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-sm mt-2" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Màu sắc chủ đạo (Theme Color)</h2>
                    <p className="text-sm text-gray-500 mt-1">Chọn màu sắc chính cho trang nhà hàng để phù hợp với thương hiệu.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={formData.primaryColor} 
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={formData.primaryColor} 
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-sm w-28 uppercase font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {["#FF380B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({...formData, primaryColor: color})}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${formData.primaryColor === color ? 'scale-125 border-gray-400' : 'border-transparent hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Live preview button */}
                  <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                    <button 
                      type="button" 
                      className="px-6 py-2 rounded-full text-white font-medium shadow transition-opacity hover:opacity-90"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Nút bấm mẫu
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Nút trên trang khách sẽ có màu này.</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thư viện ảnh quán (Gallery)</h2>
                      <p className="text-sm text-gray-500 mt-1">Hình ảnh không gian quán, món ăn đẹp.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const url = prompt("Nhập URL hình ảnh mới:");
                          if (url) setFormData({...formData, gallery: [...formData.gallery, url]});
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                      >
                        Thêm từ URL
                      </button>
                      <label className="cursor-pointer px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors">
                        Tải ảnh lên
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleUploadImage(e.target.files[0], 'gallery');
                        }} />
                      </label>
                    </div>
                  </div>
                  
                  {formData.gallery.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                      <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-sm text-gray-500">Chưa có ảnh nào trong thư viện.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {formData.gallery.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200 dark:border-gray-700">
                          <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, gallery: formData.gallery.filter((_, i) => i !== idx)})}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content: Reservation Settings */}
            {activeTab === "reservation" && (
              <div className="space-y-6">
                {/* Hours & Booking Window */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Giờ Hoạt Động & Thời Gian Đặt Trước
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Giờ mở cửa đặt bàn</label>
                      <input 
                        type="time" 
                        value={formData.reservationConfig.opening_time} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, opening_time: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Giờ đóng cửa đặt bàn</label>
                      <input 
                        type="time" 
                        value={formData.reservationConfig.closing_time} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, closing_time: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Thời gian đặt bàn muộn nhất trước giờ đóng cửa (phút){" "}
                        <span className="text-xs text-gray-400 font-normal ml-1.5">(PRD mặc định: 60 phút)</span>
                      </label>
                      <input 
                        type="number" 
                        min={0}
                        value={formData.reservationConfig.last_booking_before_close_minutes} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, last_booking_before_close_minutes: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Thời gian đặt trước tối thiểu (tiếng){" "}
                        <span className="text-xs text-gray-400 font-normal ml-1.5">(PRD mặc định: 1 tiếng)</span>
                      </label>
                      <input 
                        type="number" 
                        min={0}
                        value={formData.reservationConfig.min_advance_booking_hours} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, min_advance_booking_hours: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Thời gian đặt trước tối đa (ngày){" "}
                        <span className="text-xs text-gray-400 font-normal ml-1.5">(PRD mặc định: 30 ngày)</span>
                      </label>
                      <input 
                        type="number" 
                        min={1}
                        value={formData.reservationConfig.max_advance_booking_days} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, max_advance_booking_days: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Check-in & No-show Thresholds */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Quy Trình Check-in & Tự Động Đánh Dấu No-show
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Cho phép check-in sớm tối đa (phút){" "}
                        <span className="text-xs text-gray-400 font-normal ml-1.5">(PRD mặc định: 15 phút)</span>
                      </label>
                      <input 
                        type="number" 
                        min={0}
                        value={formData.reservationConfig.early_checkin_minutes} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, early_checkin_minutes: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Thời gian trễ tối đa trước khi No-show (phút){" "}
                        <span className="text-xs text-gray-400 font-normal ml-1.5">(PRD mặc định: 30 phút)</span>
                      </label>
                      <input 
                        type="number" 
                        min={1}
                        value={formData.reservationConfig.late_checkin_minutes} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, late_checkin_minutes: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Deposit & Cancellation Policies */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Yêu Cầu Đặt Cọc & Chính Sách Hủy Bàn
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">Cấu hình tiền cọc bắt buộc để tránh khách ảo/bùng bàn.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.reservationConfig.deposit_enabled} 
                        onChange={(e) => setFormData({
                          ...formData,
                          reservationConfig: { ...formData.reservationConfig, deposit_enabled: e.target.checked }
                        })} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {formData.reservationConfig.deposit_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 transition-all duration-300">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Số tiền cọc cố định (VND)</label>
                        <input 
                          type="number" 
                          min={0}
                          placeholder="Mặc định: 25k/chỗ"
                          value={formData.reservationConfig.deposit_amount} 
                          onChange={(e) => setFormData({
                            ...formData,
                            reservationConfig: { ...formData.reservationConfig, deposit_amount: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          Thời hạn xác nhận cọc (phút){" "}
                          <span className="text-xs text-gray-400 font-normal ml-1.5">(PRD mặc định: 120 phút)</span>
                        </label>
                        <input 
                          type="number" 
                          min={1}
                          value={formData.reservationConfig.deposit_confirmation_timeout_minutes} 
                          onChange={(e) => setFormData({
                            ...formData,
                            reservationConfig: { ...formData.reservationConfig, deposit_confirmation_timeout_minutes: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          Thời hạn hủy cọc miễn phí (tiếng){" "}
                          <span className="text-xs text-gray-400 font-normal ml-1.5">(PRD mặc định: 12 tiếng)</span>
                        </label>
                        <input 
                          type="number" 
                          min={0}
                          value={formData.reservationConfig.free_cancellation_hours} 
                          onChange={(e) => setFormData({
                            ...formData,
                            reservationConfig: { ...formData.reservationConfig, free_cancellation_hours: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Closed Dates Manager */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Quản Lý Ngày Đóng Cửa / Ngày Nghỉ
                  </h2>
                  <p className="text-xs text-gray-500">Khách hàng sẽ không thể đặt bàn vào các ngày này.</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="date"
                      value={newClosedDate}
                      onChange={(e) => setNewClosedDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newClosedDate) return;
                        if (formData.reservationConfig.closed_dates.includes(newClosedDate)) {
                          alert("Ngày này đã được thêm.");
                          return;
                        }
                        setFormData({
                          ...formData,
                          reservationConfig: {
                            ...formData.reservationConfig,
                            closed_dates: [...formData.reservationConfig.closed_dates, newClosedDate].sort()
                          }
                        });
                        setNewClosedDate("");
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Thêm Ngày Nghỉ
                    </button>
                  </div>

                  {formData.reservationConfig.closed_dates.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500">
                      Chưa cấu hình ngày nghỉ nào. Nhà hàng mở cửa tất cả các ngày trong năm.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.reservationConfig.closed_dates.map((date) => (
                        <div key={date} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-full text-sm transition-colors">
                          <span>{date}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              reservationConfig: {
                                ...formData.reservationConfig,
                                closed_dates: formData.reservationConfig.closed_dates.filter(d => d !== date)
                              }
                            })}
                            className="w-4 h-4 bg-gray-300 dark:bg-gray-600 hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
