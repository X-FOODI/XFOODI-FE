'use client';

import SocialProfileView from '@/components/social/SocialProfileView';
import { useParams } from 'next/navigation';

export default function SocialUserProfilePage() {
  const params = useParams();
  const profileId = String(params.id ?? '');

  if (!profileId) return null;

  return <SocialProfileView userId={profileId} showBack />;
}
