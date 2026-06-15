import type { User } from "@/lib/services/authService";

type AppRouter = { push: (href: string) => void };

/** Same role-based redirect used after email or Google auth. */
export function redirectAfterLogin(
  router: AppRouter,
  user: User,
  redirectPath: string | null
): void {
  const userRoles: string[] = user.roles || (user.role ? [user.role] : []);
  const hasRole = (role: string) =>
    userRoles.some((r) => r.toLowerCase() === role.toLowerCase());

  // ── Admin users ────────────────────────────────────────────────────────────
  // Always redirect admins to the admin dashboard, NEVER follow a redirect path
  // that could be a tenant path (which would show "Access Denied").
  if (hasRole("System Admin") || hasRole("Admin") || hasRole("SuperAdmin")) {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      const protocol = window.location.protocol;
      const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
      const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
      const targetAdminSubdomain = isLocalhost ? "admin.localhost" : `admin.${BASE_DOMAIN}`;

      const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;
      if (hostWithoutPort !== targetAdminSubdomain) {
        const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
        window.location.href = `${protocol}//${targetAdminSubdomain}${port}/admin/dashboard`;
        return;
      }
    }
    router.push("/admin/dashboard");
    return;
  }

  // ── Owner / Staff users ────────────────────────────────────────────────────
  // Always redirect to their restaurant's subdomain, NEVER follow a redirect
  // param that could be an admin path (which would show "Access Denied").
  if (hasRole("Owner") || hasRole("Staff")) {
    if (typeof window !== "undefined" && user.restaurantSlug) {
      const host = window.location.host;
      const protocol = window.location.protocol;
      const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
      const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
      const targetTenantSubdomain = isLocalhost
        ? `${user.restaurantSlug}.localhost`
        : `${user.restaurantSlug}.${BASE_DOMAIN}`;

      const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;
      if (hostWithoutPort !== targetTenantSubdomain) {
        const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
        const targetPath = hasRole("Owner") ? "/restaurant/dashboard" : "/staff";
        window.location.href = `${protocol}//${targetTenantSubdomain}${port}${targetPath}`;
        return;
      }
    }
    router.push(hasRole("Owner") ? "/restaurant/dashboard" : "/staff");
    return;
  }

  // ── Customer / default ─────────────────────────────────────────────────────
  // For customers, the redirect param from URL is respected (e.g., back to menu page)
  if (redirectPath && !redirectPath.startsWith("/admin")) {
    router.push(redirectPath);
    return;
  }

  router.push("/");
}
