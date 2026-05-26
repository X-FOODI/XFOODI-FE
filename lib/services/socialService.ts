import axiosInstance from './axiosInstance';
import type {
  CreatePostPayload,
  EditPostPayload,
  FeedFilter,
  PaginatedPosts,
  ReactionType,
  SocialComment,
  SocialPost,
  SocialSidebarData,
  SocialUser,
} from '../types/social';

const SOCIAL_BASE = '/social';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

function unwrap<T>(response: { data: ApiResponse<T> | T }): T {
  const body = response.data as ApiResponse<T>;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return response.data as T;
}

function extractError(error: unknown, fallback: string): never {
  const err = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  const msg = err.response?.data?.message || err.response?.data?.error || err.message;
  throw new Error(msg || fallback);
}

function normalizeUser(raw: Partial<SocialUser> | Record<string, unknown>): SocialUser {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    username: String(r.username ?? r.fullName ?? r.name ?? 'user'),
    fullName: (r.fullName ?? r.name) as string | undefined,
    name: r.name as string | undefined,
    avatarUrl: (r.avatarUrl ?? r.avatar) as string | undefined,
    avatar: r.avatar as string | undefined,
    followersCount: Number(r.followersCount ?? 0),
    followingCount: Number(r.followingCount ?? 0),
    postsCount: Number(r.postsCount ?? 0),
  };
}

function normalizeReactions(
  raw: Partial<SocialPost['reactions']> | Record<string, unknown> = {}
): SocialPost['reactions'] {
  const r = raw as Record<string, unknown>;
  return {
    like: Number(r.like ?? 0),
    love: Number(r.love ?? 0),
    haha: Number(r.haha ?? 0),
    wow: Number(r.wow ?? 0),
    sad: Number(r.sad ?? 0),
    total: Number(r.total ?? 0),
    userReaction: (r.userReaction as ReactionType | null) ?? null,
  };
}

export function normalizePost(raw: Record<string, unknown>): SocialPost {
  const author = normalizeUser((raw.author ?? raw.user ?? {}) as Record<string, unknown>);
  const images = Array.isArray(raw.images)
    ? (raw.images as string[])
    : Array.isArray(raw.imageUrls)
      ? (raw.imageUrls as string[])
      : [];

  return {
    id: String(raw.id ?? ''),
    author,
    content: String(raw.content ?? ''),
    images,
    hashtags: (raw.hashtags as string[]) ?? [],
    mentions: (raw.mentions as string[]) ?? [],
    reactions: normalizeReactions((raw.reactions ?? {}) as SocialPost['reactions']),
    commentsCount: Number(raw.commentsCount ?? raw.commentCount ?? 0),
    shareCount: Number(raw.shareCount ?? 0),
    savesCount: Number(raw.savesCount ?? 0),
    isSaved: Boolean(raw.isSaved),
    isOwner: Boolean(raw.isOwner),
    comments: (raw.comments as SocialComment[]) ?? undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: raw.updatedAt as string | undefined,
  };
}

function normalizePaginated(raw: Record<string, unknown>): PaginatedPosts {
  const itemsRaw = (raw.items ?? raw.posts ?? raw.data ?? []) as Record<string, unknown>[];
  const items = Array.isArray(itemsRaw) ? itemsRaw.map((p) => normalizePost(p)) : [];
  const page = Number(raw.page ?? raw.currentPage ?? 1);
  const totalPages = Number(raw.totalPages ?? raw.totalPage ?? 1);
  const totalCount = Number(raw.totalCount ?? raw.total ?? items.length);
  const hasMore =
    typeof raw.hasMore === 'boolean'
      ? raw.hasMore
      : page < totalPages;

  return { items, page, totalPages, totalCount, hasMore };
}

const socialService = {
  async createPost(payload: CreatePostPayload): Promise<SocialPost> {
    try {
      const formData = new FormData();
      formData.append('content', payload.content);
      if (payload.hashtags?.length) {
        formData.append('hashtags', JSON.stringify(payload.hashtags));
      }
      if (payload.mentions?.length) {
        formData.append('mentions', JSON.stringify(payload.mentions));
      }
      payload.images?.forEach((file) => formData.append('images', file));

      const response = await axiosInstance.post<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts`,
        formData
      );
      return normalizePost(unwrap(response) as Record<string, unknown>);
    } catch (error) {
      extractError(error, 'Không thể đăng bài viết');
    }
  },

  async getPosts(params?: {
    page?: number;
    limit?: number;
    feed?: FeedFilter;
  }): Promise<PaginatedPosts> {
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts`,
        { params: { page: params?.page ?? 1, limit: params?.limit ?? 10, feed: params?.feed ?? 'news' } }
      );
      return normalizePaginated(unwrap(response) as Record<string, unknown>);
    } catch (error) {
      extractError(error, 'Không thể tải bài viết');
    }
  },

  async getPostById(id: string): Promise<SocialPost> {
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts/${id}`
      );
      return normalizePost(unwrap(response) as Record<string, unknown>);
    } catch (error) {
      extractError(error, 'Không thể tải bài viết');
    }
  },

  async reactPost(id: string, reaction: ReactionType): Promise<SocialPost> {
    try {
      const response = await axiosInstance.post<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts/${id}/react`,
        { reaction }
      );
      return normalizePost(unwrap(response) as Record<string, unknown>);
    } catch (error) {
      extractError(error, 'Không thể phản ứng bài viết');
    }
  },

  async commentPost(
    postId: string,
    content: string,
    parentId?: string
  ): Promise<SocialComment> {
    try {
      const response = await axiosInstance.post<ApiResponse<SocialComment>>(
        `${SOCIAL_BASE}/posts/${postId}/comments`,
        { content, parentId }
      );
      return unwrap(response);
    } catch (error) {
      extractError(error, 'Không thể bình luận');
    }
  },

  async editComment(commentId: string, content: string): Promise<SocialComment> {
    try {
      const response = await axiosInstance.put<ApiResponse<SocialComment>>(
        `${SOCIAL_BASE}/comments/${commentId}`,
        { content }
      );
      return unwrap(response);
    } catch (error) {
      extractError(error, 'Không thể sửa bình luận');
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    try {
      await axiosInstance.delete(`${SOCIAL_BASE}/comments/${commentId}`);
    } catch (error) {
      extractError(error, 'Không thể xóa bình luận');
    }
  },

  async sharePost(id: string): Promise<{ shareCount: number }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ shareCount: number }>>(
        `${SOCIAL_BASE}/posts/${id}/share`
      );
      return unwrap(response);
    } catch (error) {
      extractError(error, 'Không thể chia sẻ bài viết');
    }
  },

  async savePost(id: string, saved: boolean): Promise<{ isSaved: boolean }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ isSaved: boolean }>>(
        `${SOCIAL_BASE}/posts/${id}/save`,
        { saved }
      );
      return unwrap(response);
    } catch (error) {
      extractError(error, 'Không thể lưu bài viết');
    }
  },

  async editPost(id: string, payload: EditPostPayload): Promise<SocialPost> {
    try {
      const response = await axiosInstance.put<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts/${id}`,
        payload
      );
      return normalizePost(unwrap(response) as Record<string, unknown>);
    } catch (error) {
      extractError(error, 'Không thể sửa bài viết');
    }
  },

  async deletePost(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`${SOCIAL_BASE}/posts/${id}`);
    } catch (error) {
      extractError(error, 'Không thể xóa bài viết');
    }
  },

  async getSidebar(): Promise<SocialSidebarData> {
    try {
      const response = await axiosInstance.get<ApiResponse<SocialSidebarData>>(
        `${SOCIAL_BASE}/sidebar`
      );
      const data = unwrap(response);
      return {
        trendingHashtags: data.trendingHashtags ?? [],
        topCreators: (data.topCreators ?? []).map((u) => normalizeUser(u)),
        suggestedUsers: (data.suggestedUsers ?? []).map((u) => normalizeUser(u)),
        recentActivity: data.recentActivity ?? [],
      };
    } catch {
      return {
        trendingHashtags: [
          { tag: 'xfoodi', count: 128 },
          { tag: 'monngon', count: 96 },
          { tag: 'nauan', count: 74 },
        ],
        topCreators: [],
        suggestedUsers: [],
        recentActivity: [],
      };
    }
  },

  async getProfile(): Promise<SocialUser> {
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/profile`
      );
      return normalizeUser(unwrap(response) as Record<string, unknown>);
    } catch {
      return { id: '', username: 'guest', followersCount: 0, followingCount: 0, postsCount: 0 };
    }
  },

  async getComments(postId: string): Promise<SocialComment[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<SocialComment[]>>(
        `${SOCIAL_BASE}/posts/${postId}/comments`
      );
      return unwrap(response) ?? [];
    } catch (error) {
      extractError(error, 'Không thể tải bình luận');
    }
  },
};

export default socialService;
