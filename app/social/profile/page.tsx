'use client';

import SocialProfileView from '@/components/social/SocialProfileView';
import { useAuth } from '@/lib/contexts/AuthContext';
import PostSkeleton from '@/app/social/components/PostSkeleton';
import BackButton from '@/components/social/BackButton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MySocialProfilePage() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace('/login?redirect=/social/profile');
    }
  }, [isAuthReady, user, router]);

  if (!isAuthReady || !user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <BackButton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  return <SocialProfileView userId={user.id} showBack />;
}
