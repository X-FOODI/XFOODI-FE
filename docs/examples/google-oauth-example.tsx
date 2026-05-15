/**
 * Example: Custom Login Page với Google OAuth
 * 
 * File này demo cách tích hợp Google OAuth vào một trang custom
 * Sử dụng hook useGoogleLogin và component GoogleLoginButton
 */

"use client";

import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { User } from '@/lib/services/authService';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CustomLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user && !authLoading) {
    router.push('/dashboard');
    return null;
  }

  const handleGoogleSuccess = (user: User) => {
    console.log('Google login successful:', user);
    
    if (user.role === 'Admin') {
      router.push('/admin/dashboard');
    } else if (user.role === 'Staff') {
      router.push('/staff/orders');
    } else {
      router.push('/customer/menu');
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google login failed:', error);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Đăng nhập
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Chào mừng bạn quay trở lại
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Đăng nhập
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              hoặc
            </span>
          </div>
        </div>

        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          rememberMe={true}
          variant="signin"
        />

        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Chưa có tài khoản?{' '}
          </span>
          <a
            href="/register"
            className="font-medium text-primary hover:text-primary-dark"
          >
            Đăng ký ngay
          </a>
        </div>
      </div>
    </div>
  );
}
