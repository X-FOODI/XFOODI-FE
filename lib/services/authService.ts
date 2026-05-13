// Auth Service - Tích hợp với .NET Backend API

import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface RegisterRequest {
  email?: string;
  password?: string;
  phoneNumber: string;
  fullName: string;
}

export interface RegisterResponse {
  user?: User;
  requireLogin?: boolean;  // true if backend doesn't auto-login
  requireEmailConfirmation?: boolean;  // true if email confirmation needed
  message?: string;
}

export interface User {
  id: string;
  customerId?: string;
  email: string;
  name?: string;
  fullName?: string;
  role?: string;  // Primary role from backend (e.g., 'Admin', 'Staff', 'Customer', 'System Admin')
  roles?: string[];
  position?: string; // Staff position from auth response (e.g., 'Waiter', 'Kitchen', 'Kitchen Staff')
  phoneNumber?: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message?: string;
  error?: string;
}

export interface GenericResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ── Cookie helpers (middleware runs server-side, needs cookie not localStorage) ──
function setAuthCookie(token: string, rememberMe: boolean) {
  if (typeof document === 'undefined') return;
  if (rememberMe) {
    const maxAge = 8 * 60 * 60; // 8 hours in seconds
    document.cookie = `accessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    return;
  }
  // Session cookie (cleared when browser closes)
  document.cookie = `accessToken=${token}; path=/; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
}

const authService = {
  // Check phone existence
  async checkPhone(phoneNumber: string): Promise<{ exists: boolean; name?: string }> {
    try {
      // API call returns { exists: boolean, customerName: string, customerId: string } directly
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.CHECK_PHONE, { phoneNumber });

      // Handle both flat structure (from screenshot) and wrapped structure (just in case)
      const data = response.data?.data || response.data;

      return {
        exists: !!data?.exists,
        name: data?.customerName || data?.name
      };
    } catch (error) {
      console.error('Check phone error:', error);
      return { exists: false };
    }
  },

  // Login with .NET Backend
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Call API login
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
      });

      // Log response để debug
      console.log('Login API Response:', response.data);
      console.log('Response.data.data:', response.data?.data);
      console.log('Response.data keys:', Object.keys(response.data || {}));
      if (response.data?.data) {
        console.log('Response.data.data keys:', Object.keys(response.data.data || {}));
      }

      // Xử lý các format response khác nhau từ backend
      let user: User;
      let tokens: { accessToken: string; refreshToken: string };

      // Format 1: { success: true, data: { accessToken, refreshToken, user } } - .NET format
      if (response.data?.success && response.data?.data?.accessToken && response.data?.data?.user) {
        user = response.data.data.user;
        tokens = {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken || '',
        };
      }
      // Format 2: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
      else if (response.data?.success && response.data?.data?.tokens) {
        user = response.data.data.user;
        tokens = response.data.data.tokens;
      }
      // Format 3: { user, tokens } trực tiếp
      else if (response.data?.user && response.data?.tokens) {
        user = response.data.user;
        tokens = response.data.tokens;
      }
      // Format 4: { data: { user, token/accessToken } }
      else if (response.data?.data?.user) {
        user = response.data.data.user;
        tokens = {
          accessToken: response.data.data.token || response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken || '',
        };
      }
      // Format 5: Chỉ có token ở top level
      else if (response.data?.token || response.data?.accessToken) {
        tokens = {
          accessToken: response.data.token || response.data.accessToken,
          refreshToken: response.data.refreshToken || '',
        };
        // Tạo user object từ response
        user = {
          id: response.data.id || response.data.userId || 'unknown',
          email: credentials.email,
          name: response.data.name || response.data.username || credentials.email.split('@')[0],
          role: response.data.role || 'user',
          avatar: response.data.avatar,
        };
      }
      else {
        console.error('Unknown response format:', response.data);
        throw new Error('Invalid response format from server');
      }

      // Validate có tokens không
      if (!tokens?.accessToken) {
        console.error('No access token in response:', response.data);
        throw new Error('No access token received from server');
      }

      // Normalize user data để có cả name và role cho frontend dễ dùng
      const normalizedUser: User = {
        ...user,
        customerId: user.customerId,  // Preserve customerId from backend
        name: user.name || user.fullName || user.email.split('@')[0],
        fullName: user.fullName || user.name || user.email.split('@')[0],
        role: user.role || (user.roles && user.roles[0]) || 'Customer',
        roles: user.roles || (user.role ? [user.role] : ['Customer']),
      };

      const shouldRemember = !!credentials.rememberMe;
      const storage = shouldRemember ? localStorage : sessionStorage;

      // Lưu thông tin vào storage theo rememberMe
      storage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        storage.setItem('refreshToken', tokens.refreshToken);
      }
      storage.setItem('userInfo', JSON.stringify(normalizedUser));

      if (!shouldRemember) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
      }

      // Lưu token vào cookie để middleware có thể đọc (server-side auth check)
      setAuthCookie(tokens.accessToken, shouldRemember);

      console.log('Login successful, user:', normalizedUser);
      return normalizedUser;

    } catch (error: any) {
      // Log error để debug
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);

      // Xử lý các loại lỗi khác nhau

      // Lỗi từ backend (response error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Lỗi 401 - Unauthorized
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }

      // Lỗi 400 - Bad Request
      if (error.response?.status === 400) {
        throw new Error('Invalid login credentials');
      }

      // Lỗi network
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Lỗi timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      // Lỗi khác
      throw error;
    }
  },

  // Register new user with email confirmation
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      // NEW: Use API_ROUTES.AUTH.REGISTER endpoint that requires email confirmation
      // Backend will NOT auto-login, user must confirm email first
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.REGISTER, data);

      // Log response để debug
      console.log('Register API Response:', response.data);

      // Xử lý các format response khác nhau từ backend
      let user: User | undefined;
      let tokens: { accessToken: string; refreshToken: string } | undefined;

      // Format 1: { success: true, data: { accessToken, refreshToken, user } }
      if (response.data?.success && response.data?.data?.accessToken && response.data?.data?.user) {
        user = response.data.data.user;
        tokens = {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken || '',
        };
      }
      // Format 2: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
      else if (response.data?.success && response.data?.data?.tokens) {
        user = response.data.data.user;
        tokens = response.data.data.tokens;
      }
      // Format 3: { user, tokens } trực tiếp
      else if (response.data?.user && response.data?.tokens) {
        user = response.data.user;
        tokens = response.data.tokens;
      }
      // Format 4: { data: { user, token/accessToken } }
      else if (response.data?.data?.user) {
        user = response.data.data.user;
        tokens = {
          accessToken: response.data.data.token || response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken || '',
        };
      }
      // Format 5: Success message without tokens (email confirmation required)
      else if (response.data?.success && response.data?.message) {
        // Backend requires email confirmation - no auto-login
        console.log('Registration successful, email confirmation required');
        return {
          requireLogin: true,
          requireEmailConfirmation: true,
          message: response.data.message || 'Registration successful! Please check your email to confirm your account.',
        };
      }
      else if (response.data?.success) {
        // Success nhưng không rõ format - assume cần login
        console.log('Registration successful, format unclear, requires manual login');
        return {
          requireLogin: true,
          message: 'Registration successful! Please login with your credentials.',
        };
      }
      else {
        console.error('Unknown response format:', response.data);
        throw new Error('Invalid response format from server');
      }

      // Validate có tokens không (nếu backend auto login sau register)
      if (!tokens?.accessToken || !user) {
        // Backend không auto login - đây không phải lỗi
        console.log('No tokens in response, requires manual login');
        return {
          requireLogin: true,
          message: 'Registration successful! Please login with your credentials.',
        };
      }

      // Normalize user data
      const normalizedUser: User = {
        ...user,
        name: user.name || user.fullName || user.email.split('@')[0],
        fullName: user.fullName || user.name || user.email.split('@')[0],
        role: user.role || (user.roles && user.roles[0]) || 'Customer',
        roles: user.roles || (user.role ? [user.role] : ['Customer']),
      };

      // Lưu thông tin vào localStorage (nếu có tokens)
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
      localStorage.setItem('userInfo', JSON.stringify(normalizedUser));

      // Set cookie để middleware nhận diện session sau khi register
      setAuthCookie(tokens.accessToken, false);

      console.log('Register successful with auto-login, user:', normalizedUser);
      return {
        user: normalizedUser,
        requireLogin: false,
      };

    } catch (error: any) {
      // Log error để debug
      console.warn('Register error:', error);
      if (error.response?.data) {
        console.warn('Error response:', error.response.data);
      }

      // Lỗi từ backend (response error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Lỗi 400 - Bad Request (validation errors)
      if (error.response?.status === 400) {
        throw new Error('Invalid registration data. Please check your input.');
      }

      // Lỗi 409 - Conflict (email already exists)
      if (error.response?.status === 409) {
        throw new Error('Email already exists. Please use a different email or login.');
      }

      // Lỗi network
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Lỗi timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      // Lỗi khác
      throw error;
    }
  },

  // Call logout API (invalidate server-side session/token if backend supports)
  async logoutServer(): Promise<void> {
    try {
      await axiosInstance.post(API_ROUTES.AUTH.LOGOUT);
    } catch (error) {
      // Không chặn luồng logout ở client nếu API lỗi
      console.warn('Logout API error:', error);
    }
  },

  // Logout user on client
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userInfo');
    // Xóa cookie để middleware biết user đã logout
    clearAuthCookie();
  },

  // Get current user
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Get current user from server
  async getCurrentUserFromServer(): Promise<User | null> {
    try {
      const response = await axiosInstance.get<AuthResponse>(API_ROUTES.AUTH.ME);
      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem('userInfo', JSON.stringify(user));
        return user;
      }
      throw new Error(response.data.message || 'Failed to get user info');
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        this.logout();
        return null;
      }
      // Nếu không có token hoặc lỗi khác, trả về null
      return null;
    }
  },

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  },

  // Change Password (requires authentication)
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const response = await axiosInstance.post<GenericResponse>(API_ROUTES.AUTH.CHANGE_PASSWORD, data);

      if (response.data.success) {
        return;
      }

      throw new Error(response.data.message || 'Failed to change password');

    } catch (error: any) {
      // Lỗi từ backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Lỗi 400 - Bad Request (validation errors)
      if (error.response?.status === 400) {
        throw new Error('Invalid password format or passwords do not match');
      }

      // Lỗi 401 - Unauthorized (wrong current password)
      if (error.response?.status === 401) {
        throw new Error('Current password is incorrect');
      }

      // Lỗi network
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Lỗi timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  },

  // Reset Password (no authentication required)
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      const response = await axiosInstance.post<GenericResponse>(API_ROUTES.AUTH.RESET_PASSWORD, data);

      if (response.data.success) {
        return;
      }

      throw new Error(response.data.message || 'Failed to reset password');

    } catch (error: any) {
      // Lỗi từ backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Lỗi 400 - Bad Request (invalid token or validation errors)
      if (error.response?.status === 400) {
        throw new Error('Invalid or expired reset token');
      }

      // Lỗi 404 - Not Found (email not found)
      if (error.response?.status === 404) {
        throw new Error('Email address not found');
      }

      // Lỗi network
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Lỗi timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  },

  // Request password reset (send reset email)
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await axiosInstance.post<GenericResponse>(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });

      if (response.data.success) {
        return;
      }

      throw new Error(response.data.message || 'Failed to send reset email');

    } catch (error: any) {
      // Lỗi từ backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Lỗi 404 - Not Found
      if (error.response?.status === 404) {
        throw new Error('Email address not found');
      }

      // Lỗi network
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Lỗi timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  },

  // Confirm email with token
  async confirmEmail(token: string): Promise<void> {
    try {
      const response = await axiosInstance.get<GenericResponse>(API_ROUTES.AUTH.CONFIRM_EMAIL, {
        params: { token }
      });

      if (response.data.success) {
        return;
      }

      throw new Error(response.data.message || 'Email confirmation failed');

    } catch (error: any) {
      // Lỗi từ backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Lỗi 400 - Bad Request (invalid token)
      if (error.response?.status === 400) {
        throw new Error('Invalid or expired confirmation token');
      }

      // Lỗi 404 - Not Found
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }

      // Lỗi network
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Lỗi timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  },

  // Resend confirmation email
  async resendConfirmationEmail(email: string): Promise<void> {
    try {
      const response = await axiosInstance.post<GenericResponse>(API_ROUTES.AUTH.RESEND_CONFIRMATION_EMAIL, { email });

      if (response.data.success) {
        return;
      }

      throw new Error(response.data.message || 'Failed to resend confirmation email');

    } catch (error: any) {
      // Lỗi từ backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Lỗi 404 - Not Found
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }

      // Lỗi 429 - Too Many Requests
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      // Lỗi network
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      // Lỗi timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  },
};

export default authService;
