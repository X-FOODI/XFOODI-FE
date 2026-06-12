"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "../../lib/contexts/TenantContext";
import restaurantApplicationService from "../../lib/services/restaurantApplicationService";
import PageTransition from "../components/PageTransition";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "antd";

// ── Icons (inline SVG to avoid MUI dependency issues) ──────────────────────────
const Icon = {
  Location: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Phone: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Email: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Star: () => (
    <svg width="14" height="14" fill="#f59e0b" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Menu: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Arrow: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  Restaurant: () => (
    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const FALLBACK_TENANT: any = {
  name: "Gia Đình Quán",
  businessName: "Gia Đình Quán Co., Ltd",
  logoUrl: "",
  primaryColor: "#FF380B",
  aboutUs: "Chào mừng quý khách đến với không gian ẩm thực ấm cúng và tinh tế của chúng tôi. Chúng tôi tự hào mang đến những món ăn truyền thống chuẩn vị cùng phong cách phục vụ tận tâm, chu đáo từ trái tim.",
  businessAddressLine1: "123 Đường Hải Phòng, Hải Châu, Đà Nẵng",
  businessPrimaryPhone: "0905 123 456",
  businessEmailAddress: "contact@giadinhquan.vn",
  businessOpeningHours: "08:00 - 22:00",
  backgroundUrl: "",
  overview: "Món ăn ngon đậm đà bản sắc Việt",
  // Mock lat/lng for Đà Nẵng city center
  latitude: 16.0544,
  longitude: 108.2022,
};

const GALLERY_IMAGES = [
  { src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80", alt: "Không gian nhà hàng" },
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80", alt: "Bếp và đầu bếp" },
  { src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80", alt: "Khu vực ăn uống" },
  { src: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&auto=format&fit=crop&q=80", alt: "Bàn tiệc" },
  { src: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&auto=format&fit=crop&q=80", alt: "Quầy bar" },
  { src: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&auto=format&fit=crop&q=80", alt: "Góc thư giãn" },
];

const DISH_HIGHLIGHTS = [
  {
    name: "Phở Bò Kobe Đặc Biệt",
    description: "Nước dùng trong vắt ninh từ ống bò 24 giờ cùng thịt bò Kobe thái mỏng mềm tan.",
    price: "189.000đ",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60",
    tag: "Bán chạy",
  },
  {
    name: "Cơm Tấm Sườn Bì Chả",
    description: "Gạo tấm thơm dẻo, sườn nướng mật ong vàng ruộm cùng chả chưng trứng muối đậm đà.",
    price: "69.000đ",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
    tag: "Đặc sản",
  },
  {
    name: "Gỏi Cuốn Tôm Thịt",
    description: "Tôm luộc, thịt ba chỉ, bún tươi và rau thơm cuộn bánh tráng chấm sốt tương đen đặc sản.",
    price: "45.000đ",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=60",
    tag: "Mới",
  },
];

const STATS = [
  { value: "500+", label: "Khách hàng mỗi ngày" },
  { value: "50+", label: "Món ăn đặc sắc" },
  { value: "10+", label: "Năm kinh nghiệm" },
  { value: "4.9★", label: "Đánh giá trung bình" },
];

const dayNamesMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

// ── Gallery component ──────────────────────────────────────────────────────────
function Gallery({ images }: { images: typeof GALLERY_IMAGES }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActive(i)}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              cursor: "pointer",
              aspectRatio: "4/3",
              background: "var(--surface)",
            }}
          >
            <img src={img.src} alt={img.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.92)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setActive((p) => (p! > 0 ? p! - 1 : images.length - 1)); }}
              style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon.ChevronLeft />
            </button>
            <motion.img
              key={active}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={images[active].src}
              alt={images[active].alt}
              style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 16, objectFit: "contain" }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setActive((p) => (p! < images.length - 1 ? p! + 1 : 0)); }}
              style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon.ChevronRight />
            </button>
            <div style={{ position: "absolute", bottom: 24, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              {active + 1} / {images.length} — {images[active].alt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Map component — geocode via Nominatim, embed OSM iframe ────────────────────
function MapEmbed({ address, lat, lng }: { address: string; lat?: number | null; lng?: number | null }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  );
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    // Nếu đã có lat/lng từ BE — dùng luôn, không cần geocode
    if (lat && lng) {
      setCoords({ lat, lng });
      return;
    }
    // Fallback: geocode từ address text qua Nominatim
    if (!address) return;
    setGeocoding(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "vi" } }
    )
      .then((r) => r.json())
      .then((results) => {
        if (results && results[0]) {
          setCoords({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
        }
      })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, [address, lat, lng]);

  const embedSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005},${coords.lat - 0.005},${coords.lng + 0.005},${coords.lat + 0.005}&layer=mapnik&marker=${coords.lat},${coords.lng}`
    : null;

  const link = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(address || "Việt Nam")}`;

  if (!address) return null;

  return (
    <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
      {geocoding && (
        <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
          <div style={{ textAlign: "center" }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Đang tải bản đồ...</p>
          </div>
        </div>
      )}
      {!geocoding && embedSrc && (
        <iframe
          key={embedSrc}
          title="Bản đồ nhà hàng"
          src={embedSrc}
          width="100%"
          height="360"
          style={{ border: "none", display: "block" }}
          loading="lazy"
          allowFullScreen
        />
      )}
      {!geocoding && !embedSrc && (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", flexDirection: "column", gap: 8 }}>
          <Icon.Location />
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "0 24px" }}>{address}</p>
        </div>
      )}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "12px 16px",
          background: "var(--card)",
          color: "var(--text-muted)",
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          borderTop: "1px solid var(--border)",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Icon.Location />
        {address} — Xem trên OpenStreetMap ↗
      </a>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RestaurantLandingPage() {
  const { tenant, loading } = useTenant();
  const [restaurantData, setRestaurantData] = useState<any>(null);

  // Fetch public restaurant data by slug — không cần auth
  useEffect(() => {
    const slug = tenant?.prefix;
    if (!slug) return;
    
    // Gọi tương đối qua Next.js proxy (cổng 3000) để tránh lỗi CORS hoặc hardcode port
    fetch(`/api/restaurants/${slug}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setRestaurantData(res.data);
      })
      .catch(() => {});
  }, [tenant?.prefix]);

  // Merge: restaurantData (từ API mới) > tenant > FALLBACK_TENANT
  const base = tenant || FALLBACK_TENANT;
  const data = {
    ...base,
    name: restaurantData?.name || base.name,
    businessAddressLine1: restaurantData?.address || base.businessAddressLine1,
    businessPrimaryPhone: restaurantData?.phone || base.businessPrimaryPhone,
    businessEmailAddress: restaurantData?.email || base.businessEmailAddress,
    aboutUs: restaurantData?.description || base.aboutUs,
    logoUrl: restaurantData?.logoUrl || base.logoUrl,
    primaryColor: restaurantData?.primaryColor || base.primaryColor,
    backgroundUrl: restaurantData?.metadata?.coverImage || base.backgroundUrl,
    gallery: restaurantData?.metadata?.gallery && restaurantData.metadata.gallery.length > 0 
      ? restaurantData.metadata.gallery.map((url: string) => ({ src: url, alt: "Không gian quán" })) 
      : GALLERY_IMAGES,
    operatingHours: restaurantData?.metadata?.operatingHours,
    latitude: restaurantData?.latitude,
    longitude: restaurantData?.longitude,
  };
  const brandColor = data.primaryColor || "#FF380B";
  const isPreview = !tenant;

  useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty('--primary', brandColor);
    }
  }, [brandColor]);

  const address = [
    data.businessAddressLine1,
    (data as any).businessAddressLine2,
    (data as any).businessAddressLine3,
    (data as any).businessAddressLine4,
  ].filter(Boolean).join(", ");
  
  const todayKey = dayNamesMap[new Date().getDay()];
  const todayHours = data.operatingHours?.[todayKey];
  const openingHoursText = todayHours 
    ? (todayHours.isOpen ? `${todayHours.open} - ${todayHours.close}` : "Đóng cửa hôm nay")
    : (data.businessOpeningHours || "08:00 – 22:00");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: brandColor }} />
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Đang tải trang nhà hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition minimumLoadingTime={800}>
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Header />
        <main style={{ paddingTop: 84 }}>

          {/* ── Preview banner ── */}
          {isPreview && (
            <div style={{ background: "linear-gradient(90deg,#f59e0b,#d97706)", color: "#fff", textAlign: "center", padding: "10px 24px", fontSize: 13, fontWeight: 600 }}>
              ⚠️ Chế độ xem trước — Chưa được cấu hình tên miền chính thức
            </div>
          )}

          {/* ── Hero ── */}
          <section style={{
            position: "relative", minHeight: "80vh", display: "flex", alignItems: "center",
            padding: "80px 24px",
            background: `linear-gradient(135deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.55) 100%), url(${data.backgroundUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80"})`,
            backgroundSize: "cover", backgroundPosition: "center", color: "#fff", overflow: "hidden",
          }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", zIndex: 2 }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    🍽️ Chào mừng quý khách
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 900, lineHeight: 1.1, margin: 0 }}>
                    {data.name}
                  </motion.h1>
                  {data.overview && (
                    <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                      style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", maxWidth: 520, margin: 0 }}>
                      {data.overview}
                    </motion.p>
                  )}
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-wrap gap-4 pt-2">
                    <Link href="/menu">
                      <Button type="primary" size="large" shape="round"
                        style={{ background: brandColor, borderColor: brandColor, height: 52, padding: "0 32px", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 24px ${brandColor}40` }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon.Menu /> Xem Thực Đơn</span>
                      </Button>
                    </Link>
                    <Link href="/customer">
                      <Button size="large" shape="round"
                        style={{ height: 52, padding: "0 32px", fontWeight: 700, fontSize: 15, background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>Đặt Bàn Online <Icon.Arrow /></span>
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                {/* Logo panel */}
                <div className="lg:col-span-5 flex justify-center">
                  <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ width: 260, height: 260, borderRadius: "24%", background: "rgba(255,255,255,0.1)", border: "3px solid rgba(255,255,255,0.2)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 20px 48px rgba(0,0,0,0.3)" }}>
                    {data.logoUrl
                      ? <img src={data.logoUrl} alt={data.name} style={{ width: "88%", height: "88%", objectFit: "contain" }} />
                      : <div style={{ color: brandColor }}><Icon.Restaurant /></div>}
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Stats bar ── */}
          <section style={{ background: brandColor, padding: "28px 24px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {STATS.map((s, i) => (
                  <div key={i}>
                    <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0 }}>{s.value}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Info cards ── */}
          <section style={{ padding: "72px 24px", background: "var(--bg-base)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: <Icon.Location />, title: "Địa Chỉ", content: address || "Liên hệ nhà hàng để biết thêm chi tiết" },
                  { icon: <Icon.Clock />, title: "Giờ Hoạt Động", content: `Hôm nay: ${openingHoursText}` },
                  { icon: <Icon.Phone />, title: "Liên Hệ", content: data.businessPrimaryPhone || "Chưa cập nhật", sub: data.businessEmailAddress },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    style={{ padding: 28, borderRadius: 20, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${brandColor}18`, color: brandColor, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      {card.icon}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>{card.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{card.content}</p>
                    {card.sub && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>{card.sub}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── About Us ── */}
          <section style={{ padding: "72px 24px", background: "var(--surface, var(--bg-base))" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-5">
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>Câu Chuyện Của Chúng Tôi</span>
                  <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1.2, margin: 0 }}>
                    Tinh Hoa Ẩm Thực<br />Được Gửi Gắm Trọn Vẹn
                  </h2>
                  <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8, margin: 0 }}>
                    {data.aboutUs || "Nhà hàng luôn nỗ lực đem lại cho thực khách những món ăn đậm đà, được chuẩn bị từ các nguyên liệu tươi sạch nhất trong ngày."}
                  </p>
                  <div className="flex flex-col gap-3 pt-2">
                    {["Nguyên liệu tươi sạch mỗi ngày", "Đầu bếp chuyên nghiệp 10+ năm kinh nghiệm", "Không gian ấm cúng, phục vụ tận tâm"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${brandColor}18`, color: brandColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon.Check />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  style={{ borderRadius: 24, overflow: "hidden", height: 400, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}>
                  <img
                    src={data.logoUrl || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80"}
                    alt="Về chúng tôi"
                    style={{ width: "100%", height: "100%", objectFit: data.logoUrl ? "contain" : "cover", background: "var(--card)", padding: data.logoUrl ? 32 : 0 }}
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── Gallery ── */}
          <section style={{ padding: "72px 24px", background: "var(--bg-base)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>Hình Ảnh</span>
                <h2 style={{ fontSize: "clamp(1.6rem,2.5vw,2.2rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>Không Gian Nhà Hàng</h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>Click vào ảnh để xem toàn màn hình</p>
              </div>
              <Gallery images={data.gallery} />
            </div>
          </section>

          {/* ── Dishes ── */}
          <section style={{ padding: "72px 24px", background: "var(--surface, var(--bg-base))" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>Thực Đơn Nổi Bật</span>
                <h2 style={{ fontSize: "clamp(1.6rem,2.5vw,2.2rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>Món Ăn Được Yêu Thích</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {DISH_HIGHLIGHTS.map((dish, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -6 }}
                    style={{ borderRadius: 20, overflow: "hidden", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                    <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                      <img src={dish.image} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", top: 12, left: 12, background: brandColor, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                        {dish.tag}
                      </span>
                    </div>
                    <div style={{ padding: 20 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>{dish.name}</h4>
                      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 16px" }}>{dish.description}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: brandColor }}>{dish.price}</span>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, j) => <Icon.Star key={j} />)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <Link href="/menu">
                  <Button type="primary" size="large" shape="round"
                    style={{ background: brandColor, borderColor: brandColor, height: 48, padding: "0 36px", fontWeight: 700 }}>
                    Xem toàn bộ thực đơn →
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Location & Map ── */}
          <section style={{ padding: "72px 24px", background: "var(--bg-base)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>Tìm Chúng Tôi</span>
                <h2 style={{ fontSize: "clamp(1.6rem,2.5vw,2.2rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>Vị Trí Nhà Hàng</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Contact details */}
                <div className="lg:col-span-2 space-y-5">
                  {[
                    { icon: <Icon.Location />, label: "Địa chỉ", value: address || "Liên hệ để biết thêm" },
                    { icon: <Icon.Phone />, label: "Điện thoại", value: data.businessPrimaryPhone || "Chưa cập nhật" },
                    { icon: <Icon.Email />, label: "Email", value: data.businessEmailAddress || "Chưa cập nhật" },
                    { icon: <Icon.Clock />, label: "Giờ mở cửa", value: openingHoursText },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${brandColor}15`, color: brandColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: "0 0 2px" }}>{item.label}</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>{item.value}</p>
                      </div>
                    </div>
                  ))}

                  {/* CTA */}
                  <div style={{ paddingTop: 8 }}>
                    <Link href="/customer">
                      <Button type="primary" block size="large" shape="round"
                        style={{ background: brandColor, borderColor: brandColor, fontWeight: 700, height: 48 }}>
                        Đặt Bàn Ngay
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Map */}
                <div className="lg:col-span-3">
                  <MapEmbed address={address} lat={data.latitude} lng={data.longitude} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Staff portal link ── */}
          <section style={{ padding: "32px 24px", background: "var(--surface, var(--bg-base))", borderTop: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
              <Link href="/admin">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "underline", cursor: "pointer" }}>
                  🔐 Cổng thông tin cho quản lý &amp; nhân viên nhà hàng
                </span>
              </Link>
            </div>
          </section>

        </main>
        <footer id="footer"><Footer /></footer>
      </div>
    </PageTransition>
  );
}
