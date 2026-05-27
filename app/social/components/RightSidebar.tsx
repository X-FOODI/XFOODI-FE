'use client';

import type { SocialSidebarData } from '@/lib/types/social';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatRelativeTime, getAvatarUrl, getDisplayName } from '../utils/socialHelpers';

interface RightSidebarProps {
  data: SocialSidebarData;
}

export default function RightSidebar({ data }: RightSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-28 hidden space-y-4 xl:block"
    >
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 backdrop-blur-md">
        <h3 className="mb-3 font-semibold text-[var(--text)]">🔥 Trending hashtags</h3>
        <ul className="space-y-2">
          {data.trendingHashtags.map((h) => (
            <li key={h.tag} className="flex justify-between text-sm">
              <Link
                href={`/social/hashtag/${h.tag}`}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                #{h.tag}
              </Link>
              <span className="text-[var(--text-muted)]">{h.count} posts</span>
            </li>
          ))}
        </ul>
      </section>

      {data.topCreators.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 backdrop-blur-md">
          <h3 className="mb-3 font-semibold text-[var(--text)]">⭐ Top creators</h3>
          <ul className="space-y-3">
            {data.topCreators.map((u) => (
              <li key={u.id}>
                <Link href={`/social/profile/${u.id}`} className="flex items-center gap-2 hover:opacity-90">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getAvatarUrl(u)} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{getDisplayName(u)}</p>
                    <p className="text-xs text-[var(--text-muted)]">@{u.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.suggestedUsers.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 backdrop-blur-md">
          <h3 className="mb-3 font-semibold text-[var(--text)]">👥 Gợi ý kết bạn</h3>
          <ul className="space-y-3">
            {data.suggestedUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2">
                <Link href={`/social/profile/${u.id}`} className="flex items-center gap-2 hover:opacity-90">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getAvatarUrl(u)} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{getDisplayName(u)}</p>
                    <p className="text-xs text-[var(--text-muted)]">@{u.username}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]"
                >
                  Follow
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.recentActivity.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 backdrop-blur-md">
          <h3 className="mb-3 font-semibold text-[var(--text)]">🕐 Hoạt động gần đây</h3>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            {data.recentActivity.map((a) => (
              <li key={a.id}>
                <p>{a.text}</p>
                <span className="text-xs">{formatRelativeTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </motion.aside>
  );
}
