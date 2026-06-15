/** Client-only optimistic ids — not persisted on the server yet */
export function isOptimisticId(id: string): boolean {
  return id.startsWith('temp-');
}

export function parseHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g);
  return matches ? [...new Set(matches.map((t) => t.slice(1).toLowerCase()))] : [];
}

export function parseMentions(text: string): string[] {
  const matches = text.match(/@[\w\u00C0-\u024F\u1E00-\u1EFF]+/g);
  return matches ? [...new Set(matches.map((t) => t.slice(1)))] : [];
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function getDisplayName(user: {
  username?: string;
  fullName?: string;
  name?: string;
}): string {
  return user.fullName || user.name || user.username || 'Người dùng';
}

export function getAvatarUrl(user: { avatarUrl?: string; avatar?: string }): string {
  return user.avatarUrl || user.avatar || '/images/logo/xfoodi-logo.png';
}

export const REACTION_EMOJI: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
};

export const EMOJI_LIST = [
  '😀', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😋', '🤤', '👍',
  '❤️', '🔥', '✨', '🎉', '💯', '🍜', '🍕', '🍔', '☕', '🍰',
];
