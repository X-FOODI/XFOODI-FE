"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Col, Form, Input, Row, Select } from "antd";
import type { FormInstance } from "antd";
import { useTranslation } from "react-i18next";

type VnProvince = { code: number; name: string };
type VnWard = { code: number; name: string };

type FieldName = string;

interface VnAddressSelectProps {
  form: FormInstance;
  cityFieldName: FieldName;
  districtWardFieldName: FieldName;
  stateProvinceFieldName?: FieldName;
  countryFieldName?: FieldName;
  countryValue?: string;
  cityLabel?: React.ReactNode;
  districtLabel?: React.ReactNode;
  wardLabel?: React.ReactNode;
  cityPlaceholder?: string;
  districtPlaceholder?: string;
  wardPlaceholder?: string;
  required?: boolean;
  cityRequiredMessage?: string;
  districtRequiredMessage?: string;
  wardRequiredMessage?: string;
  hideMappedFields?: boolean;
}

let provincesCache: VnProvince[] | null = null;
const wardsCache = new Map<number, VnWard[]>();

async function fetchJsonWithFallback<T>(urls: string[]): Promise<T | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      return (await res.json()) as T;
    } catch {
      // try next URL
    }
  }
  return null;
}

function normalizeProvinceList(data: unknown): VnProvince[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item: any) => ({ code: Number(item?.code), name: String(item?.name || "") }))
    .filter((p: VnProvince) => Number.isFinite(p.code) && !!p.name);
}

function normalizeWardsFromProvincePayload(data: any): VnWard[] {
  if (!data) return [];

  if (Array.isArray(data.wards)) {
    return data.wards
      .map((w: any) => ({ code: Number(w?.code), name: String(w?.name || "") }))
      .filter((w: VnWard) => Number.isFinite(w.code) && !!w.name);
  }

  // fallback if API returns districts with wards (legacy shape)
  if (Array.isArray(data.districts)) {
    const flattened = data.districts.flatMap((d: any) => (Array.isArray(d?.wards) ? d.wards : []));
    const mapped = flattened
      .map((w: any) => ({ code: Number(w?.code), name: String(w?.name || "") }))
      .filter((w: VnWard) => Number.isFinite(w.code) && !!w.name);

    const uniq = new Map<number, VnWard>();
    mapped.forEach((w: VnWard) => uniq.set(w.code, w));
    return Array.from(uniq.values());
  }

  return [];
}

export default function VnAddressSelect({
  form,
  cityFieldName,
  districtWardFieldName,
  stateProvinceFieldName,
  countryFieldName,
  countryValue = "Việt Nam",
  cityLabel,
  districtLabel,
  wardLabel,
  cityPlaceholder,
  districtPlaceholder,
  wardPlaceholder,
  required = false,
  cityRequiredMessage,
  districtRequiredMessage,
  wardRequiredMessage,
  hideMappedFields = true,
}: VnAddressSelectProps) {
  const { t } = useTranslation();

  const resolvedCityLabel = cityLabel ?? t("address.vn.city", { defaultValue: "Tỉnh/Thành phố" });
  const resolvedWardLabel =
    wardLabel ?? districtLabel ?? t("address.vn.ward", { defaultValue: "Phường/Xã" });

  const resolvedCityPlaceholder = cityPlaceholder ?? t("address.vn.city_placeholder", { defaultValue: "Chọn tỉnh/thành phố" });
  const resolvedWardPlaceholder =
    wardPlaceholder ?? districtPlaceholder ?? t("address.vn.ward_placeholder", { defaultValue: "Chọn phường/xã" });

  const cityRules = required
    ? [{ required: true, message: cityRequiredMessage ?? t("address.vn.city_required", { defaultValue: "Vui lòng chọn tỉnh/thành phố" }) }]
    : [];
  const wardRules = required
    ? [{ required: true, message: wardRequiredMessage ?? districtRequiredMessage ?? t("address.vn.ward_required", { defaultValue: "Vui lòng chọn phường/xã" }) }]
    : [];

  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [, setWardCode] = useState<number | null>(null);
  const [provinceValue, setProvinceValue] = useState<string | undefined>(undefined);
  const [wardValue, setWardValue] = useState<string | undefined>(undefined);

  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [wards, setWards] = useState<VnWard[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const cityValue = Form.useWatch(cityFieldName, form);
  const districtWardValue = Form.useWatch(districtWardFieldName, form);

  useEffect(() => {
    const loadProvinces = async () => {
      if (provincesCache) {
        setProvinces(provincesCache);
        return;
      }

      try {
        setLoadingProvinces(true);
        const data = await fetchJsonWithFallback<unknown>([
          "https://provinces.open-api.vn/api/v2/",
          "https://provinces.open-api.vn/api/v2/p/",
        ]);
        const next = normalizeProvinceList(data);
        provincesCache = next;
        setProvinces(next);
      } catch {
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    if (!provinces.length || !cityValue) return;

    const provinceName = String(cityValue).trim();
    let matchedProvince = provinces.find(
      (p) => p.name.toLowerCase() === provinceName.toLowerCase(),
    );

    if (!matchedProvince) {
      const cleanInput = provinceName.toLowerCase().replace(/^(tỉnh|thành phố)\s+/i, '').trim();
      matchedProvince = provinces.find(
        (p) => p.name.toLowerCase().replace(/^(tỉnh|thành phố)\s+/i, '').trim() === cleanInput,
      );
    }
    
    if (!matchedProvince) return;

    setProvinceCode(matchedProvince.code);
    setProvinceValue(matchedProvince.name);

    if (countryFieldName) {
      form.setFieldValue(countryFieldName, countryValue);
    }
    if (stateProvinceFieldName) {
      form.setFieldValue(stateProvinceFieldName, countryValue);
    }

    const prefillWards = async () => {
      let nextWards = wardsCache.get(matchedProvince.code) || [];
      if (!nextWards.length) {
        const data = await fetchJsonWithFallback<any>([
          `https://provinces.open-api.vn/api/v2/${matchedProvince.code}?depth=2`,
          `https://provinces.open-api.vn/api/v2/p/${matchedProvince.code}?depth=2`,
        ]);
        nextWards = normalizeWardsFromProvincePayload(data);
        wardsCache.set(matchedProvince.code, nextWards);
      }

      setWards(nextWards);

      const currentWardName = String(districtWardValue || "").trim();
      if (!currentWardName) return;

      let matchedWard = nextWards.find(
        (w) => w.name.toLowerCase() === currentWardName.toLowerCase(),
      );

      if (!matchedWard) {
        const cleanInput = currentWardName.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim();
        matchedWard = nextWards.find(
          (w) => w.name.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim() === cleanInput,
        );
      }

      if (matchedWard) {
        setWardCode(matchedWard.code);
        setWardValue(matchedWard.name);
      }
    };

    prefillWards();
  }, [provinces, cityValue, districtWardValue]);

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ label: p.name, value: p.name })),
    [provinces],
  );

  const wardOptions = useMemo(
    () => wards.map((w) => ({ label: w.name, value: w.name })),
    [wards],
  );

  const handleProvinceChange = async (value: string) => {
    const selected = provinces.find((p) => p.name === value);

    setProvinceValue(value);
    setWardValue(undefined);
    setWardCode(null);

    if (!selected) {
      setProvinceCode(null);
      setWards([]);
      form.setFieldsValue({
        [cityFieldName]: "",
        [districtWardFieldName]: "",
      });
      return;
    }

    setProvinceCode(selected.code);
    form.setFieldsValue({
      [cityFieldName]: selected.name,
      [districtWardFieldName]: "",
      ...(stateProvinceFieldName ? { [stateProvinceFieldName]: countryValue } : {}),
      ...(countryFieldName ? { [countryFieldName]: countryValue } : {}),
    });

    const cached = wardsCache.get(selected.code);
    if (cached) {
      setWards(cached);
      return;
    }

    try {
      setLoadingWards(true);
      const data = await fetchJsonWithFallback<any>([
        `https://provinces.open-api.vn/api/v2/${selected.code}?depth=2`,
        `https://provinces.open-api.vn/api/v2/p/${selected.code}?depth=2`,
      ]);
      const nextWards = normalizeWardsFromProvincePayload(data);
      wardsCache.set(selected.code, nextWards);
      setWards(nextWards);
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleWardChange = (value: string) => {
    const selected = wards.find((w) => w.name === value);
    setWardValue(value);
    setWardCode(selected?.code ?? null);
    form.setFieldsValue({ [districtWardFieldName]: value || "" });
  };

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label={resolvedCityLabel} rules={cityRules}>
            <Select
              showSearch
              size="large"
              loading={loadingProvinces}
              placeholder={resolvedCityPlaceholder}
              value={provinceValue}
              onChange={handleProvinceChange}
              options={provinceOptions}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label={resolvedWardLabel} rules={wardRules}>
            <Select
              showSearch
              size="large"
              loading={loadingWards}
              placeholder={resolvedWardPlaceholder}
              value={wardValue}
              onChange={handleWardChange}
              disabled={!provinceCode}
              options={wardOptions}
            />
          </Form.Item>
        </Col>
      </Row>

      {hideMappedFields && (
        <>
          <Form.Item name={cityFieldName} hidden>
            <Input />
          </Form.Item>
          <Form.Item name={districtWardFieldName} hidden>
            <Input />
          </Form.Item>
        </>
      )}
    </>
  );
}
