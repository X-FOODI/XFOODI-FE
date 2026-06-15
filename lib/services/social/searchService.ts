import axiosInstance from '../axiosInstance';
import type { SearchResults, TrendingHashtag } from '@/lib/types/social';
import { normalizePost, normalizeUser } from '../socialService';

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

const searchService = {
  async search(query: string): Promise<SearchResults> {
    const q = query.trim();
    if (!q) {
      return { users: [], posts: [], hashtags: [] };
    }
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/search`,
        { params: { q } }
      );
      const data = unwrap(response) as Record<string, unknown>;
      const usersRaw = (data.users ?? []) as Record<string, unknown>[];
      const postsRaw = (data.posts ?? data.items ?? []) as Record<string, unknown>[];
      const hashtagsRaw = (data.hashtags ?? []) as Record<string, unknown>[];
      return {
        users: Array.isArray(usersRaw) ? usersRaw.map((u) => normalizeUser(u)) : [],
        posts: Array.isArray(postsRaw) ? postsRaw.map((p) => normalizePost(p)) : [],
        hashtags: Array.isArray(hashtagsRaw)
          ? hashtagsRaw.map((h) => ({
              tag: String(h.tag ?? h.name ?? '').replace(/^#/, ''),
              count: Number(h.count ?? 0),
            }))
          : [],
      };
    } catch {
      return { users: [], posts: [], hashtags: [] };
    }
  },

  async getTrendingHashtags(): Promise<TrendingHashtag[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/hashtags/trending`
      );
      const data = unwrap(response) as Record<string, unknown>;
      const items = (data.items ?? data.hashtags ?? data) as Record<string, unknown>[];
      if (!Array.isArray(items)) return [];
      return items.map((h) => ({
        tag: String(h.tag ?? h.name ?? '').replace(/^#/, ''),
        count: Number(h.count ?? 0),
      }));
    } catch {
      return [
        { tag: 'xfoodi', count: 128 },
        { tag: 'monngon', count: 96 },
        { tag: 'foodie', count: 74 },
      ];
    }
  },
};

export default searchService;
