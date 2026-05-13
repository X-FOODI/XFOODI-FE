"use client";

import { HeroSection } from "@/components/auth/HeroSection";
import { GlassInput } from "@/components/ui/GlassInput";
import authService from "@/lib/services/authService";
import {
    CheckCircleOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    KeyOutlined,
    LockOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";
import { useTenant } from "@/lib/contexts/TenantContext";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

function ResetPasswordPageContent() {
  const { t } = useTranslation('auth');
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png";
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email') || '';
    const tokenParam = searchParams.get('token') || '';
    setEmail(emailParam);
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError(t('reset_password_page.validation.required_password'));
      return false;
    }
    if (password.length < 8) {
      setPasswordError(t('reset_password_page.validation.password_min'));
      return false;
    }
    if (!/(?=.*[a-z])/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_lowercase'));
      return false;
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_uppercase'));
      return false;
    }
    if (!/(?=.*\d)/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_number'));
      return false;
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_special'));
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError(t('reset_password_page.validation.required_confirm'));
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError(t('reset_password_page.validation.password_mismatch'));
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordTouched) {
      validatePassword(value);
    }
    if (confirmPassword && confirmPasswordTouched) {
      if (confirmPassword !== value) {
        setConfirmPasswordError(t('reset_password_page.validation.password_mismatch'));
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmPasswordTouched) {
      validateConfirmPassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!password || !password.trim()) {
      setPasswordError(t('reset_password_page.validation.required_password'));
      if (!confirmPassword || !confirmPassword.trim()) {
        setConfirmPasswordError(t('reset_password_page.validation.required_confirm'));
      }
      return;
    }

    if (!confirmPassword || !confirmPassword.trim()) {
      setConfirmPasswordError(t('reset_password_page.validation.required_confirm'));
      return;
    }

    if (!validatePassword(password)) return;
    if (!validateConfirmPassword(confirmPassword)) return;
    if (passwordError || confirmPasswordError) return;

    if (!email || !token) {
      message.error(t('reset_password_page.alerts.invalid_link'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        email,
        token,
        newPassword: password,
        confirmNewPassword: confirmPassword,
      });

      message.success(t('reset_password_page.alerts.success'));
      window.location.href = '/login-email';
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password. Please try again.';
      message.error(errorMessage);
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDark = mode === 'dark';

  return (
    <div className="auth-page-bg flex flex-col md:flex-row relative transition-colors duration-300">
      {/* Mobile Background: Image with Overlay */}
      <div className="absolute inset-0 z-0 md:hidden">
        <img
          src={HERO_IMAGE_URL}
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for mobile legibility */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/40"></div>
      </div>

      <HeroSection />

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative overflow-hidden min-h-screen z-10">

        {/* Desktop Orbs */}
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 auth-orb"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 auth-orb"></div>

        {/* Form Container */}
        <div className="auth-form-card w-full max-w-md p-8 lg:p-10 relative z-20 transition-colors duration-300">

          <div className="md:hidden w-full flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-[var(--primary)]/20 p-4">
              <img
                src={tenantLogoUrl}
                alt={tenantName || "Restaurant Logo"}
                className="w-full h-full object-contain dark:invert dark:hue-rotate-180 dark:brightness-110"
                onError={(e) => {
                  e.currentTarget.src = "/images/logo/restx-removebg-preview.png";
                }}
              />
            </div>
            <span className="auth-heading font-bold uppercase tracking-[0.2em] text-2xl drop-shadow-md">
              {tenantName || (mounted ? t('login_header.default_title') : '')}
            </span>
          </div>

          <div className="text-center md:text-left mb-8">
            <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm transition-colors">
              {t('reset_password_page.title')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="relative">
              <GlassInput
                id="password"
                label={t('reset_password_page.new_password_label')}
                icon={<LockOutlined />}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => setPasswordTouched(true)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeInvisibleOutlined className="text-lg" /> : <EyeOutlined className="text-lg" />}
              </button>
              {passwordTouched && passwordError && (
                <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{passwordError}</div>
              )}
              {passwordTouched && !passwordError && password && (
                <div className="text-green-400 text-xs mt-1 ml-1 font-medium flex items-center">
                  <CheckCircleOutlined className="mr-1" />
                  {t('reset_password_page.password_strong')}
                </div>
              )}
            </div>

            <div className="relative">
              <GlassInput
                id="confirmPassword"
                label={t('reset_password_page.confirm_password_label')}
                icon={<LockOutlined />}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={() => setConfirmPasswordTouched(true)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeInvisibleOutlined className="text-lg" /> : <EyeOutlined className="text-lg" />}
              </button>
              {confirmPasswordTouched && confirmPasswordError && (
                <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{confirmPasswordError}</div>
              )}
              {confirmPasswordTouched && !confirmPasswordError && confirmPassword && (
                <div className="text-green-400 text-xs mt-1 ml-1 font-medium flex items-center">
                  <CheckCircleOutlined className="mr-1" />
                  {t('reset_password_page.passwords_match')}
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[var(--primary)] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-white ml-1"></div>
                  ) : (
                    <span className="material-icons text-white/50 group-hover:text-white transition-colors text-lg">
                      <KeyOutlined />
                    </span>
                  )}
                </span>
                {loading ? t('login_button.loading') : t('reset_password_page.reset_btn')}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none">
          <p className="auth-footer-text">
            © {new Date().getFullYear()} {tenantName || (mounted ? t('login_header.default_title') : '')}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page-bg min-h-screen" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
