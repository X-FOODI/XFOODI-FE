'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import authService from '@/lib/services/authService';
import { App } from 'antd';
import { HeroSection } from "@/components/auth/HeroSection";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useThemeMode } from "../theme/AntdProvider";
import { MailOutlined, SyncOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

function CheckEmailContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [resending, setResending] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/xfoodi-logo.png";

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleResend = async () => {
    if (!email) {
      message.error('Email address is required');
      return;
    }
    
    setResending(true);
    try {
      await authService.resendConfirmationEmail(email);
      message.success('Confirmation email sent! Please check your inbox.');
    } catch (error: any) {
      message.error(error.message || 'Failed to resend email');
    } finally {
      setResending(false);
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
        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/40"></div>
      </div>

      {/* Left Side: Hero Image & Branding (Desktop Only) */}
      <HeroSection />

      {/* Right Side: Check Email Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative overflow-hidden min-h-screen z-10">
        
        {/* Desktop Ambient Orbs */}
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 auth-orb"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 auth-orb"></div>

        {/* Content Container */}
        <div className="auth-form-card w-full max-w-md p-8 lg:p-10 relative z-20 transition-colors duration-300">
          
          {/* Mobile Tenant Logo */}
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
              {tenantName || (mounted ? 'CHECK EMAIL' : '')}
            </span>
          </div>

          {!email ? (
            <div className="text-center space-y-6">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm">
                Invalid Request
              </h1>
              <p className="auth-text text-lg">
                Email address is missing. Please try registering again.
              </p>
              <button
                onClick={() => router.push('/register')}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5"
              >
                Back to Register
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-[var(--primary)] text-6xl mb-4">
                <MailOutlined />
              </div>
              <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm transition-colors">
                Check Your Email
              </h1>
              
              <div className="space-y-4">
                <p className="auth-text">
                  We've sent a confirmation email to:
                </p>
                <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                  <p className="font-semibold text-lg text-[var(--primary)] truncate">
                    {email}
                  </p>
                </div>
                <p className="auth-text text-sm opacity-80">
                  Please click the link in the email to confirm your account and complete registration.
                </p>
              </div>

              <div className="text-left bg-white/5 border border-[var(--primary)]/20 rounded-lg p-5 backdrop-blur-sm my-6">
                <h3 className="font-semibold auth-heading mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] text-xs">?</span>
                  What&apos;s next?
                </h3>
                <ol className="text-sm auth-text space-y-2 list-decimal list-inside opacity-90 pl-2">
                  <li>Check your email inbox</li>
                  <li>Click the confirmation link</li>
                  <li>Login with your credentials</li>
                </ol>
              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="text-sm auth-text mb-4 opacity-80">
                  Didn&apos;t receive the email?
                </p>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-[var(--primary)] text-sm font-bold rounded-xl text-[var(--primary)] bg-transparent hover:bg-[var(--primary)]/10 focus:outline-none transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.1)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.2)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  {resending ? (
                    <SyncOutlined spin className="mr-2" />
                  ) : (
                    <MailOutlined className="mr-2" />
                  )}
                  {resending ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
                <p className="text-xs auth-text mt-3 opacity-60">
                  Check your spam folder or wait a few minutes before resending
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm font-semibold auth-terms-link hover:underline transition-colors flex items-center justify-center gap-2 w-full"
                >
                  <ArrowLeftOutlined />
                  Already confirmed? Go to login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none">
          <p className="auth-footer-text">
            © {new Date().getFullYear()} {tenantName || (mounted ? 'XFoodi' : '')}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="auth-page-bg min-h-screen" />}>
      <CheckEmailContent />
    </Suspense>
  );
}
