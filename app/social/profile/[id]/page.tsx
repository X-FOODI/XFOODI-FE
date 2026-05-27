'use client';

import PostCard from '@/app/social/components/PostCard';
import PostSkeleton from '@/app/social/components/PostSkeleton';
import ProfileHeader from '@/components/social/ProfileHeader';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import socialService from '@/lib/services/socialService';
import type {
  ProfileTab,
  ReactionType,
  SocialComment,
  SocialPost,
  SocialProfile,
} from '@/lib/types/social';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function SocialProfilePage() {
  const params = useParams();
  const profileId = String(params.id ?? '');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await socialService.getUserProfile(profileId, user?.id);
      setProfile(p);
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không tải hồ sơ');
    }
  }, [profileId, user?.id, showToast]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'saved') {
        const saved = await socialService.getPosts({
          feed: 'saved',
          page: 1,
          limit: 20,
        });
        setPosts(saved.items.filter((p) => p.author.id === profileId));
      } else if (tab === 'media') {
        const all = await socialService.getPosts({
          feed: 'my',
          authorId: profileId,
          page: 1,
          limit: 30,
        });
        setPosts(all.items.filter((p) => p.images.length > 0));
      } else {
        const feed = await socialService.getPosts({
          feed: 'news',
          authorId: profileId,
          page: 1,
          limit: 20,
        });
        setPosts(feed.items);
      }
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không tải bài viết');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, tab, showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) loadPosts();
  }, [profile, tab, loadPosts]);

  const updatePost = (postId: string, updater: (p: SocialPost) => SocialPost) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
  };

  const mergeComment = (comments: SocialComment[], c: SocialComment): SocialComment[] => {
    if (!c.parentId) return [...comments, c];
    return comments.map((x) =>
      x.id === c.parentId ? { ...x, replies: [...(x.replies ?? []), c] } : x
    );
  };

  const handleComment = async (postId: string, content: string, parentId?: string) => {
    try {
      const created = await socialService.commentPost(postId, content, parentId);
      updatePost(postId, (p) => ({
        ...p,
        commentsCount: p.commentsCount + 1,
        comments: mergeComment(p.comments ?? [], created),
      }));
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không bình luận');
    }
  };

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'posts', label: 'Bài viết' },
    { key: 'media', label: 'Ảnh / Video' },
    { key: 'saved', label: 'Đã lưu' },
  ];

  if (!profile) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ProfileHeader profile={profile} />

      <div className="flex gap-2 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <p className="py-8 text-center text-[var(--text-muted)]">Chưa có nội dung.</p>
      ) : tab === 'media' ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {posts.flatMap((p) =>
            p.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${p.id}-${i}`}
                src={src}
                alt=""
                className="aspect-square rounded-lg object-cover transition hover:opacity-90"
              />
            ))
          )}
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            disabled={!user}
            currentUserId={user?.id}
            onReact={async (id, reaction) => {
              try {
                const updated = await socialService.reactPost(id, reaction);
                updatePost(id, () => updated);
              } catch {
                /* ignore */
              }
            }}
            onClearReaction={async (id) => {
              const p = posts.find((x) => x.id === id);
              const r = p?.reactions.userReaction;
              if (!r) return;
              try {
                const updated = await socialService.clearReaction(id, r);
                updatePost(id, () => updated);
              } catch {
                /* ignore */
              }
            }}
            onComment={handleComment}
            onEditComment={async (cid, content) => {
              await socialService.editComment(cid, content);
            }}
            onDeleteComment={async (cid) => {
              await socialService.deleteComment(cid);
            }}
            onSave={async (id, saved) => {
              await socialService.savePost(id, saved);
            }}
            onShare={async (id) => {
              await socialService.sharePost(id);
            }}
            onEdit={async (id, content) => {
              const updated = await socialService.editPost(id, { content });
              updatePost(id, () => updated);
            }}
            onDelete={async (id) => {
              await socialService.deletePost(id);
              setPosts((prev) => prev.filter((p) => p.id !== id));
            }}
          />
        ))
      )}
    </div>
  );
}
