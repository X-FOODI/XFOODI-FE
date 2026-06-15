'use client';

import type { ReactionType, SocialComment, SocialPost } from '@/lib/types/social';
import { motion } from 'framer-motion';
import socialService from '@/lib/services/socialService';
import { useEffect, useState } from 'react';
import {
  formatRelativeTime,
  getAvatarUrl,
  getDisplayName,
  isOptimisticId,
  REACTION_EMOJI,
} from '../utils/socialHelpers';
import CommentSection from './CommentSection';
import ImageGallery from './ImageGallery';
import ReactionPicker from './ReactionPicker';
import ShareModal from './ShareModal';

interface PostCardProps {
  post: SocialPost;
  disabled?: boolean;
  currentUserId?: string;
  onReact: (postId: string, reaction: ReactionType) => void;
  onClearReaction: (postId: string) => void;
  onComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onSave: (postId: string, saved: boolean) => void;
  onShare: (postId: string) => void;
  onEdit: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
}

function reactionTotal(reactions: SocialPost['reactions']): number {
  return (
    reactions.like +
    reactions.love +
    reactions.haha +
    reactions.wow +
    reactions.sad
  );
}

export default function PostCard({
  post,
  disabled,
  currentUserId,
  onReact,
  onClearReaction,
  onComment,
  onEditComment,
  onDeleteComment,
  onSave,
  onShare,
  onEdit,
  onDelete,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>(post.comments ?? []);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setComments(post.comments ?? []);
  }, [post.comments, post.id]);

  useEffect(() => {
    if (!showComments || comments.length > 0 || loadingComments) return;
    if (isOptimisticId(post.id)) return;
    let cancelled = false;
    setLoadingComments(true);
    socialService
      .getComments(post.id)
      .then((list) => {
        if (!cancelled) setComments(list);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showComments, post.id, comments.length, loadingComments]);
  const totalReactions = reactionTotal(post.reactions);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/social?post=${post.id}`
      : `/social?post=${post.id}`;

  const isOwner = post.isOwner || (currentUserId && post.author.id === currentUserId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-sm backdrop-blur-md"
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAvatarUrl(post.author)}
            alt=""
            className="h-11 w-11 rounded-full object-cover ring-2 ring-[var(--primary-soft)]"
          />
          <div>
            <p className="font-semibold text-[var(--text)]">{getDisplayName(post.author)}</p>
            <p className="text-xs text-[var(--text-muted)]">
              @{post.author.username} · {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--surface)]"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 min-w-[120px] rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface)]"
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  Sửa bài
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--surface)]"
                  onClick={() => {
                    onDelete(post.id);
                    setMenuOpen(false);
                  }}
                >
                  Xóa bài
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {editing ? (
        <div className="mb-3 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
            rows={4}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm text-[var(--on-primary)]"
              onClick={() => {
                onEdit(post.id, editContent);
                setEditing(false);
              }}
            >
              Lưu
            </button>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)]"
              onClick={() => {
                setEditContent(post.content);
                setEditing(false);
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[var(--text)]">{post.content}</p>
      )}

      {post.hashtags && post.hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-sm font-medium text-[var(--primary)]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <ImageGallery images={post.images} altPrefix={`post-${post.id}`} />

      {totalReactions > 0 && (
        <div className="mt-2 flex items-center gap-1 text-sm text-[var(--text-muted)]">
          {Object.entries(REACTION_EMOJI).map(([key, emoji]) =>
            post.reactions[key as ReactionType] > 0 ? (
              <span key={key}>{emoji}</span>
            ) : null
          )}
          <span className="ml-1">{totalReactions}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
        <ReactionPicker
          currentReaction={post.reactions.userReaction}
          disabled={disabled}
          onReact={(r) => onReact(post.id, r)}
          onClear={() => onClearReaction(post.id)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowComments((s) => !s)}
          className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-50"
        >
          💬 {post.commentsCount || comments.length}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSave(post.id, !post.isSaved)}
          className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 ${
            post.isSaved ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
          }`}
        >
          {post.isSaved ? '🔖 Đã lưu' : '🔖 Lưu'}
        </button>
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)]"
          onClick={() => {
            setShareOpen(true);
            onShare(post.id);
          }}
        >
          ↗ {post.shareCount}
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          comments={comments}
          loading={loadingComments}
          disabled={disabled}
          currentUserId={currentUserId}
          onAddComment={(content, parentId) => onComment(post.id, content, parentId)}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
        />
      )}

      <ShareModal
        open={shareOpen}
        postUrl={shareUrl}
        onClose={() => setShareOpen(false)}
      />
    </motion.article>
  );
}
