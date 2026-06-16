"use client";

import {
  ArrowRightOutlined,
  RiseOutlined,
  TeamOutlined,
  SmileOutlined
} from "@ant-design/icons";
import { Card, Col, Flex, Grid, Row, Tag, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface CaseStudy {
  brand: string;
  logo: string;
  metric: string;
  metricLabel: string;
  metricColor: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const CaseStudiesSection: React.FC = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const cases: CaseStudy[] = [
    {
      brand: "Phở Hùng",
      logo: "🍜",
      metric: "+35%",
      metricLabel: "Tăng trưởng doanh thu",
      metricColor: "#10B981",
      title: "Số hóa thực đơn & QR Menu tại bàn",
      description: "Chuỗi 5 chi nhánh đã triển khai QR Menu của XFoodi giúp khách chọn món nhanh, thanh toán chuyển khoản PayOS tức thì, tăng tốc độ quay vòng bàn.",
      icon: <RiseOutlined style={{ fontSize: 24, color: "#10B981" }} />
    },
    {
      brand: "Pizza Home",
      logo: "🍕",
      metric: "-45%",
      metricLabel: "Chi phí nhân sự phục vụ",
      metricColor: "var(--primary)",
      title: "Khách gọi món tự động tại bàn",
      description: "Nhờ quy trình khách tự quét QR order trực tiếp xuống bếp (KOT), Pizza Home giảm bớt gánh nặng tuyển dụng waiter trong các khung giờ cao điểm.",
      icon: <TeamOutlined style={{ fontSize: 24, color: "var(--primary)" }} />
    },
    {
      brand: "Coffee Bean",
      logo: "☕",
      metric: "62%",
      metricLabel: "Tỷ lệ quay lại của khách",
      metricColor: "#6366F1",
      title: "Chăm sóc khách hàng tự động CRM",
      description: "Hệ thống tự động kích hoạt kịch bản tích điểm, tặng voucher sinh nhật cá nhân hóa qua SMS giúp kéo khách hàng cũ quay lại thường xuyên.",
      icon: <SmileOutlined style={{ fontSize: 24, color: "#6366F1" }} />
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
  };

  return (
    <section
      id="case-studies"
      style={{
        padding: "100px 24px",
        background: "var(--bg-base)",
        position: "relative",
        overflow: "hidden",
      }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* Header */}
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
            {t("homepage.case_studies.tag", "KHÁCH HÀNG TIÊU BIỂU")}
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
            {t("homepage.case_studies.title", "Được tin dùng bởi các thương hiệu hàng đầu")}
          </Title>
          <Paragraph
            style={{
              fontSize: 18,
              color: "var(--text-muted)",
              margin: 0,
              maxWidth: 700,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7
            }}>
            {t("homepage.case_studies.description", "Khám phá cách các đối tác F&B tối ưu quy trình và tăng trưởng cùng XFoodi.")}
          </Paragraph>
        </Flex>

        {/* Case Studies Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}>
          <Row gutter={[32, 32]}>
            {cases.map((c, idx) => (
              <Col xs={24} md={8} key={idx}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                  style={{ height: "100%" }}>
                  <Card
                    style={{
                      height: "100%",
                      borderRadius: 24,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                    styles={{ body: { padding: 32 } }}>
                    <Flex vertical gap={20} style={{ height: "100%" }}>
                      {/* Brand Header */}
                      <Flex justify="space-between" align="center">
                        <Flex align="center" gap={12}>
                          <span style={{ fontSize: 28, display: "block" }}>{c.logo}</span>
                          <Text strong style={{ fontSize: 16, color: "var(--text)" }}>{c.brand}</Text>
                        </Flex>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid var(--border)"
                          }}>
                          {c.icon}
                        </div>
                      </Flex>

                      {/* Growth Metric callout */}
                      <div style={{ background: "var(--surface)", padding: "16px 20px", borderRadius: 16, border: "1px solid var(--border)" }}>
                        <span style={{ color: c.metricColor, fontSize: 32, fontWeight: 900, display: "block", lineHeight: 1.1 }}>
                          {c.metric}
                        </span>
                        <Text style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                          {c.metricLabel}
                        </Text>
                      </div>

                      {/* Detail text */}
                      <Flex vertical gap={8} style={{ flex: 1 }}>
                        <Title level={5} style={{ margin: 0, color: "var(--text)", fontSize: 16 }}>
                          {c.title}
                        </Title>
                        <Text style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: 14 }}>
                          {c.description}
                        </Text>
                      </Flex>

                      {/* Bottom link */}
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                        <span
                          style={{
                            color: "var(--primary)",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                          {t("homepage.case_studies.view_story", "Đọc Case Study")}
                          <ArrowRightOutlined />
                        </span>
                      </div>
                    </Flex>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
