'use client';

import type { User } from '@/lib/services/authService';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { EMOJI_LIST, getAvatarUrl, parseHashtags, parseMentions } from '../utils/socialHelpers';

interface CreatePostProps {
  user: User | null;
  disabled?: boolean;
  onSubmit: (data: { content: string; images: File[]; hashtags: string[]; mentions: string[] }) => Promise<void>;
}

export default function CreatePost({ user, disabled, onSubmit }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const socialUser = user
    ? {
        avatarUrl: user.avatar,
        fullName: user.fullName || user.name,
        username: user.email?.split('@')[0] || 'user',
      }
    : null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 10 - images.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...next].slice(0, 10));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (disabled || submitting) return;
    if (!content.trim() && images.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        images: images.map((i) => i.file),
        hashtags: parseHashtags(content),
        mentions: parseMentions(content),
      });
      setContent('');
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setImages([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 shadow-sm backdrop-blur-md"
    >
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={socialUser ? getAvatarUrl(socialUser) : '/images/logo/xfoodi-logo.png'}
          alt=""
          className="h-11 w-11 rounded-full object-cover ring-2 ring-[var(--primary-soft)]"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled || submitting}
          placeholder={
            disabled
              ? 'Đăng nhập để chia sẻ với cộng đồng...'
              : 'Bạn đang nghĩ gì? Dùng #hashtag hoặc @mention'
          }
          rows={3}
          className="min-h-[80px] flex-1 resize-none rounded-xl border-0 bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={img.preview} className="relative h-20 w-20 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt="" className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showEmoji && !disabled && (
        <div className="mt-2 flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="text-xl hover:scale-110"
              onClick={() => setContent((c) => c + emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-50"
            title="Ảnh"
          >
            🖼️ Ảnh
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowEmoji((s) => !s)}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-50"
          >
            😊 Emoji
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setContent((c) => c + (c.endsWith(' ') || !c ? '#' : ' #'))}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-50"
          >
            # Hashtag
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setContent((c) => c + (c.endsWith(' ') || !c ? '@' : ' @'))}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-50"
          >
            @ Mention
          </button>
        </div>
        <button
          type="button"
          disabled={disabled || submitting || (!content.trim() && images.length === 0)}
          onClick={handleSubmit}
          className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--on-primary)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Đang đăng...' : 'Đăng bài'}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </motion.div>
  );
}
