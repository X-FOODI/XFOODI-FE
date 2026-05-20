export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    /** POST `{ googleToken: string }` — Google credential JWT. Full URL = NEXT_PUBLIC_API_URL + path (e.g. …/api/auth/google). */
    GOOGLE: '/auth/google',
    REGISTER: '/auth/register',
    CHECK_PHONE: '/auth/customer/check-phone',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    RESET_PASSWORD: '/auth/reset-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    CONFIRM_EMAIL: '/auth/confirm-email',
    RESEND_CONFIRMATION_EMAIL: '/auth/resend-confirmation-email',
    REFRESH_TOKEN: '/auth/refresh-token'
  },
  USERS: {
    ME: '/users/me',
    CHANGE_PASSWORD: '/users/change-password',
  }
};
