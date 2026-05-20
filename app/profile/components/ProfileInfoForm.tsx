"use client";

import {
  CalendarOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  MailOutlined,
  ManOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import type { User } from "@/lib/services/authService";

// ── Validation ────────────────────────────────────────────────────────────────

function validateFullName(value: string): string {
  if (!value.trim()) return "Full name is required.";
  if (value.trim().length < 2) return "Full name must be at least 2 characters.";
  if (value.trim().length > 100) return "Full name must be at most 100 characters.";
  return "";
}

function validatePhone(value: string): string {
  if (!value.trim()) return "";
  const phoneRegex = /^(\+84|0)(3[2-9]|5[6-9]|7[0|6-9]|8[0-9]|9[0-9])[0-9]{7}$/;
  if (!phoneRegex.test(value.replace(/\s/g, ""))) {
    return "Invalid phone number. Use a valid Vietnamese number (e.g. 0912345678).";
  }
  return "";
}

function validateDateOfBirth(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Invalid date.";
  if (date > new Date()) return "Date of birth cannot be in the future.";
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  if (date < minDate) return "Please enter a valid date of birth.";
  return "";
}

function validateAddress(value: string): string {
  if (!value.trim()) return "";
  if (value.trim().length > 255) return "Address must be at most 255 characters.";
  return "";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileFormValues {
  fullName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  address: string;
}

type FieldKey = keyof ProfileFormValues;

interface ProfileInfoFormProps {
  user: User;
  loading: boolean;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

// ── Shared input style (uses CSS variables — works in both light & dark) ──────
// Avoids Tailwind dark: classes that get overridden by globals.css utility overrides.
const inputStyle: React.CSSProperties = {
  width: "100%",
  paddingLeft: "2.5rem",
  paddingRight: "1rem",
  paddingTop: "0.75rem",
  paddingBottom: "0.75rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: "#f87171",
};

const inputDisabledStyle: React.CSSProperties = {
  ...inputStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileInfoForm({ user, loading, onSubmit }: ProfileInfoFormProps) {
  const [values, setValues] = useState<ProfileFormValues>({
    fullName: user.fullName || user.name || "",
    phoneNumber: user.phoneNumber || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    address: user.address || "",
  });

  const [errors, setErrors] = useState<ProfileFormValues>({
    fullName: "", phoneNumber: "", gender: "", dateOfBirth: "", address: "",
  });

  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    fullName: false, phoneNumber: false, gender: false, dateOfBirth: false, address: false,
  });

  // Sync when user prop changes after a successful save
  useEffect(() => {
    setValues({
      fullName: user.fullName || user.name || "",
      phoneNumber: user.phoneNumber || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
      address: user.address || "",
    });
  }, [user]);

  const validate = (v: ProfileFormValues): ProfileFormValues => ({
    fullName: validateFullName(v.fullName),
    phoneNumber: validatePhone(v.phoneNumber),
    gender: "",
    dateOfBirth: validateDateOfBirth(v.dateOfBirth),
    address: validateAddress(v.address),
  });

  const handleChange = (field: FieldKey, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field]) setErrors(validate(next));
  };

  const handleBlur = (field: FieldKey) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      Object.keys(touched).map((k) => [k, true])
    ) as Record<FieldKey, boolean>;
    setTouched(allTouched);
    const errs = validate(values);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    await onSubmit(values);
  };

  // Resolve style per field
  const getStyle = (field: FieldKey): React.CSSProperties => {
    if (loading) return inputDisabledStyle;
    if (touched[field] && errors[field]) return inputErrorStyle;
    return inputStyle;
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "0.75rem",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
    color: "var(--text-muted)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    marginBottom: "0.375rem",
    color: "var(--text)",
  };

  const errorMsgStyle: React.CSSProperties = {
    marginTop: "0.25rem",
    fontSize: "0.75rem",
    color: "#f87171",
    fontWeight: 500,
  };

  const fieldError = (field: FieldKey) =>
    touched[field] && errors[field] ? (
      <p style={errorMsgStyle}>{errors[field]}</p>
    ) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Row 1: Full Name + Phone ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" style={labelStyle}>
            Full Name <span style={{ color: "#f87171" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={iconStyle}><UserOutlined /></span>
            <input
              id="fullName"
              type="text"
              value={values.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              disabled={loading}
              placeholder="Your full name"
              autoComplete="name"
              style={getStyle("fullName")}
            />
          </div>
          {fieldError("fullName")}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" style={labelStyle}>
            Phone Number
          </label>
          <div style={{ position: "relative" }}>
            <span style={iconStyle}><PhoneOutlined /></span>
            <input
              id="phoneNumber"
              type="tel"
              value={values.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              onBlur={() => handleBlur("phoneNumber")}
              disabled={loading}
              placeholder="0912 345 678"
              autoComplete="tel"
              style={getStyle("phoneNumber")}
            />
          </div>
          {fieldError("phoneNumber")}
        </div>
      </div>

      {/* ── Email — read-only ── */}
      <div>
        <label htmlFor="email" style={labelStyle}>
          Email{" "}
          <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>
            (cannot be changed)
          </span>
        </label>
        <div style={{ position: "relative" }}>
          <span style={iconStyle}><MailOutlined /></span>
          <input
            id="email"
            type="email"
            value={user.email}
            readOnly
            disabled
            autoComplete="email"
            style={inputDisabledStyle}
          />
        </div>
      </div>

      {/* ── Row 2: Gender + Date of Birth ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gender */}
        <div>
          <label htmlFor="gender" style={labelStyle}>Gender</label>
          <div style={{ position: "relative" }}>
            <span style={iconStyle}><ManOutlined /></span>
            <select
              id="gender"
              value={values.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              onBlur={() => handleBlur("gender")}
              disabled={loading}
              style={{
                ...getStyle("gender"),
                appearance: "none",
                WebkitAppearance: "none",
                paddingRight: "2rem",
              }}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}
                  style={{ background: "var(--surface)", color: "var(--text)" }}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Dropdown arrow */}
            <span style={{
              position: "absolute", top: 0, bottom: 0, right: "0.75rem",
              display: "flex", alignItems: "center", pointerEvents: "none",
              color: "var(--text-muted)",
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" style={labelStyle}>Date of Birth</label>
          <div style={{ position: "relative" }}>
            <span style={iconStyle}><CalendarOutlined /></span>
            <input
              id="dateOfBirth"
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              onBlur={() => handleBlur("dateOfBirth")}
              disabled={loading}
              max={new Date().toISOString().split("T")[0]}
              style={{
                ...getStyle("dateOfBirth"),
                colorScheme: "light dark",
              }}
            />
          </div>
          {fieldError("dateOfBirth")}
        </div>
      </div>

      {/* ── Address ── */}
      <div>
        <label htmlFor="address" style={labelStyle}>Address</label>
        <div style={{ position: "relative" }}>
          <span style={{ ...iconStyle, top: "0.75rem", bottom: "auto" }}>
            <EnvironmentOutlined />
          </span>
          <textarea
            id="address"
            value={values.address}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            disabled={loading}
            placeholder="Street, District, City"
            rows={2}
            style={{
              ...getStyle("address"),
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
              resize: "none",
            }}
          />
        </div>
        {fieldError("address")}
        <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {values.address.length}/255 characters
        </p>
      </div>

      {/* ── Submit ── */}
      <div style={{ paddingTop: "0.5rem" }}>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[#ff5722] transition-all duration-200 shadow-[0_4px_14px_0_rgba(255,56,11,0.35)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.25)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:shadow-none"
        >
          {loading ? (
            <><LoadingOutlined className="text-base" />Saving…</>
          ) : (
            <><SaveOutlined className="text-base" />Save Changes</>
          )}
        </button>
      </div>
    </form>
  );
}
