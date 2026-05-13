"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import {
  ApiOutlined,
  BarChartOutlined,
  FileTextOutlined,
  InboxOutlined,
  ShopOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Row, Typography } from "antd";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureSection: React.FC = () => {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const routeByIndex = [
    "/tour/analytics",
    "/tour/tables",
    "/tour/menu",
    "/tour/reservations",
    "/tour/customer",
    "/tour/staff-ops",
  ];

  const features: Feature[] = [
    {
      icon: <BarChartOutlined style={{ fontSize: 36 }} />,
      title: t("homepage.features.items.analytics.title"),
      description: t("homepage.features.items.analytics.description"),
      color: "var(--primary)",
    },
    {
      icon: <TableOutlined style={{ fontSize: 36 }} />,
      title: t("homepage.features.items.tables.title"),
      description: t("homepage.features.items.tables.description"),
      color: "#10B981",
    },
    {
      icon: <FileTextOutlined style={{ fontSize: 36 }} />,
      title: t("homepage.features.items.menu.title"),
      description: t("homepage.features.items.menu.description"),
      color: "#6366F1",
    },
    {
      icon: <InboxOutlined style={{ fontSize: 36 }} />,
      title: t("homepage.features.items.reservations.title"),
      description: t("homepage.features.items.reservations.description"),
      color: "#F59E0B",
    },
    {
      icon: <ShopOutlined style={{ fontSize: 36 }} />,
      title: t("homepage.features.items.customer.title"),
      description: t("homepage.features.items.customer.description"),
      color: "#EC4899",
    },
    {
      icon: <ApiOutlined style={{ fontSize: 36 }} />,
      title: t("homepage.features.items.staff_ops.title"),
      description: t("homepage.features.items.staff_ops.description"),
      color: "#14B8A6",
    },
  ];

  const headerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const iconVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: {
      scale: 1.1,
      rotate: [0, -10, 10, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <section
      id="product"
      style={{
        padding: "100px 24px",
        background: "var(--bg-base)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "-10%",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(255, 56, 11, 0.05) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "-5%",
          width: 300,
          height: 300,
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={headerVariants}>
          <Flex
            vertical
            gap={16}
            align="center"
            style={{ width: "100%", textAlign: "center", marginBottom: 64 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  background:
                    "linear-gradient(135deg, #FFF3E8 0%, #FFE8D6 100%)",
                  borderRadius: 50,
                  color: "#CC2D08",
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 16,
                }}>
                {t("homepage.features.tag")}
              </span>
            </motion.div>
            <Title
              level={2}
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 700,
                margin: 0,
                color: "var(--text)",
                lineHeight: 1.2,
              }}>
              {t("homepage.features.title_prefix")}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0% 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                {tenantName || t("homepage.features.brand")}
              </span>
            </Title>
            <Paragraph
              style={{
                fontSize: 18,
                color: "var(--text-muted)",
                margin: 0,
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.7,
              }}>
              {t("homepage.features.description")}
            </Paragraph>
          </Flex>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}>
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <motion.div
                  variants={cardVariants}
                  style={{ height: "100%" }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                    style={{ height: "100%", willChange: "transform" }}>
                    <Link
                      href={routeByIndex[index]}
                      prefetch
                      style={{ display: "block", height: "100%" }}>
                      <Card
                        style={{
                          height: "100%",
                          borderRadius: 20,
                          border:
                            hoveredIndex === index
                              ? `2px solid ${feature.color}30`
                              : "2px solid transparent",
                          transition: "all 0.3s ease",
                          background:
                            hoveredIndex === index
                              ? `linear-gradient(135deg, ${feature.color}05 0%, var(--card) 100%)`
                              : "var(--card)",
                          boxShadow:
                            hoveredIndex === index
                              ? `0 20px 40px ${feature.color}15`
                              : "0 4px 20px rgba(0, 0, 0, 0.05)",
                          outline:
                            hoveredIndex !== index
                              ? "1px solid var(--border)"
                              : "none",
                          cursor: "pointer",
                        }}
                        styles={{ body: { padding: 28 } }}>
                        <Flex vertical gap={16}>
                          <motion.div
                            initial="rest"
                            animate={hoveredIndex === index ? "hover" : "rest"}
                            variants={iconVariants}
                            style={{
                              width: 72,
                              height: 72,
                              background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}08 100%)`,
                              borderRadius: 18,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: feature.color,
                              border: `1px solid ${feature.color}20`,
                            }}>
                            {feature.icon}
                          </motion.div>
                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              color: "var(--text)",
                              fontSize: 18,
                            }}>
                            {feature.title}
                          </Title>
                          <Text
                            style={{
                              color: "var(--text-muted)",
                              lineHeight: 1.7,
                              fontSize: 15,
                            }}>
                            {feature.description}
                          </Text>

                          {/* Learn more link */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={
                              hoveredIndex === index
                                ? { opacity: 1, x: 0 }
                                : { opacity: 0, x: -10 }
                            }
                            transition={{ duration: 0.2 }}>
                            <span
                              style={{
                                color: feature.color,
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}>
                              {t("homepage.features.items.learn_more")}
                              <motion.span
                                animate={
                                  hoveredIndex === index
                                    ? { x: [0, 5, 0] }
                                    : { x: 0 }
                                }
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                }}>
                                →
                              </motion.span>
                            </span>
                          </motion.div>
                        </Flex>
                      </Card>
                    </Link>
                  </motion.div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSection;
