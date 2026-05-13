import axios from 'axios';
import { API_ROUTES } from '../constants/apiRoutes';

// Get initial base URL based on current host
// This is called once during module initialization
const getInitialBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: use internal Docker network URL or localhost for development
    // In Docker, services communicate via internal network names
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  // Client-side: Always use relative path
  // The reverse proxy will route /api/* requests to the correct backend
  // based on the Host header (e.g., demo.restx.food -> tenant backend)
  return '/api';
};

const axiosInstance = axios.create({
  baseURL: getInitialBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'accept': '*/*',
  },
  timeout: 30000, // 30 seconds timeout
});

// Update baseURL on client-side after hydration
if (typeof window !== 'undefined') {
  axiosInstance.defaults.baseURL = getInitialBaseUrl();
}

// Allow manual override of base URL (used by TenantContext when hostname is provided)
export const setAxiosBaseUrl = (baseUrl: string) => {
  axiosInstance.defaults.baseURL = baseUrl;
};

axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure we are in the browser before accessing storage
    // Token co the nam trong localStorage (rememberMe=true) hoac sessionStorage (rememberMe=false)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // When sending FormData, do not set Content-Type so the browser/axios can set
    // multipart/form-data with the correct boundary. Otherwise server gets
    // Content-Type: application/json and returns 400.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function setAuthCookie(token: string, rememberMe: boolean) {
  if (typeof document === 'undefined') return;
  if (rememberMe) {
    const maxAge = 8 * 60 * 60; // 8 hours in seconds
    document.cookie = `accessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    return;
  }
  document.cookie = `accessToken=${token}; path=/; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(API_ROUTES.AUTH.REFRESH_TOKEN) &&
      !originalRequest.url?.includes(API_ROUTES.AUTH.LOGIN)
    ) {
      originalRequest._retry = true;
      try {
        if (typeof window === 'undefined') throw new Error('No window object');

        // Doc refreshToken tu ca localStorage (rememberMe=true) va sessionStorage (rememberMe=false)
        const refreshTokenFromLocal = localStorage.getItem('refreshToken');
        const refreshTokenFromSession = sessionStorage.getItem('refreshToken');
        const refreshToken = refreshTokenFromLocal || refreshTokenFromSession;
        const useSession = !refreshTokenFromLocal && !!refreshTokenFromSession;

        if (!refreshToken) throw new Error('No refresh token available');

        // Call refresh token API
        const response = await axiosInstance.post(API_ROUTES.AUTH.REFRESH_TOKEN, { refreshToken });
        if (response.data.success) {
          const { accessToken } = response.data.data;
          // Ghi lai accessToken vao dung storage tuong ung
          if (useSession) {
            sessionStorage.setItem('accessToken', accessToken);
          } else {
            localStorage.setItem('accessToken', accessToken);
          }
          // Đồng bộ cookie để middleware SSR không redirect sai về /login
          setAuthCookie(accessToken, !useSession);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          // Xoa ca hai storage khi refresh that bai
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userInfo');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('userInfo');
          // Xóa cookie để middleware không còn cho phép truy cập route được bảo vệ
          clearAuthCookie();

          const windowPath = window.location.pathname;
          if (!windowPath.startsWith('/your-reservation')) {
            const currentPath = `${windowPath}${window.location.search || ''}`;
            const encodedRedirect = encodeURIComponent(currentPath || '/');
            const loginPath =
              windowPath.startsWith('/admin') || windowPath.startsWith('/staff')
                ? '/login-email'
                : '/login';

            window.location.href = `${loginPath}?redirect=${encodedRedirect}`;
          }
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
