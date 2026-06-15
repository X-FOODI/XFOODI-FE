'use client';

import PostCard from '@/app/social/components/PostCard';
import PostSkeleton from '@/app/social/components/PostSkeleton';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import socialService from '@/lib/services/socialService';
import searchService from '@/lib/services/social/searchService';
import type { ReactionType, SocialPost, TrendingHashtag } from '@/lib/types/social';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function HashtagPage() {
  const params = useParams();
  const tag = decodeURIComponent(String(params.tag ?? ''));
  const { user } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [trending, setTrending] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const fetchLockRef = useRef(false);

  const load = useCallback(
    async (pageNum: number, append = false) => {
      if (fetchLockRef.current) return;
      fetchLockRef.current = true;
      if (pageNum === 1) setLoading(true);
      try {
        const result = await socialService.getPostsByHashtag(tag, { page: pageNum, limit: 10 });
        setPosts((prev) => (append ? [...prev, ...result.items] : result.items));
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (e) {
        showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không tải hashtag');
        if (!append) setPosts([]);
        setHasMore(false);
      } finally {
        fetchLockRef.current = false;
        setLoading(false);
      }
    },
    [tag, showToast]
  );

  useEffect(() => {
    load(1, false);
    searchService.getTrendingHashtags().then(setTrending);
  }, [load]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore && !fetchLockRef.current) {
        load(page + 1, true);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, load]);

  const noop = () => undefined;
  const noopAsync = async () => undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--primary-soft)] to-[var(--card)] p-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">#{tag.replace(/^#/, '')}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Bài viết theo hashtag</p>
        </div>

        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <p className="text-center text-[var(--text-muted)]">Chưa có bài viết cho hashtag này.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              disabled={!user}
              currentUserId={user?.id}
              onReact={noop as (id: string, r: ReactionType) => void}
              onClearReaction={noop}
              onComment={noopAsync}
              onEditComment={noopAsync}
              onDeleteComment={noopAsync}
              onSave={noop}
              onShare={noop}
              onEdit={noop}
              onDelete={noop}
            />
          ))
        )}
        <div ref={loadMoreRef} className="h-4" />
      </div>

      <aside className="hidden lg:col-span-4 lg:block">
        <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-3 font-semibold text-[var(--text)]">Hashtag thịnh hành</h2>
          <ul className="space-y-2">
            {trending.map((h) => (
              <li key={h.tag}>
                <Link
                  href={`/social/hashtag/${h.tag}`}
                  className="flex justify-between text-sm hover:text-[var(--primary)]"
                >
                  <span>#{h.tag}</span>
                  <span className="text-[var(--text-muted)]">{h.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
