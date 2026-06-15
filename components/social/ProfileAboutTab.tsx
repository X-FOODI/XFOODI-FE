'use client';

import { getDisplayName } from '@/app/social/utils/socialHelpers';
import type { SocialProfile } from '@/lib/types/social';

interface ProfileAboutTabProps {
  profile: SocialProfile;
}

function AboutRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="border-b border-[var(--border)] py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--text)]">{value}</dd>
    </div>
  );
}

export default function ProfileAboutTab({ profile }: ProfileAboutTabProps) {
  const joinDate = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined;

  const hasAnyField =
    profile.fullName ||
    profile.username ||
    profile.email ||
    joinDate ||
    profile.bio;

  if (!hasAnyField) {
    return (
      <p className="py-8 text-center text-[var(--text-muted)]">
        Chưa có thông tin giới thiệu.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-2 shadow-sm">
      <dl>
        <AboutRow label="Tên" value={getDisplayName(profile)} />
        <AboutRow label="Username" value={profile.username ? `@${profile.username}` : undefined} />
        {profile.isSelf && <AboutRow label="Email" value={profile.email} />}
        <AboutRow label="Ngày tham gia" value={joinDate} />
        {profile.bio && (
          <div className="border-b border-[var(--border)] py-3 last:border-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Giới thiệu
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-[var(--text)]">{profile.bio}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
