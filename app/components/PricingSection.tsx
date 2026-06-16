"use client";

import { CheckOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Grid, Row, Switch, Typography } from "antd";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const PricingSection: React.FC = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

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
      id="pricing"
      style={{
        padding: "100px 24px",
        background: "var(--bg-base)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Visual background decorations */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "-10%",
          width: 350,
          height: 350,
          background: "radial-gradient(circle, rgba(255, 90, 44, 0.03) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Flex vertical gap={16} align="center" style={{ width: "100%", textAlign: "center", marginBottom: 48 }}>
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
            {t("homepage.pricing.tag", "BẢNG GIÁ DỊCH VỤ")}
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
            {t("homepage.pricing.title", "Chi phí tối giản, hiệu quả tối đa")}
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
            {t("homepage.pricing.description", "Không có chi phí ẩn. Chọn gói dịch vụ phù hợp nhất với quy mô nhà hàng của bạn.")}
          </Paragraph>

          {/* Monthly / Yearly Toggle */}
          <Flex gap={12} align="center" style={{ marginTop: 24 }}>
            <Text strong style={{ color: billingPeriod === "monthly" ? "var(--text)" : "var(--text-muted)" }}>
              {t("homepage.pricing.toggle_monthly", "Hàng tháng")}
            </Text>
            <Switch
              checked={billingPeriod === "yearly"}
              onChange={(checked) => setBillingPeriod(checked ? "yearly" : "monthly")}
              style={{ background: billingPeriod === "yearly" ? "var(--primary)" : "#d9d9d9" }}
            />
            <Text strong style={{ color: billingPeriod === "yearly" ? "var(--text)" : "var(--text-muted)" }}>
              {t("homepage.pricing.toggle_yearly", "Hàng năm (Tiết kiệm 20%)")}
            </Text>
          </Flex>
        </Flex>

        {/* Pricing Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}>
          <Row gutter={[32, 32]} justify="center" align="stretch">
            {/* Starter Plan */}
            <Col xs={24} md={8}>
              <motion.div variants={itemVariants} style={{ height: "100%" }}>
                <Card
                  style={{
                    height: "100%",
                    borderRadius: 24,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    boxShadow: "var(--shadow-sm)",
                    position: "relative"
                  }}
                  styles={{ body: { padding: "40px 32px" } }}>
                  <Flex vertical gap={24} style={{ height: "100%" }}>
                    <div>
                      <Text strong style={{ fontSize: 18, color: "var(--text)" }}>{t("homepage.pricing.starter.title", "Starter")}</Text>
                      <Paragraph style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8, minHeight: 40 }}>
                        {t("homepage.pricing.starter.desc")}
                      </Paragraph>
                      <Flex align="baseline" gap={4} style={{ marginTop: 16 }}>
                        <span style={{ fontSize: 40, fontWeight: 900, color: "var(--text)" }}>
                          ₫{billingPeriod === "monthly" ? "299.000" : "239.000"}
                        </span>
                        <Text style={{ color: "var(--text-muted)", fontSize: 14 }}>
                          {billingPeriod === "monthly" ? t("homepage.pricing.period_mo") : t("homepage.pricing.period_yr")}
                        </Text>
                      </Flex>
                    </div>

                    <div style={{ flex: 1, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                      <Flex vertical gap={12}>
                        {(t("homepage.pricing.starter.features", { returnObjects: true }) as string[] || []).map((feat, idx) => (
                          <Flex key={idx} gap={10} align="flex-start">
                            <CheckOutlined style={{ color: "var(--success)", fontSize: 14, marginTop: 3 }} />
                            <Text style={{ color: "var(--text)", fontSize: 14 }}>{feat}</Text>
                          </Flex>
                        ))}
                      </Flex>
                    </div>

                    <Link href="/register-restaurant" prefetch>
                      <Button type="default" block size="large" style={{ height: 48, borderRadius: 24, borderColor: "var(--border)", fontWeight: 700 }}>
                        {t("homepage.pricing.btn_primary", "Dùng thử miễn phí")}
                      </Button>
                    </Link>
                  </Flex>
                </Card>
              </motion.div>
            </Col>

            {/* Business Plan (Highlighted) */}
            <Col xs={24} md={8}>
              <motion.div variants={itemVariants} style={{ height: "100%" }} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <Card
                  style={{
                    height: "100%",
                    borderRadius: 24,
                    border: "2.5px solid var(--primary)",
                    background: "var(--card)",
                    boxShadow: "0 20px 40px rgba(255, 90, 44, 0.15)",
                    position: "relative",
                  }}
                  styles={{ body: { padding: "40px 32px" } }}>
                  {/* Popular tag */}
                  <div style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)",
                    color: "#ffffff",
                    padding: "4px 18px",
                    borderRadius: 50,
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(255, 90, 44, 0.25)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Phổ biến nhất
                  </div>

                  <Flex vertical gap={24} style={{ height: "100%" }}>
                    <div>
                      <Text strong style={{ fontSize: 18, color: "var(--text)" }}>{t("homepage.pricing.business.title", "Business")}</Text>
                      <Paragraph style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8, minHeight: 40 }}>
                        {t("homepage.pricing.business.desc")}
                      </Paragraph>
                      <Flex align="baseline" gap={4} style={{ marginTop: 16 }}>
                        <span style={{ fontSize: 40, fontWeight: 900, color: "var(--text)" }}>
                          ₫{billingPeriod === "monthly" ? "999.000" : "799.000"}
                        </span>
                        <Text style={{ color: "var(--text-muted)", fontSize: 14 }}>
                          {billingPeriod === "monthly" ? t("homepage.pricing.period_mo") : t("homepage.pricing.period_yr")}
                        </Text>
                      </Flex>
                    </div>

                    <div style={{ flex: 1, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                      <Flex vertical gap={12}>
                        {(t("homepage.pricing.business.features", { returnObjects: true }) as string[] || []).map((feat, idx) => (
                          <Flex key={idx} gap={10} align="flex-start">
                            <CheckOutlined style={{ color: "var(--primary)", fontSize: 14, marginTop: 3 }} />
                            <Text style={{ color: "var(--text)", fontSize: 14 }} strong={idx === 1}>
                              {feat}
                            </Text>
                          </Flex>
                        ))}
                      </Flex>
                    </div>

                    <Link href="/register-restaurant" prefetch>
                      <Button type="primary" block size="large" style={{ height: 48, borderRadius: 24, background: "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)", border: "none", fontWeight: 700, boxShadow: "0 6px 16px rgba(255, 90, 44, 0.2)" }}>
                        {t("homepage.pricing.btn_primary", "Dùng thử miễn phí")}
                      </Button>
                    </Link>
                  </Flex>
                </Card>
              </motion.div>
            </Col>

            {/* Enterprise Plan */}
            <Col xs={24} md={8}>
              <motion.div variants={itemVariants} style={{ height: "100%" }}>
                <Card
                  style={{
                    height: "100%",
                    borderRadius: 24,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    boxShadow: "var(--shadow-sm)",
                    position: "relative"
                  }}
                  styles={{ body: { padding: "40px 32px" } }}>
                  <Flex vertical gap={24} style={{ height: "100%" }}>
                    <div>
                      <Text strong style={{ fontSize: 18, color: "var(--text)" }}>{t("homepage.pricing.enterprise.title", "Enterprise")}</Text>
                      <Paragraph style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8, minHeight: 40 }}>
                        {t("homepage.pricing.enterprise.desc")}
                      </Paragraph>
                      <Flex align="baseline" gap={4} style={{ marginTop: 16 }}>
                        <span style={{ fontSize: 40, fontWeight: 900, color: "var(--text)" }}>
                          {t("homepage.pricing.contact")}
                        </span>
                      </Flex>
                    </div>

                    <div style={{ flex: 1, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                      <Flex vertical gap={12}>
                        {(t("homepage.pricing.enterprise.features", { returnObjects: true }) as string[] || []).map((feat, idx) => (
                          <Flex key={idx} gap={10} align="flex-start">
                            <CheckOutlined style={{ color: "var(--success)", fontSize: 14, marginTop: 3 }} />
                            <Text style={{ color: "var(--text)", fontSize: 14 }}>{feat}</Text>
                          </Flex>
                        ))}
                      </Flex>
                    </div>

                    <a href="#footer">
                      <Button type="default" block size="large" style={{ height: 48, borderRadius: 24, borderColor: "var(--border)", fontWeight: 700 }}>
                        {t("homepage.pricing.btn_secondary", "Liên hệ ngay")}
                      </Button>
                    </a>
                  </Flex>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
