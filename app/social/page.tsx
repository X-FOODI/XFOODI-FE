'use client';

import Header from '@/app/components/Header';
import CreatePost from '@/app/social/components/CreatePost';
import EmptyFeed from '@/app/social/components/EmptyFeed';
import LeftSidebar from '@/app/social/components/LeftSidebar';
import PostCard from '@/app/social/components/PostCard';
import PostSkeleton from '@/app/social/components/PostSkeleton';
import RightSidebar from '@/app/social/components/RightSidebar';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import socialService from '@/lib/services/socialService';
import type {
  FeedFilter,
  ReactionType,
  SocialComment,
  SocialPost,
  SocialSidebarData,
  SocialUser,
} from '@/lib/types/social';
import { useCallback, useEffect, useRef, useState } from 'react';

function mergeCommentTree(comments: SocialComment[], newComment: SocialComment): SocialComment[] {
  if (!newComment.parentId) return [...comments, newComment];
  return comments.map((c) => {
    if (c.id === newComment.parentId) {
      return { ...c, replies: [...(c.replies ?? []), newComment] };
    }
    if (c.replies?.length) {
      return { ...c, replies: mergeCommentTree(c.replies, newComment) };
    }
    return c;
  });
}

function updateCommentInTree(
  comments: SocialComment[],
  id: string,
  content: string
): SocialComment[] {
  return comments.map((c) => {
    if (c.id === id) return { ...c, content };
    if (c.replies?.length) return { ...c, replies: updateCommentInTree(c.replies, id, content) };
    return c;
  });
}

function removeCommentFromTree(comments: SocialComment[], id: string): SocialComment[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) =>
      c.replies?.length ? { ...c, replies: removeCommentFromTree(c.replies, id) } : c
    );
}

export default function SocialPage() {
  const { user, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const isLoggedIn = !!user;

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [profile, setProfile] = useState<SocialUser | null>(null);
  const [sidebar, setSidebar] = useState<SocialSidebarData | null>(null);
  const [activeFeed, setActiveFeed] = useState<FeedFilter>('news');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const profileFromAuth: SocialUser = profile ?? {
    id: user?.id ?? '',
    username: user?.email?.split('@')[0] ?? 'guest',
    fullName: user?.fullName || user?.name,
    avatarUrl: user?.avatar,
    followersCount: 0,
    followingCount: 0,
    postsCount: posts.length,
  };

  const loadPosts = useCallback(
    async (pageNum: number, feed: FeedFilter, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        if (feed === 'saved' && !user?.id) {
          setPosts([]);
          setHasMore(false);
          setPage(1);
          return;
        }
        const result = await socialService.getPosts({
          page: pageNum,
          limit: 10,
          feed,
          authorId: feed === 'my' ? user?.id : undefined,
        });
        setPosts((prev) => (append ? [...prev, ...result.items] : result.items));
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (e) {
        showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không tải được bài viết');
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [showToast, user?.id]
  );

  useEffect(() => {
    if (!isAuthReady) return;
    loadPosts(1, activeFeed, false);
  }, [activeFeed, isAuthReady, loadPosts]);

  useEffect(() => {
    socialService.getSidebar().then(setSidebar);
    if (isLoggedIn) {
      socialService.getProfile().then(setProfile).catch(() => undefined);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadPosts(page + 1, activeFeed, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, activeFeed, loadPosts]);

  const updatePost = (postId: string, updater: (p: SocialPost) => SocialPost) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
  };

  const handleCreatePost = async (data: {
    content: string;
    images: File[];
    hashtags: string[];
    mentions: string[];
  }) => {
    const optimistic: SocialPost = {
      id: `temp-${Date.now()}`,
      author: profileFromAuth,
      content: data.content,
      images: data.images.map((f) => URL.createObjectURL(f)),
      hashtags: data.hashtags,
      mentions: data.mentions,
      reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, userReaction: null },
      commentsCount: 0,
      shareCount: 0,
      isOwner: true,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [optimistic, ...prev]);
    try {
      const created = await socialService.createPost(data);
      setPosts((prev) => prev.map((p) => (p.id === optimistic.id ? created : p)));
      showToast('success', 'Đã đăng bài', 'Bài viết của bạn đã được chia sẻ');
    } catch (e) {
      setPosts((prev) => prev.filter((p) => p.id !== optimistic.id));
      showToast('error', 'Lỗi đăng bài', e instanceof Error ? e.message : 'Thử lại sau');
      throw e;
    }
  };

  const handleReact = async (postId: string, reaction: ReactionType) => {
    const prev = posts.find((p) => p.id === postId);
    if (!prev) return;
    const old = prev.reactions.userReaction;
    if (old === reaction) {
      await handleClearReaction(postId);
      return;
    }
    updatePost(postId, (p) => {
      const next = { ...p.reactions };
      if (old) next[old] = Math.max(0, next[old] - 1);
      next[reaction] = (next[reaction] ?? 0) + 1;
      next.userReaction = reaction;
      return { ...p, reactions: next };
    });
    try {
      const updated = await socialService.reactPost(postId, reaction);
      updatePost(postId, () => updated);
    } catch (e) {
      updatePost(postId, () => prev);
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể phản ứng');
    }
  };

  const handleClearReaction = async (postId: string) => {
    const prev = posts.find((p) => p.id === postId);
    const current = prev?.reactions.userReaction;
    if (!prev || !current) return;
    updatePost(postId, (p) => {
      const next = { ...p.reactions };
      next[current] = Math.max(0, (next[current] ?? 0) - 1);
      next.userReaction = null;
      return { ...p, reactions: next };
    });
    try {
      const updated = await socialService.clearReaction(postId, current);
      updatePost(postId, () => updated);
    } catch (e) {
      updatePost(postId, () => prev);
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể bỏ phản ứng');
    }
  };

  const handleComment = async (postId: string, content: string, parentId?: string) => {
    const tempComment: SocialComment = {
      id: `temp-c-${Date.now()}`,
      postId,
      userId: user?.id ?? '',
      author: profileFromAuth,
      content,
      parentId,
      createdAt: new Date().toISOString(),
    };
    updatePost(postId, (p) => ({
      ...p,
      commentsCount: p.commentsCount + 1,
      comments: mergeCommentTree(p.comments ?? [], tempComment),
    }));
    try {
      const created = await socialService.commentPost(postId, content, parentId);
      updatePost(postId, (p) => ({
        ...p,
        comments: mergeCommentTree(
          removeCommentFromTree(p.comments ?? [], tempComment.id),
          created
        ),
      }));
    } catch (e) {
      updatePost(postId, (p) => ({
        ...p,
        commentsCount: Math.max(0, p.commentsCount - 1),
        comments: removeCommentFromTree(p.comments ?? [], tempComment.id),
      }));
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể bình luận');
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await socialService.editComment(commentId, content);
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          comments: p.comments ? updateCommentInTree(p.comments, commentId, content) : [],
        }))
      );
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể sửa');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await socialService.deleteComment(commentId);
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          commentsCount: Math.max(0, p.commentsCount - 1),
          comments: p.comments ? removeCommentFromTree(p.comments, commentId) : [],
        }))
      );
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
    }
  };

  const handleSave = async (postId: string, saved: boolean) => {
    updatePost(postId, (p) => ({ ...p, isSaved: saved }));
    try {
      await socialService.savePost(postId, saved);
      showToast('success', saved ? 'Đã lưu' : 'Đã bỏ lưu');
    } catch (e) {
      updatePost(postId, (p) => ({ ...p, isSaved: !saved }));
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể lưu');
    }
  };

  const handleShare = async (postId: string) => {
    updatePost(postId, (p) => ({ ...p, shareCount: p.shareCount + 1 }));
    try {
      const res = await socialService.sharePost(postId);
      updatePost(postId, (p) => ({ ...p, shareCount: res.shareCount }));
    } catch {
      /* share count optimistic is fine */
    }
  };

  const handleEditPost = async (postId: string, content: string) => {
    updatePost(postId, (p) => ({ ...p, content }));
    try {
      const updated = await socialService.editPost(postId, { content });
      updatePost(postId, () => updated);
      showToast('success', 'Đã cập nhật bài viết');
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể sửa');
      loadPosts(1, activeFeed);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await socialService.deletePost(postId);
      showToast('success', 'Đã xóa bài viết');
    } catch (e) {
      loadPosts(1, activeFeed);
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể xóa');
    }
  };

  const defaultSidebar: SocialSidebarData = {
    trendingHashtags: [
      { tag: 'xfoodi', count: 128 },
      { tag: 'foodie', count: 86 },
      { tag: 'monngon', count: 64 },
    ],
    topCreators: [],
    suggestedUsers: [],
    recentActivity: [],
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6">
        <div className="mb-4 lg:hidden">
          <select
            value={activeFeed}
            onChange={(e) => setActiveFeed(e.target.value as FeedFilter)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
          >
            <option value="news">News Feed</option>
            <option value="my">My Posts</option>
            <option value="trending">Trending</option>
            <option value="saved">Saved Posts</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <LeftSidebar
              profile={profileFromAuth}
              activeFeed={activeFeed}
              onFeedChange={setActiveFeed}
            />
          </div>

          <div className="space-y-4 lg:col-span-6">
            <CreatePost
              user={user}
              disabled={!isLoggedIn}
              onSubmit={handleCreatePost}
            />

            {loading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length === 0 ? (
              <EmptyFeed showLoginCta={!isLoggedIn} />
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  disabled={!isLoggedIn}
                  currentUserId={user?.id}
                  onReact={handleReact}
                  onClearReaction={handleClearReaction}
                  onComment={handleComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  onSave={handleSave}
                  onShare={handleShare}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />
              ))
            )}

            {loadingMore && <PostSkeleton />}
            <div ref={loadMoreRef} className="h-4" />
          </div>

          <div className="lg:col-span-3">
            <RightSidebar data={sidebar ?? defaultSidebar} />
          </div>
        </div>
      </main>
    </div>
  );
}
