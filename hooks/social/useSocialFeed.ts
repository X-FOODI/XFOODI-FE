'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import socialService from '@/lib/services/socialService';
import type { FeedFilter, SocialPost } from '@/lib/types/social';
import { useCallback, useEffect, useRef, useState } from 'react';

function dedupePostsById(posts: SocialPost[]): SocialPost[] {
  const seen = new Set<string>();
  return posts.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function useSocialFeed(activeFeed: FeedFilter) {
  const { user, isAuthReady } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLockRef = useRef(false);
  const loadFailedRef = useRef(false);
  const postsErrorToastRef = useRef(false);
  const userIdRef = useRef(user?.id);
  const activeFeedRef = useRef(activeFeed);
  userIdRef.current = user?.id;
  activeFeedRef.current = activeFeed;

  const loadPosts = useCallback(
    async (pageNum: number, feed: FeedFilter, append = false) => {
      if (fetchLockRef.current) return;
      fetchLockRef.current = true;

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        if (feed === 'saved' && !userIdRef.current) {
          setPosts([]);
          setHasMore(false);
          setPage(1);
          loadFailedRef.current = false;
          return;
        }
        const result = await socialService.getPosts({
          page: pageNum,
          limit: 10,
          feed,
          authorId: feed === 'my' ? userIdRef.current : undefined,
        });
        if (feed !== activeFeedRef.current) return;
        setPosts((prev) =>
          dedupePostsById(append ? [...prev, ...result.items] : result.items)
        );
        setHasMore(result.hasMore);
        setPage(pageNum);
        loadFailedRef.current = false;
      } catch (e) {
        if (feed !== activeFeedRef.current) return;
        if (!postsErrorToastRef.current) {
          postsErrorToastRef.current = true;
          showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không tải được bài viết');
        }
        if (!append) {
          setPosts([]);
          setHasMore(false);
          loadFailedRef.current = true;
        }
      } finally {
        fetchLockRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!isAuthReady) return;
    fetchLockRef.current = false;
    postsErrorToastRef.current = false;
    loadFailedRef.current = false;
    setPage(1);
    setHasMore(true);
    loadPosts(1, activeFeed, false);
  }, [activeFeed, isAuthReady, loadPosts]);

  return {
    posts,
    setPosts,
    page,
    hasMore,
    loading,
    loadingMore,
    loadFailedRef,
    fetchLockRef,
    loadPosts,
  };
}
