import SocialShell from '@/components/social/SocialShell';
import { NotificationProvider, SocialProvider } from '@/store/social';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Mạng xã hội | XFoodi',
  description: 'Kết nối, chia sẻ và khám phá cộng đồng ẩm thực XFoodi.',
};

export default function SocialLayout({ children }: { children: ReactNode }) {
  return (
    <SocialProvider>
      <NotificationProvider>
        <SocialShell>{children}</SocialShell>
      </NotificationProvider>
    </SocialProvider>
  );
}
