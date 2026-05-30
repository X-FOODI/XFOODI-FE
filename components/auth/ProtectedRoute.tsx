import { useAuth } from '@/lib/contexts/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Role values must match what the backend returns in the JWT/user object
type AppRole = 'Customer' | 'Admin' | 'Owner' | 'Staff' | 'System Admin' | 'SuperAdmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  /** Allow multiple roles to access this route */
  allowedRoles?: AppRole[];
}

export default function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const query = searchParams?.toString();
        const fullPath = `${pathname}${query ? `?${query}` : ''}`;
        const redirect = encodeURIComponent(fullPath || '/');
        router.push(`/login?redirect=${redirect}`);
        return;
      }

      // Check role-based access
      const userRole = user.role || '';
      const userRoles = user.roles || (userRole ? [userRole] : []);

      if (requiredRole && !userRoles.includes(requiredRole)) {
        router.push('/login');
        return;
      }

      if (allowedRoles && allowedRoles.length > 0) {
        const hasAccess = allowedRoles.some(role => userRoles.includes(role));
        if (!hasAccess) {
          router.push('/login');
          return;
        }
      }
    }
  }, [user, loading, requiredRole, allowedRoles, router, pathname, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Verify role access
  const userRole = user.role || '';
  const userRoles = user.roles || (userRole ? [userRole] : []);

  if (requiredRole && !userRoles.includes(requiredRole)) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => userRoles.includes(role));
    if (!hasAccess) {
      return null;
    }
  }

  return <>{children}</>;
}
