'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Button, Select, message, Modal, Typography } from 'antd';
import { DollarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import adminAxios from '@/lib/services/axiosInstance';

const { Text } = Typography;

export default function BusinessSettings({ settings, onSettingsUpdated }: { settings: any, onSettingsUpdated: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      commissionRate: parseFloat(settings?.commissionRate || '10'),
      minDeliveryFee: parseInt(settings?.minDeliveryFee || '15000'),
      maxDeliveryDistance: parseInt(settings?.maxDeliveryDistance || '20'),
      refundPeriod: parseInt(settings?.refundPeriod || '24'),
      defaultRestaurantStatus: settings?.defaultRestaurantStatus || 'PENDING',
      defaultUserStatus: settings?.defaultUserStatus || 'ACTIVE'
    });
  }, [settings, form]);

  const onSave = (values: any) => {
    Modal.confirm({
      title: 'Xác nhận thay đổi cấu hình doanh thu?',
      icon: <ExclamationCircleOutlined />,
      content: 'Các thông số như Commission, Delivery Fee ảnh hưởng trực tiếp đến dòng tiền của hệ thống. Bạn có chắc chắn muốn lưu các thay đổi này không?',
      okText: 'Xác nhận Lưu',
      okType: 'danger',
      cancelText: 'Hủy bỏ',
      onOk: async () => {
        try {
          setLoading(true);
          const payload: Record<string, string> = {};
          Object.keys(values).forEach(k => {
            payload[k] = String(values[k]);
          });
          
          const res = await adminAxios.put('/settings/admin', payload);
          if (res.data.success) {
            message.success('Cập nhật cấu hình doanh thu thành công!');
            setIsDirty(false);
            onSettingsUpdated();
          }
        } catch (error: any) {
          message.error('Cập nhật cấu hình doanh thu thất bại');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <Card title={<><DollarOutlined /> Kinh doanh & Vận hành</>}>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSave}
        onValuesChange={() => setIsDirty(true)}
      >
        <Form.Item label="Hoa hồng nhà hàng (%)" name="commissionRate">
          <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="Phí giao hàng tối thiểu (VND)" name="minDeliveryFee">
          <InputNumber min={0} step={1000} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="Khoảng cách giao hàng tối đa (km)" name="maxDeliveryDistance">
          <InputNumber min={1} max={100} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="Thời gian hoàn tiền (Giờ)" name="refundPeriod">
          <InputNumber min={0} max={720} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item label="Trạng thái nhà hàng mặc định" name="defaultRestaurantStatus">
          <Select>
            <Select.Option value="PENDING">Chờ duyệt</Select.Option>
            <Select.Option value="ACTIVE">Hoạt động</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Trạng thái người dùng mặc định" name="defaultUserStatus">
          <Select>
            <Select.Option value="ACTIVE">Hoạt động</Select.Option>
            <Select.Option value="INACTIVE">Không hoạt động / Cần xác minh</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!isDirty}>
            Lưu cấu hình doanh thu
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
