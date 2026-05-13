import { useAuth } from '@/lib/contexts/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'shop';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
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
      } else if (requiredRole && user.role !== requiredRole) {
        if (requiredRole === 'admin' || requiredRole === 'shop') {
          router.push('/login');
        } else {
          const query = searchParams?.toString();
          const fullPath = `${pathname}${query ? `?${query}` : ''}`;
          const redirect = encodeURIComponent(fullPath || '/');
          router.push(`/login?redirect=${redirect}`);
        }
      }
    }
  }, [user, loading, requiredRole, router, pathname, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
