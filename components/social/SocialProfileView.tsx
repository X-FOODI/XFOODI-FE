'use client';

import PostCard from '@/app/social/components/PostCard';
import PostSkeleton from '@/app/social/components/PostSkeleton';
import { isOptimisticId } from '@/app/social/utils/socialHelpers';
import BackButton from '@/components/social/BackButton';
import EditProfileModal from '@/components/social/EditProfileModal';
import ProfileAboutTab from '@/components/social/ProfileAboutTab';
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
import { useCallback, useEffect, useState } from 'react';

interface SocialProfileViewProps {
  userId: string;
  showBack?: boolean;
}

function mergeCommentTree(comments: SocialComment[], c: SocialComment): SocialComment[] {
  if (!c.parentId) return [...comments, c];
  return comments.map((x) =>
    x.id === c.parentId ? { ...x, replies: [...(x.replies ?? []), c] } : x
  );
}

export default function SocialProfileView({ userId, showBack = true }: SocialProfileViewProps) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const p = await socialService.getUserProfile(userId, user?.id);
      const engagement = await socialService.getProfileEngagementStats(userId, p.isSelf ?? false);
      setProfile({
        ...p,
        likesReceivedCount: engagement.likesReceivedCount,
        savedPostsCount: engagement.savedPostsCount,
      });
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không tải hồ sơ');
    }
  }, [userId, user?.id, showToast]);

  const loadPosts = useCallback(async () => {
    if (tab === 'about') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (tab === 'saved') {
        if (!profile?.isSelf) {
          setPosts([]);
          return;
        }
        const saved = await socialService.getPosts({
          feed: 'saved',
          page: 1,
          limit: 30,
        });
        setPosts(saved.items);
      } else {
        const feed = await socialService.getPosts({
          feed: 'my',
          authorId: userId,
          page: 1,
          limit: 30,
        });
        setPosts(feed.items);
      }
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không tải bài viết');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, tab, profile?.isSelf, showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) loadPosts();
  }, [profile, tab, loadPosts]);

  const updatePost = (postId: string, updater: (p: SocialPost) => SocialPost) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
  };

  const handleComment = async (postId: string, content: string, parentId?: string) => {
    try {
      const created = await socialService.commentPost(postId, content, parentId);
      updatePost(postId, (p) => ({
        ...p,
        commentsCount: p.commentsCount + 1,
        comments: mergeCommentTree(p.comments ?? [], created),
      }));
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không bình luận');
    }
  };

  const handleProfileSaved = (updated: SocialProfile) => {
    setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
    if (user && updated.isSelf) {
      updateUser({
        ...user,
        fullName: updated.fullName ?? user.fullName,
        name: updated.fullName ?? user.name,
        avatar: updated.avatarUrl ?? user.avatar,
      });
    }
    showToast('success', 'Đã lưu', 'Hồ sơ đã được cập nhật');
  };

  const tabs: { key: ProfileTab; label: string; selfOnly?: boolean }[] = [
    { key: 'posts', label: 'Bài viết' },
    { key: 'saved', label: 'Đã lưu', selfOnly: true },
    { key: 'about', label: 'Giới thiệu' },
  ];

  const visibleTabs = tabs.filter((t) => !t.selfOnly || profile?.isSelf);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        {showBack && (
          <div className="mb-5">
            <BackButton />
          </div>
        )}
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {showBack && (
        <div className="mb-5">
          <BackButton />
        </div>
      )}

      <div className="mb-6">
        <ProfileHeader
          profile={profile}
          onEdit={profile.isSelf ? () => setEditOpen(true) : undefined}
        />
      </div>

      <div className="mb-6 flex gap-2 border-b border-[var(--border)]">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
      {tab === 'about' ? (
        <ProfileAboutTab profile={profile} />
      ) : loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <p className="py-8 text-center text-[var(--text-muted)]">Chưa có nội dung.</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            disabled={!user}
            currentUserId={user?.id}
            onReact={async (id, reaction: ReactionType) => {
              if (isOptimisticId(id)) return;
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
              if (!r || isOptimisticId(id)) return;
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
              setProfile((prev) =>
                prev
                  ? { ...prev, postsCount: Math.max(0, (prev.postsCount ?? 1) - 1) }
                  : prev
              );
            }}
          />
        ))
      )}
      </div>

      {profile.isSelf && (
        <EditProfileModal
          profile={profile}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
