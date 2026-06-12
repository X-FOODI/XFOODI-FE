"use client";

import {
  CheckCircleOutlined,
  QrcodeOutlined,
  UsergroupAddOutlined,
  NotificationOutlined,
  MessageOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { Button, Card, Col, Flex, Grid, Row, Tag, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const FeatureSection: React.FC = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const rowVariantsLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
  };

  const rowVariantsRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
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
      {/* Background visual shapes */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "-10%",
          width: 450,
          height: 450,
          background: "radial-gradient(circle, rgba(255, 90, 44, 0.04) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "-10%",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Flex vertical gap={16} align="center" style={{ width: "100%", textAlign: "center", marginBottom: 80 }}>
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
            {t("homepage.features_alt.tag", "TÍNH NĂNG CỐT LÕI")}
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
            {t("homepage.features_alt.title", "Mọi công cụ vận hành nằm trong tay bạn")}
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
            {t("homepage.features_alt.description", "Không chỉ là phần mềm quản lý, XFoodi cung cấp bộ giải pháp toàn diện giúp tự động hóa luồng trải nghiệm khách hàng.")}
          </Paragraph>
        </Flex>

        {/* Feature List (Alternating Rows) */}
        <Flex vertical gap={100}>
          {/* Row 1: Smart QR Menu (Image/Visual Left, Text Right) */}
          <Row gutter={[48, 32]} align="middle" justify="space-between">
            <Col xs={24} md={12}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={rowVariantsLeft}>
                {/* Visual Phone Mockup */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Card
                    style={{
                      width: 280,
                      background: "#111827",
                      border: "6px solid #374151",
                      borderRadius: 36,
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                      overflow: "hidden",
                      height: 480,
                      padding: 0,
                      color: "#ffffff"
                    }}
                    styles={{ body: { padding: 0 } }}>
                    {/* Notch */}
                    <div style={{ height: 16, width: 120, background: "#374151", margin: "0 auto", borderRadius: "0 0 10px 10px" }} />
                    <div style={{ padding: 16, borderBottom: "1px solid #1f2937", background: "#1f2937" }}>
                      <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 700 }}>🍜 Phở Hùng - Bàn A2</span>
                    </div>
                    {/* Items */}
                    <Flex vertical gap={12} style={{ padding: 16 }}>
                      {[
                        { name: "Phở bò tái gầu", desc: "Nước dùng đậm đà, thịt bò mềm ngọt", price: "65.000", count: 1 },
                        { name: "Bún chả Hà Nội", desc: "Thịt nướng than hoa thơm nức", price: "55.000", count: 0 },
                        { name: "Nem cua bể", desc: "Giòn rụm thơm ngon", price: "30.000", count: 0 }
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: "#1f2937", borderRadius: 12, padding: 12, border: item.count ? "1.5px solid var(--primary)" : "none" }}>
                          <Flex justify="space-between" align="center">
                            <Flex vertical>
                              <span style={{ color: "#ffffff", fontSize: 12, fontWeight: 700 }}>{item.name}</span>
                              <span style={{ color: "#9ca3af", fontSize: 10 }}>{item.desc}</span>
                            </Flex>
                            <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: 12 }}>₫{item.price}</span>
                          </Flex>
                          {item.count > 0 && (
                            <Flex justify="flex-end" style={{ marginTop: 8 }}>
                              <Tag color="success" style={{ margin: 0, borderRadius: 4, fontSize: 9 }}>Đã thêm</Tag>
                            </Flex>
                          )}
                        </div>
                      ))}
                    </Flex>
                    {/* Order summary bar */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1f2937", padding: 16, borderTop: "1px solid #374151" }}>
                      <Button type="primary" block icon={<QrcodeOutlined />} style={{ background: "var(--primary)", border: "none", height: 36, fontWeight: 700, fontSize: 12 }}>
                        Gửi Order & Thanh Toán
                      </Button>
                    </div>
                  </Card>
                </div>
              </motion.div>
            </Col>

            <Col xs={24} md={12}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={rowVariantsRight}>
                <Flex vertical gap={20}>
                  <Tag color="orange" style={{ width: "fit-content", borderRadius: 4, fontWeight: 600 }}>Web App</Tag>
                  <Title level={3} style={{ color: "var(--text)", fontSize: 28, margin: 0, fontWeight: 700 }}>
                    {t("homepage.features_alt.qr_menu.title", "QR Menu thông minh")}
                  </Title>
                  <Paragraph style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, margin: 0 }}>
                    {t("homepage.features_alt.qr_menu.desc", "Khách hàng quét mã QR tại bàn để gọi món, xem hóa đơn và thanh toán online qua PayOS động mà không cần tải ứng dụng hay đợi phục vụ.")}
                  </Paragraph>
                  <Flex vertical gap={12} style={{ marginTop: 8 }}>
                    {[
                      t("homepage.features_alt.qr_menu.bullet1", "Quét QR gọi món tức thì"),
                      t("homepage.features_alt.qr_menu.bullet2", "Thanh toán PayOS động"),
                      t("homepage.features_alt.qr_menu.bullet3", "Trải nghiệm mượt mà, không cài đặt")
                    ].map((bullet, idx) => (
                      <Flex key={idx} gap={10} align="center">
                        <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 16 }} />
                        <Text style={{ color: "var(--text)", fontSize: 15 }}>{bullet}</Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Link href="/tour/menu" prefetch style={{ marginTop: 8 }}>
                    <Button type="primary" size="large" style={{ background: "var(--primary)", border: "none", borderRadius: 20, fontWeight: 600 }}>
                      Xem tính năng thực đơn số <ArrowRightOutlined />
                    </Button>
                  </Link>
                </Flex>
              </motion.div>
            </Col>
          </Row>

          {/* Row 2: CRM & Loyalty (Text Left, Image/Visual Right) */}
          <Row gutter={[48, 32]} align="middle" justify="space-between" style={{ flexDirection: isMobile ? "column-reverse" : "row" }}>
            <Col xs={24} md={12}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={rowVariantsLeft}>
                <Flex vertical gap={20}>
                  <Tag color="blue" style={{ width: "fit-content", borderRadius: 4, fontWeight: 600 }}>Customer Relations</Tag>
                  <Title level={3} style={{ color: "var(--text)", fontSize: 28, margin: 0, fontWeight: 700 }}>
                    {t("homepage.features_alt.crm.title", "CRM & Khách hàng thân thiết")}
                  </Title>
                  <Paragraph style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, margin: 0 }}>
                    {t("homepage.features_alt.crm.desc", "Lưu trữ lịch sử ăn uống, tự động tích điểm, phân hạng thành viên và tạo các chương trình tri ân để giữ chân khách hàng trung thành.")}
                  </Paragraph>
                  <Flex vertical gap={12} style={{ marginTop: 8 }}>
                    {[
                      t("homepage.features_alt.crm.bullet1", "Lưu lịch sử khách hàng"),
                      t("homepage.features_alt.crm.bullet2", "Tự động tích điểm thành viên"),
                      t("homepage.features_alt.crm.bullet3", "Phân nhóm chăm sóc cá nhân hóa")
                    ].map((bullet, idx) => (
                      <Flex key={idx} gap={10} align="center">
                        <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 16 }} />
                        <Text style={{ color: "var(--text)", fontSize: 15 }}>{bullet}</Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Link href="/tour/customer" prefetch style={{ marginTop: 8 }}>
                    <Button type="primary" size="large" style={{ background: "var(--primary)", border: "none", borderRadius: 20, fontWeight: 600 }}>
                      Khám phá hệ thống CRM <ArrowRightOutlined />
                    </Button>
                  </Link>
                </Flex>
              </motion.div>
            </Col>

            <Col xs={24} md={12}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={rowVariantsRight}>
                {/* Visual CRM Dashboard Card */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Card
                    style={{
                      width: "100%",
                      maxWidth: 420,
                      background: "var(--card)",
                      borderRadius: 20,
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-md)",
                    }}
                    styles={{ body: { padding: 24 } }}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                      <Text strong style={{ color: "var(--text)", fontSize: 14 }}><UsergroupAddOutlined /> Khách hàng thân thiết</Text>
                      <Tag color="gold">Hạng Vàng (Gold)</Tag>
                    </Flex>
                    {/* Customer Info */}
                    <Flex gap={12} align="center" style={{ marginBottom: 20 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 700 }}>
                        PA
                      </div>
                      <Flex vertical>
                        <Text strong style={{ color: "var(--text)" }}>Phan Anh</Text>
                        <Text style={{ color: "var(--text-muted)", fontSize: 12 }}>+84 987 **** 89</Text>
                      </Flex>
                    </Flex>
                    {/* Points & Stats */}
                    <Row gutter={16} style={{ background: "var(--surface)", padding: 12, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 16 }}>
                      <Col span={12}>
                        <Text style={{ fontSize: 10, color: "var(--text-muted)", display: "block" }}>Tích điểm</Text>
                        <Text strong style={{ fontSize: 16, color: "var(--text)" }}>420 điểm</Text>
                      </Col>
                      <Col span={12}>
                        <Text style={{ fontSize: 10, color: "var(--text-muted)", display: "block" }}>Đã dùng bữa</Text>
                        <Text strong style={{ fontSize: 16, color: "var(--text)" }}>12 lần</Text>
                      </Col>
                    </Row>
                    {/* Recent visit */}
                    <Flex justify="space-between" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>Lần ghé thăm gần nhất:</Text>
                      <Text style={{ fontSize: 12, color: "var(--text)" }} strong>2 ngày trước</Text>
                    </Flex>
                  </Card>
                </div>
              </motion.div>
            </Col>
          </Row>

          {/* Row 3: Marketing Automation (Image/Visual Left, Text Right) */}
          <Row gutter={[48, 32]} align="middle" justify="space-between">
            <Col xs={24} md={12}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={rowVariantsLeft}>
                {/* Visual Campaign/Voucher Phone Mockup */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Card
                    style={{
                      width: 280,
                      background: "#111827",
                      border: "6px solid #374151",
                      borderRadius: 36,
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                      overflow: "hidden",
                      height: 400,
                      padding: 0,
                    }}
                    styles={{ body: { padding: 0 } }}>
                    {/* Notch */}
                    <div style={{ height: 16, width: 120, background: "#374151", margin: "0 auto", borderRadius: "0 0 10px 10px" }} />
                    <div style={{ padding: 12, background: "#1f2937", borderBottom: "1px solid #1f2937", color: "#ffffff" }}>
                      <span style={{ color: "#ffffff", fontSize: 11, fontWeight: 700 }}><NotificationOutlined /> Remarketing Campaign</span>
                    </div>
                    {/* SMS Message pop */}
                    <div style={{ padding: 16 }}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        style={{
                          background: "#1f2937",
                          borderRadius: 12,
                          padding: 14,
                          color: "#ffffff",
                          fontSize: 11,
                          lineHeight: 1.6,
                          boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                          borderLeft: "4px solid var(--primary)"
                        }}>
                        <Flex gap={8} align="center" style={{ marginBottom: 6 }}>
                          <MessageOutlined style={{ color: "var(--primary)" }} />
                          <span style={{ color: "#ffffff", fontSize: 10, fontWeight: 700 }}>TIN NHẮN CHĂM SÓC KHÁCH</span>
                        </Flex>
                        &quot;Chúc mừng sinh nhật Phan Anh! Phở Hùng gửi tặng bạn voucher giảm 20% tổng hóa đơn. Mã: <strong>BDAY20</strong>. Áp dụng đến hết tuần này.&quot;
                      </motion.div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            </Col>

            <Col xs={24} md={12}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={rowVariantsRight}>
                <Flex vertical gap={20}>
                  <Tag color="cyan" style={{ width: "fit-content", borderRadius: 4, fontWeight: 600 }}>Automation</Tag>
                  <Title level={3} style={{ color: "var(--text)", fontSize: 28, margin: 0, fontWeight: 700 }}>
                    {t("homepage.features_alt.marketing.title", "Marketing Tự động (Remarketing)")}
                  </Title>
                  <Paragraph style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, margin: 0 }}>
                    {t("homepage.features_alt.marketing.desc", "Thiết lập các kịch bản gửi voucher sinh nhật, tin nhắn SMS/Email chăm sóc khách cũ và các chiến dịch remarketing thúc đẩy tỷ lệ quay lại.")}
                  </Paragraph>
                  <Flex vertical gap={12} style={{ marginTop: 8 }}>
                    {[
                      t("homepage.features_alt.marketing.bullet1", "Voucher chúc mừng sinh nhật tự động"),
                      t("homepage.features_alt.marketing.bullet2", "Remarketing SMS & Email"),
                      t("homepage.features_alt.marketing.bullet3", "Đo lường hiệu quả chuyển đổi")
                    ].map((bullet, idx) => (
                      <Flex key={idx} gap={10} align="center">
                        <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 16 }} />
                        <Text style={{ color: "var(--text)", fontSize: 15 }}>{bullet}</Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Link href="/tour/staff-ops" prefetch style={{ marginTop: 8 }}>
                    <Button type="primary" size="large" style={{ background: "var(--primary)", border: "none", borderRadius: 20, fontWeight: 600 }}>
                      Khám phá tự động hóa <ArrowRightOutlined />
                    </Button>
                  </Link>
                </Flex>
              </motion.div>
            </Col>
          </Row>
        </Flex>
      </div>
    </section>
  );
};

export default FeatureSection;
