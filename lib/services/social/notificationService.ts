import axiosInstance from '../axiosInstance';
import type { SocialNotification } from '@/lib/types/social';
import { normalizeUser } from '../socialService';

const SOCIAL_BASE = '/social';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

function unwrap<T>(response: { data: ApiResponse<T> | T }): T {
  const body = response.data as ApiResponse<T>;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return response.data as T;
}

function normalizeNotification(raw: Record<string, unknown>): SocialNotification {
  const actor = normalizeUser((raw.actor ?? raw.user ?? {}) as Record<string, unknown>);
  const type = String(raw.type ?? 'like').toLowerCase() as SocialNotification['type'];
  return {
    id: String(raw.id ?? ''),
    type: ['like', 'comment', 'follow', 'mention', 'share'].includes(type) ? type : 'like',
    actor,
    postId: raw.postId as string | undefined,
    commentId: raw.commentId as string | undefined,
    message: String(raw.message ?? raw.content ?? ''),
    read: Boolean(raw.read ?? raw.isRead ?? false),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

const notificationService = {
  async getNotifications(limit = 30): Promise<SocialNotification[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/notifications`,
        { params: { limit } }
      );
      const data = unwrap(response) as Record<string, unknown>;
      const items = (data.items ?? data.notifications ?? data) as Record<string, unknown>[];
      return Array.isArray(items) ? items.map((n) => normalizeNotification(n)) : [];
    } catch {
      return [];
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await axiosInstance.patch(`${SOCIAL_BASE}/notifications/${id}/read`);
    } catch {
      /* non-blocking */
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await axiosInstance.post(`${SOCIAL_BASE}/notifications/read-all`);
    } catch {
      /* non-blocking */
    }
  },
};

export default notificationService;
