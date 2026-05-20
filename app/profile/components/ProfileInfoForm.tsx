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
  const now = new Date();
  if (date > now) return "Date of birth cannot be in the future.";
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
    fullName: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    address: "",
  });

  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    fullName: false,
    phoneNumber: false,
    gender: false,
    dateOfBirth: false,
    address: false,
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
    if (touched[field]) {
      setErrors(validate(next));
    }
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

  // ── Shared style helpers ──────────────────────────────────────────────────

  const inputBase =
    "w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors duration-200 outline-none " +
    "focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] " +
    "bg-white border-gray-200 text-gray-900 placeholder-gray-400 " +
    "dark:bg-white/5 dark:border-white/10 dark:text-white " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const selectBase =
    "w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors duration-200 outline-none appearance-none " +
    "focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] " +
    "bg-white border-gray-200 text-gray-900 " +
    "dark:bg-[#1a1a2e] dark:border-white/10 dark:text-white " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const errorBorder = "border-red-400 focus:ring-red-400/30";

  const fieldError = (field: FieldKey) =>
    touched[field] && errors[field] ? (
      <p className="mt-1 text-xs text-red-400 font-medium">{errors[field]}</p>
    ) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* ── Row 1: Full Name + Phone ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            Full Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <UserOutlined />
            </span>
            <input
              id="fullName"
              type="text"
              value={values.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              disabled={loading}
              placeholder="Your full name"
              autoComplete="name"
              className={`${inputBase} ${touched.fullName && errors.fullName ? errorBorder : ""}`}
            />
          </div>
          {fieldError("fullName")}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <PhoneOutlined />
            </span>
            <input
              id="phoneNumber"
              type="tel"
              value={values.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              onBlur={() => handleBlur("phoneNumber")}
              disabled={loading}
              placeholder="0912 345 678"
              autoComplete="tel"
              className={`${inputBase} ${touched.phoneNumber && errors.phoneNumber ? errorBorder : ""}`}
            />
          </div>
          {fieldError("phoneNumber")}
        </div>
      </div>

      {/* ── Email — read-only (full width) ── */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
          Email
          <span className="ml-2 text-xs font-normal text-gray-400">(cannot be changed)</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <MailOutlined />
          </span>
          <input
            id="email"
            type="email"
            value={user.email}
            readOnly
            disabled
            autoComplete="email"
            className={`${inputBase} cursor-not-allowed opacity-60`}
          />
        </div>
      </div>

      {/* ── Row 2: Gender + Date of Birth ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            Gender
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <ManOutlined />
            </span>
            <select
              id="gender"
              value={values.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              onBlur={() => handleBlur("gender")}
              disabled={loading}
              className={selectBase}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            Date of Birth
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <CalendarOutlined />
            </span>
            <input
              id="dateOfBirth"
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              onBlur={() => handleBlur("dateOfBirth")}
              disabled={loading}
              max={new Date().toISOString().split("T")[0]}
              className={`${inputBase} ${touched.dateOfBirth && errors.dateOfBirth ? errorBorder : ""}`}
            />
          </div>
          {fieldError("dateOfBirth")}
        </div>
      </div>

      {/* ── Address (full width) ── */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
          Address
        </label>
        <div className="relative">
          <span className="absolute top-3 left-3 pointer-events-none text-gray-400">
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
            className={
              "w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors duration-200 outline-none resize-none " +
              "focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] " +
              "bg-white border-gray-200 text-gray-900 placeholder-gray-400 " +
              "dark:bg-white/5 dark:border-white/10 dark:text-white " +
              "disabled:opacity-50 disabled:cursor-not-allowed " +
              (touched.address && errors.address ? errorBorder : "")
            }
          />
        </div>
        {fieldError("address")}
        <p className="mt-1 text-xs text-gray-400">
          {values.address.length}/255 characters
        </p>
      </div>

      {/* ── Submit ── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[#ff5722] transition-all duration-200 shadow-[0_4px_14px_0_rgba(255,56,11,0.35)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.25)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:shadow-none"
        >
          {loading ? (
            <>
              <LoadingOutlined className="text-base" />
              Saving…
            </>
          ) : (
            <>
              <SaveOutlined className="text-base" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
