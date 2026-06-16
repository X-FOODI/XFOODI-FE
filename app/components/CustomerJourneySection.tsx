"use client";

import {
  UserOutlined,
  QrcodeOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  RightOutlined,
  DownOutlined
} from "@ant-design/icons";
import { Card, Flex, Grid, Typography } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface JourneyStep {
  key: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}

const CustomerJourneySection: React.FC = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [activeStep, setActiveStep] = useState(0);

  const steps: JourneyStep[] = [
    {
      key: "customer",
      icon: <UserOutlined style={{ fontSize: 24 }} />,
      title: t("homepage.journey.steps.customer", "Khách hàng"),
      detail: t("homepage.features.items.customer.description", "Thực khách bước vào nhà hàng và ngồi vào bàn của mình.")
    },
    {
      key: "scan",
      icon: <QrcodeOutlined style={{ fontSize: 24 }} />,
      title: t("homepage.journey.steps.scan", "Quét QR"),
      detail: t("homepage.workflow.steps.operation.description", "Quét mã QR riêng đặt sẵn tại mỗi bàn để bắt đầu hành trình.")
    },
    {
      key: "view",
      icon: <EyeOutlined style={{ fontSize: 24 }} />,
      title: t("homepage.journey.steps.view", "Xem menu"),
      detail: t("homepage.features.items.menu.description", "Xem thực đơn số hóa trực quan, cập nhật hình ảnh và giá món realtime.")
    },
    {
      key: "order",
      icon: <ShoppingCartOutlined style={{ fontSize: 24 }} />,
      title: t("homepage.journey.steps.order", "Đặt món"),
      detail: t("homepage.features.items.staff_ops.description", "Chọn món và gửi order trực tiếp xuống nhà bếp mà không cần chờ phục vụ.")
    },
    {
      key: "pay",
      icon: <CreditCardOutlined style={{ fontSize: 24 }} />,
      title: t("homepage.journey.steps.pay", "Thanh toán"),
      detail: t("homepage.faq.items.2.a", "Thanh toán an toàn qua cổng PayOS động ngay khi hoàn tất bữa ăn.")
    },
    {
      key: "crm",
      icon: <DatabaseOutlined style={{ fontSize: 24 }} />,
      title: t("homepage.journey.steps.crm", "CRM lưu dữ liệu"),
      detail: t("homepage.features.items.customer.description", "Thông tin ăn uống và số điện thoại được lưu trữ để tích điểm loyalty.")
    },
    {
      key: "marketing",
      icon: <ThunderboltOutlined style={{ fontSize: 24 }} />,
      title: t("homepage.journey.steps.marketing", "Marketing tự động"),
      detail: t("homepage.features_alt.marketing.desc", "Hệ thống tự động gửi tin nhắn chúc mừng, tặng voucher thôi thúc thực khách quay lại.")
    }
  ];

  // Auto cycle pipeline steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
  };

  return (
    <section
      id="journey"
      style={{
        padding: "100px 24px",
        background: "var(--surface)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Decorative Blur Background */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: 350,
          height: 350,
          background: "radial-gradient(circle, rgba(255, 90, 44, 0.03) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={headerVariants}>
          <Flex vertical gap={16} align="center" style={{ width: "100%", textAlign: "center", marginBottom: 64 }}>
            <span
              style={{
                display: "inline-block",
                padding: "8px 20px",
                background: "var(--primary-soft)",
                borderRadius: 50,
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: 14,
                border: "1px solid var(--primary-border)"
              }}>
              {t("homepage.journey.tag", "HÀNH TRÌNH TRẢI NGHIỆM")}
            </span>
            <Title
              level={2}
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                margin: 0,
                color: "var(--text)",
                lineHeight: 1.2
              }}>
              {t("homepage.journey.title", "Luồng hoạt động liền mạch 360°")}
            </Title>
            <Paragraph
              style={{
                fontSize: 18,
                color: "var(--text-muted)",
                margin: 0,
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.7
              }}>
              {t("homepage.journey.description", "Xem cách thực khách và nhà bếp của bạn kết nối mượt mà qua hệ thống tự động của XFoodi.")}
            </Paragraph>
          </Flex>
        </motion.div>

        {/* Pipeline Map */}
        <div style={{ marginBottom: 48 }}>
          <Flex
            vertical={isMobile}
            gap={isMobile ? 24 : 12}
            align="center"
            justify="space-between"
            style={{ width: "100%" }}>
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <React.Fragment key={step.key}>
                  {/* Step Node Container */}
                  <motion.div
                    onClick={() => setActiveStep(index)}
                    animate={{
                      scale: isActive ? 1.08 : 1,
                      y: isActive ? -4 : 0
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      width: isMobile ? "100%" : "calc(100% / 7)",
                      position: "relative"
                    }}>
                    {/* Ring wrapper */}
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: "50%",
                        background: isActive
                          ? "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)"
                          : "var(--card)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isActive ? "#ffffff" : "var(--text-muted)",
                        boxShadow: isActive
                          ? "0 10px 24px rgba(255, 90, 44, 0.35)"
                          : "var(--shadow-sm)",
                        border: isActive
                          ? "2px solid transparent"
                          : "1px solid var(--border)",
                        transition: "all 0.3s ease",
                        position: "relative"
                      }}>
                      {step.icon}
                      {/* Step index badge */}
                      <span
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: isActive ? "#ffffff" : "var(--primary)",
                          color: isActive ? "var(--primary)" : "#ffffff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          transition: "all 0.3s ease"
                        }}>
                        {index + 1}
                      </span>
                    </div>

                    <Text
                      strong
                      style={{
                        marginTop: 16,
                        fontSize: 14,
                        color: isActive ? "var(--primary)" : "var(--text)",
                        textAlign: "center",
                        fontWeight: isActive ? 700 : 600,
                        transition: "color 0.3s ease"
                      }}>
                      {step.title}
                    </Text>
                  </motion.div>

                  {/* Flow Arrow */}
                  {index < steps.length - 1 && (
                    <div
                      style={{
                        color: isActive ? "var(--primary)" : "var(--border)",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.3s ease",
                        transform: isMobile ? "rotate(90deg)" : "none",
                        margin: isMobile ? "8px 0" : 0
                      }}>
                      {isMobile ? <DownOutlined style={{ fontSize: 14 }} /> : <RightOutlined style={{ fontSize: 14 }} />}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </Flex>
        </div>

        {/* Active Step Details Panel */}
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}>
              <Card
                style={{
                  background: "var(--card)",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-md)",
                  textAlign: "center"
                }}
                styles={{ body: { padding: "32px 24px" } }}>
                <Flex vertical gap={12} align="center">
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--primary)",
                      textTransform: "uppercase",
                      letterSpacing: 2
                    }}>
                    {t("homepage.journey.tag", "Hành Trình")} - Bước {activeStep + 1}
                  </Text>
                  <Title level={4} style={{ margin: 0, color: "var(--text)" }}>
                    {steps[activeStep].title}
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 16,
                      color: "var(--text-muted)",
                      margin: 0,
                      maxWidth: 600,
                      lineHeight: 1.7
                    }}>
                    {steps[activeStep].detail}
                  </Paragraph>
                </Flex>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default CustomerJourneySection;
