"use client";

import {
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  LoadingOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";

// ── Validation ────────────────────────────────────────────────────────────────

function validateCurrentPassword(value: string): string {
  if (!value) return "Current password is required.";
  return "";
}

function validateNewPassword(value: string): string {
  if (!value) return "New password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(value)) return "Password must contain at least one number.";
  return "";
}

function validateConfirmPassword(newPwd: string, confirm: string): string {
  if (!confirm) return "Please confirm your new password.";
  if (confirm !== newPwd) return "Passwords do not match.";
  return "";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordFormProps {
  loading: boolean;
  onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

type FieldKey = "currentPassword" | "newPassword" | "confirmPassword";

export default function ChangePasswordForm({ loading, onSubmit }: ChangePasswordFormProps) {
  const [values, setValues] = useState<ChangePasswordFormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ChangePasswordFormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [showPasswords, setShowPasswords] = useState<Record<FieldKey, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const validate = (v: ChangePasswordFormValues): ChangePasswordFormValues => ({
    currentPassword: validateCurrentPassword(v.currentPassword),
    newPassword: validateNewPassword(v.newPassword),
    confirmPassword: validateConfirmPassword(v.newPassword, v.confirmPassword),
  });

  const handleChange = (field: FieldKey, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field]) {
      const errs = validate(next);
      setErrors(errs);
    }
  };

  const handleBlur = (field: FieldKey) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(values);
    setErrors(errs);
  };

  const toggleShow = (field: FieldKey) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    const errs = validate(values);
    setErrors(errs);
    if (errs.currentPassword || errs.newPassword || errs.confirmPassword) return;
    await onSubmit(values);
  };

  const inputBase =
    "w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-[var(--primary)]/40 " +
    "bg-white/5 border-white/10 text-[var(--text-primary,#111)] dark:text-white placeholder-gray-400 " +
    "focus:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed";

  const errorClass = "border-red-400 focus:ring-red-400/30";

  const fields: { key: FieldKey; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { key: "currentPassword", label: "Current Password", icon: <LockOutlined />, placeholder: "Enter current password" },
    { key: "newPassword", label: "New Password", icon: <KeyOutlined />, placeholder: "Min 8 chars, 1 uppercase, 1 number" },
    { key: "confirmPassword", label: "Confirm New Password", icon: <SafetyOutlined />, placeholder: "Re-enter new password" },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {fields.map(({ key, label, icon, placeholder }) => (
        <div key={key}>
          <label htmlFor={key} className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            {label} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </span>
            <input
              id={key}
              type={showPasswords[key] ? "text" : "password"}
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={() => handleBlur(key)}
              disabled={loading}
              placeholder={placeholder}
              autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
              className={`${inputBase} ${touched[key] && errors[key] ? errorClass : ""}`}
            />
            <button
              type="button"
              onClick={() => toggleShow(key)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label={showPasswords[key] ? "Hide password" : "Show password"}
            >
              {showPasswords[key] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>
          {touched[key] && errors[key] && (
            <p className="mt-1 text-xs text-red-400 font-medium">{errors[key]}</p>
          )}
        </div>
      ))}

      {/* Password strength hint */}
      {values.newPassword && (
        <PasswordStrengthBar password={values.newPassword} />
      )}

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
              Updating…
            </>
          ) : (
            <>
              <KeyOutlined className="text-base" />
              Update Password
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Password Strength Bar ─────────────────────────────────────────────────────

function getStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-400" };
  if (score <= 2) return { score, label: "Fair", color: "bg-yellow-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-blue-400" };
  return { score, label: "Strong", color: "bg-green-400" };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  const pct = Math.min((score / 5) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Password strength</span>
        <span className={`font-medium ${color.replace("bg-", "text-")}`}>{label}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
