'use client';

import {
    RiseOutlined,
    SettingOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
      number: '01',
      title: t('homepage.workflow.steps.setup.title'),
      description: t('homepage.workflow.steps.setup.description'),
      icon: <SettingOutlined style={{ fontSize: 36, color: 'var(--primary)' }} />,
    },
    {
      number: '02',
      title: t('homepage.workflow.steps.operation.title'),
      description: t('homepage.workflow.steps.operation.description'),
      icon: <SyncOutlined style={{ fontSize: 36, color: 'var(--primary)' }} />,
    },
    {
      number: '03',
      title: t('homepage.workflow.steps.analysis.title'),
      description: t('homepage.workflow.steps.analysis.description'),
      icon: <RiseOutlined style={{ fontSize: 36, color: 'var(--primary)' }} />,
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
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <section
      style={{
        padding: '80px 24px',
        background: 'var(--bg-base)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={headerVariants}
        >
          <Space orientation="vertical" size={16} style={{ width: '100%', textAlign: 'center', marginBottom: 64 }}>
            <Title
              level={2}
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 700,
                margin: 0,
                color: 'var(--text)',
              }}
            >
              {t('homepage.workflow.title')}
            </Title>
            <Paragraph
              style={{
                fontSize: 18,
                color: 'var(--text-muted)',
                margin: 0,
                maxWidth: 600,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {t('homepage.workflow.description')}
            </Paragraph>
          </Space>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Row gutter={[32, 32]}>
            {workflowSteps.map((step, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div variants={cardVariants} style={{ height: '100%' }}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderRadius: 20,
                      border: '2px solid var(--border)',
                      transition: 'all 0.3s ease',
                    }}
                    styles={{ body: { padding: 32 } }}
                  >
                    <Space orientation="vertical" size={20}>
                      <Tag
                        style={{
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
                          border: 'none',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 18,
                          padding: '10px 20px',
                          borderRadius: 50,
                        }}
                      >
                        {step.number}
                      </Tag>

                      <div
                        style={{
                          width: 64,
                          height: 64,
                          background: 'linear-gradient(135deg, #FFF3E8 0%, #FFE8D6 100%)',
                          borderRadius: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {step.icon}
                      </div>

                      <Title level={4} style={{ margin: 0, color: 'var(--text)' }}>
                        {step.title}
                      </Title>

                      <Text style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 15 }}>
                        {step.description}
                      </Text>
                    </Space>
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
