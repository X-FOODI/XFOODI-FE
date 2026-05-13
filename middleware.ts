import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // Landing domains - serve public landing page
  const LANDING_DOMAINS = new Set(["restx.food", "www.restx.food"]);

  // Super Admin domain - serve /tenants (manage all tenants)
  const ADMIN_DOMAIN = 'admin.restx.food';

  // Standalone landing domains — served as dedicated pages, not tenant subdomains
  const STANDALONE_LANDING_DOMAINS: Record<string, string> = {
    "lebon.io.vn": "/lebon",
    "www.lebon.io.vn": "/lebon",
  };

  // Custom tenant domains (mapped in DB)
  const CUSTOM_TENANT_DOMAINS = new Set<string>([]);

  // Public routes accessible on any domain (no auth needed)
  const PUBLIC_ROUTES = new Set([
    "/login",
    "/login-email",
    "/register",
    "/forgot-password",
    "/restaurant",
    "/reset-password",
  ]);

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|otf)$/)
  ) {
    return NextResponse.next();
  }

  // Development mode - allow all routes for plain localhost (no subdomain)
  const isPlainDevelopment =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:');

  if (isPlainDevelopment) {
    return NextResponse.next();
  }

  // Landing domains (restx.food, www.restx.food)
  if (LANDING_DOMAINS.has(host)) {
    return NextResponse.next();
  }

  const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;

  // Standalone restaurant landing pages (e.g. lebon.io.vn → /lebon)
  const standalonePath = STANDALONE_LANDING_DOMAINS[hostWithoutPort] ?? STANDALONE_LANDING_DOMAINS[host];
  if (standalonePath) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(standalonePath, req.url));
    }
    return NextResponse.next();
  }

  const isAdminDomain = host === ADMIN_DOMAIN || hostWithoutPort === 'admin.localhost';

  // ── Auth token check (read cookie set by authService on login) ──
  const accessToken = req.cookies.get('accessToken')?.value;
  const hasAuthToken = !!accessToken;
  
  const adminAccessToken = req.cookies.get('adminAccessToken')?.value;
  const hasAdminAuthToken = !!adminAccessToken;

  // Super Admin domain (admin.restx.food or admin.localhost)
  if (isAdminDomain) {
    // Canonical login path: /login (rewrite to admin login page)
    if (pathname === '/login') {
      // If already logged in, go to home (which will redirect to /tenants)
      if (hasAdminAuthToken) {
        return NextResponse.redirect(new URL('/tenants', req.url));
      }
      return NextResponse.rewrite(new URL('/login-admin', req.url));
    }

    // Backward compatibility: redirect /login-admin to /login
    if (pathname === '/login-admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Require admin token for all other paths on the admin domain
    if (!hasAdminAuthToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Redirect root to /tenants
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/tenants', req.url));
    }
    
    return NextResponse.next();
  }

  // Allow public routes on any domain
  const isPublicRoute =
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith('/restaurant');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Tenant domains:
  // - Production: *.restx.food (excluding www, admin, root)
  // - Development: *.localhost (e.g., demo.localhost:3000, excluding admin.localhost)
  const isTenantDomain =
    CUSTOM_TENANT_DOMAINS.has(hostWithoutPort) ||
    (host.endsWith('.restx.food') &&
      !LANDING_DOMAINS.has(host) &&
      host !== ADMIN_DOMAIN) ||
    (host.includes('.localhost') &&
      hostWithoutPort !== 'admin.localhost');

  if (isTenantDomain) {
    // Block admin tenants routes on tenant domains
    if (pathname === '/tenants' || pathname.startsWith('/tenants/')) {
      const port = host.includes(':') ? host.split(':')[1] : '';
      const adminHost = hostWithoutPort.endsWith('localhost')
        ? `admin.localhost${port ? `:${port}` : ''}`
        : ADMIN_DOMAIN;
      const adminLoginUrl = new URL(req.nextUrl);
      adminLoginUrl.host = adminHost;
      adminLoginUrl.pathname = '/login';
      adminLoginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    // Root path → restaurant landing page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/restaurant', req.url));
    }

    // ── Protect /admin/* — require auth token in cookie ──
    if (pathname.startsWith('/admin')) {
      if (!hasAuthToken) {
        const loginUrl = new URL('/login-email', req.url);
        // Pass redirect so login page can send user back after login
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Has token → let AdminAuthGuard do the role check on client
      return NextResponse.next();
    }

    // Customer-facing routes:
    // - Table-scoped QR routes (/customer/{tableId}, /menu/{tableId}) are public.
    // - Non table-scoped customer/menu routes still require authentication.
    const customerTableRoutePattern = /^\/customer\/[0-9a-fA-F-]{36}$/;
    const menuTableRoutePattern = /^\/menu\/[0-9a-fA-F-]{36}$/;
    const isPublicTableRoute =
      customerTableRoutePattern.test(pathname) ||
      menuTableRoutePattern.test(pathname);

    // Customer-facing authenticated routes: require access token unless table route is public
    if (
      (pathname === '/customer' || pathname.startsWith('/customer/')) ||
      (pathname === '/menu' || pathname.startsWith('/menu/'))
    ) {
      if (!isPublicTableRoute && !hasAuthToken) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Staff routes
    if (pathname.startsWith('/staff')) {
      return NextResponse.next();
    }

    // All other paths
    return NextResponse.next();
  }

  // Unknown domain
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
