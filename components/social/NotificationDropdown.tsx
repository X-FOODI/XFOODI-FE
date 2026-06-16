'use client';

import { formatRelativeTime } from '@/app/social/utils/socialHelpers';
import { useSocialNotifications } from '@/hooks/social';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ThumbsUp, MessageSquare, UserPlus, AtSign, Share2, Bell } from 'lucide-react';

const TYPE_ICON: Record<string, React.ReactNode> = {
  like: <ThumbsUp className="h-4 w-4 text-blue-500 fill-blue-500" />,
  comment: <MessageSquare className="h-4 w-4 text-green-500" />,
  follow: <UserPlus className="h-4 w-4 text-purple-500" />,
  mention: <AtSign className="h-4 w-4 text-orange-500" />,
  share: <Share2 className="h-4 w-4 text-pink-500" />,
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, refresh, loading } =
    useSocialNotifications();

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] transition hover:bg-[var(--primary-soft)]"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5 text-[var(--text)]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[1100] mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h3 className="font-semibold text-[var(--text)]">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">Đang tải...</li>
            ) : notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                Chưa có thông báo
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface)] ${
                      !n.read ? 'bg-[var(--primary-soft)]/30' : ''
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                      {TYPE_ICON[n.type] ?? <Bell className="h-4 w-4 text-[var(--text-muted)]" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)]">
                        <span className="font-semibold">{n.actor.fullName ?? n.actor.username}</span>{' '}
                        {n.message}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-[var(--border)] p-2 text-center">
            <Link
              href="/social"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Về bảng tin
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
