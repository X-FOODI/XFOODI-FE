'use client';

import { useTenant } from "@/lib/contexts/TenantContext";
import {
  FacebookFilled,
  LinkedinFilled,
  YoutubeFilled,
} from '@ant-design/icons';
import { Col, Divider, Row, Space, Typography } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';
const { Title, Text, Link } = Typography;

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}


const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const currentYear = new Date().getFullYear();

  const footerColumns: FooterColumn[] = [
    {
      title: t('homepage.footer.columns.product.title'),
      links: [
        { label: t('homepage.footer.columns.product.overview'), href: '#overview' },
        { label: t('homepage.footer.columns.product.features'), href: '#features' },
        { label: t('homepage.footer.columns.product.pricing'), href: '#pricing' },
        { label: t('homepage.footer.columns.product.integrations'), href: '#integrations' },
      ],
    },
    {
      title: t('homepage.footer.columns.resources.title'),
      links: [
        { label: t('homepage.footer.columns.resources.blog'), href: '#blog' },
        { label: t('homepage.footer.columns.resources.help_center'), href: '#help' },
        { label: t('homepage.footer.columns.resources.faqs'), href: '#faqs' },
        { label: t('homepage.footer.columns.resources.documentation'), href: '#docs' },
      ],
    },
    {
      title: t('homepage.footer.columns.company.title'),
      links: [
        { label: t('homepage.footer.columns.company.about'), href: '#about' },
        { label: t('homepage.footer.columns.company.contact'), href: '#contact' },
        { label: t('homepage.footer.columns.company.careers'), href: '#careers' },
        { label: t('homepage.footer.columns.company.partners'), href: '#partners' },
      ],
    },
    {
      title: t('homepage.footer.columns.legal.title'),
      links: [
        { label: t('homepage.footer.columns.legal.privacy'), href: '#privacy' },
        { label: t('homepage.footer.columns.legal.terms'), href: '#terms' },
        { label: t('homepage.footer.columns.legal.cookies'), href: '#cookies' },
        { label: t('homepage.footer.columns.legal.gdpr'), href: '#gdpr' },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const bottomVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.4,
      },
    },
  };

  return (
    <footer
      style={{
        background: 'var(--bg-base)',
        padding: '64px 24px 32px',
        color: 'var(--text)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Row gutter={[48, 48]}>
            {/* Logo and Tagline */}
            <Col xs={24} md={8}>
              <motion.div variants={itemVariants}>
                <Space orientation="vertical" size={20}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png"}
                        alt={tenant?.businessName || tenant?.name || "Restaurant Logo"}
                        className="app-logo-img"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                        onError={(e) => { e.currentTarget.src = '/images/logo/restx-removebg-preview.png'; }}
                      />
                    </div>
                    <Title level={4} style={{ margin: 0, color: 'var(--text)' }}>
                      {tenant?.businessName || tenant?.name || t('homepage.footer.brand', { defaultValue: 'Restaurant' })}
                    </Title>
                  </div>

                  <Text style={{ color: 'var(--text-muted)', lineHeight: 1.7, display: 'block', maxWidth: 280 }}>
                    {t('homepage.footer.tagline')}
                  </Text>

                  {/* Social Icons */}
                  <Space size={8}>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <FacebookFilled style={{ fontSize: 18 }} />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <LinkedinFilled style={{ fontSize: 18 }} />
                    </a>
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <YoutubeFilled style={{ fontSize: 18 }} />
                    </a>
                  </Space>
                </Space>
              </motion.div>
            </Col>

            {/* Footer Links */}
            <Col xs={24} md={16}>
              <Row gutter={[32, 32]}>
                {footerColumns.map((column, index) => (
                  <Col xs={12} sm={6} key={index}>
                    <motion.div variants={itemVariants}>
                      <Space orientation="vertical" size={16}>
                        <Text strong style={{ color: 'var(--text)', fontSize: 15 }}>
                          {column.title}
                        </Text>
                        <Space orientation="vertical" size={12}>
                          {column.links.map((link, linkIndex) => (
                            <Link
                              key={linkIndex}
                              href={link.href}
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: 14,
                                transition: 'color 0.2s ease',
                              }}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </Space>
                      </Space>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={bottomVariants}
        >
          <Divider style={{ borderColor: 'var(--border)', margin: '48px 0 24px' }} />

          {/* Bottom Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {t('homepage.footer.copyright', { year: currentYear })}
            </Text>
            <Space size={24}>
              <Link href="#privacy" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {t('homepage.footer.privacy')}
              </Link>
              <Link href="#terms" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {t('homepage.footer.terms')}
              </Link>
              <Link href="#cookies" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {t('homepage.footer.cookies')}
              </Link>
            </Space>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
