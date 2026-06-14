"use client";

import {
  PartitionOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CompassOutlined
} from "@ant-design/icons";
import { Card, Col, Flex, Grid, Row, Tag, Typography } from "antd";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface TenantNode {
  name: string;
  subdomain: string;
  icon: string;
  color: string;
  dbName: string;
  menuItems: string[];
}

const MultiTenantSection: React.FC = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [hoveredTenant, setHoveredTenant] = useState<number | null>(null);

  const tenants: TenantNode[] = [
    {
      name: "Phở Hùng",
      subdomain: "phohung.xfoodi.website",
      icon: "🍜",
      color: "var(--primary)",
      dbName: "db_tenant_phohung",
      menuItems: ["Phở đặc biệt: 65k", "Quẩy giòn: 5k"]
    },
    {
      name: "Sushi House",
      subdomain: "sushi.xfoodi.website",
      icon: "🍣",
      color: "#10B981",
      dbName: "db_tenant_sushi",
      menuItems: ["Sake Sashimi: 120k", "Maki Roll: 80k"]
    },
    {
      name: "Pizza Home",
      subdomain: "pizzahome.xfoodi.website",
      icon: "🍕",
      color: "#6366F1",
      dbName: "db_tenant_pizza",
      menuItems: ["Pizza Seafood: 180k", "Coca Lon: 15k"]
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
      id="architecture"
      style={{
        padding: "100px 24px",
        background: "var(--surface)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Decorative Blur BG */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />

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
            {t("homepage.multitenant.tag", "KIẾN TRÚC HỆ THỐNG")}
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
            {t("homepage.multitenant.title", "Một nền tảng - Hàng nghìn nhà hàng độc lập")}
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
            {t("homepage.multitenant.description", "XFoodi sử dụng công nghệ Multi-Tenant SaaS giúp cô lập dữ liệu hoàn toàn. Mỗi nhà hàng vận hành như một thực thể độc lập với cấu hình riêng biệt.")}
          </Paragraph>
        </Flex>

        {/* Tree Map Representation */}
        <Row gutter={[48, 48]} align="middle" justify="center">
          {/* Left / Center Column: Central Platform Controller */}
          <Col xs={24} lg={10}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}>
              <Card
                style={{
                  background: "var(--card)",
                  borderRadius: 24,
                  border: "2px solid var(--primary-border)",
                  boxShadow: "0 20px 40px rgba(255, 90, 44, 0.1)",
                  position: "relative",
                  overflow: "hidden"
                }}
                styles={{ body: { padding: 32 } }}>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: "linear-gradient(90deg, var(--primary) 0%, #FF6B3B 100%)"
                }} />
                
                <Flex vertical gap={20} align="center" style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      background: "var(--primary-soft)",
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                      border: "1px solid var(--primary-border)"
                    }}>
                    <PartitionOutlined style={{ fontSize: 36 }} />
                  </div>
                  
                  <Flex vertical gap={4}>
                    <Title level={4} style={{ margin: 0, color: "var(--text)" }}>
                      {t("homepage.multitenant.platform", "XFoodi Platform")}
                    </Title>
                    <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>Core SaaS Controller</Text>
                  </Flex>

                  <Paragraph style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    Quản lý tài nguyên dùng chung, điều phối lưu lượng truy cập và tự động phân tách CSDL khi có đối tác mới đăng ký.
                  </Paragraph>

                  <Flex vertical gap={10} style={{ width: "100%", borderTop: "1px solid var(--border)", paddingTop: 16, textAlign: "left" }}>
                    <Text strong style={{ fontSize: 13, color: "var(--text)" }}>
                      {t("homepage.multitenant.isolation", "Mỗi nhà hàng sở hữu:")}
                    </Text>
                    {[
                      { icon: <GlobalOutlined style={{ color: "var(--primary)" }} />, text: t("homepage.multitenant.domain", "Tên miền/Subdomain riêng biệt") },
                      { icon: <DatabaseOutlined style={{ color: "#10B981" }} />, text: t("homepage.multitenant.customers", "Cơ sở dữ liệu khách hàng cô lập") },
                      { icon: <FileTextOutlined style={{ color: "#6366F1" }} />, text: t("homepage.multitenant.menu", "Thực đơn và cấu hình riêng") }
                    ].map((item, idx) => (
                      <Flex key={idx} gap={10} align="center">
                        {item.icon}
                        <Text style={{ fontSize: 13, color: "var(--text)" }}>{item.text}</Text>
                      </Flex>
                    ))}
                  </Flex>
                </Flex>
              </Card>
            </motion.div>
          </Col>

          {/* Right Column: Radiating Isolated Nodes */}
          <Col xs={24} lg={12}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {tenants.map((tenant, idx) => {
                const isHovered = hoveredTenant === idx;
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    onHoverStart={() => setHoveredTenant(idx)}
                    onHoverEnd={() => setHoveredTenant(null)}>
                    <Card
                      style={{
                        background: "var(--card)",
                        borderRadius: 20,
                        border: isHovered ? `1px solid ${tenant.color}` : "1px solid var(--border)",
                        boxShadow: isHovered ? `0 10px 20px ${tenant.color}15` : "var(--shadow-sm)",
                        transition: "all 0.3s ease",
                      }}
                      styles={{ body: { padding: 20 } }}>
                      <Row gutter={16} align="middle">
                        <Col span={3}>
                          <span style={{ fontSize: 32, display: "block", textAlign: "center" }}>
                            {tenant.icon}
                          </span>
                        </Col>
                        
                        <Col span={13}>
                          <Flex vertical gap={2}>
                            <Title level={5} style={{ margin: 0, color: "var(--text)", fontSize: 16 }}>
                              {tenant.name}
                            </Title>
                            <Text code style={{ fontSize: 12, color: tenant.color, width: "fit-content" }}>
                              {tenant.subdomain}
                            </Text>
                          </Flex>
                        </Col>

                        <Col span={8} style={{ textAlign: "right" }}>
                          <Flex vertical align="flex-end" gap={4}>
                            <Tag
                              icon={<DatabaseOutlined />}
                              color="blue"
                              style={{ margin: 0, borderRadius: 4, fontSize: 11, background: "rgba(30,41,59,0.05)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                              {tenant.dbName}
                            </Tag>
                            {isHovered && (
                              <motion.span
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ fontSize: 11, color: "var(--success)", fontWeight: 700 }}>
                                <SafetyCertificateOutlined /> Isolated CSDL
                              </motion.span>
                            )}
                          </Flex>
                        </Col>
                      </Row>

                      {/* Expanded Tenant Data visual */}
                      {isHovered && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          style={{
                            borderTop: "1px solid var(--border)",
                            marginTop: 16,
                            paddingTop: 12,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6
                          }}>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>MENU & PRICING SPECIFIC:</Text>
                          <Flex gap={12}>
                            {tenant.menuItems.map((menu, mIdx) => (
                              <Tag key={mIdx} color="default" style={{ borderRadius: 4, margin: 0, fontSize: 11 }}>
                                {menu}
                              </Tag>
                            ))}
                          </Flex>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default MultiTenantSection;
