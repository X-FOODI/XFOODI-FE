'use client';

import { Avatar, Card, Col, Rate, Row, Space, Typography } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  initial: string;
}



const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();

  const testimonials: Testimonial[] = [
    {
      name: 'Anh Nam',
      role: t('homepage.testimonials.items.nam.role'),
      initial: 'N',
      quote: t('homepage.testimonials.items.nam.quote'),
    },
    {
      name: 'Chị Hương',
      role: t('homepage.testimonials.items.huong.role'),
      initial: 'H',
      quote: t('homepage.testimonials.items.huong.quote'),
    },
    {
      name: 'Anh Tuấn',
      role: t('homepage.testimonials.items.tuan.role'),
      initial: 'T',
      quote: t('homepage.testimonials.items.tuan.quote'),
    },
    {
      name: 'Chị Lan',
      role: t('homepage.testimonials.items.lan.role'),
      initial: 'L',
      quote: t('homepage.testimonials.items.lan.quote'),
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
              {t('homepage.testimonials.title')}
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
              {t('homepage.testimonials.description')}
            </Paragraph>
          </Space>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
        >
          <Row gutter={[24, 24]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} md={12} key={index}>
                <motion.div variants={cardVariants} style={{ height: '100%' }}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderRadius: 20,
                      border: '1px solid var(--border)',
                      transition: 'all 0.3s ease',
                      background: 'var(--card)',
                    }}
                    styles={{ body: { padding: 28 } }}
                  >
                    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Space size={16}>
                          <Avatar
                            size={56}
                            style={{
                              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
                              fontWeight: 700,
                              fontSize: 22,
                            }}
                          >
                            {testimonial.initial}
                          </Avatar>
                          <div>
                            <Text strong style={{ fontSize: 17, display: 'block' }}>
                              {testimonial.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                              {testimonial.role}
                            </Text>
                          </div>
                        </Space>
                        <Rate
                          disabled
                          defaultValue={5}
                          style={{ fontSize: 16 }}
                        />
                      </div>

                      {/* Quote */}
                      <Paragraph
                        style={{
                          fontSize: 16,
                          color: 'var(--text)',
                          lineHeight: 1.8,
                          margin: 0,
                          fontStyle: 'italic',
                          position: 'relative',
                          paddingLeft: 20,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: -8,
                            fontSize: 48,
                            color: '#FF6B3B',
                            fontFamily: 'Georgia, serif',
                            lineHeight: 1,
                          }}
                        >
                          &ldquo;
                        </span>
                        {testimonial.quote}
                      </Paragraph>
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

export default TestimonialsSection;
