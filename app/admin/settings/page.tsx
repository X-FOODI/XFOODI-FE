'use client';

import React, { useState, useEffect } from 'react';
import { Breadcrumb, Tabs, Spin, Typography } from 'antd';
import { 
  UserOutlined, 
  SafetyOutlined, 
  GlobalOutlined, 
  BellOutlined, 
  DollarOutlined, 
  ToolOutlined,
  HomeOutlined
} from '@ant-design/icons';
import ProfileSettings from '@/components/admin/settings/ProfileSettings';
import SecuritySettings from '@/components/admin/settings/SecuritySettings';
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import NotificationSettings from '@/components/admin/settings/NotificationSettings';
import BusinessSettings from '@/components/admin/settings/BusinessSettings';
import MaintenanceSettings from '@/components/admin/settings/MaintenanceSettings';
import adminAxios from '@/lib/services/axiosInstance';
import Link from 'next/link';

const { Title } = Typography;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminAxios.get('/settings/admin');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading && !settings) {
    return <div className="p-8 flex justify-center items-center h-[50vh]"><Spin size="large" /></div>;
  }

  const items = [
    {
      key: 'profile',
      label: <span><UserOutlined /> Hồ sơ</span>,
      children: <ProfileSettings />
    },
    {
      key: 'security',
      label: <span><SafetyOutlined /> Bảo mật</span>,
      children: <SecuritySettings settings={settings} onSettingsUpdated={fetchSettings} />
    },
    {
      key: 'general',
      label: <span><GlobalOutlined /> Cài đặt chung</span>,
      children: <GeneralSettings settings={settings} onSettingsUpdated={fetchSettings} />
    },
    {
      key: 'notification',
      label: <span><BellOutlined /> Thông báo</span>,
      children: <NotificationSettings settings={settings} onSettingsUpdated={fetchSettings} />
    },
    {
      key: 'business',
      label: <span><DollarOutlined /> Doanh nghiệp</span>,
      children: <BusinessSettings settings={settings} onSettingsUpdated={fetchSettings} />
    },
    {
      key: 'maintenance',
      label: <span><ToolOutlined /> Bảo trì</span>,
      children: <MaintenanceSettings settings={settings} onSettingsUpdated={fetchSettings} />
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: <Link href="/admin/dashboard"><HomeOutlined /> Bảng điều khiển</Link> },
          { title: 'Cài đặt' }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Cài đặt
          </Title>
          <div className="text-gray-500 mt-1">Định cấu hình tài khoản và tùy chọn hệ thống của bạn</div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <Tabs 
          tabPosition="left" 
          items={items} 
          destroyOnHidden={false}
          className="admin-settings-tabs"
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .admin-settings-tabs .ant-tabs-nav {
          width: 250px;
        }
        .admin-settings-tabs .ant-tabs-tab {
          padding: 12px 24px;
          font-size: 15px;
        }
        .admin-settings-tabs .ant-tabs-content-holder {
          padding-left: 24px;
          border-left: 1px solid #f0f0f0;
        }
      `}} />
    </div>
  );
}
