'use client';

import { ArrowRightOutlined, GlobalOutlined, HeartOutlined, RocketOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/lib/contexts/TenantContext';

const { Title, Paragraph, Text } = Typography;

const AboutUsSection: React.FC = () => {
    const { t } = useTranslation();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    };

    const stats = [
        { label: t('homepage.about.stats.restaurants', 'Restaurants Empowered'), value: '10k+', icon: <RocketOutlined /> },
        { label: t('homepage.about.stats.countries', 'Countries Supported'), value: '25+', icon: <GlobalOutlined /> },
        { label: t('homepage.about.stats.chefs', 'Happy Chefs'), value: '50k+', icon: <HeartOutlined /> },
        { label: t('homepage.about.stats.team', 'Team Members'), value: '100+', icon: <UsergroupAddOutlined /> },
    ];

    return (
        <section
            id="about-us"
            style={{
                padding: '120px 24px',
                background: 'var(--bg-base)', // Fallback if bg-base not defined? Usually it is in layout.
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative Background Blob */}
            <div
                style={{
                    position: 'absolute',
                    top: '30%',
                    right: '-10%',
                    width: 500,
                    height: 500,
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 60%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '-5%',
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.04) 0%, transparent 60%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                }}
            />

            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={containerVariants}
                >
                    <Row gutter={[64, 48]} align="middle">
                        {/* Left Column: Text Content */}
                        <Col xs={24} lg={12}>
                            <motion.div variants={itemVariants}>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        background: 'rgba(255, 56, 11, 0.08)',
                                        borderRadius: 50,
                                        color: 'var(--primary)',
                                        fontWeight: 600,
                                        fontSize: 14,
                                        marginBottom: 24,
                                    }}
                                >
                                    {t('homepage.about.tag', 'Our Story')}
                                </span>
                                <Title
                                    level={2}
                                    style={{
                                        fontSize: 'clamp(32px, 5vw, 48px)',
                                        fontWeight: 800,
                                        color: 'var(--text)',
                                        lineHeight: 1.5,
                                        marginBottom: 24,
                                    }}
                                >
                                    {t('homepage.about.title_prefix', 'Revolutionizing the')} <br />
                                    <span style={{
                                        background: 'linear-gradient(135deg, var(--primary) 0%, #F59E0B 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        display: 'inline-block',
                                        paddingTop: '0.2em',
                                        marginTop: '-0.2em', // Counteract padding to maintain position
                                        paddingBottom: '0.2em',
                                        marginBottom: '-0.2em'
                                    }}>
                                        {t('homepage.about.title_highlight', 'Culinary World')}
                                    </span>
                                </Title>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Paragraph
                                    style={{
                                        fontSize: 18,
                                        color: 'var(--text-muted)',
                                        lineHeight: 1.8,
                                        marginBottom: 32,
                                        maxWidth: 500,
                                    }}
                                >
                                    {t('homepage.about.description', `Welcome to ${tenantName || 'our restaurant'} — where tradition meets innovation to elevate every dining experience.`)}
                                </Paragraph>

                                <Space size={24} wrap style={{ marginBottom: 48 }}>
                                    <div style={{ paddingLeft: 16, borderLeft: '4px solid var(--primary)' }}>
                                        <Text strong style={{ display: 'block', fontSize: 16, color: 'var(--text)' }}>{t('homepage.about.mission.title', 'Mission Driven')}</Text>
                                        <Text type="secondary">{t('homepage.about.mission.desc', 'Dedicated to your growth')}</Text>
                                    </div>
                                    <div style={{ paddingLeft: 16, borderLeft: '4px solid #6366F1' }}>
                                        <Text strong style={{ display: 'block', fontSize: 16, color: 'var(--text)' }}>{t('homepage.about.innovation.title', 'Innovation First')}</Text>
                                        <Text type="secondary">{t('homepage.about.innovation.desc', 'Always ahead of the curve')}</Text>
                                    </div>
                                </Space>

                                <Button
                                    type="primary"
                                    size="large"
                                    style={{
                                        height: 52,
                                        padding: '0 32px',
                                        borderRadius: 26,
                                        background: 'var(--primary)',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        boxShadow: '0 10px 25px rgba(255, 56, 11, 0.25)'
                                    }}
                                    icon={<ArrowRightOutlined />}
                                >
                                    {t('homepage.about.cta', 'Join Our Journey')}
                                </Button>
                            </motion.div>
                        </Col>

                        {/* Right Column: Visual/Stats */}
                        <Col xs={24} lg={12}>
                            <motion.div variants={itemVariants}>
                                <div style={{ position: 'relative', padding: '20px' }}>
                                    {/* Abstract Grid Composition */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: 24,
                                    }}>
                                        {stats.map((stat, idx) => (
                                            <motion.div
                                                key={idx}
                                                whileHover={{ y: -5 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Card
                                                    variant="borderless"
                                                    style={{
                                                        borderRadius: 24,
                                                        background: 'var(--card)', // Assuming variable exists, else #fff
                                                        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                                                        textAlign: 'center',
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        padding: 24
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: 32,
                                                        marginBottom: 16,
                                                        color: idx % 2 === 0 ? 'var(--primary)' : '#6366F1',
                                                        background: idx % 2 === 0 ? 'rgba(255, 56, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                        width: 64,
                                                        height: 64,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        margin: '0 auto 16px'
                                                    }}>
                                                        {stat.icon}
                                                    </div>
                                                    <Title level={3} style={{ margin: 0, fontWeight: 800, color: 'var(--text)' }}>{stat.value}</Title>
                                                    <Text type="secondary" style={{ fontSize: 15 }}>{stat.label}</Text>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Decorative Elements behind grid */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: '80%',
                                        height: '80%',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, #FF8A00 100%)',
                                        opacity: 0.05,
                                        zIndex: -1,
                                        borderRadius: 40,
                                        transform: 'rotate(-5deg) scale(1.1)',
                                    }} />
                                </div>
                            </motion.div>
                        </Col>
                    </Row>
                </motion.div>
            </div>
        </section>
    );
};

export default AboutUsSection;
