'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, message, Select } from 'antd';
import { GlobalOutlined, UploadOutlined } from '@ant-design/icons';
import adminAxios from '@/lib/services/axiosInstance';

export default function GeneralSettings({ settings, onSettingsUpdated }: { settings: any, onSettingsUpdated: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      systemName: settings?.systemName || 'XFOODI',
      language: settings?.language || 'en',
      timezone: settings?.timezone || 'UTC+7',
      currency: settings?.currency || 'VND',
      dateFormat: settings?.dateFormat || 'DD/MM/YYYY'
    });
  }, [settings, form]);

  const onSave = async (values: any) => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && key !== 'logo') formData.append(key, values[key]);
      });
      if (values.logo?.file) {
        formData.append('logo', values.logo.file);
      }
      
      const res = await adminAxios.put('/settings/admin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        message.success('Cập nhật cài đặt chung thành công!');
        setIsDirty(false);
        onSettingsUpdated();
      }
    } catch (error: any) {
      message.error('Cập nhật cài đặt chung thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<><GlobalOutlined /> Cấu hình chung</>}>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSave}
        onValuesChange={() => setIsDirty(true)}
      >
        <Form.Item label="Tên hệ thống" name="systemName" rules={[{ required: true }]}>
          <Input placeholder="Nhập tên hệ thống" />
        </Form.Item>
        
        <Form.Item label="Logo hệ thống" name="logo">
          <Upload maxCount={1} beforeUpload={() => false} listType="picture">
            <Button icon={<UploadOutlined />}>Tải Logo lên</Button>
          </Upload>
        </Form.Item>
        
        <Form.Item label="Ngôn ngữ" name="language">
          <Select>
            <Select.Option value="en">English</Select.Option>
            <Select.Option value="vi">Tiếng Việt</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="Múi giờ" name="timezone">
          <Select>
            <Select.Option value="UTC+7">UTC +7 (Indochina Time)</Select.Option>
            <Select.Option value="UTC+0">UTC +0</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="Tiền tệ" name="currency">
          <Select>
            <Select.Option value="VND">VND - Vietnam Dong</Select.Option>
            <Select.Option value="USD">USD - US Dollar</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="Định dạng ngày tháng" name="dateFormat">
          <Select>
            <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
            <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
            <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!isDirty}>
            Lưu cài đặt chung
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
