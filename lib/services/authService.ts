// Auth Service - Tích hợp với .NET Backend API

import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';
import { setAuthCookie, clearAuthCookie, setAdminAuthCookie, clearAdminAuthCookie } from '../utils/authCookies';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  turnstileToken?: string;
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
  turnstileToken?: string;
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
  restaurantId?: string | null; // Set when user is Owner
  restaurantSlug?: string | null;
  position?: string; // Staff position from auth response (e.g., 'Waiter', 'Kitchen', 'Kitchen Staff')
  phoneNumber?: string;
  avatar?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string;
  dateOfBirth?: string; // ISO date string e.g. "1995-08-20"
  address?: string;
  hasPassword?: boolean;
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

/** Google JWT payload only — not verified; used as fallback when API omits user.email. */
function decodeGoogleCredentialEmail(idToken: string): string | undefined {
  try {
    const payloadB64 = idToken.split('.')[1];
    if (!payloadB64) return undefined;
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { email?: string };
    return typeof payload.email === 'string' ? payload.email : undefined;
  } catch {
    return undefined;
  }
}

const GOOGLE_HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Thông tin đăng nhập Google không hợp lệ',
  401: 'Phiên Google đã hết hạn, vui lòng thử lại',
  403: 'Email Google chưa được xác minh',
  500: 'Lỗi máy chủ, vui lòng thử lại sau',
  503: 'Tính năng đăng nhập Google tạm thời không khả dụng',
};

function readBackendErrorText(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const payload = data as { message?: unknown; error?: unknown };
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }
  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }
  return undefined;
}

function throwNormalizedLoginError(error: any, mode: 'password' | 'google'): never {
  console.error('Login error:', error);
  console.error('Error response:', error.response?.data);
  console.error('Error status:', error.response?.status);

  const status: number | undefined = error.response?.status;
  const backendMessage = readBackendErrorText(error.response?.data);

  if (backendMessage) {
    throw new Error(backendMessage);
  }

  if (mode === 'google' && status !== undefined && GOOGLE_HTTP_STATUS_MESSAGES[status]) {
    throw new Error(GOOGLE_HTTP_STATUS_MESSAGES[status]);
  }

  if (status === 401) {
    throw new Error('Invalid email or password');
  }

  if (status === 400) {
    throw new Error('Invalid login credentials');
  }

  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  }

  if (error.code === 'ECONNABORTED') {
    throw new Error('Hết thời gian chờ. Vui lòng thử lại.');
  }

  if (mode === 'google') {
    throw new Error('Đăng nhập Google thất bại. Vui lòng thử lại.');
  }

  throw error;
}

function parseAuthLoginPayload(
  responseData: any,
  emailFallback: string
): { user: User; tokens: { accessToken: string; refreshToken: string } } {
  let user: User;
  let tokens: { accessToken: string; refreshToken: string };

  if (responseData?.success && responseData?.data?.accessToken && responseData?.data?.user) {
    user = responseData.data.user;
    tokens = {
      accessToken: responseData.data.accessToken,
      refreshToken: responseData.data.refreshToken || '',
    };
  } else if (responseData?.success && responseData?.data?.tokens) {
    user = responseData.data.user;
    tokens = responseData.data.tokens;
  } else if (responseData?.user && responseData?.tokens) {
    user = responseData.user;
    tokens = responseData.tokens;
  } else if (responseData?.data?.user) {
    user = responseData.data.user;
    tokens = {
      accessToken: responseData.data.token || responseData.data.accessToken,
      refreshToken: responseData.data.refreshToken || '',
    };
  } else if (responseData?.token || responseData?.accessToken) {
    tokens = {
      accessToken: responseData.token || responseData.accessToken,
      refreshToken: responseData.refreshToken || '',
    };
    user = {
      id: responseData.id || responseData.userId || 'unknown',
      email: responseData.email || emailFallback,
      name: responseData.name || responseData.username || emailFallback.split('@')[0],
      role: responseData.role || 'user',
      avatar: responseData.avatar,
    };
  } else {
    console.error('Unknown response format:', responseData);
    throw new Error('Invalid response format from server');
  }

  if (!tokens?.accessToken) {
    console.error('No access token in response:', responseData);
    throw new Error('No access token received from server');
  }

  return { user, tokens };
}

function finalizeLoginSession(
  user: User,
  tokens: { accessToken: string; refreshToken: string },
  rememberMe: boolean
): User {
  const normalizedUser: User = {
    ...user,
    customerId: user.customerId,
    name: user.name || user.fullName || user.email.split('@')[0],
    fullName: user.fullName || user.name || user.email.split('@')[0],
    role: user.role || (user.roles && user.roles[0]) || 'Customer',
    roles: user.roles || (user.role ? [user.role] : ['Customer']),
    restaurantId: user.restaurantId ?? null,
    restaurantSlug: user.restaurantSlug ?? null,
    avatar: user.avatar || (user as any).avatarUrl || '',
    phoneNumber: user.phoneNumber || (user as any).phone || '',
  };

  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem('accessToken', tokens.accessToken);
  if (tokens.refreshToken) {
    storage.setItem('refreshToken', tokens.refreshToken);
  }
  storage.setItem('userInfo', JSON.stringify(normalizedUser));

  const isAdmin = normalizedUser.roles?.some((r) =>
    ['Admin', 'SuperAdmin', 'System Admin'].includes(r)
  );

  if (isAdmin) {
    storage.setItem('adminAccessToken', tokens.accessToken);
  }

  if (!rememberMe) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    if (isAdmin) {
      localStorage.removeItem('adminAccessToken');
    }
  }

  setAuthCookie(tokens.accessToken, rememberMe);
  if (isAdmin) {
    setAdminAuthCookie(tokens.accessToken, rememberMe);
  }

  console.log('Login session finalized');
  return normalizedUser;
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

  // Request login OTP via phone
  async requestPhoneLoginOtp(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.PHONE_OTP, { phoneNumber });
      return {
        success: !!response.data?.success,
        message: response.data?.message || 'Gửi mã OTP thành công.'
      };
    } catch (error: any) {
      console.error('Request phone OTP error:', error);
      const backendMessage = error.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.';
      throw new Error(backendMessage);
    }
  },

  // Verify phone OTP and sign in
  async verifyPhoneLoginOtp(phoneNumber: string, code: string): Promise<User> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.PHONE_VERIFY, { phoneNumber, code });
      const data = response.data?.data || response.data;

      if (!data?.accessToken) {
        throw new Error('Xác thực OTP thành công nhưng không nhận được thông tin đăng nhập.');
      }

      const userObj: User = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        phoneNumber: data.user.phoneNumber,
        avatar: data.user.avatarUrl || '',
        role: data.user.roles?.[0] || 'Customer',
        roles: data.user.roles || ['Customer'],
        restaurantId: data.user.restaurantId || null,
        restaurantSlug: data.user.restaurantSlug || null,
      };

      const normalizedUser = finalizeLoginSession(userObj, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }, true);

      console.log('Phone OTP login successful');
      return normalizedUser;
    } catch (error: any) {
      console.error('Verify phone OTP error:', error);
      const backendMessage = error.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      throw new Error(backendMessage);
    }
  },

  // Login with .NET Backend
  async login(credentials: LoginCredentials): Promise<User | { requires2FA: true; tempToken: string }> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
        turnstileToken: credentials.turnstileToken,
      });

      console.log('Login successful');

      if (response.data?.requires2FA) {
        return {
          requires2FA: true,
          tempToken: response.data.tempToken,
        };
      }

      const { user, tokens } = parseAuthLoginPayload(response.data, credentials.email);
      return finalizeLoginSession(user, tokens, !!credentials.rememberMe);
    } catch (error: any) {
      throwNormalizedLoginError(error, 'password');
    }
  },

  // Unlock blocked admin account using Turnstile token
  async unlockAccount(email: string, turnstileToken: string): Promise<any> {
    try {
      const response = await axiosInstance.post<any>('/auth/unlock', {
        email,
        turnstileToken,
      });
      return response.data;
    } catch (error: any) {
      console.error('Unlock account error:', error);
      const backendMessage = error.response?.data?.message || 'Mở khóa tài khoản thất bại. Vui lòng kiểm tra lại.';
      throw new Error(backendMessage);
    }
  },

  // Validate 2FA TOTP code or backup code during login
  async validate2FA(tempToken: string, code: string, rememberMe = true): Promise<User> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.TWO_FACTOR_VALIDATE, {
        tempToken,
        code,
      });

      console.log('2FA Validation successful');
      const { user, tokens } = parseAuthLoginPayload(response.data, 'admin@xfoodi.com');
      return finalizeLoginSession(user, tokens, rememberMe);
    } catch (error: any) {
      throwNormalizedLoginError(error, 'password');
    }
  },

  // Generate 2FA setup details (QR code image and secret)
  async setup2FA(): Promise<{ qrCode: string; secret: string }> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.TWO_FACTOR_SETUP);
      return response.data?.data;
    } catch (error: any) {
      const backendMessage = readBackendErrorText(error.response?.data);
      throw new Error(backendMessage || 'Không thể thiết lập 2FA. Vui lòng thử lại.');
    }
  },

  // Verify first 2FA code and enable 2FA, returning backup codes
  async enable2FA(code: string): Promise<{ backupCodes: string[] }> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.TWO_FACTOR_ENABLE, { code });
      return response.data?.data;
    } catch (error: any) {
      const backendMessage = readBackendErrorText(error.response?.data);
      throw new Error(backendMessage || 'Không thể kích hoạt 2FA. Vui lòng kiểm tra lại mã.');
    }
  },

  // Disable 2FA with verification code
  async disable2FA(code: string): Promise<void> {
    try {
      await axiosInstance.post<any>(API_ROUTES.AUTH.TWO_FACTOR_DISABLE, { code });
    } catch (error: any) {
      const backendMessage = readBackendErrorText(error.response?.data);
      throw new Error(backendMessage || 'Không thể tắt 2FA. Vui lòng kiểm tra lại mã.');
    }
  },

  // Retrieve current admin 2FA configuration status
  async get2FAStatus(): Promise<{ twoFactorEnabled: boolean; remainingBackupCodes: number }> {
    try {
      const response = await axiosInstance.get<any>(API_ROUTES.AUTH.TWO_FACTOR_STATUS);
      return response.data?.data;
    } catch (error: any) {
      const backendMessage = readBackendErrorText(error.response?.data);
      throw new Error(backendMessage || 'Không thể tải trạng thái bảo mật 2FA.');
    }
  },

  // Regenerate emergency backup codes
  async regenerateBackupCodes(code: string): Promise<{ backupCodes: string[] }> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.TWO_FACTOR_REGENERATE_BACKUP_CODES, { code });
      return response.data?.data;
    } catch (error: any) {
      const backendMessage = readBackendErrorText(error.response?.data);
      throw new Error(backendMessage || 'Không thể tạo lại mã dự phòng. Vui lòng kiểm tra lại mã OTP.');
    }
  },

  // Setup a new 2FA device, requiring authorization from the old device first
  async setupNew2FADevice(code: string): Promise<{ qrCode: string; secret: string }> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.TWO_FACTOR_SETUP_NEW_DEVICE, { code });
      return response.data?.data;
    } catch (error: any) {
      const backendMessage = readBackendErrorText(error.response?.data);
      throw new Error(backendMessage || 'Xác thực thiết bị hiện tại thất bại. Vui lòng kiểm tra lại mã OTP.');
    }
  },

  // Confirm new 2FA device setup with OTP from the new device
  async confirmNew2FADevice(code: string): Promise<{ backupCodes: string[] }> {
    try {
      const response = await axiosInstance.post<any>(API_ROUTES.AUTH.TWO_FACTOR_CONFIRM_NEW_DEVICE, { code });
      return response.data?.data;
    } catch (error: any) {
      const backendMessage = readBackendErrorText(error.response?.data);
      throw new Error(backendMessage || 'Xác thực thiết bị mới thất bại. Vui lòng kiểm tra lại mã OTP.');
    }
  },

  /**
   * Exchange Google credential JWT for app tokens.
   * Backend: POST `{ googleToken }` to `/auth/google` (full URL: NEXT_PUBLIC_API_URL + path; or NEXT_PUBLIC_AUTH_GOOGLE_LOGIN_PATH).
   * Response must match one of the same shapes as email `login`.
   */
  async loginWithGoogle(googleToken: string, rememberMe = true): Promise<User> {
    const path =
      (typeof process !== 'undefined' &&
        process.env.NEXT_PUBLIC_AUTH_GOOGLE_LOGIN_PATH?.trim()) ||
      API_ROUTES.AUTH.GOOGLE;
    const emailFallback = decodeGoogleCredentialEmail(googleToken) || 'google@user.invalid';

    try {
      const response = await axiosInstance.post<any>(path, { googleToken });

      try {
        const { user, tokens } = parseAuthLoginPayload(response.data, emailFallback);
        return finalizeLoginSession(user, tokens, !!rememberMe);
      } catch (sessionError) {
        console.error(
          '[loginWithGoogle] parseAuthLoginPayload / finalizeLoginSession failed:',
          sessionError,
          { responseData: response.data }
        );
        throw sessionError instanceof Error
          ? sessionError
          : new Error('Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.');
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error && (error as { response?: unknown }).response) {
        throwNormalizedLoginError(error, 'google');
      }
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
    localStorage.removeItem('adminAccessToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('adminAccessToken');
    // Xóa cookie để middleware biết user đã logout
    clearAuthCookie();
    clearAdminAuthCookie();
  },

  // Get current user
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (!userInfo || userInfo === 'undefined') return null;
    try {
      return JSON.parse(userInfo);
    } catch (e) {
      console.error('Failed to parse userInfo:', e);
      localStorage.removeItem('userInfo');
      sessionStorage.removeItem('userInfo');
      return null;
    }
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
