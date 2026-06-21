"use client";

import { GoogleIdentityButton } from "@/components/auth/GoogleIdentityButton";
import { HeroSection } from "@/components/auth/HeroSection";
import { SocialAuthButton } from "@/components/auth/social/SocialAuthButton";
import { SocialAuthMethods } from "@/components/auth/social/SocialAuthMethods";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import { GlassInput } from "@/components/ui/GlassInput";
import { redirectAfterLogin } from "@/lib/auth/redirectAfterLogin";
import { useAuth } from "@/lib/contexts/AuthContext";
import authService, { type User } from "@/lib/services/authService";
import { useTenant } from "@/lib/contexts/TenantContext";
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    LoginOutlined,
    MailOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
    ArrowLeftOutlined,
    KeyOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AntdProvider";
import TurnstileWidget, { type TurnstileInstance } from "@/components/TurnstileWidget";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

function LoginEmailPageContent() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { login, updateUser, user, loading: authLoading } = useAuth();
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/xfoodi-logo.png";
  const [mounted, setMounted] = useState(false);
  const [isAdminDomain, setIsAdminDomain] = useState(false);

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // 2FA States
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  // Phone Login States
  const [isPhoneLoginActive, setIsPhoneLoginActive] = useState(false);
  const [phoneLoginStep, setPhoneLoginStep] = useState("phone"); // "phone" | "otp"
  const [phoneLoginNumber, setPhoneLoginNumber] = useState("");
  const [phoneLoginOtp, setPhoneLoginOtp] = useState("");
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(300);
  const [phoneLoginNumberError, setPhoneLoginNumberError] = useState("");
  const [phoneLoginNumberTouched, setPhoneLoginNumberTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsAdminDomain(hostname.startsWith('admin.') || hostname.includes('admin.localhost'));
    }
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && user) {
      navigateAfterLogin(user);
    }
  }, [mounted, authLoading, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (requires2FA && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (requires2FA && countdown === 0) {
      message.error("Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.");
      setRequires2FA(false);
      setTempToken("");
      setCountdown(300);
      setOtpCode("");
    }
    return () => clearInterval(timer);
  }, [requires2FA, countdown]);

  // Phone OTP Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPhoneLoginActive && phoneLoginStep === 'otp' && phoneOtpCountdown > 0) {
      timer = setInterval(() => {
        setPhoneOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isPhoneLoginActive && phoneLoginStep === 'otp' && phoneOtpCountdown === 0) {
      message.error("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
      setPhoneLoginStep('phone');
      setPhoneOtpCountdown(300);
      setPhoneLoginOtp("");
    }
    return () => clearInterval(timer);
  }, [isPhoneLoginActive, phoneLoginStep, phoneOtpCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const navigateAfterLogin = (user: User) => {
    redirectAfterLogin(router, user, redirectPath);
  };

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
      const res = await login({ email, password, rememberMe: remember, turnstileToken });
      if (res && 'requires2FA' in res) {
        setRequires2FA(true);
        setTempToken(res.tempToken);
        setCountdown(300);
        setOtpCode("");
        message.info("Vui lòng nhập mã xác thực 2FA để hoàn tất đăng nhập.");
        return;
      }
      navigateAfterLogin(res as User);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      message.error(errorMessage);
      // Reset Turnstile after any login failure — token is now consumed/invalid
      turnstileRef.current?.reset();
      setTurnstileToken("");
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAccount = async () => {
    if (!email || !email.trim()) {
      message.error("Vui lòng nhập email của tài khoản cần mở khóa.");
      return;
    }
    if (!turnstileToken) {
      message.error("Vui lòng hoàn tất xác thực Cloudflare Turnstile trước khi mở khóa.");
      return;
    }

    setUnlockLoading(true);
    try {
      const res = await authService.unlockAccount(email.trim(), turnstileToken);
      message.success(res.message || "Mở khóa tài khoản thành công! Bạn có thể đăng nhập lại.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } catch (error: any) {
      message.error(error.message || "Mở khóa thất bại. Vui lòng thử lại.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !otpCode.trim()) {
      message.error("Vui lòng nhập mã xác thực.");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.validate2FA(tempToken, otpCode.trim(), remember);
      updateUser(user);
      message.success("Xác thực 2FA thành công!");
      navigateAfterLogin(user);
    } catch (error: any) {
      const errorMessage = error.message || 'Mã xác thực 2FA không hợp lệ hoặc đã hết hạn.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (num: string) => {
    if (!num) {
      setPhoneLoginNumberError("");
      return false;
    }
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(num.trim())) {
      setPhoneLoginNumberError("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (ví dụ: 0912345678).");
      return false;
    }
    setPhoneLoginNumberError("");
    return true;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoginNumberTouched(true);

    if (!phoneLoginNumber || !phoneLoginNumber.trim()) {
      setPhoneLoginNumberError("Vui lòng nhập số điện thoại.");
      return;
    }

    if (!validatePhone(phoneLoginNumber) || phoneLoginNumberError) {
      return;
    }

    setLoading(true);
    try {
      await authService.requestPhoneLoginOtp(phoneLoginNumber);
      setPhoneLoginStep('otp');
      setPhoneOtpCountdown(300);
      setPhoneLoginOtp("");
      message.success("Mã OTP đã được gửi thành công!");
    } catch (error: any) {
      const errorMessage = error.message || 'Gửi mã OTP thất bại. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneLoginOtp || !phoneLoginOtp.trim()) {
      message.error("Vui lòng nhập mã xác thực OTP.");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.verifyPhoneLoginOtp(phoneLoginNumber, phoneLoginOtp.trim());
      updateUser(user);
      message.success("Đăng nhập bằng số điện thoại thành công!");
      navigateAfterLogin(user);
    } catch (error: any) {
      const errorMessage = error.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDark = mode === 'dark';

  if (isAdminDomain) {
    return (
      <div 
        className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ${
          isDark ? 'bg-[#080A10]' : 'bg-[#F8FAFC]'
        }`}
      >
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-45 pointer-events-none"
          style={{ 
            backgroundImage: isDark 
              ? 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)' 
              : 'radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        ></div>

        {/* Premium Ambient Glowing Orbs */}
        <div 
          className={`absolute -top-48 -left-48 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none transition-all duration-500 ${
            isDark ? 'bg-[var(--primary)]/15' : 'bg-[var(--primary)]/10'
          }`}
        ></div>
        <div 
          className={`absolute -bottom-48 -right-48 w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none transition-all duration-500 ${
            isDark ? 'bg-purple-600/10' : 'bg-purple-400/5'
          }`}
        ></div>
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-all duration-500 ${
            isDark ? 'bg-amber-500/5' : 'bg-amber-500/3'
          }`}
        ></div>

        {/* Login Card */}
        <div 
          className={`w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] border backdrop-blur-2xl relative z-10 transition-all duration-500 ${
            isDark 
              ? 'bg-[#111625]/75 border-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.5)]' 
              : 'bg-white/80 border-black/5 shadow-[0_25px_50px_rgba(15,23,42,0.06)]'
          }`}
        >
          {/* Glowing Security Shield Icon */}
          <div className="w-16 h-16 mx-auto bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-6 border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(255,56,11,0.15)] animate-pulse">
            <SafetyCertificateOutlined className="text-2xl text-[var(--primary)]" />
          </div>

          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-[#0E1726]'
            }`}>
              {requires2FA ? "Xác thực 2 lớp (2FA)" : "Quản trị viên XFoodi"}
            </h1>
            <p className={`text-sm mt-2 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {requires2FA 
                ? "Bảo mật tài khoản nâng cao" 
                : "Hệ thống quản lý & vận hành toàn cục"}
            </p>
          </div>

          {requires2FA ? (
            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div className="text-center space-y-4">
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {useBackupCode 
                    ? "Nhập mã khôi phục dự phòng để hoàn tất đăng nhập quản trị."
                    : "Tài khoản quản trị được bảo vệ bằng Google Authenticator. Nhập mã OTP 6 số để tiếp tục."}
                </p>
              </div>

              <div className="relative">
                <GlassInput
                  id="otpCode"
                  label={useBackupCode ? "Mã dự phòng khôi phục" : "Mã OTP 2FA (6 chữ số)"}
                  icon={useBackupCode ? <KeyOutlined /> : <SafetyCertificateOutlined />}
                  type="text"
                  required
                  value={otpCode}
                  maxLength={useBackupCode ? 16 : 6}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (useBackupCode) {
                      setOtpCode(val);
                    } else {
                      if (/^\d*$/.test(val)) {
                        setOtpCode(val);
                      }
                    }
                  }}
                  disabled={loading}
                  className={isDark ? 'text-white' : 'text-[#0E1726] bg-transparent'}
                />
                
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setOtpCode("");
                    }}
                    className="text-xs text-[var(--primary)] hover:text-[#ff5c35] hover:underline transition-colors bg-transparent border-none cursor-pointer outline-none p-0"
                  >
                    {useBackupCode ? "Sử dụng mã OTP chuẩn" : "Sử dụng mã dự phòng khôi phục"}
                  </button>
                  
                  <span className="text-xs text-amber-500 font-medium">
                    Hết hạn sau {formatTime(countdown)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[var(--primary)] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
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
                  {loading ? "Đang xác thực..." : "Xác thực & Đăng nhập"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setOtpCode("");
                    setTempToken("");
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-2xl border transition-all duration-300 bg-transparent cursor-pointer ${
                    isDark 
                      ? 'border-gray-700 text-gray-400 hover:text-white hover:bg-white/5' 
                      : 'border-gray-200 text-gray-500 hover:text-gray-850 hover:bg-black/5'
                  }`}
                >
                  <ArrowLeftOutlined /> Quay lại đăng nhập
                </button>
              </div>
            </form>
          ) : (
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
                    className={isDark ? 'text-white' : 'text-[#0E1726] bg-transparent'}
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
                    className={isDark ? 'text-white' : 'text-[#0E1726] bg-transparent'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer outline-none"
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

              <div className="flex items-center justify-between">
                <RememberCheckbox checked={remember} onChange={setRemember} />
              </div>

              {/* Cloudflare Turnstile */}
              <TurnstileWidget
                ref={turnstileRef}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
                onError={() => setTurnstileToken("")}
              />

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || unlockLoading || !turnstileToken}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[var(--primary)] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
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

                <button
                  type="button"
                  onClick={handleUnlockAccount}
                  disabled={loading || unlockLoading || !turnstileToken}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold rounded-2xl border transition-all duration-300 bg-transparent cursor-pointer ${
                    isDark 
                      ? 'border-amber-500/30 text-amber-500 hover:text-amber-400 hover:bg-amber-500/5' 
                      : 'border-amber-500/40 text-amber-600 hover:text-amber-700 hover:bg-amber-500/5'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {unlockLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-amber-500"></div>
                  ) : (
                    <SafetyCertificateOutlined className="text-lg" />
                  )}
                  {unlockLoading ? "Đang mở khóa..." : "Mở khóa tài khoản bị chặn"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className={`absolute bottom-6 w-full text-center z-10 pointer-events-none transition-colors duration-300 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <p className="text-xs">
            © {new Date().getFullYear()} XFoodi Portal. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

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
              {requires2FA 
                ? "Xác thực 2 lớp (2FA)" 
                : isPhoneLoginActive
                  ? "Đăng nhập Số điện thoại"
                  : isAdminDomain 
                    ? "Quản trị viên XFoodi" 
                    : t('login_email_page.title')}
            </h1>
          </div>

          {requires2FA ? (
            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 animate-pulse">
                  <SafetyCertificateOutlined className="text-3xl" />
                </div>
                <p className="text-sm auth-text leading-relaxed">
                  {useBackupCode 
                    ? "Nhập mã khôi phục dự phòng để hoàn tất đăng nhập quản trị."
                    : "Tài khoản quản trị được bảo vệ bằng Google Authenticator. Nhập mã OTP 6 số để tiếp tục."}
                </p>
              </div>

              <div className="relative">
                <GlassInput
                  id="otpCode"
                  label={useBackupCode ? "Mã dự phòng khôi phục" : "Mã OTP 2FA (6 chữ số)"}
                  icon={useBackupCode ? <KeyOutlined /> : <SafetyCertificateOutlined />}
                  type="text"
                  required
                  value={otpCode}
                  maxLength={useBackupCode ? 16 : 6}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (useBackupCode) {
                      setOtpCode(val);
                    } else {
                      if (/^\d*$/.test(val)) {
                        setOtpCode(val);
                      }
                    }
                  }}
                  disabled={loading}
                />
                
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setOtpCode("");
                    }}
                    className="text-xs text-[var(--primary)] hover:text-[#ff5c35] hover:underline transition-colors bg-transparent border-none cursor-pointer outline-none p-0"
                  >
                    {useBackupCode ? "Sử dụng mã OTP chuẩn" : "Sử dụng mã dự phòng khôi phục"}
                  </button>
                  
                  <span className="text-xs text-amber-500 font-medium">
                    Hết hạn sau {formatTime(countdown)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[var(--primary)] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
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
                  {loading ? "Đang xác thực..." : "Xác thực & Đăng nhập"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setOtpCode("");
                    setTempToken("");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl border border-gray-500/20 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 bg-transparent cursor-pointer"
                >
                  <ArrowLeftOutlined /> Quay lại đăng nhập
                </button>
              </div>
            </form>
          ) : isPhoneLoginActive ? (
            phoneLoginStep === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <p className="text-sm auth-text leading-relaxed text-center md:text-left">
                  Nhập số điện thoại Việt Nam của bạn để nhận mã xác thực OTP đăng nhập nhanh chóng.
                </p>
                <div className="relative">
                  <GlassInput
                    id="phoneLoginNumber"
                    label="Số điện thoại"
                    icon={<PhoneOutlined />}
                    type="tel"
                    required
                    value={phoneLoginNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhoneLoginNumber(val);
                      if (phoneLoginNumberTouched) {
                        validatePhone(val);
                      }
                    }}
                    onBlur={() => setPhoneLoginNumberTouched(true)}
                    disabled={loading}
                    placeholder="Ví dụ: 0912345678"
                  />
                  {(phoneLoginNumberTouched && phoneLoginNumberError) && (
                    <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{phoneLoginNumberError}</div>
                  )}
                </div>

                <TurnstileWidget
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                />

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || !turnstileToken}
                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[var(--primary)] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-white ml-1"></div>
                      ) : (
                        <span className="material-icons text-white/50 group-hover:text-white transition-colors text-lg">
                          <PhoneOutlined />
                        </span>
                      )}
                    </span>
                    {loading ? "Đang gửi OTP..." : "Gửi mã OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPhoneLoginActive(false);
                      setPhoneLoginNumber("");
                      setPhoneLoginNumberError("");
                      setPhoneLoginNumberTouched(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl border border-gray-500/20 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 bg-transparent cursor-pointer"
                  >
                    <MailOutlined /> Quay lại đăng nhập bằng Email
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePhoneOtpSubmit} className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 animate-pulse">
                    <SafetyCertificateOutlined className="text-3xl" />
                  </div>
                  <p className="text-sm auth-text leading-relaxed text-center">
                    Mã xác thực OTP đã được gửi đến số điện thoại <strong className="text-white">{phoneLoginNumber}</strong>. Vui lòng nhập mã để hoàn tất.
                  </p>
                </div>

                <div className="relative">
                  <GlassInput
                    id="phoneLoginOtp"
                    label="Mã xác thực OTP (6 chữ số)"
                    icon={<SafetyCertificateOutlined />}
                    type="text"
                    required
                    value={phoneLoginOtp}
                    maxLength={6}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setPhoneLoginOtp(val);
                      }
                    }}
                    disabled={loading}
                  />
                  
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await authService.requestPhoneLoginOtp(phoneLoginNumber);
                          setPhoneOtpCountdown(300);
                          setPhoneLoginOtp("");
                          message.success("Mã OTP mới đã được gửi lại!");
                        } catch (err: any) {
                          message.error(err.message || "Không thể gửi lại mã OTP.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || phoneOtpCountdown > 240}
                      className="text-xs text-[var(--primary)] hover:text-[#ff5c35] hover:underline disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer outline-none p-0"
                    >
                      Gửi lại mã OTP
                    </button>
                    
                    <span className="text-xs text-amber-500 font-medium">
                      Hết hạn sau {formatTime(phoneOtpCountdown)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[var(--primary)] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
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
                    {loading ? "Đang xác thực..." : "Xác thực & Đăng nhập"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhoneLoginStep('phone');
                      setPhoneLoginOtp("");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl border border-gray-500/20 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 bg-transparent cursor-pointer"
                  >
                    <ArrowLeftOutlined /> Quay lại nhập số điện thoại
                  </button>
                </div>
              </form>
            )
          ) : (
            <>
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
                      className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer outline-none"
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
                          <LoginOutlined />
                        </span>
                      )}
                    </span>
                    {loading ? t('login_button.loading') : t('login_button.login_text')}
                  </button>
                </div>

                {!isAdminDomain && (
                  <div className="text-center text-sm mt-6 pt-4 border-t auth-divider">
                    <span className="auth-text">{t('login_email_page.no_account')} </span>
                    <a href="/register" className="auth-terms-link font-semibold hover:underline transition-colors">
                      {t('login_email_page.sign_up_here')}
                    </a>
                  </div>
                )}
              </form>

              {!isAdminDomain && (
                <SocialAuthMethods dividerLabel={t('login_email_page.or_login_with')}>
                  <GoogleIdentityButton
                    rememberMe={remember}
                    disabled={loading}
                    onAuthenticated={navigateAfterLogin}
                    variant="signin"
                  />
                  <SocialAuthButton
                    icon={<PhoneOutlined />}
                    onClick={() => {
                      setIsPhoneLoginActive(true);
                      setPhoneLoginStep('phone');
                      setPhoneLoginOtp("");
                      setPhoneLoginNumber("");
                      setPhoneLoginNumberTouched(false);
                      setPhoneLoginNumberError("");
                    }}
                    loading={loading}
                    inactive={loading}
                  >
                    {t('login_email_page.phone_number')}
                  </SocialAuthButton>
                </SocialAuthMethods>
              )}
            </>
          )}
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
