"use client";

import { DownOutlined } from "@ant-design/icons";
import { Flex, Grid, Typography } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface FaqItem {
  q: string;
  a: string;
}

const FaqSection: React.FC = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const rawItems = t("homepage.faq.items", { returnObjects: true }) as FaqItem[];
  const faqItems: FaqItem[] = Array.isArray(rawItems) ? rawItems : [];

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
    }
  };

  return (
    <section
      id="faq"
      style={{
        padding: "100px 24px",
        background: "var(--surface)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Decorative Blob */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "-5%",
          width: 350,
          height: 350,
          background: "radial-gradient(circle, rgba(255, 90, 44, 0.02) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      />

      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
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
            {t("homepage.faq.tag", "FAQ")}
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
            {t("homepage.faq.title", "Giải đáp thắc mắc")}
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
            {t("homepage.faq.description", "Tìm câu trả lời nhanh cho các câu hỏi phổ biến về nền tảng.")}
          </Paragraph>
        </Flex>

        {/* FAQ Accordion List */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "var(--card)",
                  borderRadius: 16,
                  border: isOpen ? "1.5px solid var(--primary-border)" : "1px solid var(--border)",
                  boxShadow: isOpen ? "var(--shadow-sm)" : "none",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}>
                {/* Question Trigger */}
                <Flex
                  align="center"
                  justify="space-between"
                  onClick={() => toggleFaq(idx)}
                  style={{
                    padding: "20px 24px",
                    cursor: "pointer",
                    userSelect: "none"
                  }}>
                  <Text
                    strong
                    style={{
                      fontSize: 16,
                      color: isOpen ? "var(--primary)" : "var(--text)",
                      transition: "color 0.2s ease"
                    }}>
                    {item.q}
                  </Text>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: isOpen ? "var(--primary)" : "var(--text-muted)", fontSize: 14 }}>
                    <DownOutlined />
                  </motion.div>
                </Flex>

                {/* Answer Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}>
                      <div
                        style={{
                          padding: "0 24px 20px",
                          color: "var(--text-muted)",
                          fontSize: 15,
                          lineHeight: 1.7,
                          borderTop: "1px solid var(--border)",
                          paddingTop: 16
                        }}>
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
