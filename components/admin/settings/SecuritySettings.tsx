'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Button, Switch, message, Checkbox, Space, Typography } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import adminAxios from '@/lib/services/axiosInstance';

const { Text } = Typography;

export default function SecuritySettings({ settings, onSettingsUpdated }: { settings: any, onSettingsUpdated: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      twoFactorEnabled: settings?.twoFactorEnabled === 'true',
      sessionTimeout: parseInt(settings?.sessionTimeout || '30'),
      maxLoginAttempts: parseInt(settings?.maxLoginAttempts || '5'),
      requireStrongPassword: settings?.requireStrongPassword === 'true'
    });
  }, [settings, form]);

  const onSave = async (values: any) => {
    try {
      setLoading(true);
      const res = await adminAxios.put('/settings/admin', {
        twoFactorEnabled: String(values.twoFactorEnabled),
        sessionTimeout: String(values.sessionTimeout),
        maxLoginAttempts: String(values.maxLoginAttempts),
        requireStrongPassword: String(values.requireStrongPassword)
      });
      if (res.data.success) {
        message.success('Cập nhật bảo mật thành công!');
        setIsDirty(false);
        onSettingsUpdated();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Cập nhật bảo mật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<><SafetyOutlined /> Cài đặt bảo mật</>}>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSave}
        onValuesChange={() => setIsDirty(true)}
      >
        <Form.Item label="Xác thực 2 yếu tố (2FA)" name="twoFactorEnabled" valuePropName="checked">
          <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
        </Form.Item>
        
        <Form.Item label="Thời gian chờ phiên làm việc (Phút)" name="sessionTimeout">
          <InputNumber min={5} max={1440} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item 
          label="Số lần đăng nhập sai tối đa" 
          name="maxLoginAttempts"
          extra={<Text type="secondary">Khóa tài khoản 15 phút nếu vượt quá số lần thử.</Text>}
        >
          <InputNumber min={1} max={10} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item name="requireStrongPassword" valuePropName="checked">
          <Checkbox>Yêu cầu mật khẩu mạnh</Checkbox>
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!isDirty}>
            Lưu cài đặt bảo mật
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
