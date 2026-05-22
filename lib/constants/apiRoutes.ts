export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
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
  },
  RESTAURANT_APPLICATIONS: {
    CREATE: '/restaurant-applications',
    MY: '/restaurant-applications/my',
    LIST: '/restaurant-applications',
    DETAIL: (id: string) => `/restaurant-applications/${id}`,
    APPROVE: (id: string) => `/restaurant-applications/${id}/approve`,
    REJECT: (id: string) => `/restaurant-applications/${id}/reject`,
  },
};
