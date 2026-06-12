/**
 * Shared auth cookie utilities.
 * Used by both authService and axiosInstance to manage the accessToken cookie
 * that Next.js middleware reads for server-side route protection.
 */

function getCookieDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  
  // If it's an IP address, don't set domain
  if (/^[0-9.]+$/.test(hostname)) {
    return '';
  }
  
  // If it's localhost or a subdomain of localhost
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return '; domain=.localhost';
  }
  
  // Otherwise, extract the base domain
  const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'xfoodi.website';
  if (hostname.endsWith(`.${BASE_DOMAIN}`) || hostname === BASE_DOMAIN) {
    return `; domain=.${BASE_DOMAIN}`;
  }
  
  return '';
}

export function setAuthCookie(token: string, rememberMe: boolean) {
  if (typeof document === 'undefined') return;
  const domainAttr = getCookieDomain();
  if (rememberMe) {
    const maxAge = 8 * 60 * 60; // 8 hours in seconds
    document.cookie = `accessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttr}`;
    return;
  }
  // Session cookie (cleared when browser closes)
  document.cookie = `accessToken=${token}; path=/; SameSite=Lax${domainAttr}`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  const domainAttr = getCookieDomain();
  document.cookie = `accessToken=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
}

export function setAdminAuthCookie(token: string, rememberMe: boolean) {
  if (typeof document === 'undefined') return;
  const domainAttr = getCookieDomain();
  if (rememberMe) {
    const maxAge = 8 * 60 * 60; // 8 hours in seconds
    document.cookie = `adminAccessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttr}`;
    return;
  }
  // Session cookie (cleared when browser closes)
  document.cookie = `adminAccessToken=${token}; path=/; SameSite=Lax${domainAttr}`;
}

export function clearAdminAuthCookie() {
  if (typeof document === 'undefined') return;
  const domainAttr = getCookieDomain();
  document.cookie = `adminAccessToken=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
}
