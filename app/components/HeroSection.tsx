'use client';

import { FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Grid, Row, Tag, Typography } from 'antd';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTransition } from './PageTransition';
import TenantRequestForm from './TenantRequestForm';
import { useAuth } from '@/lib/contexts/AuthContext';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const { isAnimationReady } = usePageTransition();
  const screens = useBreakpoint();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Use state for isMobile to match existing logic (or we could rely entirely on screens)
  // Maintaining isMobile for granular typography/padding tweaks if needed, but syncing with breakpoints is better.
  // Let's use screens for layout decisions primarily.
  // Note: screens might be empty on first render, so we need to handle that or use a useEffect for isMobile if we want exact px match.
  // But for this refactor, let's stick to the simpler isMobile state for "small mobile" specifically (<768)
  // and use screens for the larger layout breaks (lg).

  const [isMobile, setIsMobile] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isStacked = !screens.lg; // Tablet or Mobile (< 992px)

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, x: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const blobVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 0.12,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: 'easeOut',
      },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const trustedByVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 1,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <section
      style={{
        position: 'relative',
        minHeight: isMobile ? 'auto' : '100vh',
        padding: isMobile ? '100px 16px 40px' : '100px 24px 40px',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Orange Gradient Blob - Hidden on mobile for cleaner look */}
      {!isMobile && (
        <motion.div
          variants={blobVariants}
          initial="hidden"
          animate={isAnimationReady ? 'visible' : 'hidden'}
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-15%',
            width: '60%',
            height: '120%',
            background: 'linear-gradient(135deg, #FF6B3B 0%, var(--primary) 50%, #CC2D08 100%)',
            borderRadius: '40% 30% 50% 40%',
            transform: 'rotate(-15deg)',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1, width: '100%' }}>
        <Row gutter={[48, 48]} align="middle">
          {/* Left Column */}
          <Col xs={24} lg={12}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isAnimationReady ? 'visible' : 'hidden'}
            >
              <Flex
                vertical
                gap={20}
                style={{
                  width: '100%',
                  alignItems: isStacked ? 'center' : 'flex-start',
                  textAlign: isStacked ? 'center' : 'left'
                }}
              >
                <motion.div variants={itemVariants}>
                  <Tag
                    style={{
                      background: 'linear-gradient(135deg, #FFF3E8 0%, #FFE8D6 100%)',
                      border: 'none',
                      color: '#CC2D08',
                      fontWeight: 600,
                      fontSize: isMobile ? 12 : 14,
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      borderRadius: 50,
                    }}
                  >
                    {t('homepage.hero.tag')}
                  </Tag>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Title
                    level={1}
                    style={{
                      fontSize: isMobile ? 28 : 'clamp(36px, 5vw, 56px)',
                      fontWeight: 700,
                      lineHeight: 1.15,
                      margin: 0,
                      color: 'var(--text)',
                    }}
                  >
                    {t('homepage.hero.title')}
                  </Title>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Paragraph
                    style={{
                      fontSize: isMobile ? 15 : 18,
                      color: 'var(--text-muted)',
                      lineHeight: 1.7,
                      margin: 0,
                      maxWidth: 480,
                    }}
                  >
                    {t('homepage.hero.description')}
                  </Paragraph>
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <Flex gap={12} wrap="wrap" justify={isStacked ? 'center' : 'flex-start'}>
                    <Button
                      type="primary"
                      size={isMobile ? 'middle' : 'large'}
                      block={isMobile}
                      onClick={() => {
                        if (isAuthenticated) {
                          setModalVisible(true);
                        } else {
                          window.location.href = '/login';
                        }
                      }}
                      style={{
                        height: isMobile ? 44 : 52,
                        padding: isMobile ? '0 24px' : '0 36px',
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 600,
                        borderRadius: 50,
                        background: 'linear-gradient(135deg, var(--primary) 0%, #CC2D08 100%)',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(255, 56, 11, 0.35)',
                      }}
                    >
                      {t('homepage.hero.get_started')}
                    </Button>
                    <Button
                      size={isMobile ? 'middle' : 'large'}
                      icon={<PlayCircleOutlined />}
                      block={isMobile}
                      style={{
                        height: isMobile ? 44 : 52,
                        padding: isMobile ? '0 20px' : '0 32px',
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 600,
                        borderRadius: 50,
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                        background: 'var(--card)',
                      }}
                    >
                      {t('homepage.hero.watch_demo')}
                    </Button>
                  </Flex>
                </motion.div>

                {/* Stats */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate={isAnimationReady ? 'visible' : 'hidden'}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  <Row gutter={[isMobile ? 16 : 32, 16]} justify={isStacked ? 'center' : 'start'}>
                    {[
                      { value: '100.000+', label: t('homepage.hero.stats.brands') },
                      { value: '15+', label: t('homepage.hero.stats.years') },
                      { value: '500+', label: t('homepage.hero.stats.branches') },
                    ].map((stat, index) => (
                      <Col key={index} xs={8} lg={8}>
                        <motion.div
                          variants={statsVariants}
                          custom={index}
                          style={{
                            display: 'flex',
                            flexDirection: 'column', // Always column for cleaner stat look
                            alignItems: isStacked ? 'center' : 'flex-start',
                            gap: 2
                          }}
                        >
                          <span style={{ color: 'var(--primary)', fontSize: isMobile ? 20 : 28, fontWeight: 700 }}>{stat.value}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: isMobile ? 11 : 13, textAlign: 'center' }}>{stat.label}</span>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                </motion.div>
              </Flex>
            </motion.div>
          </Col>

          {/* Right Column - Dashboard Mockup - Hidden on small mobile, visible on tablet */}
          <Col xs={24} lg={12} style={{ display: isMobile ? 'none' : 'block' }}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate={isAnimationReady ? 'visible' : 'hidden'}
            >
              <Card
                style={{
                  background: 'var(--card)',
                  borderRadius: 24,
                  border: '1px solid var(--border)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
                }}
                styles={{ body: { padding: 24 } }}
              >
                <Flex vertical gap={20} style={{ width: '100%' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 18, color: 'var(--text)' }}>{t('homepage.hero.dashboard.title')}</Text>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, var(--primary) 0%, #CC2D08 100%)',
                        borderRadius: 8,
                      }}
                    />
                  </div>

                  {/* Chart Area */}
                  <Card
                    style={{
                      background: 'var(--card)',
                      border: `1px solid var(--border)`,
                      borderRadius: 12,
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Text strong style={{ color: 'var(--text)', display: 'block', marginBottom: 8 }}>{t('homepage.hero.dashboard.revenue_7_days')}</Text>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
                      {[32, 52, 44, 68, 60, 80, 72].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: `${h}%`,
                            minHeight: 20,
                            borderRadius: 8,
                            background: 'linear-gradient(180deg, #FF6B3B 0%, var(--primary) 100%)',
                            boxShadow: '0 6px 18px rgba(255, 56, 11, 0.25)',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => <span key={d}>{d}</span>)}
                    </div>
                  </Card>

                  {/* Metrics */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card size="small" style={{ borderRadius: 12, background: 'var(--card)', border: `1px solid var(--border)` }}>
                        <Text style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          {t('homepage.hero.dashboard.revenue')}
                        </Text>
                        <Title level={4} style={{ margin: '8px 0 0', color: 'var(--primary)' }}>
                          ₫2.4M
                        </Title>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" style={{ borderRadius: 12, background: 'var(--card)', border: `1px solid var(--border)` }}>
                        <Text style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          {t('homepage.hero.dashboard.orders')}
                        </Text>
                        <Title level={4} style={{ margin: '8px 0 0', color: 'var(--primary)' }}>
                          148
                        </Title>
                      </Card>
                    </Col>
                  </Row>

                  {/* Table Preview */}
                  <Card size="small" style={{ borderRadius: 12, background: 'var(--card)', border: `1px solid var(--border)` }}>
                    <Text strong style={{ display: 'block', marginBottom: 12, color: 'var(--text)' }}>
                      <FileTextOutlined style={{ marginRight: 6 }} /> {t('homepage.hero.dashboard.recent_orders')}
                    </Text>
                    <Flex vertical gap={12} style={{ width: '100%' }}>
                      {[
                        { table: 'A02', total: 'đ750.000', status: t('staff.orders.status.pending'), color: 'var(--primary)', bar: 88 },
                        { table: 'B01', total: 'đ1.25M', status: t('staff.orders.status.served'), color: '#52c41a', bar: 72 },
                        { table: 'VIP01', total: 'đ3.48M', status: t('staff.tables.status.occupied'), color: 'var(--primary)', bar: 64 },
                      ].map((order, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ color: 'var(--text)', fontSize: 14 }}>{order.table}</Text>
                            <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>{order.total}</Text>
                            <span style={{ color: order.color, fontSize: 12, fontWeight: 700 }}>{order.status}</span>
                          </div>
                          <div
                            style={{
                              height: 8,
                              borderRadius: 999,
                              background: 'var(--border)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${order.bar}%`,
                                height: '100%',
                                background: order.color,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </Flex>
                  </Card>
                </Flex>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Trusted By - Inside Hero */}
        <motion.div
          variants={trustedByVariants}
          initial="hidden"
          animate={isAnimationReady ? 'visible' : 'hidden'}
          style={{
            marginTop: 48,
            paddingTop: 32,
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <Text
            style={{
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            {t('homepage.hero.trusted_by')}
          </Text>
          <motion.div
            initial="hidden"
            animate={isAnimationReady ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 1.2,
                },
              },
            }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 24,
              marginTop: 20,
              flexWrap: 'wrap',
            }}
          >
            {['Golden Gate', 'Redsun', 'ThaiExpress', 'Phở 24', 'Highlands', 'King BBQ'].map((brand, index) => (
              <motion.span
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.4,
                      ease: [0.25, 0.4, 0.25, 1],
                    },
                  },
                }}
                style={{
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '8px 16px',
                  background: 'var(--card)',
                  borderRadius: 8,
                }}
              >
                {brand}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Tenant Request Form Modal */}
      <TenantRequestForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          console.log('Tenant request submitted successfully');
        }}
      />
    </section>
  );
};

export default HeroSection;
