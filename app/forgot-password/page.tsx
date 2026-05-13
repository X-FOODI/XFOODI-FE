"use client";

import { HeroSection } from "@/components/auth/HeroSection";
import { GlassInput } from "@/components/ui/GlassInput";
import authService from "@/lib/services/authService";
import { MailOutlined, SendOutlined } from "@ant-design/icons";
import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";
import { useTenant } from "@/lib/contexts/TenantContext";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError(t('forgot_password_page.validation.required_email'));
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError(t('forgot_password_page.validation.invalid_email'));
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailTouched) {
      validateEmail(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!email || !email.trim()) {
      setEmailError(t('forgot_password_page.validation.required_email'));
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
      message.success(t('forgot_password_page.alerts.success', { email }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset link. Please try again.';
      message.error(errorMessage);
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png";
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

      {/* Left Side: Hero Image & Branding (Desktop Only) */}
      <HeroSection />

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative overflow-hidden min-h-screen z-10">

        {/* Desktop Ambient Orbs */}
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 auth-orb"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 auth-orb"></div>

        {/* Form Container */}
        <div className="auth-form-card w-full max-w-md p-8 lg:p-10 relative z-20 transition-colors duration-300">

          <div className="md:hidden w-full flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-[var(--primary)]/20 p-4">
              <img
                src={tenantLogoUrl}
                alt={tenantName || "Restaurant Logo"}
                className={`w-full h-full object-contain ${isDark ? 'filter invert hue-rotate-180 brightness-110' : ''}`}
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
              {t('forgot_password_page.title')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <GlassInput
                id="email"
                label={t('forgot_password_page.email_label')}
                icon={<MailOutlined />}
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={() => setEmailTouched(true)}
                disabled={loading}
              />
              {(emailTouched && emailError) && (
                <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{emailError}</div>
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
                      <SendOutlined />
                    </span>
                  )}
                </span>
                {loading ? t('login_button.loading', { defaultValue: 'Sending...' }) : t('forgot_password_page.send_btn')}
              </button>
            </div>

            <div className="text-center pt-4 border-t auth-divider">
              <a href="/login" className="auth-terms-link text-sm font-semibold transition-colors inline-flex items-center hover:underline">
                <span className="mr-2">←</span>
                {t('forgot_password_page.back_to_login')}
              </a>
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
