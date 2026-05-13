"use client";

import { HeroSection } from "@/components/auth/HeroSection";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import { GlassInput } from "@/components/ui/GlassInput";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    LoginOutlined,
    MailOutlined,
    PhoneOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AntdProvider";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

function LoginEmailPageContent() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { login } = useAuth();
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png";
  const [mounted, setMounted] = useState(false);

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validation Logic
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("");
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError(t('login_email_page.validation.invalid_email'));
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordError("");
      return false;
    }
    if (pwd.length < 6) {
      setPasswordError(t('login_email_page.validation.password_min'));
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailTouched) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordTouched) {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!email || !email.trim()) {
      setEmailError(t('login_email_page.validation.required_email'));
      if (!password || !password.trim()) {
        setPasswordError(t('login_email_page.validation.required_password'));
      }
      return;
    }

    if (!password || !password.trim()) {
      setPasswordError(t('login_email_page.validation.required_password'));
      return;
    }

    if (!validateEmail(email) || !validatePassword(password) || emailError || passwordError) {
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email, password, rememberMe: remember });

      // Check roles for redirection
      const userRoles: string[] = user.roles || (user.role ? [user.role] : []);
      const hasRole = (role: string) => userRoles.some(r => r.toLowerCase() === role.toLowerCase());

      // If middleware saved a redirect path (e.g. /admin/tables), go there
      if (redirectPath) {
        router.push(redirectPath);
      } else if (hasRole('System Admin') || hasRole('Admin')) {
        router.push('/admin');
      } else if (hasRole('Staff')) {
        router.push('/staff');
      } else {
        router.push('/');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      message.error(errorMessage);
      console.error('Login error:', error);
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

      {/* Left Side: Hero Image & Branding (Desktop Only) */}
      <HeroSection />

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative overflow-hidden min-h-screen z-10">

        {/* Desktop Ambient Orbs */}
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 auth-orb"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 auth-orb"></div>

        {/* Login Form Container */}
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
              {t('login_email_page.title')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <GlassInput
                  id="email"
                  label={t('login_email_page.email_label')}
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

              <div className="relative">
                <GlassInput
                  id="password"
                  label={t('login_email_page.password_label')}
                  icon={<LockOutlined />}
                  type={showPassword ? "text" : "password"}
                  required
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
                {(passwordTouched && passwordError) && (
                  <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{passwordError}</div>
                )}
                <div className="text-right mt-1">
                  <a
                    href="/forgot-password"
                    className="text-xs text-[var(--primary)] hover:text-[#ff5c35] hover:underline"
                  >
                    {t('login_email_page.forgot_password')}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <RememberCheckbox checked={remember} onChange={setRemember} />
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
                      <LoginOutlined />
                    </span>
                  )}
                </span>
                {loading ? t('login_button.loading') : t('login_button.login_text')}
              </button>
            </div>



            <div className="text-center text-sm mt-6 pt-4 border-t auth-divider">
              <span className="auth-text">{t('login_email_page.no_account')} </span>
              <a href="/register" className="auth-terms-link font-semibold hover:underline transition-colors">
                {t('login_email_page.sign_up_here')}
              </a>
            </div>
          </form>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="auth-divider w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="auth-divider-label">
                {t('login_email_page.or_login_with')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="auth-alt-btn w-full inline-flex justify-center items-center py-3 px-4 shadow-sm text-sm font-medium group"
            >
              <PhoneOutlined className="auth-input-icon text-xl mr-3" />
              <span>{t('login_email_page.phone_number')}</span>
            </button>
          </div>
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

export default function LoginEmailPage() {
  return (
    <Suspense fallback={<div className="auth-page-bg min-h-screen" />}>
      <LoginEmailPageContent />
    </Suspense>
  );
}
