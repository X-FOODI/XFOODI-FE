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

  if (redirectPath) {
    router.push(redirectPath);
    return;
  }
  if (hasRole("System Admin") || hasRole("Admin")) {
    router.push("/admin");
    return;
  }
  if (hasRole("Staff")) {
    router.push("/staff");
    return;
  }
  router.push("/");
}
