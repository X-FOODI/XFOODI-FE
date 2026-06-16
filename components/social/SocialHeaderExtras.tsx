'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

/**
 * Optional extras for the global Header on non-social routes.
 * Social routes use SocialNavbar via app/social/layout.tsx instead.
 */
export default function SocialHeaderExtras() {
  const pathname = usePathname();
  if (pathname?.startsWith('/social')) return null;

  return (
    <Link
      href="/social/search"
      className="hidden items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] sm:flex"
    >
      <Search className="h-4 w-4" /> <span className="hidden md:inline">Tìm MXH</span>
    </Link>
  );
}
