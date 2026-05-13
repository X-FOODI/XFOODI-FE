"use client";

import { AutoComplete, Form } from "antd";
import type { FormInstance } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";

interface VnStreetAutocompleteProps {
  form: FormInstance;
  fieldName: string;
  cityFieldName?: string;
  districtWardFieldName?: string;
  countryFieldName?: string;
  placeholder?: string;
  disabled?: boolean;
}

type NominatimItem = {
  display_name: string;
  name?: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state?: string;
  };
};

function formatSuggestion(item: NominatimItem): string {
  const road = [item.address?.house_number, item.address?.road]
    .filter(Boolean)
    .join(" ")
    .trim();
  const area = [
    item.address?.suburb,
    item.address?.city_district,
    item.address?.city,
    item.address?.state,
  ]
    .filter(Boolean)
    .join(", ")
    .trim();

  if (road && area) return `${road}, ${area}`;
  if (road) return road;
  return item.display_name;
}

export default function VnStreetAutocomplete({
  form,
  fieldName,
  cityFieldName,
  districtWardFieldName,
  countryFieldName,
  placeholder,
  disabled,
}: VnStreetAutocompleteProps) {
  const value = Form.useWatch(fieldName, form) || "";
  const [options, setOptions] = useState<({ value: string; label: string; rawItem: NominatimItem })[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const keyword = useMemo(() => String(value).trim(), [value]);

  useEffect(() => {
    if (keyword.length < 3) {
      setOptions([]);
      setLoading(false);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        setLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=vn&addressdetails=1&limit=8&q=${encodeURIComponent(keyword)}`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: {
            "Accept-Language": "vi",
          },
        });

        if (!res.ok) {
          setOptions([]);
          return;
        }

        const data = (await res.json()) as NominatimItem[];
        const next = Array.isArray(data)
          ? data.map((item) => {
              const text = formatSuggestion(item);
              return { value: text, label: text, rawItem: item };
            })
          : [];

        const unique = Array.from(new Map(next.map((i) => [i.value, i])).values());
        setOptions(unique);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <AutoComplete
      value={value}
      size="large"
      options={options.map(opt => ({ value: opt.value, label: opt.label }))}
      onChange={(next) => form.setFieldValue(fieldName, next)}
      onSelect={(next) => {
        form.setFieldValue(fieldName, next);
        const selectedOption = options.find(opt => opt.value === next);
        if (selectedOption && selectedOption.rawItem && selectedOption.rawItem.address) {
          const { state, city, city_district, suburb } = selectedOption.rawItem.address;
          const province = state || city;
          const ward = suburb || city_district;
          
          if (cityFieldName && province) {
            form.setFieldValue(cityFieldName, province);
          }
          if (districtWardFieldName && ward) {
            form.setFieldValue(districtWardFieldName, ward);
          }
          if (countryFieldName) {
            form.setFieldValue(countryFieldName, "Việt Nam");
          }
        }
      }}
      placeholder={placeholder}
      notFoundContent={keyword.length >= 3 ? (loading ? "Đang gợi ý..." : "Không có gợi ý") : "Nhập ít nhất 3 ký tự"}
      disabled={disabled}
      allowClear
    />
  );
}
