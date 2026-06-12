"use client";

import {
  QrcodeOutlined,
  RiseOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Row, Tag, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WorkflowSection: React.FC = () => {
  const { t } = useTranslation();

  const workflowSteps: WorkflowStep[] = [
    {
      number: "01",
      title: t("homepage.workflow.steps.setup.title"),
      description: t("homepage.workflow.steps.setup.description"),
      icon: <SettingOutlined style={{ fontSize: 32, color: "var(--primary)" }} />,
    },
    {
      number: "02",
      title: t("homepage.workflow.steps.operation.title"),
      description: t("homepage.workflow.steps.operation.description"),
      icon: <QrcodeOutlined style={{ fontSize: 32, color: "var(--primary)" }} />,
    },
    {
      number: "03",
      title: t("homepage.workflow.steps.analysis.title"),
      description: t("homepage.workflow.steps.analysis.description"),
      icon: <RiseOutlined style={{ fontSize: 32, color: "var(--primary)" }} />,
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
        staggerChildren: 0.15,
        delayChildren: 0.1,
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

  return (
    <section
      id="workflow"
      style={{
        padding: "100px 24px",
        background: "var(--bg-base)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Subtle Background Blob */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(232, 68, 10, 0.03) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
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
            <span
              style={{
                display: "inline-block",
                padding: "8px 20px",
                background: "var(--primary-soft)",
                borderRadius: 50,
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: 14,
                border: "1px solid var(--primary-border)",
              }}>
              {t("homepage.workflow.tag", "Quy trình")}
            </span>
            <Title
              level={2}
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 700,
                margin: 0,
                color: "var(--text)",
                lineHeight: 1.2,
              }}>
              {t("homepage.workflow.title")}
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
              {t("homepage.workflow.description")}
            </Paragraph>
          </Flex>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}>
          <Row gutter={[32, 32]}>
            {workflowSteps.map((step, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div
                  variants={cardVariants}
                  style={{ height: "100%" }}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}>
                  <Card
                    style={{
                      height: "100%",
                      borderRadius: 24,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      boxShadow: "var(--shadow-sm)",
                      transition: "all 0.3s ease",
                    }}
                    styles={{ body: { padding: 32 } }}>
                    <Flex vertical gap={24} align="flex-start">
                      <Flex justify="space-between" align="center" style={{ width: "100%" }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            background: "var(--primary-soft)",
                            borderRadius: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid var(--primary-border)",
                          }}>
                          {step.icon}
                        </div>
                        <span
                          style={{
                            fontSize: 36,
                            fontWeight: 800,
                            color: "var(--primary-soft)",
                            lineHeight: 1,
                            userSelect: "none",
                          }}>
                          {step.number}
                        </span>
                      </Flex>

                      <Flex vertical gap={12}>
                        <Title level={4} style={{ margin: 0, color: "var(--text)", fontSize: 20 }}>
                          {step.title}
                        </Title>
                        <Text style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: 15 }}>
                          {step.description}
                        </Text>
                      </Flex>
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

export default WorkflowSection;
