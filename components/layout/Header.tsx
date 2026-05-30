'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

function UserAvatar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) {
    return (
      <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">
        Login
      </Link>
    );
  }

  const displayName = user.fullName || user.name || user.email;
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-200 hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 flex items-center justify-center bg-blue-50 flex-shrink-0"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-blue-600 select-none">{initials}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            My Profile
          </Link>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              XFoodi
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/menu" className="text-gray-700 hover:text-blue-600 transition-colors">
              Menu
            </Link>
            <Link href="/reservations" className="text-gray-700 hover:text-blue-600 transition-colors">
              Reservations
            </Link>
            <Link href="/orders" className="text-gray-700 hover:text-blue-600 transition-colors">
              Orders
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <UserAvatar />
          </div>
        </div>
      </div>
    </header>
  );
}
