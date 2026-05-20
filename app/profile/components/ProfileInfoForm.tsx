"use client";

import { LoadingOutlined, MailOutlined, PhoneOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
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
  if (!value.trim()) return ""; // phone is optional
  // Vietnamese phone: 10 digits starting with 0, or +84 prefix
  const phoneRegex = /^(\+84|0)(3[2-9]|5[6-9]|7[0|6-9]|8[0-9]|9[0-9])[0-9]{7}$/;
  if (!phoneRegex.test(value.replace(/\s/g, ""))) {
    return "Invalid phone number format. Use a valid Vietnamese number (e.g. 0912345678).";
  }
  return "";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileFormValues {
  fullName: string;
  phoneNumber: string;
}

interface ProfileInfoFormProps {
  user: User;
  loading: boolean;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileInfoForm({ user, loading, onSubmit }: ProfileInfoFormProps) {
  const [fullName, setFullName] = useState(user.fullName || user.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");

  const [errors, setErrors] = useState({ fullName: "", phoneNumber: "" });
  const [touched, setTouched] = useState({ fullName: false, phoneNumber: false });

  // Sync when user prop changes (e.g. after a successful update)
  useEffect(() => {
    setFullName(user.fullName || user.name || "");
    setPhoneNumber(user.phoneNumber || "");
  }, [user]);

  const validate = (name: string, phone: string) => ({
    fullName: validateFullName(name),
    phoneNumber: validatePhone(phone),
  });

  const handleBlur = (field: "fullName" | "phoneNumber") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(fullName, phoneNumber);
    setErrors(errs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, phoneNumber: true });
    const errs = validate(fullName, phoneNumber);
    setErrors(errs);
    if (errs.fullName || errs.phoneNumber) return;
    await onSubmit({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() });
  };

  const inputBase =
    "w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-[var(--primary)]/40 " +
    "bg-white/5 border-white/10 text-[var(--text-primary,#111)] dark:text-white placeholder-gray-400 " +
    "focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed";

  const errorClass = "border-red-400 focus:ring-red-400/30";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (touched.fullName) setErrors((prev) => ({ ...prev, fullName: validateFullName(e.target.value) }));
            }}
            onBlur={() => handleBlur("fullName")}
            disabled={loading}
            placeholder="Your full name"
            className={`${inputBase} ${touched.fullName && errors.fullName ? errorClass : ""}`}
            autoComplete="name"
          />
        </div>
        {touched.fullName && errors.fullName && (
          <p className="mt-1 text-xs text-red-400 font-medium">{errors.fullName}</p>
        )}
      </div>

      {/* Email — read-only */}
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
            className={`${inputBase} cursor-not-allowed opacity-60`}
            autoComplete="email"
          />
        </div>
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
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (touched.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: validatePhone(e.target.value) }));
            }}
            onBlur={() => handleBlur("phoneNumber")}
            disabled={loading}
            placeholder="0912 345 678"
            className={`${inputBase} ${touched.phoneNumber && errors.phoneNumber ? errorClass : ""}`}
            autoComplete="tel"
          />
        </div>
        {touched.phoneNumber && errors.phoneNumber && (
          <p className="mt-1 text-xs text-red-400 font-medium">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Submit */}
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
