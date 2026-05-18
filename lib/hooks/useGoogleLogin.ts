/**
 * Custom hook for Google OAuth login
 * 
 * @description
 * Xử lý flow đăng nhập Google OAuth:
 * 1. Nhận googleToken (credential JWT) từ Google
 * 2. Gửi lên backend API để xác thực
 * 3. Nhận về accessToken, refreshToken, user
 * 4. Lưu vào storage (localStorage/sessionStorage) và cookie
 * 5. Cập nhật global auth state
 * 
 * @example
 * ```tsx
 * const { loginWithGoogle, loading, error } = useGoogleLogin();
 * 
 * const handleGoogleSuccess = async (credentialResponse) => {
 *   const user = await loginWithGoogle(credentialResponse.credential, true);
 *   router.push('/dashboard');
 * };
 * ```
 */

import { useAuth } from '@/lib/contexts/AuthContext';
import type { User } from '@/lib/services/authService';
import { useState, useCallback } from 'react';

export interface UseGoogleLoginReturn {
  /** Hàm xử lý đăng nhập Google */
  loginWithGoogle: (googleToken: string, rememberMe?: boolean) => Promise<User>;
  /** Trạng thái loading */
  loading: boolean;
  /** Lỗi nếu có */
  error: string | null;
  /** Reset error state */
  clearError: () => void;
}

/**
 * Hook xử lý Google OAuth login
 * 
 * @returns {UseGoogleLoginReturn} Object chứa loginWithGoogle function và states
 */
export function useGoogleLogin(): UseGoogleLoginReturn {
  const { loginWithGoogle: authLoginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = useCallback(
    async (googleToken: string, rememberMe = true): Promise<User> => {
      // Validate input
      if (!googleToken || typeof googleToken !== 'string') {
        const errorMsg = 'Invalid Google token';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setLoading(true);
      setError(null);

      try {
        // Gọi AuthContext loginWithGoogle
        // AuthContext sẽ:
        // 1. POST { googleToken } lên backend /auth/google
        // 2. Nhận về { accessToken, refreshToken, user }
        // 3. Lưu vào localStorage/sessionStorage + cookie
        // 4. Update global auth state
        const user = await authLoginWithGoogle(googleToken, rememberMe);
        
        return user;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Google sign-in failed. Please try again.';
        
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authLoginWithGoogle]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loginWithGoogle,
    loading,
    error,
    clearError,
  };
}
