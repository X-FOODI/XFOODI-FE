'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Switch, message, Alert, TimePicker } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import adminAxios from '@/lib/services/axiosInstance';
import dayjs from 'dayjs';

export default function MaintenanceSettings({ settings, onSettingsUpdated }: { settings: any, onSettingsUpdated: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const maintenanceMode = Form.useWatch('maintenanceMode', form);

  useEffect(() => {
    form.setFieldsValue({
      maintenanceMode: settings?.maintenanceMode === 'true',
      maintenanceMessage: settings?.maintenanceMessage || 'System is under maintenance.',
      allowAdminLogin: settings?.allowAdminLogin === 'true',
      estimatedFinish: settings?.estimatedFinish ? dayjs(settings.estimatedFinish, 'HH:mm') : null
    });
  }, [settings, form]);

  const onSave = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        maintenanceMode: String(values.maintenanceMode),
        maintenanceMessage: values.maintenanceMessage,
        allowAdminLogin: String(values.allowAdminLogin),
        estimatedFinish: values.estimatedFinish ? values.estimatedFinish.format('HH:mm') : ''
      };
      
      const res = await adminAxios.put('/settings/admin', payload);
      if (res.data.success) {
        message.success('Cập nhật cài đặt bảo trì thành công!');
        setIsDirty(false);
        onSettingsUpdated();
      }
    } catch (error: any) {
      message.error('Cập nhật cài đặt bảo trì thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<><ToolOutlined /> Chế độ bảo trì</>}>
      {maintenanceMode && (
        <Alert
          message="Cảnh báo nguy hiểm"
          description="Chế độ bảo trì đang BẬT. Toàn bộ người dùng và nhà hàng sẽ không thể truy cập hệ thống. Hành động này ảnh hưởng nghiêm trọng đến hoạt động kinh doanh!"
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSave}
        onValuesChange={() => setIsDirty(true)}
      >
        <Form.Item label="Bật chế độ bảo trì" name="maintenanceMode" valuePropName="checked">
          <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
        </Form.Item>
        
        <Form.Item label="Thông báo bảo trì" name="maintenanceMessage">
          <Input.TextArea rows={3} placeholder="Hệ thống đang được bảo trì. Vui lòng quay lại sau." />
        </Form.Item>
        
        <Form.Item label="Thời gian dự kiến hoàn thành" name="estimatedFinish">
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="Cho phép Quản trị viên đăng nhập" name="allowAdminLogin" valuePropName="checked">
          <Switch checkedChildren="Có" unCheckedChildren="Không" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!isDirty} danger={maintenanceMode}>
            Lưu cài đặt bảo trì
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
