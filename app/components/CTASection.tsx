"use client";

import { ArrowRightOutlined, MessageOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Button, Flex, Grid, Typography } from "antd";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const CTASection: React.FC = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const checklist = [
    t("homepage.cta.check1", "Domain riêng"),
    t("homepage.cta.check2", "QR Menu"),
    t("homepage.cta.check3", "CRM khách hàng"),
    t("homepage.cta.check4", "Marketing tự động"),
    t("homepage.cta.check5", "Không cần đội kỹ thuật")
  ];

  return (
    <section
      id="cta"
      style={{
        padding: "80px 24px 120px",
        background: "var(--bg-base)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Background visual shapes */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-5%",
          width: 300,
          height: 300,
          background: "radial-gradient(circle, rgba(255, 90, 44, 0.05) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "-5%",
          width: 350,
          height: 350,
          background: "radial-gradient(circle, rgba(255, 90, 44, 0.04) 0%, transparent 65%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}>
          <div
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)",
              borderRadius: 32,
              padding: isMobile ? "56px 24px" : "72px 48px",
              boxShadow: "0 24px 48px rgba(255, 90, 44, 0.25)",
              position: "relative",
              overflow: "hidden",
              textAlign: "center",
            }}>
            {/* Glossy overlay blobs inside card */}
            <div
              style={{
                position: "absolute",
                top: "-100px",
                left: "-100px",
                width: 300,
                height: 300,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.08)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-150px",
                right: "-150px",
                width: 400,
                height: 400,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.08)",
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />

            <Flex vertical gap={24} align="center" style={{ position: "relative", zIndex: 2 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 24px",
                  background: "rgba(255, 255, 255, 0.18)",
                  borderRadius: 50,
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  backdropFilter: "blur(8px)",
                }}>
                {t("homepage.cta.badge", "Miễn phí 14 ngày")}
              </span>

              <Title
                level={2}
                style={{
                  color: "#ffffff",
                  margin: 0,
                  fontSize: "clamp(26px, 4vw, 40px)",
                  fontWeight: 850,
                  lineHeight: 1.25,
                  maxWidth: 800,
                }}>
                {t("homepage.cta.title", "Tạo website nhà hàng của bạn trong 5 phút")}
              </Title>

              <Paragraph
                style={{
                  color: "rgba(255, 255, 255, 0.95)",
                  fontSize: "clamp(15px, 2vw, 17px)",
                  maxWidth: 650,
                  margin: "0 auto",
                  lineHeight: 1.8,
                }}>
                {t(
                  "homepage.cta.description",
                  "Thiết lập hệ thống vận hành tự động và chuyên nghiệp từ A-Z mà không cần đội ngũ kỹ thuật hỗ trợ."
                )}
              </Paragraph>

              {/* Checklist Grid */}
              <Flex
                gap={isMobile ? 12 : 24}
                wrap="wrap"
                justify="center"
                align="center"
                style={{
                  marginTop: 16,
                  marginBottom: 16,
                  maxWidth: 800,
                }}>
                {checklist.map((item, idx) => (
                  <Flex key={idx} gap={8} align="center" style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    padding: "8px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(4px)"
                  }}>
                    <CheckCircleOutlined style={{ color: "#ffffff", fontSize: 15 }} />
                    <span style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}>{item}</span>
                  </Flex>
                ))}
              </Flex>

              {/* Action Buttons */}
              <Flex gap={16} wrap justify="center" align="center" style={{ width: "100%", marginTop: 8 }}>
                <Link href="/register-restaurant" prefetch>
                  <Button
                    type="default"
                    size="large"
                    onMouseEnter={() => setHoveredBtn("primary")}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      background: "#ffffff",
                      color: "var(--primary)",
                      border: "none",
                      height: 56,
                      padding: "0 40px",
                      borderRadius: 28,
                      fontWeight: 700,
                      fontSize: 16,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: hoveredBtn === "primary"
                        ? "0 12px 24px rgba(0, 0, 0, 0.15)"
                        : "0 8px 16px rgba(0, 0, 0, 0.08)",
                      transform: hoveredBtn === "primary" ? "translateY(-2px)" : "translateY(0)",
                      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}>
                    {t("homepage.cta.primary_btn", "Dùng thử miễn phí 14 ngày")}
                    <ArrowRightOutlined
                      style={{
                        transform: hoveredBtn === "primary" ? "translateX(4px)" : "translateX(0)",
                        transition: "transform 0.3s ease",
                      }}
                    />
                  </Button>
                </Link>

                <a href="#footer">
                  <Button
                    type="default"
                    ghost
                    size="large"
                    onMouseEnter={() => setHoveredBtn("secondary")}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      color: "#ffffff",
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      background: hoveredBtn === "secondary" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                      height: 56,
                      padding: "0 40px",
                      borderRadius: 28,
                      fontWeight: 600,
                      fontSize: 16,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      transform: hoveredBtn === "secondary" ? "translateY(-2px)" : "translateY(0)",
                      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}>
                    <MessageOutlined />
                    {t("homepage.cta.secondary_btn", "Liên hệ tư vấn")}
                  </Button>
                </a>
              </Flex>
            </Flex>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
