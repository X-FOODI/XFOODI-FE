"use client";

import VnAddressSelect from "@/components/ui/VnAddressSelect";
import VnStreetAutocomplete from "@/components/ui/VnStreetAutocomplete";
import { tenantService } from "@/lib/services/tenantService";
import { TenantRequestInput } from "@/lib/types/tenant";
import { MailOutlined, PhoneOutlined, ShopOutlined } from "@ant-design/icons";
import { App, Col, Form, Input, Modal, Row } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const customStyles = `
  .tenant-request-form .url-bar {
    display: flex;
    align-items: center;
    border: 1px solid var(--ant-color-border, #d9d9d9);
    border-radius: 6px;
    height: 40px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    padding: 0 12px;
    gap: 2px;
    cursor: text;
  }

  .tenant-request-form .url-bar:focus-within {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1) !important;
  }

  .tenant-request-form .url-bar .ant-input {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    height: 100%;
    border-radius: 0 !important;
    font-size: 14px;
    flex: 1;
    min-width: 0;
  }

  .tenant-request-form .url-bar .url-segment {
    font-size: 14px;
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
  }

  .tenant-request-form .url-bar .url-scheme,
  .tenant-request-form .url-bar .url-suffix {
    color: #6b7280;
  }
`;

interface TenantRequestFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

export const TenantRequestForm: React.FC<TenantRequestFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<TenantRequestInput>();
  const [loading, setLoading] = useState(false);
  const [hostNameValue, setHostNameValue] = useState("");

  const handleSubmit = async (values: TenantRequestInput) => {
    setLoading(true);

    try {
      const normalizedHostname = values.hostname?.trim().toLowerCase();
      const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
      const requestData: TenantRequestInput = {
        ...values,
        hostname: normalizedHostname
          ? normalizedHostname.endsWith(`.${BASE_DOMAIN}`)
            ? normalizedHostname
            : `${normalizedHostname}.${BASE_DOMAIN}`
          : normalizedHostname,
      };

      await tenantService.addTenantRequest(requestData);

      message.success({
        content: t("tenant_requests.form.success_message"),
        duration: 5,
      });

      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("tenant_requests.form.error_message");
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const validateSlug = (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
    if (!/^[a-z0-9-]+$/.test(value)) {
      return Promise.reject(new Error(t("tenant_requests.form.hostname_invalid")));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ShopOutlined className="text-orange-500" />
          <span>{t("tenant_requests.form.title")}</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText={t("tenant_requests.form.submit")}
      cancelText={t("tenant_requests.form.cancel")}
      confirmLoading={loading}
      width="90%"
      style={{ maxWidth: 700 }}
      styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingTop: 16, paddingBottom: 16 } }}
      mask={{ closable: false }}
      destroyOnHidden
    >
      <style>{customStyles}</style>
      <div className="py-2 tenant-request-form">
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("tenant_requests.form.description")}
        </p>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("tenant_requests.form.restaurant_name")}
                name="name"
                rules={[
                  { required: true, message: t("tenant_requests.form.restaurant_name_required") },
                  { min: 3, message: t("tenant_requests.form.restaurant_name_min") },
                ]}
              >
                <Input prefix={<ShopOutlined style={{ color: "var(--text-muted)" }} />} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={t("tenants.create.fields.host_name")}
                name="hostname"
                rules={[
                  { required: true, message: t("tenant_requests.form.hostname_required") },
                  { validator: validateSlug },
                ]}
                tooltip={t("tenant_requests.form.hostname_tooltip")}
              >
                <div className="url-bar">
                  <span className="url-segment url-scheme">https://</span>
                  <Input
                    value={hostNameValue}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                      form.setFieldValue("hostname", value);
                      setHostNameValue(value);
                    }}
                  />
                  <span className="url-segment url-suffix">.{process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website"}</span>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t("tenant_requests.form.business_name")} name="businessName">
            <Input prefix={<ShopOutlined style={{ color: "var(--text-muted)" }} />} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("tenant_requests.form.business_email")}
                name="businessEmailAddress"
                rules={[{ type: "email", message: t("tenant_requests.form.business_email_invalid") }]}
              >
                <Input prefix={<MailOutlined style={{ color: "var(--text-muted)" }} />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t("tenant_requests.form.phone_number")} name="businessPrimaryPhone">
                <Input prefix={<PhoneOutlined style={{ color: "var(--text-muted)" }} />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t("tenant_requests.form.address_line_1_placeholder")} name="businessAddressLine1">
            <VnStreetAutocomplete 
              form={form} 
              fieldName="businessAddressLine1" 
              cityFieldName="businessAddressLine3"
              districtWardFieldName="businessAddressLine2"
              countryFieldName="businessCountry"
            />
          </Form.Item>

          <VnAddressSelect
            form={form}
            cityFieldName="businessAddressLine3"
            districtWardFieldName="businessAddressLine2"
            countryFieldName="businessCountry"
            required
            cityRequiredMessage={t("tenant_requests.form.city_required", { defaultValue: "Vui lòng chọn tỉnh/thành phố" })}
            districtRequiredMessage={t("tenant_requests.form.district_required", { defaultValue: "Vui lòng chọn phường/xã" })}
            wardRequiredMessage={t("tenant_requests.form.ward_required", { defaultValue: "Vui lòng chọn phường/xã" })}
          />

          <Form.Item label={t("tenant_requests.form.country_placeholder")} name="businessCountry" initialValue="Việt Nam">
            <Input readOnly />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default TenantRequestForm;
