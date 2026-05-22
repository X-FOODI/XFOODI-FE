'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import authService from '@/lib/services/authService';
import { App } from 'antd';
import { HeroSection } from "@/components/auth/HeroSection";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useThemeMode } from "../theme/AntdProvider";
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, MailOutlined, ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

function ConfirmEmailContent() {
  const { message: antdMessage } = App.useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const token = searchParams.get('token');
  
  const { mode } = useThemeMode();
  const { tenant } = useTenant();
  const tenantName = tenant?.businessName || tenant?.name;
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/xfoodi-logo.png";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link. Please check your email and try again.');
      return;
    }
    
    confirmEmail();
  }, [token]);
  
  const confirmEmail = async () => {
    try {
      setStatus('loading');
      await authService.confirmEmail(token!);
      setStatus('success');
      setMessage('Your email has been confirmed successfully! You can now login to your account.');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Email confirmation failed. Please try again or contact support.');
    }
  };
  
  const handleRetry = () => {
    if (token) {
      confirmEmail();
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
              {tenantName || (mounted ? 'CONFIRM EMAIL' : '')}
            </span>
          </div>

          <div className="text-center space-y-6">
            {status === 'loading' && (
              <>
                <div className="text-[var(--primary)] text-6xl mb-4">
                  <SyncOutlined spin />
                </div>
                <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm transition-colors">
                  Confirming your email...
                </h1>
                <p className="auth-text text-lg">
                  Please wait while we verify your account.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-green-500 text-6xl mb-4">
                  <CheckCircleOutlined />
                </div>
                <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm transition-colors text-green-500">
                  Email Confirmed!
                </h1>
                <p className="auth-text text-lg">
                  {message}
                </p>
                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5"
                  >
                    Go to Login
                  </button>
                  <p className="text-sm auth-text opacity-70">
                    Redirecting automatically in 3 seconds...
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-red-500 text-6xl mb-4">
                  <CloseCircleOutlined />
                </div>
                <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm transition-colors text-red-500">
                  Confirmation Failed
                </h1>
                <p className="auth-text text-lg mb-6">
                  {message}
                </p>

                <div className="text-left bg-red-500/10 border border-red-500/20 rounded-lg p-5 backdrop-blur-sm my-6">
                  <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs">?</span>
                    Common issues:
                  </h3>
                  <ul className="text-sm text-red-400/90 space-y-2 list-disc list-inside pl-2">
                    <li>The confirmation link has expired (24 hours)</li>
                    <li>The link has already been used</li>
                    <li>The link was copied incorrectly</li>
                  </ul>
                </div>

                <div className="space-y-4 pt-2">
                  {token && (
                    <button
                      onClick={handleRetry}
                      className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--primary)] hover:bg-[#ff5722] focus:outline-none transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5"
                    >
                      <ReloadOutlined /> Try Again
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/check-email`)}
                    className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-[var(--primary)] text-sm font-bold rounded-xl text-[var(--primary)] bg-transparent hover:bg-[var(--primary)]/10 focus:outline-none transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.1)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.2)] hover:-translate-y-0.5"
                  >
                    <MailOutlined /> Resend Confirmation Email
                  </button>
                  
                  <div className="pt-2 border-t border-white/10 mt-4">
                    <button
                      onClick={() => router.push('/register')}
                      className="text-sm font-semibold auth-terms-link hover:underline transition-colors flex items-center justify-center gap-2 w-full mt-4"
                    >
                      <ArrowLeftOutlined /> Back to Register
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="auth-page-bg min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary)]"></div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
