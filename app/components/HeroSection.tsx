"use client";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  MobileOutlined,
  ShopOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  LaptopOutlined,
  QrcodeOutlined
} from "@ant-design/icons";
import { Button, Card, Col, Flex, Grid, Row, Tag, Typography } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageTransition } from "./PageTransition";
import TenantRequestForm from "./TenantRequestForm";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const HeroSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { isAnimationReady } = usePageTransition();
  const screens = useBreakpoint();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [isMobile, setIsMobile] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Animation states for the dual mockup interactive loop
  const [mockupStep, setMockupStep] = useState(0);
  const [revenue, setRevenue] = useState(12500000);
  const [orderCount, setOrderCount] = useState(152);
  const [recentOrders, setRecentOrders] = useState([
    { id: "1401", item: "2x Bún bò Huế", table: "Bàn 08", price: "130.000", status: "Hoàn tất" },
    { id: "1400", item: "1x Trà đào", table: "Bàn 15", price: "25.000", status: "Hoàn tất" }
  ]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Loop simulation of user scan -> order -> receive
  useEffect(() => {
    const interval = setInterval(() => {
      setMockupStep((prev) => {
        const next = (prev + 1) % 5;
        
        if (next === 0) {
          // Reset dashboard numbers
          setRevenue(12500000);
          setOrderCount(152);
          setRecentOrders([
            { id: "1401", item: "2x Bún bò Huế", table: "Bàn 08", price: "130.000", status: "Hoàn tất" },
            { id: "1400", item: "1x Trà đào", table: "Bàn 15", price: "25.000", status: "Hoàn tất" }
          ]);
        }
        
        if (next === 2) {
          // Add item flying animation triggers new order insertion
          setOrderCount((prev) => prev + 1);
          setRevenue((prev) => prev + 65000);
          setRecentOrders((prev) => [
            { id: "1402", item: "1x Phở bò tái", table: "Bàn 04", price: "65.000", status: "Mới" },
            ...prev.slice(0, 2)
          ]);
        }
        
        if (next === 3) {
          // Order moves to kitchen (Đang chế biến)
          setRecentOrders((prev) =>
            prev.map((o) => (o.id === "1402" ? { ...o, status: "Bếp làm" } : o))
          );
        }

        if (next === 4) {
          // Order completed
          setRecentOrders((prev) =>
            prev.map((o) => (o.id === "1402" ? { ...o, status: "Hoàn tất" } : o))
          );
        }

        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const isStacked = !screens.lg;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const rightVisualVariants = {
    hidden: { opacity: 0, x: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: isMobile ? "auto" : "100vh",
        padding: isMobile ? "100px 16px 160px" : "100px 24px 180px",
        overflow: "hidden",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
      }}>
      {/* Decorative Blob */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isAnimationReady ? { opacity: 0.12, scale: 1 } : {}}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: "-15%",
            right: "-15%",
            width: "55%",
            height: "120%",
            background: "linear-gradient(135deg, #FF6B3B 0%, var(--primary) 50%, #CC2D08 100%)",
            borderRadius: "40% 30% 50% 40%",
            transform: "rotate(-12deg)",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, width: "100%" }}>
        <Row gutter={[48, 48]} align="middle">
          {/* Left Column (Hero Content) */}
          <Col xs={24} lg={11}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isAnimationReady ? "visible" : "hidden"}>
              <Flex
                vertical
                gap={24}
                style={{
                  width: "100%",
                  alignItems: isStacked ? "center" : "flex-start",
                  textAlign: isStacked ? "center" : "left",
                }}>
                <motion.div variants={itemVariants}>
                  <Tag
                    style={{
                      background: "var(--primary-soft)",
                      border: "1px solid var(--primary-border)",
                      color: "var(--primary)",
                      fontWeight: 700,
                      fontSize: isMobile ? 12 : 14,
                      padding: isMobile ? "6px 14px" : "8px 18px",
                      borderRadius: 50,
                    }}>
                    {t("homepage.hero.tag")}
                  </Tag>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Title
                    level={1}
                    style={{
                      fontSize: isMobile ? 32 : "clamp(38px, 4.5vw, 54px)",
                      fontWeight: 850,
                      lineHeight: 1.2,
                      margin: 0,
                      color: "var(--text)",
                      letterSpacing: "-0.02em"
                    }}>
                    {t("homepage.hero.title")}
                  </Title>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Paragraph
                    style={{
                      fontSize: isMobile ? 16 : 18,
                      color: "var(--text-muted)",
                      lineHeight: 1.8,
                      margin: 0,
                      maxWidth: 520,
                    }}>
                    {t("homepage.hero.description")}
                  </Paragraph>
                </motion.div>

                {/* Interactive CTA buttons */}
                <motion.div variants={itemVariants} style={{ width: "100%" }}>
                  <Flex gap={16} wrap="wrap" justify={isStacked ? "center" : "flex-start"}>
                    <Link href="/register-restaurant" prefetch>
                      <Button
                        type="primary"
                        size="large"
                        style={{
                          height: 54,
                          padding: "0 36px",
                          fontSize: 16,
                          fontWeight: 700,
                          borderRadius: 28,
                          background: "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)",
                          border: "none",
                          boxShadow: "0 10px 24px rgba(255, 90, 44, 0.3)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                        {t("homepage.hero.get_started")}
                        <ArrowRightOutlined />
                      </Button>
                    </Link>
                    <a href="#case-studies">
                      <Button
                        size="large"
                        icon={<PlayCircleOutlined />}
                        style={{
                          height: 54,
                          padding: "0 32px",
                          fontSize: 16,
                          fontWeight: 600,
                          borderRadius: 28,
                          borderColor: "var(--border)",
                          color: "var(--text)",
                          background: "var(--card)",
                          boxShadow: "var(--shadow-sm)",
                        }}>
                        {t("homepage.hero.watch_demo")}
                      </Button>
                    </a>
                  </Flex>
                </motion.div>

                {/* Hero Stats */}
                <motion.div
                  variants={itemVariants}
                  style={{ marginTop: 16, width: "100%", borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                  <Row gutter={[isMobile ? 12 : 24, 16]} justify={isStacked ? "center" : "start"}>
                    {[
                      { value: "1,250+", label: isVi ? "Nhà hàng đang hoạt động" : "Active Restaurants" },
                      { value: "5.2M+", label: isVi ? "Đơn hàng xử lý" : "Orders Processed" },
                      { value: "99.95%", label: isVi ? "Uptime SLA" : "Uptime SLA" },
                    ].map((stat, index) => (
                      <Col key={index} xs={8}>
                        <Flex vertical align={isStacked ? "center" : "flex-start"} gap={4}>
                          <span style={{ color: "var(--primary)", fontSize: isMobile ? 20 : 26, fontWeight: 800, lineHeight: 1.1 }}>
                            {stat.value}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: isMobile ? 11 : 13, lineHeight: 1.2 }}>
                            {stat.label}
                          </span>
                        </Flex>
                      </Col>
                    ))}
                  </Row>
                </motion.div>
              </Flex>
            </motion.div>
          </Col>

          {/* Right Column (Dual SaaS Mockup with real-time feedback loops) */}
          <Col xs={24} lg={13} style={{ display: isMobile ? "none" : "block" }}>
            <motion.div
              variants={rightVisualVariants}
              initial="hidden"
              animate={isAnimationReady ? "visible" : "hidden"}
              style={{ position: "relative", height: 480, width: "100%" }}>
              
              {/* Desktop Dashboard Mockup */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 20,
                  width: "80%",
                  background: "var(--card)",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                  zIndex: 1,
                  transition: "all 0.3s ease",
                }}>
                {/* Browser Toolbar */}
                <Flex
                  align="center"
                  justify="space-between"
                  style={{
                    background: "var(--surface)",
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}>
                  <Flex gap={6}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                  </Flex>
                  <Text style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.7, fontFamily: "monospace" }}>
                    dashboard.xfoodi.vn
                  </Text>
                  <LaptopOutlined style={{ fontSize: 14, color: "var(--text-muted)" }} />
                </Flex>

                {/* Dashboard Inner Content */}
                <div style={{ padding: 20 }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14, color: "var(--text)" }}>Restaurant Portal</Text>
                    <Tag color="processing" style={{ borderRadius: 4, fontSize: 11 }}>Live KOT Panel</Tag>
                  </Flex>

                  {/* Stat Cards */}
                  <Row gutter={12} style={{ marginBottom: 20 }}>
                    <Col span={12}>
                      <div style={{ background: "var(--surface)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                        <Text style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Doanh thu hôm nay</Text>
                        <Text strong style={{ fontSize: 16, color: "var(--text)" }}>
                          ₫{revenue.toLocaleString("vi-VN")}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ background: "var(--surface)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                        <Text style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Tổng đơn đặt</Text>
                        <Text strong style={{ fontSize: 16, color: "var(--text)" }}>
                          {orderCount} đơn
                        </Text>
                      </div>
                    </Col>
                  </Row>

                  {/* Active Orders List */}
                  <div>
                    <Text strong style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                      Đơn hàng gần đây
                    </Text>
                    <Flex vertical gap={8}>
                      <AnimatePresence initial={false}>
                        {recentOrders.map((ord) => (
                          <motion.div
                            key={ord.id}
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: 10, height: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                              background: "var(--surface)",
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}>
                            <Flex vertical>
                              <Text strong style={{ fontSize: 12, color: "var(--text)" }}>{ord.item}</Text>
                              <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>{ord.table} · Đơn #{ord.id}</Text>
                            </Flex>
                            <Flex align="center" gap={8}>
                              <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>₫{ord.price}</Text>
                              <Tag
                                color={
                                  ord.status === "Mới"
                                    ? "red"
                                    : ord.status === "Bếp làm"
                                    ? "orange"
                                    : "green"
                                }
                                style={{ margin: 0, borderRadius: 4, fontSize: 10 }}>
                                {ord.status}
                              </Tag>
                            </Flex>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </Flex>
                  </div>
                </div>
              </div>

              {/* Overlapping Mobile Menu QR Mockup */}
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  bottom: 10,
                  width: 230,
                  background: "#111827",
                  border: "6px solid #374151",
                  borderRadius: 32,
                  boxShadow: "0 24px 48px rgba(0, 0, 0, 0.25)",
                  overflow: "hidden",
                  zIndex: 2,
                  height: 380,
                  display: "flex",
                  flexDirection: "column",
                  color: "#ffffff"
                }}>
                {/* Phone Notch */}
                <div style={{
                  height: 18,
                  width: 100,
                  background: "#374151",
                  margin: "0 auto",
                  borderRadius: "0 0 10px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }} />

                {/* Mobile App Header */}
                <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #1f2937", background: "#1f2937" }}>
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap={6}>
                      <ShopOutlined style={{ color: "var(--primary)", fontSize: 14 }} />
                      <span style={{ fontSize: 11, color: "#ffffff", fontWeight: 700 }}>Phở Hùng QR</span>
                    </Flex>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>Bàn 04</span>
                  </Flex>
                </div>

                {/* Mobile Menu List */}
                <div style={{ flex: 1, padding: 12, overflow: "hidden", display: "flex", verticalAlign: "top", flexDirection: "column", gap: 10 }}>
                  {/* Item 1 */}
                  <div style={{
                    background: "#1f2937",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative"
                  }}>
                    <Flex vertical>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff" }}>Phở bò tái chín</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>₫65.000</span>
                    </Flex>
                    
                    {/* Simulated finger click pointer */}
                    {mockupStep === 1 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [0.8, 1.2, 1], opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                          position: "absolute",
                          right: -10,
                          top: 15,
                          zIndex: 10,
                          width: 24,
                          height: 24,
                          background: "rgba(255, 90, 44, 0.4)",
                          border: "2px solid var(--primary)",
                          borderRadius: "50%",
                          pointerEvents: "none"
                        }}
                      />
                    )}

                    <Button
                      type="primary"
                      size="small"
                      style={{
                        fontSize: 9,
                        height: 22,
                        background: mockupStep >= 2 ? "#10b981" : "var(--primary)",
                        border: "none",
                        borderRadius: 4,
                        fontWeight: 700
                      }}>
                      {mockupStep >= 2 ? "Đã chọn" : "Thêm"}
                    </Button>
                  </div>

                  {/* Item 2 */}
                  <div style={{ background: "#1f2937", borderRadius: 8, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Flex vertical>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff" }}>Bún bò Huế</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>₫65.000</span>
                    </Flex>
                    <Button size="small" style={{ fontSize: 9, height: 22, background: "transparent", color: "#ffffff", borderColor: "#4b5563", borderRadius: 4 }}>
                      Thêm
                    </Button>
                  </div>

                  {/* Item 3 */}
                  <div style={{ background: "#1f2937", borderRadius: 8, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Flex vertical>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff" }}>Trà đào cam sả</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>₫25.000</span>
                    </Flex>
                    <Button size="small" style={{ fontSize: 9, height: 22, background: "transparent", color: "#ffffff", borderColor: "#4b5563", borderRadius: 4 }}>
                      Thêm
                    </Button>
                  </div>
                </div>

                {/* Floating Payment Action */}
                <AnimatePresence>
                  {mockupStep >= 3 && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "#1f2937",
                        padding: 12,
                        borderTop: "1px solid #374151"
                      }}>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#ffffff" }}>Tổng: 1 món</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>₫65.000</span>
                      </Flex>
                      <Button
                        type="primary"
                        block
                        size="small"
                        icon={mockupStep === 4 ? <CheckCircleOutlined /> : <QrcodeOutlined />}
                        style={{
                          fontSize: 10,
                          height: 28,
                          background: mockupStep === 4 ? "#10b981" : "var(--primary)",
                          border: "none"
                        }}>
                        {mockupStep === 4 ? "Đã Thanh Toán (PayOS)" : "Quét PayOS chuyển khoản"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </Col>
        </Row>
      </div>

      {/* Full-width Partners Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "20px 16px",
          zIndex: 1,
        }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <Text
            style={{
              color: "var(--text-muted)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
              display: "block",
              marginBottom: 12,
            }}>
            {isVi ? "Được tin dùng bởi các thương hiệu hàng đầu" : "TRUSTED BY LEADING BRANDS"}
          </Text>
          <Flex gap={24} wrap="wrap" justify="center" align="middle">
            {["🍜 Phở Hùng", "🍣 Sushi House", "☕ Coffee Bean", "🍕 Pizza Home", "🍰 Sweet & Salt", "🍗 Chicken Hub"].map((brand, index) => (
              <span
                key={index}
                style={{
                  color: "var(--text)",
                  fontWeight: 700,
                  fontSize: 13,
                  opacity: 0.8,
                  padding: "6px 16px",
                  background: "var(--card)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}>
                {brand}
              </span>
            ))}
          </Flex>
        </div>
      </div>

      {/* Request Form Modal */}
      <TenantRequestForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          console.log("Tenant request submitted");
        }}
      />
    </section>
  );
};

export default HeroSection;
