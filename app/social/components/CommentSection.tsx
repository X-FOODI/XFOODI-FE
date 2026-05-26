'use client';

import type { SocialComment } from '@/lib/types/social';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { formatRelativeTime, getAvatarUrl, getDisplayName } from '../utils/socialHelpers';

interface CommentSectionProps {
  postId: string;
  comments: SocialComment[];
  loading?: boolean;
  disabled?: boolean;
  currentUserId?: string;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onEditComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

function CommentItem({
  comment,
  disabled,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: {
  comment: SocialComment;
  disabled?: boolean;
  currentUserId?: string;
  onReply: (parentId: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const isOwner = currentUserId && comment.userId === currentUserId;

  return (
    <div className={depth > 0 ? 'ml-8 mt-3 border-l-2 border-[var(--border)] pl-3' : 'mt-3'}>
      <div className="flex gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAvatarUrl(comment.author)}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-[var(--surface)] px-3 py-2">
            <p className="text-sm font-semibold text-[var(--text)]">
              {getDisplayName(comment.author)}
            </p>
            {editing ? (
              <div className="mt-1 flex gap-2">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--primary)]"
                  onClick={() => {
                    onEdit(comment.id, editText);
                    setEditing(false);
                  }}
                >
                  Lưu
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--text)]">{comment.content}</p>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
            <span>{formatRelativeTime(comment.createdAt)}</span>
            {!disabled && depth < 2 && (
              <button type="button" className="hover:text-[var(--primary)]" onClick={() => onReply(comment.id)}>
                Trả lời
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button type="button" className="hover:text-[var(--primary)]" onClick={() => setEditing(true)}>
                  Sửa
                </button>
                <button type="button" className="hover:text-[var(--danger)]" onClick={() => onDelete(comment.id)}>
                  Xóa
                </button>
              </>
            )}
          </div>
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              disabled={disabled}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({
  comments,
  loading,
  disabled,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentSectionProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    setSubmitting(true);
    try {
      await onAddComment(text.trim(), replyTo);
      setText('');
      setReplyTo(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-[var(--border)] pt-3">
      {loading && (
        <p className="py-2 text-center text-sm text-[var(--text-muted)]">Đang tải bình luận...</p>
      )}
      {!loading && comments.length === 0 && (
        <p className="py-2 text-center text-sm text-[var(--text-muted)]">Chưa có bình luận</p>
      )}
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          disabled={disabled}
          currentUserId={currentUserId}
          onReply={(id) => setReplyTo(id)}
          onEdit={(id, content) => onEditComment(id, content)}
          onDelete={(id) => onDeleteComment(id)}
        />
      ))}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || submitting}
          placeholder={
            disabled
              ? 'Đăng nhập để bình luận'
              : replyTo
                ? 'Viết trả lời...'
                : 'Viết bình luận...'
          }
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || submitting || !text.trim()}
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)] disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
      {replyTo && (
        <button
          type="button"
          className="mt-1 text-xs text-[var(--text-muted)] hover:text-[var(--primary)]"
          onClick={() => setReplyTo(undefined)}
        >
          Hủy trả lời
        </button>
      )}
    </motion.div>
  );
}
