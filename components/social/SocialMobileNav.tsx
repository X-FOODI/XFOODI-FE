'use client';

import { useSocialStoreOptional } from '@/store/social';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/social', label: 'Feed', icon: '🏠' },
  { href: '/social/search', label: 'Tìm', icon: '🔍' },
  { href: '/social', label: 'Đăng', icon: '➕', action: 'create' as const },
  { href: '/social', label: 'Thông báo', icon: '🔔' },
  { href: '/social/profile', label: 'Tôi', icon: '👤' },
];

export default function SocialMobileNav() {
  const pathname = usePathname();
  const store = useSocialStoreOptional();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-[var(--border)] bg-[var(--card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {ITEMS.map((item) => {
          const isActive =
            item.href === '/social'
              ? pathname === '/social' && item.label === 'Feed'
              : pathname?.startsWith(item.href) && item.href !== '/social';

          if (item.action === 'create') {
            return (
              <li key="create">
                <button
                  type="button"
                  onClick={() => store?.setCreatePostOpen(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-xl text-white shadow-lg"
                  aria-label="Tạo bài viết"
                >
                  {item.icon}
                </button>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
                  isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
