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
import { useAuth } from "@/lib/contexts/AuthContext";
import authService from "@/lib/services/authService";

const resolveRestaurantUrl = (url: string) => {
  if (!url) return "#";
  
  const isHomepage = typeof window !== "undefined" && 
    (window.location.pathname === "/" || window.location.pathname === "/restaurant");

  let target = url;
  if (url === "/menu" || url === "menu") {
    target = "/restaurant/menu";
  } else if (url === "/reservation" || url === "reservation" || url === "#reservation") {
    target = "/restaurant/reservations/new";
  }

  if (target.startsWith("#") && !isHomepage) {
    return `/restaurant${target}`;
  }

  return target;
};

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

// ── Published Layout Renderers ──────────────────────────────────────────────────

function PublishedHeader({ props, brandColor }: { props: any; brandColor: string }) {
  const links = Array.isArray(props.links) ? props.links : [];

  return (
    <header 
      style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--card, #FFFFFF)", 
        borderBottom: "1px solid var(--border, #E2E8F0)",
        backdropFilter: "blur(20px)",
        height: 72,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo and Business Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {props.logoUrl ? (
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={props.logoUrl} alt={props.businessName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontWeight: "bold", 
                fontSize: 18, 
                color: "#fff",
                background: brandColor,
              }}
            >
              {props.businessName ? props.businessName.charAt(0).toUpperCase() : "R"}
            </div>
          )}
          <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
            {props.businessName || "Restaurant"}
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 24 }} className="hidden md:flex">
          {links.map((link: any, i: number) => (
            <a
              key={i}
              href={resolveRestaurantUrl(link.href)}
              style={{ 
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = brandColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 600, gap: 6, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            Open Now
          </span>
          
          {props.ctaText && (
            <a
              href={resolveRestaurantUrl(props.ctaLink)}
              style={{
                background: brandColor,
                color: "#fff",
                textDecoration: "none",
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                display: "inline-block",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
              }}
            >
              {props.ctaText}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function PublishedHero({ props, brandColor }: { props: any; brandColor: string }) {
  const hasLogo = !!props.logoUrl;

  return (
    <section
      style={{
        position: "relative",
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        padding: "80px 24px",
        background: `linear-gradient(135deg,rgba(0,0,0,${(props.overlayOpacity || 0.65) * 1.3}) 0%,rgba(0,0,0,${props.overlayOpacity || 0.65}) 100%), url(${props.backgroundImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", zIndex: 2 }}>
        {hasLogo ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-left space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 900, lineHeight: 1.1, margin: 0 }}
              >
                {props.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ fontSize: "clamp(1rem,1.8vw,1.2rem)", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.6 }}
              >
                {props.subtitle}
              </motion.p>
              {props.ctaText && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="pt-2">
                  <Link href={resolveRestaurantUrl(props.ctaLink || "#reservation")}>
                    <Button
                      type="primary"
                      size="large"
                      style={{
                        background: brandColor,
                        borderColor: brandColor,
                        height: 56,
                        padding: "0 44px",
                        fontWeight: 700,
                        fontSize: 17,
                        boxShadow: `0 8px 24px ${brandColor}40`,
                        borderRadius: 8,
                      }}
                    >
                      {props.ctaText}
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Right Logo Column */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105"
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: "24%",
                  background: "rgba(255,255,255,0.1)",
                  border: "3px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 20px 48px rgba(0,0,0,0.3)",
                }}
              >
                <img
                  src={props.logoUrl}
                  alt={props.title}
                  style={{ width: "88%", height: "88%", objectFit: "contain" }}
                />
              </motion.div>
            </div>
          </div>
        ) : (
          /* Standard Centered Layout */
          <div style={{ textAlign: "center" }} className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: "clamp(2.5rem,6vw,4.2rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}
            >
              {props.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", color: "rgba(255,255,255,0.85)", marginBottom: 32 }}
            >
              {props.subtitle}
            </motion.p>
            {props.ctaText && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Link href={resolveRestaurantUrl(props.ctaLink || "#reservation")}>
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      background: brandColor,
                      borderColor: brandColor,
                      height: 56,
                      padding: "0 44px",
                      fontWeight: 700,
                      fontSize: 17,
                      boxShadow: `0 8px 24px ${brandColor}40`,
                      borderRadius: 8,
                    }}
                  >
                    {props.ctaText}
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function PublishedStats({ props }: { props: any }) {
  const stats = Array.isArray(props.stats) ? props.stats : [];
  return (
    <section
      style={{
        padding: "32px 24px",
        background: props.backgroundColor || "var(--primary, #FF380B)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s: any, i: number) => (
            <div key={i} className="space-y-1">
              <p
                style={{ color: "#fff", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, margin: 0 }}
              >
                {s.value}
              </p>
              <p
                style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0 }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PublishedInfoCards({ props, brandColor }: { props: any; brandColor: string }) {
  const cards = Array.isArray(props.cards) ? props.cards : [];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "MapPin":
        return <Icon.Location />;
      case "Clock":
        return <Icon.Clock />;
      case "Phone":
        return <Icon.Phone />;
      default:
        return <Icon.Location />;
    }
  };

  return (
    <section style={{ padding: "48px 24px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card: any, i: number) => (
            <div
              key={i}
              className="p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  background: `${brandColor}18`,
                  color: brandColor,
                }}
              >
                {getIcon(card.icon)}
              </div>
              <h3
                style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, marginTop: 0, color: "var(--text)" }}
              >
                {card.title}
              </h3>
              <p
                style={{ fontSize: 13, margin: 0, lineHeight: 1.5, color: "var(--text-muted)" }}
              >
                {card.content}
              </p>
              {card.sub && (
                <p
                  style={{ fontSize: 12, marginTop: 4, margin: 0, color: "var(--text-muted)", opacity: 0.8 }}
                >
                  {card.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function PublishedAbout({ props, brandColor }: { props: any; brandColor: string }) {
  return (
    <section style={{ padding: "80px 24px", background: "var(--surface, var(--bg-base))" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>
              {props.heading || "Về Chúng Tôi"}
            </span>
            <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
              Tinh Hoa Ẩm Thực
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8 }}>{props.story}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(props.values || []).map((val: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{val.icon}</span>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{val.title}</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{val.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 24, overflow: "hidden", height: 400, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}>
            <img
              src={props.image || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80"}
              alt="Về chúng tôi"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PublishedMenuGrid({ props, brandColor }: { props: any; brandColor: string }) {
  const categories = Array.isArray(props.categories) ? props.categories : [];
  return (
    <section style={{ padding: "80px 24px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>
            Thực Đơn Của Quán
          </span>
          <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "var(--text)", marginTop: 8 }}>
            {props.title}
          </h2>
          {props.subtitle && (
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>{props.subtitle}</p>
          )}
        </div>

        {categories.map((cat: any, ci: number) => (
          <div key={ci} style={{ marginBottom: 48 }}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: brandColor,
                borderBottom: `2px solid ${brandColor}`,
                paddingBottom: 6,
                marginBottom: 24,
                display: "inline-block",
              }}
            >
              {cat.name}
            </h3>
            <div className={`grid gap-6 ${props.layout === "list" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {(cat.items || []).map((item: any, ii: number) => (
                <div
                  key={ii}
                  className="flex gap-4 p-4 rounded-2xl animate-card"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}
                >
                  {item.image && (
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>{item.name}</h4>
                        {item.badge && (
                          <span
                            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                            style={{ background: `${brandColor}18`, color: brandColor }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {props.showPrices !== false && (
                        <span style={{ fontSize: 15, fontWeight: 800, color: brandColor }}>{item.price}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PublishedOpeningHours({ props, brandColor }: { props: any; brandColor: string }) {
  return (
    <section style={{ padding: "80px 24px", background: "var(--surface, var(--bg-base))" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>
          Thời Gian Phục Vụ
        </span>
        <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 32px" }}>
          {props.title}
        </h2>
        <div
          className="space-y-4 text-left"
          style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}
        >
          {(props.hours || []).map((h: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center py-2"
              style={{ borderBottom: i < props.hours.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{h.day}</span>
              <span style={{ fontSize: 14, color: h.closed ? "var(--text-muted)" : "var(--text)" }}>
                {h.closed ? "Đóng Cửa" : `${h.open} - ${h.close}`}
              </span>
            </div>
          ))}
          {props.note && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 16 }}>ℹ️ {props.note}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function PublishedLocationMap({ props, brandColor }: { props: any; brandColor: string }) {
  return (
    <section style={{ padding: "80px 24px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>
            Tìm Đường Đến Quán
          </span>
          <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>
            {props.title}
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }} className="space-y-4">
              {[
                { icon: <Icon.Location />, label: "Địa Chỉ", value: props.address },
                { icon: <Icon.Phone />, label: "Điện Thoại", value: props.phone },
                { icon: <Icon.Email />, label: "Email", value: props.email },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${brandColor}18`,
                      color: brandColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                      {item.label}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/restaurant/reservations/new">
              <Button type="primary" block size="large" style={{ background: brandColor, borderColor: brandColor, height: 54, fontWeight: 700, borderRadius: 8, fontSize: 16 }}>
                Đặt Bàn Ngay
              </Button>
            </Link>
          </div>
          <div className="lg:col-span-3">
            <MapEmbed address={props.address} lat={props.coordinates?.lat} lng={props.coordinates?.lng} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PublishedFooter({ props, brandColor }: { props: any; brandColor: string }) {
  return (
    <footer style={{ background: "var(--card)", borderTop: "1px solid var(--border)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 style={{ fontSize: 18, fontWeight: 800, color: brandColor }}>{props.businessName}</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{props.description}</p>
        </div>
        <div className="space-y-4">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Liên Kết</h4>
          <ul className="space-y-2">
            {(props.links || []).map((l: any, i: number) => (
              <li key={i}>
                <a href={resolveRestaurantUrl(l.href)} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Mạng Xã Hội</h4>
          <div className="flex gap-4">
            {(props.socialMedia || []).map((s: any, i: number) => (
              <a key={i} href={s.url} style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {s.platform}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: "24px auto 0", paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{props.copyright}</p>
      </div>
    </footer>
  );
}

function PublishedGallery({ props, brandColor }: { props: any; brandColor: string }) {
  const images = Array.isArray(props.images) ? props.images : [];
  return (
    <section style={{ padding: "80px 24px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>
            Hình Ảnh
          </span>
          <h2 style={{ fontSize: "clamp(1.6rem,2.5vw,2.2rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>
            {props.title || "Hình Ảnh Nhà Hàng"}
          </h2>
        </div>
        <Gallery images={images} />
      </div>
    </section>
  );
}

function PublishedTestimonials({ props, brandColor }: { props: any; brandColor: string }) {
  const reviews = Array.isArray(props.reviews) ? props.reviews : [];
  return (
    <section style={{ padding: "80px 24px", background: "var(--surface, var(--bg-base))" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>
            Đánh Giá
          </span>
          <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>
            {props.title || "Khách Hàng Nói Gì"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r: any, i: number) => (
            <div
              key={i}
              style={{
                padding: 24,
                borderRadius: 20,
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              }}
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: r.rating || 5 }).map((_, j) => (
                  <Icon.Star key={j} />
                ))}
              </div>
              <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>"{r.text}"</p>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginTop: 16 }}>— {r.name}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PublishedReservationCTA({ props, brandColor }: { props: any; brandColor: string }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "80px 24px",
        background: `linear-gradient(135deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.75) 100%), url(${props.backgroundImage || "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&auto=format&fit=crop&q=80"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff",
        textAlign: "center",
        borderRadius: 24,
        margin: "0 24px 72px",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="space-y-6">
        <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800 }}>{props.title}</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)" }}>{props.description}</p>
        <Link href={props.buttonLink || "/restaurant/reservations/new"}>
          <Button type="primary" size="large" style={{ background: brandColor, borderColor: brandColor, height: 54, padding: "0 44px", fontWeight: 700, borderRadius: 8, fontSize: 16 }}>
            {props.buttonText}
          </Button>
        </Link>
      </div>
    </section>
  );
}

function PublishedContact({ props, brandColor }: { props: any; brandColor: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Tin nhắn của bạn đã được gửi thành công! 🎉");
    setForm({ name: "", email: "", phone: "", message: "" });
  };
  return (
    <section style={{ padding: "80px 24px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: brandColor }}>
            Liên Hệ
          </span>
          <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>
            {props.title || "Liên Hệ Với Chúng Tôi"}
          </h2>
          {props.subtitle && <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>{props.subtitle}</p>}
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}
          className="space-y-4"
        >
          {props.fields?.map((f: any, i: number) => (
            <div key={i} className="flex flex-col gap-2">
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  required={f.required}
                  value={(form as any)[f.label.toLowerCase()] || ""}
                  onChange={(e) => setForm({ ...form, [f.label.toLowerCase()]: e.target.value })}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text)",
                    minHeight: 100,
                  }}
                />
              ) : (
                <input
                  type={f.type}
                  required={f.required}
                  value={(form as any)[f.label.toLowerCase()] || ""}
                  onChange={(e) => setForm({ ...form, [f.label.toLowerCase()]: e.target.value })}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text)",
                  }}
                />
              )}
            </div>
          ))}
          <Button type="primary" htmlType="submit" size="large" block style={{ background: brandColor, borderColor: brandColor, height: 48, fontWeight: 700 }}>
            {props.submitText || "Gửi Tin Nhắn"}
          </Button>
        </form>
      </div>
    </section>
  );
}

const ANIMATION_VARIANTS = {
  none: {
    initial: {},
    whileInView: {},
    transition: {}
  },
  fadeIn: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { duration: 0.8, ease: "easeOut" }
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
  slideLeft: {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

function PublishedLayoutRenderer({ layout, brandColor }: { layout: any; brandColor: string }) {
  const sections = Array.isArray(layout.sections) ? layout.sections : [];

  return (
    <div style={{ fontFamily: layout.theme?.fontFamily || "Inter, sans-serif" }}>
      {sections
        .filter((s: any) => s.visible)
        .map((s: any) => {
          const animType = (s.props?.animation as keyof typeof ANIMATION_VARIANTS) || "none";
          const anim = ANIMATION_VARIANTS[animType] || ANIMATION_VARIANTS.none;

          const renderedComponent = (() => {
            switch (s.type) {
              case "header":
                return <PublishedHeader props={s.props} brandColor={brandColor} />;
              case "hero":
                return <PublishedHero props={s.props} brandColor={brandColor} />;
              case "stats":
                return <PublishedStats props={s.props} />;
              case "info-cards":
                return <PublishedInfoCards props={s.props} brandColor={brandColor} />;
              case "about":
                return <PublishedAbout props={s.props} brandColor={brandColor} />;
              case "menu-grid":
              case "menu-featured":
                return <PublishedMenuGrid props={s.props} brandColor={brandColor} />;
              case "opening-hours":
                return <PublishedOpeningHours props={s.props} brandColor={brandColor} />;
              case "location-map":
                return <PublishedLocationMap props={s.props} brandColor={brandColor} />;
              case "gallery":
                return <PublishedGallery props={s.props} brandColor={brandColor} />;
              case "testimonials":
                return <PublishedTestimonials props={s.props} brandColor={brandColor} />;
              case "reservation-cta":
                return <PublishedReservationCTA props={s.props} brandColor={brandColor} />;
              case "contact":
                return <PublishedContact props={s.props} brandColor={brandColor} />;
              case "footer":
                return <PublishedFooter props={s.props} brandColor={brandColor} />;
              default:
                return null;
            }
          })();

          if (!renderedComponent) return null;

          const sectionId = (() => {
            if (s.type === "menu-grid" || s.type === "menu-featured") return "menu";
            if (s.type === "location-map" || s.type === "contact") return "contact";
            if (s.type === "about") return "about";
            if (s.type === "gallery") return "gallery";
            if (s.type === "opening-hours") return "hours";
            if (s.type === "testimonials") return "testimonials";
            return undefined;
          })();

          if (s.type === "header" || s.type === "footer") {
            return <div key={s.id} id={sectionId}>{renderedComponent}</div>;
          }

          return (
            <motion.div
              key={s.id}
              id={sectionId}
              initial={anim.initial}
              whileInView={anim.whileInView}
              viewport={{ once: true, margin: "-100px" }}
              transition={anim.transition}
            >
              {renderedComponent}
            </motion.div>
          );
        })}
    </div>
  );
}

export default function RestaurantLandingPage() {
  const { tenant, loading } = useTenant();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const { user } = useAuth();
  const [publishedLayout, setPublishedLayout] = useState<any>(null);

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

  useEffect(() => {
    if (!data.id) return;
    
    // Fetch published layout from builder using dynamic URL and disable cache
    const builderUrl = process.env.NEXT_PUBLIC_BUILDER_URL || "http://localhost:3001";
    fetch(`${builderUrl}/api/layouts?tenantId=${data.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((layouts) => {
        if (Array.isArray(layouts)) {
          const published = layouts.find((l: any) => l.status === "published");
          if (published) {
            setPublishedLayout(published);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load published layout from MongoDB builder:", err);
      });
  }, [data.id]);

  const isOwnerOrStaff = user && (user.restaurantId === data.id || user.restaurantSlug === data.slug);
  const brandColor = data.primaryColor || "#FF380B";
  const isPreview = !tenant;

  useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty('--primary', brandColor);
    }
  }, [brandColor]);

  useEffect(() => {
    if (publishedLayout?.theme?.mode) {
      document.documentElement.setAttribute('data-theme', publishedLayout.theme.mode);
    }
  }, [publishedLayout]);

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

  if (publishedLayout) {
    const hasHeader = publishedLayout.sections?.some((s: any) => s.type === "header" && s.visible);

    return (
      <PageTransition minimumLoadingTime={800}>
        <div style={{ minHeight: "100vh", background: publishedLayout.theme?.mode === "light" ? "#F8FAFC" : "#0A0E14" }}>
          {!hasHeader && <Header />}
          <main style={{ paddingTop: hasHeader ? 72 : 84 }}>
            {isPreview && (
              <div style={{ background: "linear-gradient(90deg,#f59e0b,#d97706)", color: "#fff", textAlign: "center", padding: "10px 24px", fontSize: 13, fontWeight: 600 }}>
                ⚠️ Chế độ xem trước — Chưa được cấu hình tên miền chính thức
              </div>
            )}
            
            <PublishedLayoutRenderer layout={publishedLayout} brandColor={brandColor} />

            {/* Staff portal link */}
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

          {/* Floating Edit Button for Owner/Staff */}
          {isOwnerOrStaff && (
            <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 9999 }}>
              <a
                href={`${process.env.NEXT_PUBLIC_BUILDER_URL || "http://localhost:3001"}/editor?tenantId=${data.id || ""}&token=${authService.getAccessToken() || ""}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  type="primary"
                  size="large"
                  style={{
                    background: "#10B981", // Emerald green
                    borderColor: "#10B981",
                    height: 54,
                    padding: "0 24px",
                    boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
                    fontWeight: 700,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#fff",
                    borderRadius: 10,
                  }}
                >
                  <span>✏️ Thiết Kế Website</span>
                </Button>
              </a>
            </div>
          )}
        </div>
      </PageTransition>
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
                      <Button type="primary" size="large"
                        style={{ background: brandColor, borderColor: brandColor, height: 56, padding: "0 40px", fontWeight: 700, fontSize: 16, boxShadow: `0 8px 24px ${brandColor}40`, borderRadius: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon.Menu /> Xem Thực Đơn</span>
                      </Button>
                    </Link>
                    <Link href="/restaurant/reservations/new">
                      <Button size="large"
                        style={{ height: 56, padding: "0 40px", fontWeight: 700, fontSize: 16, background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8 }}>
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
                  <Button type="primary" size="large"
                    style={{ background: brandColor, borderColor: brandColor, height: 54, padding: "0 44px", fontWeight: 700, borderRadius: 8, fontSize: 16 }}>
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
                    <Link href="/restaurant/reservations/new">
                      <Button type="primary" block size="large"
                        style={{ background: brandColor, borderColor: brandColor, fontWeight: 700, height: 54, borderRadius: 8, fontSize: 16 }}>
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

        {/* Floating Edit Button for Owner/Staff */}
        {isOwnerOrStaff && (
          <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 9999 }}>
            <a
              href={`${process.env.NEXT_PUBLIC_BUILDER_URL || "http://localhost:3001"}/editor?tenantId=${data.id || ""}&token=${authService.getAccessToken() || ""}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="primary"
                size="large"
                style={{
                  background: "#10B981", // Emerald green
                  borderColor: "#10B981",
                  height: 54,
                  padding: "0 24px",
                  boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
                  fontWeight: 700,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#fff",
                  borderRadius: 10,
                }}
              >
                <span>✏️ Thiết Kế Website</span>
              </Button>
            </a>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
