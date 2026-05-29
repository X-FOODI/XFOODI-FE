"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "../../lib/contexts/TenantContext";
import restaurantApplicationService from "../../lib/services/restaurantApplicationService";
import PageTransition from "../components/PageTransition";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import {
  Restaurant as RestaurantIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  MenuBook as MenuBookIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
  Login as LoginIcon,
  CheckCircle as CheckCircleIcon,
  LocalOffer as LocalOfferIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { Button } from "antd";

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
};

const DISH_HIGHLIGHTS = [
  {
    name: "Phở Bò Kobe Đặc Biệt",
    description: "Nước dùng trong vắt ninh từ ống bò 24 giờ cùng thịt bò Kobe thái mỏng mềm tan.",
    price: "189.000đ",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60"
  },
  {
    name: "Cơm Tấm Sườn Bì Chả",
    description: "Gạo tấm thơm dẻo, sườn nướng mật ong vàng ruộm cùng chả chưng trứng muối đậm đà.",
    price: "69.000đ",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"
  },
  {
    name: "Gỏi Cuốn Tôm Thịt",
    description: "Tôm luộc, thịt ba chỉ, bún tươi và rau thơm cuộn bánh tráng chấm sốt tương đen đặc sản.",
    price: "45.000đ",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=60"
  }
];

export default function RestaurantLandingPage() {
  const { tenant, loading, error } = useTenant();
  const [myApp, setMyApp] = useState<any>(null);

  useEffect(() => {
    if (!tenant) {
      restaurantApplicationService.getMy()
        .then((app) => {
          if (app) {
            setMyApp({
              name: app.restaurantName,
              businessName: app.restaurantName,
              logoUrl: app.logoUrl,
              aboutUs: app.description || FALLBACK_TENANT.aboutUs,
              businessAddressLine1: app.address,
              businessPrimaryPhone: app.phone,
              businessEmailAddress: app.email,
              businessOpeningHours: FALLBACK_TENANT.businessOpeningHours,
              primaryColor: "#FF380B",
            });
          }
        })
        .catch(() => {});
    }
  }, [tenant]);

  // Use tenant config, matched myApp, or fall back to pre-filled preview data
  const data = tenant || myApp || FALLBACK_TENANT;
  const isPreview = !tenant;

  const brandColor = data.primaryColor || "#FF380B";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: brandColor }} />
          <p style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 500 }}>Đang tải trang nhà hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition minimumLoadingTime={1000}>
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Header />

        <main style={{ paddingTop: 84 }}>
          {/* ── Preview Mode Banner ── */}
          {isPreview && (
            <div style={{
              background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
              color: "#fff",
              textAlign: "center",
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <LocalOfferIcon sx={{ fontSize: 16 }} />
              Chế độ xem trước Nhà hàng mới (Chưa được cấu hình tên miền chính thức hoặc đang chờ duyệt đơn)
            </div>
          )}

          {/* ── Hero Banner Section ── */}
          <section style={{
            position: "relative",
            minHeight: "75vh",
            display: "flex",
            alignItems: "center",
            padding: "80px 24px",
            background: `linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 100%), url(${data.backgroundUrl || data.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80'})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "#fff",
            overflow: "hidden"
          }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", zIndex: 2 }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Brand info */}
                <div className="lg:col-span-7 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}
                  >
                    <RestaurantIcon sx={{ fontSize: 16, color: brandColor }} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Chào mừng quý khách</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-6xl font-black tracking-tight"
                    style={{ lineHeight: 1.15 }}
                  >
                    {data.name}
                  </motion.h1>

                  {data.overview && (
                    <motion.p
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-lg text-gray-200 font-medium max-w-xl"
                    >
                      {data.overview}
                    </motion.p>
                  )}

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-wrap gap-4 pt-2"
                  >
                    <Link href="/menu">
                      <Button
                        type="primary"
                        size="large"
                        shape="round"
                        style={{
                          background: brandColor,
                          borderColor: brandColor,
                          height: 52,
                          padding: "0 32px",
                          fontWeight: 700,
                          fontSize: 15,
                          boxShadow: `0 8px 24px rgba(255,56,11,0.25)`
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <MenuBookIcon /> Xem Thực Đơn
                        </span>
                      </Button>
                    </Link>

                    <Link href="/customer">
                      <Button
                        size="large"
                        shape="round"
                        style={{
                          height: 52,
                          padding: "0 32px",
                          fontWeight: 700,
                          fontSize: 15,
                          background: "rgba(255,255,255,0.1)",
                          borderColor: "rgba(255,255,255,0.3)",
                          color: "#fff"
                        }}
                        className="hover:bg-white/20 transition-all"
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          Đặt Bàn Online <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </span>
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                {/* Cover/Logo image panel */}
                <div className="lg:col-span-5 flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    style={{
                      width: 280,
                      height: 280,
                      borderRadius: "24%",
                      background: "rgba(255,255,255,0.1)",
                      border: "3px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(16px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      boxShadow: "0 20px 48px rgba(0,0,0,0.3)"
                    }}
                  >
                    {data.logoUrl ? (
                      <img
                        src={data.logoUrl}
                        alt={data.name}
                        style={{ width: "90%", height: "90%", objectFit: "contain", borderRadius: "20%" }}
                      />
                    ) : (
                      <RestaurantIcon sx={{ fontSize: 96, color: brandColor }} />
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Key Restaurant Features & Overview ── */}
          <section style={{ padding: "80px 24px", background: "var(--bg-base)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Location Box */}
                <div style={{
                  padding: 32,
                  borderRadius: 20,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${brandColor}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <LocationOnIcon style={{ color: brandColor }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Địa Chỉ</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {data.businessAddressLine1 || "Liên hệ nhà hàng để biết thêm chi tiết"}
                  </p>
                </div>

                {/* Opening Hours Box */}
                <div style={{
                  padding: 32,
                  borderRadius: 20,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${brandColor}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <AccessTimeIcon style={{ color: brandColor }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Giờ Hoạt Động</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Hàng ngày: {data.businessOpeningHours || "08:00 - 22:00"}
                  </p>
                </div>

                {/* Contact Box */}
                <div style={{
                  padding: 32,
                  borderRadius: 20,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${brandColor}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <PhoneIcon style={{ color: brandColor }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Liên Hệ</h3>
                  <p className="text-sm mb-1 font-semibold" style={{ color: "var(--text)" }}>
                    {data.businessPrimaryPhone || "Chưa cập nhật"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {data.businessEmailAddress || ""}
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* ── About Us Segment ── */}
          <section style={{ padding: "60px 24px", background: "var(--bg-light-base, var(--bg-base))" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left side text */}
                <div className="space-y-6">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>
                    Câu Chuyện Của Chúng Tôi
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--text)", lineHeight: 1.25 }}>
                    Tinh Hoa Ẩm Thực Được Gửi Gắm Trọn Vẹn
                  </h2>
                  <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {data.aboutUs || "Nhà hàng luôn nỗ lực đem lại cho thực khách những món ăn đậm đà, được chuẩn bị từ các nguyên liệu tươi sạch nhất trong ngày. Hãy đồng hành cùng chúng tôi để khám phá trọn vẹn văn hóa ẩm thực đặc trưng."}
                  </p>
                  <div className="flex gap-6 pt-2">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircleIcon style={{ color: brandColor, fontSize: 18 }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Nguyên liệu tươi sạch</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircleIcon style={{ color: brandColor, fontSize: 18 }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Đầu bếp chuyên nghiệp</span>
                    </div>
                  </div>
                </div>

                {/* Right side illustration */}
                <div style={{
                  position: "relative",
                  borderRadius: 24,
                  overflow: "hidden",
                  height: 380,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.05)",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: data.logoUrl ? 32 : 0
                }}>
                  {data.logoUrl ? (
                    <img
                      src={data.logoUrl}
                      alt={data.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 16 }}
                    />
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80"
                      alt="Interior and cooking"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>

              </div>
            </div>
          </section>

          {/* ── Dishes highlights ── */}
          <section style={{ padding: "80px 24px", background: "var(--bg-base)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>Thực Đơn Nổi Bật</span>
                <h2 className="text-3xl font-extrabold mt-2" style={{ color: "var(--text)" }}>Món Ăn Khuyên Dùng</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {DISH_HIGHLIGHTS.map((dish, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -6 }}
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
                    }}
                    className="flex flex-col"
                  >
                    <div style={{ height: 200, overflow: "hidden" }}>
                      <img src={dish.image} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>{dish.name}</h4>
                        <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>{dish.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="font-bold text-sm" style={{ color: brandColor }}>{dish.price}</span>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon key={i} sx={{ fontSize: 13, color: "#f59e0b" }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Staff Portal Link ── */}
          <section style={{ padding: "40px 24px", background: "var(--bg-light-base, var(--bg-base))", borderTop: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
              <Link href="/admin">
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "var(--text-muted)",
                  textDecoration: "underline",
                  cursor: "pointer"
                }} className="hover:text-primary">
                  <LoginIcon sx={{ fontSize: 14 }} /> Cổng thông tin cho quản lý & nhân viên nhà hàng
                </span>
              </Link>
            </div>
          </section>
        </main>

        <footer id="footer">
          <Footer />
        </footer>
      </div>
    </PageTransition>
  );
}
