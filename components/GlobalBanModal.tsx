'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Typography, Result } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/contexts/AuthContext';

const { Paragraph, Text } = Typography;

export default function GlobalBanModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [banInfo, setBanInfo] = useState<{ message: string; reason: string } | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handleGlobalBan = (event: any) => {
      setBanInfo(event.detail);
      setIsVisible(true);
    };

    window.addEventListener('globalBan', handleGlobalBan);
    return () => {
      window.removeEventListener('globalBan', handleGlobalBan);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Modal
      open={isVisible}
      closable={false}
      maskClosable={false}
      footer={null}
      keyboard={false}
      centered
      width={480}
      styles={{ mask: { backgroundColor: 'rgba(0,0,0,0.85)' } }}
      className="global-ban-modal"
    >
      <Result
        status="error"
        icon={<StopOutlined style={{ color: '#ff4d4f' }} />}
        title={
          <span style={{ fontSize: '24px', fontWeight: 600 }}>
            {banInfo?.message?.toLowerCase().includes('restaurant') ? 'Restaurant Disabled' : 'Account Disabled'}
          </span>
        }
        subTitle={
          <div style={{ marginTop: '16px' }}>
            <Paragraph>
              <Text strong>{banInfo?.message}</Text>
            </Paragraph>
            <div
              style={{
                backgroundColor: '#fff1f0',
                padding: '12px 16px',
                borderRadius: '8px',
                borderLeft: '4px solid #ff4d4f',
                textAlign: 'left',
                marginBottom: '24px'
              }}
            >
              <Text style={{ color: '#a8071a' }}>
                <strong>Reason:</strong> {banInfo?.reason}
              </Text>
            </div>
            <Paragraph type="secondary">
              Please contact our support team if you believe this is a mistake.
            </Paragraph>
          </div>
        }
        extra={[
          <Button
            key="home"
            size="large"
            block
            style={{ marginBottom: '8px' }}
            onClick={() => {
              // Return to root main domain
              window.location.href = `http://${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'xfoodi.website'}`;
            }}
          >
            Return to Homepage
          </Button>,
          <Button
            key="logout"
            type="primary"
            danger
            size="large"
            block
            onClick={() => {
              setIsVisible(false);
              logout();
            }}
          >
            Logout
          </Button>
        ]}
      />
    </Modal>
  );
}
