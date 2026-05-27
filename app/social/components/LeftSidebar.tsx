'use client';

import type { FeedFilter, SocialUser } from '@/lib/types/social';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getAvatarUrl, getDisplayName } from '../utils/socialHelpers';

const MENU: { key: FeedFilter; label: string; icon: string }[] = [
  { key: 'news', label: 'News Feed', icon: '🏠' },
  { key: 'my', label: 'My Posts', icon: '📝' },
  { key: 'trending', label: 'Trending', icon: '🔥' },
  { key: 'saved', label: 'Saved Posts', icon: '🔖' },
];

interface LeftSidebarProps {
  profile: SocialUser;
  activeFeed: FeedFilter;
  onFeedChange: (feed: FeedFilter) => void;
}

export default function LeftSidebar({ profile, activeFeed, onFeedChange }: LeftSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-28 hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 shadow-sm backdrop-blur-md lg:block"
    >
      <div className="mb-4 flex flex-col items-center text-center">
        <Link
          href={profile.id ? `/social/profile/${profile.id}` : '/social'}
          className="flex flex-col items-center transition hover:opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAvatarUrl(profile)}
            alt=""
            className="mb-2 h-16 w-16 rounded-full object-cover ring-2 ring-[var(--primary)]"
          />
          <p className="font-semibold text-[var(--text)]">{getDisplayName(profile)}</p>
          <p className="text-sm text-[var(--text-muted)]">@{profile.username}</p>
        </Link>
        <div className="mt-3 flex w-full justify-around text-center text-xs">
          <div>
            <p className="font-bold text-[var(--text)]">{profile.followersCount ?? 0}</p>
            <p className="text-[var(--text-muted)]">Followers</p>
          </div>
          <div>
            <p className="font-bold text-[var(--text)]">{profile.followingCount ?? 0}</p>
            <p className="text-[var(--text-muted)]">Following</p>
          </div>
          <div>
            <p className="font-bold text-[var(--text)]">{profile.postsCount ?? 0}</p>
            <p className="text-[var(--text-muted)]">Posts</p>
          </div>
        </div>
      </div>
      <nav className="space-y-1">
        {MENU.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onFeedChange(item.key)}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              activeFeed === item.key
                ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <Link
          href="/social/search"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
        >
          <span>🔍</span>
          Tìm kiếm
        </Link>
        {profile.id && (
          <Link
            href={`/social/profile/${profile.id}`}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
          >
            <span>👤</span>
            Trang cá nhân
          </Link>
        )}
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
        >
          <span>⚙️</span>
          Settings
        </button>
      </nav>
    </motion.aside>
  );
}
