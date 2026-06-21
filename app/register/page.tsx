"use client";

import { GoogleIdentityButton } from "@/components/auth/GoogleIdentityButton";
import { HeroSection } from "@/components/auth/HeroSection";
import { SocialAuthMethods } from "@/components/auth/social/SocialAuthMethods";
import { GlassInput } from "@/components/ui/GlassInput";
import { redirectAfterLogin } from "@/lib/auth/redirectAfterLogin";
import { useTenant } from "@/lib/contexts/TenantContext";
import type { User } from "@/lib/services/authService";
import authService from "@/lib/services/authService";
import { EyeInvisibleOutlined, EyeOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserAddOutlined } from "@ant-design/icons";
import { App } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";
import TurnstileWidget, { type TurnstileInstance } from "@/components/TurnstileWidget";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

export default function RegisterPage() {
  const router = useRouter();
  const navigateAfterGoogle = (user: User) => {
    redirectAfterLogin(router, user, null);
  };

  const { message } = App.useApp();
  const { t } = useTranslation('auth');
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/xfoodi-logo.png";
  const isDark = mode === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // Error states
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: [] as string[],
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const validateEmail = (email: string) => {
    if (!email) return "";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return t('register_page.validation.invalid_email');
    }
    return "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "";
    if (!/^[0-9]{10}$/.test(phone)) {
      return t('register_page.validation.invalid_phone');
    }
    return "";
  };

  const validatePassword = (pwd: string): string[] => {
    if (!pwd) return [];

    const errors: string[] = [];
    if (pwd.length < 8) errors.push(t('register_page.password_requirements.length'));
    if (!/(?=.*[a-z])/.test(pwd)) errors.push(t('register_page.password_requirements.lowercase'));
    if (!/(?=.*[A-Z])/.test(pwd)) errors.push(t('register_page.password_requirements.uppercase'));
    if (!/(?=.*[0-9])/.test(pwd)) errors.push(t('register_page.password_requirements.number'));
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(pwd)) errors.push(t('register_page.password_requirements.special'));

    return errors;
  };

  const validateConfirmPassword = (confirmPwd: string, pwd: string) => {
    if (!confirmPwd) return "";
    if (confirmPwd !== pwd) {
      return t('register_page.validation.password_mismatch');
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name as keyof typeof touched]) {
      if (name === "firstName" && value.trim()) setErrors((prev) => ({ ...prev, firstName: "" }));
      else if (name === "lastName" && value.trim()) setErrors((prev) => ({ ...prev, lastName: "" }));
      else if (name === "email" && !validateEmail(value)) setErrors((prev) => ({ ...prev, email: "" }));
      else if (name === "phone" && !validatePhone(value)) setErrors((prev) => ({ ...prev, phone: "" }));
      else if (name === "password") {
        const passwordErrors = validatePassword(value);
        if (passwordErrors.length === 0) setErrors((prev) => ({ ...prev, password: [] }));
        if (formData.confirmPassword && value === formData.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
      else if (name === "confirmPassword" && value === formData.password) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Optional: set touched state here if desired
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors = {
      firstName: !formData.firstName ? t('register_page.validation.required_first_name') : "",
      lastName: !formData.lastName ? t('register_page.validation.required_last_name') : "",
      email: !formData.email ? t('register_page.validation.required_email') : validateEmail(formData.email),
      phone: !formData.phone ? t('register_page.validation.required_phone') : validatePhone(formData.phone),
      password: !formData.password ? [t('register_page.validation.required_password')] : validatePassword(formData.password),
      confirmPassword: !formData.confirmPassword ? t('register_page.validation.required_confirm_password') : validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      ),
    };

    setErrors(newErrors);

    const hasErrors =
      newErrors.firstName ||
      newErrors.lastName ||
      newErrors.email ||
      newErrors.phone ||
      newErrors.password.length > 0 ||
      newErrors.confirmPassword;

    if (hasErrors) {
      // Reset Turnstile so user gets a fresh token on retry
      turnstileRef.current?.reset();
      setTurnstileToken("");
      return;
    }

    if (!acceptTerms) {
      message.warning(t('register_page.alerts.accept_terms'));
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
        fullName: `${formData.firstName} ${formData.lastName}`,
        turnstileToken,
      });

      // Handle email confirmation flow
      if (result.requireEmailConfirmation) {
        message.success(result.message || 'Registration successful! Please check your email to confirm your account.');
        // Redirect to check-email page
        window.location.href = `/check-email?email=${encodeURIComponent(formData.email)}`;
      } 
      // Handle old flow (auto-login or manual login)
      else if (result.requireLogin) {
        message.success(result.message || 'Registration successful! Please login with your credentials.');
        window.location.href = '/login';
      } else {
        message.success(t('register_page.alerts.submitted', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        }));
        window.location.href = '/';
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to register. Please try again.';
      if (errorMessage.toLowerCase().includes('phone number') && errorMessage.toLowerCase().includes('registered')) {
        setErrors(prev => ({ ...prev, phone: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exists')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else {
        message.error(errorMessage);
      }
      // Reset Turnstile after any API failure — token is now consumed/invalid
      turnstileRef.current?.reset();
      setTurnstileToken("");
      console.warn('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="auth-form-card w-full max-w-lg p-8 lg:p-10 relative z-20 transition-colors duration-300">

          <div className="md:hidden w-full flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-[var(--primary)]/20 p-4">
              <img
                src={tenantLogoUrl}
                alt={tenantName || "Restaurant Logo"}
                className={`w-full h-full object-contain ${isDark ? 'filter invert hue-rotate-180 brightness-110' : ''}`}
                onError={(e) => {
                  e.currentTarget.src = "/images/logo/xfoodi-logo.png";
                }}
              />
            </div>
            <span className="auth-heading font-bold uppercase tracking-[0.2em] text-2xl drop-shadow-md">
              {tenantName || (mounted ? t('login_header.default_title') : '')}
            </span>
          </div>

          <div className="text-center md:text-left mb-8">
            <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm transition-colors">
              {t('register_page.title')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <GlassInput
                  id="firstName"
                  name="firstName"
                  label={t('register_page.first_name')}
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                  disabled={loading}
                />
                {touched.firstName && errors.firstName && (
                  <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.firstName}</div>
                )}
              </div>
              <div className="relative">
                <GlassInput
                  id="lastName"
                  name="lastName"
                  label={t('register_page.last_name')}
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                  disabled={loading}
                />
                {touched.lastName && errors.lastName && (
                  <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.lastName}</div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <GlassInput
                id="email"
                name="email"
                label={t('register_page.email')}
                icon={<MailOutlined />}
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                disabled={loading}
              />
              {touched.email && errors.email && (
                <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.email}</div>
              )}
            </div>

            {/* Phone */}
            <div className="relative">
              <GlassInput
                id="phone"
                name="phone"
                label={t('register_page.phone')}
                icon={<PhoneOutlined />}
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                disabled={loading}
              />
              {touched.phone && errors.phone && (
                <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.phone}</div>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <GlassInput
                id="password"
                name="password"
                label={t('register_page.password')}
                icon={<LockOutlined />}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeInvisibleOutlined className="text-lg" /> : <EyeOutlined className="text-lg" />}
              </button>
              {touched.password && errors.password.length > 0 && (
                <div className="mt-1 space-y-1">
                  {errors.password.map((err, i) => (
                    <div key={i} className="text-red-400 text-xs ml-1 font-medium">{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <GlassInput
                id="confirmPassword"
                name="confirmPassword"
                label={t('register_page.confirm_password')}
                icon={<LockOutlined />}
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeInvisibleOutlined className="text-lg" /> : <EyeOutlined className="text-lg" />}
              </button>
              {touched.confirmPassword && errors.confirmPassword && (
                <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.confirmPassword}</div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="auth-checkbox w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </div>
              <label htmlFor="terms" className="auth-terms-text ml-3">
                {t('register_page.i_agree')}{" "}
                <a href="/terms" className="auth-terms-link">
                  {t('register_page.terms_of_service')}
                </a>{" "}
                &{" "}
                <a href="/privacy" className="auth-terms-link">
                  {t('register_page.privacy_policy')}
                </a>
              </label>
            </div>

            {/* Cloudflare Turnstile */}
            <TurnstileWidget
              ref={turnstileRef}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
            />

            <div>
              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[var(--primary)] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-white ml-1"></div>
                  ) : (
                    <span className="material-icons text-white/50 group-hover:text-white transition-colors text-lg">
                      <UserAddOutlined />
                    </span>
                  )}
                </span>
                {loading ? t('login_button.loading') : t('register_page.create_account_btn')}
              </button>
            </div>

            <SocialAuthMethods dividerLabel={t("login_email_page.or_login_with")}>
              <GoogleIdentityButton
                rememberMe
                disabled={loading}
                onAuthenticated={navigateAfterGoogle}
                variant="signup"
              />
            </SocialAuthMethods>

            <div className="text-center text-sm mt-4 pt-4 border-t auth-divider">
              <span className="auth-text">{t('register_page.already_have_account')} </span>
              <a href="/login" className="auth-terms-link font-semibold hover:underline transition-colors">
                {t('register_page.sign_in_here')}
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
