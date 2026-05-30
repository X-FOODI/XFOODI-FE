/**
 * Shared auth cookie utilities.
 * Used by both authService and axiosInstance to manage the accessToken cookie
 * that Next.js middleware reads for server-side route protection.
 */

export function setAuthCookie(token: string, rememberMe: boolean) {
  if (typeof document === 'undefined') return;
  if (rememberMe) {
    const maxAge = 8 * 60 * 60; // 8 hours in seconds
    document.cookie = `accessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    return;
  }
  // Session cookie (cleared when browser closes)
  document.cookie = `accessToken=${token}; path=/; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
}

export function setAdminAuthCookie(token: string, rememberMe: boolean) {
  if (typeof document === 'undefined') return;
  if (rememberMe) {
    const maxAge = 8 * 60 * 60; // 8 hours in seconds
    document.cookie = `adminAccessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    return;
  }
  // Session cookie (cleared when browser closes)
  document.cookie = `adminAccessToken=${token}; path=/; SameSite=Lax`;
}

export function clearAdminAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'adminAccessToken=; path=/; max-age=0; SameSite=Lax';
}

