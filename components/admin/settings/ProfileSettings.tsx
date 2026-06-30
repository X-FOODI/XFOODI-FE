'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, message, Typography, Space } from 'antd';
import { UploadOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/contexts/AuthContext';
import adminAxios from '@/lib/services/axiosInstance';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPassDirty, setIsPassDirty] = useState(false);
  
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || ''
      });
    }
  }, [user, profileForm]);

  const onProfileSave = async (values: any) => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && key !== 'avatar') formData.append(key, values[key]);
      });
      if (values.avatar?.file) {
        formData.append('avatar', values.avatar.file);
      }
      
      const res = await adminAxios.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        message.success('Cập nhật hồ sơ thành công!');
        setIsDirty(false);
        if (res.data.data) {
          updateUser(res.data.data);
        } else {
          window.location.reload();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSave = async (values: any) => {
    try {
      setPassLoading(true);
      const res = await adminAxios.put('/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });
      if (res.data.success) {
        message.success('Đổi mật khẩu thành công!');
        passwordForm.resetFields();
        setIsPassDirty(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title={<><UserOutlined /> Thông tin hồ sơ</>}>
        <Form 
          form={profileForm} 
          layout="vertical" 
          onFinish={onProfileSave}
          onValuesChange={() => setIsDirty(true)}
        >
          <Form.Item label="Ảnh đại diện" name="avatar">
            <Upload maxCount={1} beforeUpload={() => false} listType="picture">
              <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          
          <Form.Item label="Email" name="email">
            <Input disabled placeholder="admin@xfoodi.com" />
          </Form.Item>
          
          <Form.Item label="Số điện thoại" name="phoneNumber">
            <Input placeholder="+84..." />
          </Form.Item>
          
          <Form.Item label="Địa chỉ" name="address">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} disabled={!isDirty}>
              Lưu hồ sơ
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title={<><LockOutlined /> Đổi mật khẩu</>}>
        <Form 
          form={passwordForm} 
          layout="vertical" 
          onFinish={onPasswordSave}
          onValuesChange={() => setIsPassDirty(true)}
        >
          <Form.Item 
            label="Mật khẩu hiện tại" 
            name="currentPassword" 
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>
          
          <Form.Item 
            label="Mật khẩu mới" 
            name="newPassword" 
            rules={[{ required: true, message: 'Bắt buộc' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
          
          <Form.Item 
            label="Xác nhận mật khẩu" 
            name="confirmPassword" 
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Bắt buộc' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu mới" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passLoading} disabled={!isPassDirty}>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
