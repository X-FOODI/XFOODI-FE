"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/lib/contexts/ToastContext";
import userService from "@/lib/services/userService";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  LoadingOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// ── Validation ────────────────────────────────────────────────────────────────

function validateCurrentPassword(v: string) {
  if (!v) return "Current password is required.";
  return "";
}

function validateNewPassword(v: string) {
  if (!v) return "New password is required.";
  if (v.length < 6) return "Password must be at least 6 characters.";
  return "";
}

function validateConfirm(newPwd: string, confirm: string) {
  if (!confirm) return "Please confirm your new password.";
  if (confirm !== newPwd) return "Passwords do not match.";
  return "";
}

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#f87171" };
  if (score <= 2) return { score, label: "Fair", color: "#fbbf24" };
  if (score <= 3) return { score, label: "Good", color: "#60a5fa" };
  return { score, label: "Strong", color: "#34d399" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldKey = "currentPassword" | "newPassword" | "confirmPassword";

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ── Shared styles (CSS variables — theme-safe) ────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  paddingLeft: "2.75rem",
  paddingRight: "2.75rem",
  paddingTop: "0.75rem",
  paddingBottom: "0.75rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [showPwd, setShowPwd] = useState<Record<FieldKey, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/change-password");
    }
  }, [user, authLoading, router]);

  const validate = (v: FormValues): FormValues => ({
    currentPassword: validateCurrentPassword(v.currentPassword),
    newPassword: validateNewPassword(v.newPassword),
    confirmPassword: validateConfirm(v.newPassword, v.confirmPassword),
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

  const toggleShow = (field: FieldKey) =>
    setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    const errs = validate(values);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setSuccess(true);
      showToast("success", "Password changed", "Your password has been updated successfully.");
      // Redirect back to profile after short delay
      setTimeout(() => router.push("/profile"), 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      showToast("error", "Update failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(values.newPassword);

  // ── Loading auth ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: "1.5rem" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircleOutlined style={{ fontSize: "2rem", color: "#34d399" }} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Password Updated</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>Redirecting you back to profile…</p>
          <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "50%", border: "2px solid var(--primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const fields: { key: FieldKey; label: string; icon: React.ReactNode; placeholder: string; autoComplete: string }[] = [
    { key: "currentPassword", label: "Current Password", icon: <LockOutlined />, placeholder: "Enter your current password", autoComplete: "current-password" },
    { key: "newPassword", label: "New Password", icon: <KeyOutlined />, placeholder: "At least 6 characters", autoComplete: "new-password" },
    { key: "confirmPassword", label: "Confirm New Password", icon: <SafetyOutlined />, placeholder: "Re-enter new password", autoComplete: "new-password" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", transition: "background 0.3s" }}>

      {/* ── Top bar ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid var(--border)", background: "var(--card)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", height: "3.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeftOutlined />
            <span>Back to Profile</span>
          </button>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>Change Password</span>
        </div>
      </div>

      {/* ── Main ── */}
      <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Heading */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontSize: "1.25rem", flexShrink: 0 }}>
              <LockOutlined />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Change Password</h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0, paddingLeft: "3.625rem" }}>
            Choose a strong password to keep your account secure.
          </p>
        </div>

        {/* Card */}
        <div style={{ borderRadius: "1rem", border: "1px solid var(--border)", background: "var(--card)", boxShadow: "var(--shadow-sm)", padding: "1.75rem" }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {fields.map(({ key, label, icon, placeholder, autoComplete }) => {
              const hasError = touched[key] && !!errors[key];
              const fieldInputStyle: React.CSSProperties = {
                ...inputStyle,
                borderColor: hasError ? "#f87171" : "var(--border)",
                boxShadow: hasError ? "0 0 0 2px rgba(248,113,113,0.2)" : undefined,
              };

              return (
                <div key={key}>
                  <label
                    htmlFor={key}
                    style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem", color: "var(--text)" }}
                  >
                    {label} <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    {/* Left icon */}
                    <span style={{ position: "absolute", top: 0, bottom: 0, left: "0.875rem", display: "flex", alignItems: "center", pointerEvents: "none", color: "var(--text-muted)" }}>
                      {icon}
                    </span>
                    <input
                      id={key}
                      type={showPwd[key] ? "text" : "password"}
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      onBlur={() => handleBlur(key)}
                      disabled={loading}
                      placeholder={placeholder}
                      autoComplete={autoComplete}
                      style={{
                        ...fieldInputStyle,
                        opacity: loading ? 0.55 : 1,
                        cursor: loading ? "not-allowed" : "text",
                      }}
                    />
                    {/* Toggle visibility */}
                    <button
                      type="button"
                      onClick={() => toggleShow(key)}
                      disabled={loading}
                      aria-label={showPwd[key] ? "Hide password" : "Show password"}
                      style={{ position: "absolute", top: 0, bottom: 0, right: "0.875rem", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      {showPwd[key] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>

                  {/* Error */}
                  {hasError && (
                    <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#f87171", fontWeight: 500 }}>
                      {errors[key]}
                    </p>
                  )}

                  {/* Password strength bar — only for newPassword */}
                  {key === "newPassword" && values.newPassword && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Password strength</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: strength.color }}>{strength.label}</span>
                      </div>
                      <div style={{ height: "0.375rem", borderRadius: "9999px", background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "9999px", background: strength.color, width: `${Math.min((strength.score / 5) * 100, 100)}%`, transition: "width 0.3s, background 0.3s" }} />
                      </div>
                    </div>
                  )}

                  {/* Confirm match indicator */}
                  {key === "confirmPassword" && values.confirmPassword && !errors.confirmPassword && touched.confirmPassword && (
                    <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#34d399", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <CheckCircleOutlined /> Passwords match
                    </p>
                  )}
                </div>
              );
            })}

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--border)", margin: "0.25rem 0" }} />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.875rem 1.5rem",
                borderRadius: "0.875rem",
                border: "none",
                background: loading ? "var(--primary-soft)" : "var(--primary)",
                color: loading ? "var(--primary)" : "#fff",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 14px rgba(255,56,11,0.35)",
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#ff5722"; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "var(--primary)"; }}
            >
              {loading ? (
                <><LoadingOutlined style={{ fontSize: "1rem" }} /> Updating…</>
              ) : (
                <><KeyOutlined style={{ fontSize: "1rem" }} /> Update Password</>
              )}
            </button>

            {/* Back link */}
            <button
              type="button"
              onClick={() => router.push("/profile")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center", padding: "0.25rem", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Cancel — go back to profile
            </button>
          </form>
        </div>

        {/* Security tips */}
        <div style={{ marginTop: "1.25rem", borderRadius: "0.875rem", border: "1px solid var(--border)", background: "var(--surface)", padding: "1rem 1.25rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>
            Tips for a strong password
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[
              "At least 6 characters long",
              "Mix uppercase and lowercase letters",
              "Include numbers and special characters",
              "Avoid using personal information",
            ].map((tip) => (
              <li key={tip} style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{tip}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
