'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Checkbox, message, Space, Switch } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import adminAxios from '@/lib/services/axiosInstance';

export default function NotificationSettings({ settings, onSettingsUpdated }: { settings: any, onSettingsUpdated: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      emailNewUser: settings?.emailNewUser === 'true',
      emailNewRestaurant: settings?.emailNewRestaurant === 'true',
      emailNewReport: settings?.emailNewReport === 'true',
      emailNewFeedback: settings?.emailNewFeedback === 'true',
      browserNotification: settings?.browserNotification === 'true',
      weeklySummary: settings?.weeklySummary === 'true',
    });
  }, [settings, form]);

  const onSave = async (values: any) => {
    try {
      setLoading(true);
      const payload: Record<string, string> = {};
      Object.keys(values).forEach(k => {
        payload[k] = String(values[k]);
      });
      
      const res = await adminAxios.put('/settings/admin', payload);
      if (res.data.success) {
        message.success('Cập nhật thông báo thành công!');
        setIsDirty(false);
        onSettingsUpdated();
      }
    } catch (error: any) {
      message.error('Cập nhật thông báo thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<><BellOutlined /> Tùy chọn thông báo</>}>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSave}
        onValuesChange={() => setIsDirty(true)}
      >
        <Form.Item label="Thông báo qua Email">
          <Space direction="vertical">
            <Form.Item name="emailNewUser" valuePropName="checked" noStyle>
              <Checkbox>Đăng ký người dùng mới</Checkbox>
            </Form.Item>
            <Form.Item name="emailNewRestaurant" valuePropName="checked" noStyle>
              <Checkbox>Đăng ký nhà hàng mới</Checkbox>
            </Form.Item>
            <Form.Item name="emailNewReport" valuePropName="checked" noStyle>
              <Checkbox>Báo cáo hệ thống mới</Checkbox>
            </Form.Item>
            <Form.Item name="emailNewFeedback" valuePropName="checked" noStyle>
              <Checkbox>Phản hồi từ người dùng mới</Checkbox>
            </Form.Item>
          </Space>
        </Form.Item>
        
        <Form.Item label="Thông báo trình duyệt" name="browserNotification" valuePropName="checked">
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>
        
        <Form.Item label="Báo cáo tổng hợp hàng tuần" name="weeklySummary" valuePropName="checked">
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!isDirty}>
            Lưu cài đặt thông báo
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
