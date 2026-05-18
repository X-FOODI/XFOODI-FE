/**
 * Google Login Button Component
 * 
 * @description
 * Component nút đăng nhập Google tuân thủ Google Branding Guidelines:
 * - Sử dụng Google official button từ @react-oauth/google
 * - Không thay đổi màu sắc hoặc logo Google
 * - Hiển thị loading state khi đang xử lý
 * - Hiển thị error message nếu thất bại
 * 
 * @example
 * ```tsx
 * <GoogleLoginButton
 *   onSuccess={(user) => router.push('/dashboard')}
 *   rememberMe={true}
 *   variant="signin"
 * />
 * ```
 */

"use client";

import { useGoogleLogin } from '@/lib/hooks/useGoogleLogin';
import type { User } from '@/lib/services/authService';
import { GoogleLogin } from '@react-oauth/google';
import { App } from 'antd';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';

export interface GoogleLoginButtonProps {
  /** Callback khi đăng nhập thành công */
  onSuccess: (user: User) => void;
  /** Callback khi có lỗi (optional) */
  onError?: (error: Error) => void;
  /** Lưu session (localStorage) hay không (sessionStorage) */
  rememberMe?: boolean;
  /** Disable button */
  disabled?: boolean;
  /** Variant text: "signin" hoặc "signup" */
  variant?: 'signin' | 'signup';
  /** Custom width (default: 320px) */
  width?: number;
}

export function GoogleLoginButton({
  onSuccess,
  onError,
  rememberMe = true,
  disabled = false,
  variant = 'signin',
  width = 320,
}: GoogleLoginButtonProps) {
  const { t } = useTranslation('auth');
  const { message } = App.useApp();
  const { loginWithGoogle, loading, error } = useGoogleLogin();

  // Refs để tránh stale closure
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const rememberMeRef = useRef(rememberMe);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    rememberMeRef.current = rememberMe;
  }, [rememberMe]);

  // Hiển thị error nếu có
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error, message]);

  // Không render nếu không có Google Client ID
  if (!GOOGLE_CLIENT_ID) {
    console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
    return null;
  }

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse?.credential;
    
    if (!credential) {
      const errorMsg = t('login_email_page.google_invalid_token') || 'Invalid Google response';
      message.error(errorMsg);
      return;
    }

    try {
      const user = await loginWithGoogle(credential, rememberMeRef.current);
      onSuccessRef.current(user);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Google sign-in failed');
      onErrorRef.current?.(error);
    }
  };

  const handleError = () => {
    const errorMsg = t('login_email_page.google_popup_closed') || 'Google sign-in was cancelled';
    message.warning(errorMsg);
  };

  const buttonText = variant === 'signup' ? ('signup_with' as const) : ('continue_with' as const);
  const blocked = disabled || loading;

  return (
    <div
      className={`google-oauth-btn-wrap relative w-full flex justify-center min-h-[44px] items-center ${
        blocked ? 'pointer-events-none' : ''
      }`}
      aria-busy={loading}
    >
      <div
        className={`w-full flex justify-center transition-opacity ${
          loading ? 'opacity-40' : 'opacity-100'
        }`}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          ux_mode="popup"
          theme="outline"
          size="large"
          shape="rectangular"
          text={buttonText}
          width={width}
          containerProps={{
            className: 'w-full flex justify-center [&>div]:w-full [&>div]:max-w-[400px]',
          }}
        />
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-md">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
