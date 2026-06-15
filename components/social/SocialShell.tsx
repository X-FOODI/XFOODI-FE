'use client';

import FloatingCreateButton from '@/components/social/FloatingCreateButton';
import SocialMobileNav from '@/components/social/SocialMobileNav';
import SocialNavbar from '@/components/social/SocialNavbar';
import type { ReactNode } from 'react';

interface SocialShellProps {
  children: ReactNode;
}

export default function SocialShell({ children }: SocialShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <SocialNavbar />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 md:pb-8">{children}</div>
      <SocialMobileNav />
      <FloatingCreateButton />
    </div>
  );
}
