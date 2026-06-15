'use client';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/app/components/ThemeToggle';
import NotificationDropdown from '@/components/social/NotificationDropdown';
import SocialSearchBar from '@/components/social/SocialSearchBar';
import authService from '@/lib/services/authService';
import { LogoutOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const NAV_LINKS = [
  { href: '/social', label: 'Bảng tin', match: (p: string) => p === '/social' },
  { href: '/social/search', label: 'Tìm kiếm', match: (p: string) => p.startsWith('/social/search') },
];

export default function SocialNavbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const user = authService.getCurrentUser();
      setIsAuthenticated(!!token);
      setDisplayName(user?.fullName || user?.name || '');
      setUserId(user?.id ?? '');
    };
    sync();
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logoutServer();
    } catch {
      /* ignore */
    }
    authService.logout();
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <header className="fixed left-0 right-0 top-0 z-[1000] border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo/xfoodi-logo.png" alt="XFoodi" className="h-9 w-9 object-contain" />
          <span className="hidden font-bold text-[var(--text)] sm:inline">XFoodi</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item) => {
            const active = item.match(pathname ?? '');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/social"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              pathname?.startsWith('/social')
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Mạng xã hội
          </Link>
        </nav>

        <div className="hidden flex-1 justify-center lg:flex">
          <SocialSearchBar className="w-full max-w-md" />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="lg:hidden">
            <SocialSearchBar compact />
          </div>
          <NotificationDropdown />
          <LanguageSwitcher />
          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-1.5 pr-3 text-sm font-medium text-[var(--text)] transition hover:border-[var(--primary)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                <UserOutlined />
              </span>
              <span className="hidden max-w-[100px] truncate sm:inline">
                {displayName || 'Tài khoản'}
              </span>
            </button>
            {profileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Đóng menu"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--surface)]"
                        onClick={() => setProfileOpen(false)}
                      >
                        <ProfileOutlined /> {t('homepage.header.view_profile', 'Hồ sơ')}
                      </Link>
                      {userId && (
                        <Link
                          href={`/social/profile/${userId}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--surface)]"
                          onClick={() => setProfileOpen(false)}
                        >
                          <UserOutlined /> Trang MXH
                        </Link>
                      )}
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--surface)]"
                        onClick={() => setProfileOpen(false)}
                      >
                        <UserOutlined /> {t('homepage.header.dashboard', 'Dashboard')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-[var(--surface)]"
                      >
                        <LogoutOutlined /> {t('homepage.header.logout', 'Đăng xuất')}
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="block px-4 py-2.5 text-sm font-medium text-[var(--primary)]"
                      onClick={() => setProfileOpen(false)}
                    >
                      {t('login_button.login_text', 'Đăng nhập')}
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
