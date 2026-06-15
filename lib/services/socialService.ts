import axiosInstance from './axiosInstance';
import userService from './userService';
import type {
  CreatePostPayload,
  EditPostPayload,
  FeedFilter,
  PaginatedPosts,
  ReactionType,
  SocialComment,
  SocialPost,
  SocialProfile,
  SocialSidebarData,
  SocialUser,
  UpdateSocialProfilePayload,
} from '../types/social';

const SOCIAL_BASE = '/social';

function isOptimisticPostId(postId: string): boolean {
  return postId.startsWith('temp-');
}

const API_REACTIONS = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD'] as const;
type ApiReactionType = (typeof API_REACTIONS)[number];

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

/** Cursor stack per feed key for page-based infinite scroll */
const feedCursorStacks = new Map<string, (string | null)[]>();

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

function toApiReaction(reaction: ReactionType): ApiReactionType {
  return reaction.toUpperCase() as ApiReactionType;
}

function fromApiReaction(type: string | null | undefined): ReactionType | null {
  if (!type) return null;
  const lower = type.toLowerCase() as ReactionType;
  return ['like', 'love', 'haha', 'wow', 'sad'].includes(lower) ? lower : null;
}

function feedCacheKey(feed: FeedFilter, authorId?: string): string {
  return `${feed}:${authorId ?? ''}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Không thể đọc file ảnh'));
        return;
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.readAsDataURL(file);
  });
}

async function uploadPostImage(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'xfoodi/posts');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.');
    }

    const json = (await res.json()) as { secure_url: string };
    return json.secure_url;
  }

  const base64 = await fileToBase64(file);
  const response = await axiosInstance.post<ApiResponse<{ urls: string[] }>>(
    `${SOCIAL_BASE}/media/upload`,
    {
      files: [{ base64, mimeType: file.type || 'image/jpeg' }],
    }
  );
  const data = unwrap(response);
  const url = data.urls?.[0];
  if (!url) {
    throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.');
  }
  return url;
}

export function normalizeUser(raw: Partial<SocialUser> | Record<string, unknown>): SocialUser {
  const r = raw as Record<string, unknown>;
  const userName = r.userName ?? r.username;
  const stats = (r.stats ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    username: String(userName ?? r.fullName ?? r.name ?? 'user'),
    fullName: (r.fullName ?? r.name) as string | undefined,
    name: r.name as string | undefined,
    avatarUrl: (r.avatarUrl ?? r.avatar) as string | undefined,
    avatar: r.avatar as string | undefined,
    followersCount: Number(r.followersCount ?? stats.followersCount ?? 0),
    followingCount: Number(r.followingCount ?? stats.followingCount ?? 0),
    postsCount: Number(r.postsCount ?? stats.postsCount ?? 0),
  };
}

export function normalizeSocialProfile(
  raw: Record<string, unknown>,
  currentUserId?: string
): SocialProfile {
  const user = normalizeUser(raw);
  return {
    ...user,
    bio: raw.bio as string | undefined,
    coverUrl: (raw.coverImageUrl ?? raw.coverUrl) as string | undefined,
    email: raw.email as string | undefined,
    joinedAt: raw.createdAt as string | undefined,
    isFollowing: Boolean(raw.isFollowing),
    isSelf: Boolean(
      raw.isOwner ?? (currentUserId && String(raw.id ?? user.id) === currentUserId)
    ),
  };
}

function normalizeReactionsFromPost(raw: Record<string, unknown>): SocialPost['reactions'] {
  const stats = (raw.stats ?? {}) as Record<string, unknown>;
  const counts = (stats.reactionCounts ?? raw.reactions ?? {}) as Record<string, unknown>;
  const viewer = (raw.viewer ?? {}) as Record<string, unknown>;
  const viewerReaction = (viewer.reaction as { type?: string } | undefined)?.type;

  const like = Number(counts.LIKE ?? counts.like ?? 0);
  const love = Number(counts.LOVE ?? counts.love ?? 0);
  const haha = Number(counts.HAHA ?? counts.haha ?? 0);
  const wow = Number(counts.WOW ?? counts.wow ?? 0);
  const sad = Number(counts.SAD ?? counts.sad ?? 0);

  return {
    like,
    love,
    haha,
    wow,
    sad,
    total: Number(stats.reactionCount ?? like + love + haha + wow + sad),
    userReaction: fromApiReaction(viewerReaction ?? (raw.userReaction as string)),
  };
}

function normalizeImages(raw: Record<string, unknown>): string[] {
  if (Array.isArray(raw.images)) {
    return (raw.images as unknown[]).map((img) => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object' && 'imageUrl' in img) {
        return String((img as { imageUrl: string }).imageUrl);
      }
      return '';
    }).filter(Boolean);
  }
  if (Array.isArray(raw.imageUrls)) {
    return raw.imageUrls as string[];
  }
  return [];
}

export function normalizePost(raw: Record<string, unknown>, currentUserId?: string): SocialPost {
  const author = normalizeUser((raw.author ?? raw.user ?? {}) as Record<string, unknown>);
  const stats = (raw.stats ?? {}) as Record<string, unknown>;
  const viewer = (raw.viewer ?? {}) as Record<string, unknown>;

  return {
    id: String(raw.id ?? ''),
    author,
    content: String(raw.content ?? ''),
    images: normalizeImages(raw),
    hashtags: (raw.hashtags as string[]) ?? [],
    mentions: (raw.mentions as string[]) ?? [],
    reactions: normalizeReactionsFromPost(raw),
    commentsCount: Number(raw.commentsCount ?? stats.commentCount ?? 0),
    shareCount: Number(raw.shareCount ?? stats.shareCount ?? 0),
    savesCount: Number(raw.savesCount ?? 0),
    isSaved: Boolean(raw.isSaved ?? viewer.saved ?? false),
    isOwner: Boolean(
      raw.isOwner ?? (currentUserId && String(raw.authorId ?? author.id) === currentUserId)
    ),
    comments: raw.comments as SocialComment[] | undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: raw.updatedAt as string | undefined,
  };
}

function normalizeComment(raw: Record<string, unknown>): SocialComment {
  const user = (raw.user ?? raw.author ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    postId: String(raw.postId ?? ''),
    userId: String(raw.userId ?? user.id ?? ''),
    author: normalizeUser(user),
    content: String(raw.content ?? ''),
    parentId: (raw.parentId as string | null) ?? null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: raw.updatedAt as string | undefined,
    replies: Array.isArray(raw.replies)
      ? (raw.replies as Record<string, unknown>[]).map((r) => normalizeComment(r))
      : undefined,
  };
}

function normalizePaginated(
  raw: Record<string, unknown>,
  page: number,
  currentUserId?: string
): PaginatedPosts {
  const itemsRaw = (raw.items ?? raw.posts ?? []) as Record<string, unknown>[];
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((p) => normalizePost(p, currentUserId))
    : [];
  const pagination = (raw.pagination ?? {}) as Record<string, unknown>;
  const hasMore =
    typeof pagination.hasMore === 'boolean'
      ? pagination.hasMore
      : Boolean(raw.hasMore);

  return {
    items,
    page,
    totalPages: hasMore ? page + 1 : page,
    totalCount: items.length,
    hasMore,
  };
}

const socialService = {
  async createPost(payload: CreatePostPayload): Promise<SocialPost> {
    try {
      const imageUrls: string[] = [];
      if (payload.images?.length) {
        for (const file of payload.images) {
          imageUrls.push(await uploadPostImage(file));
        }
      }

      const response = await axiosInstance.post<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts`,
        { content: payload.content, imageUrls }
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
    authorId?: string;
    hashtag?: string;
  }): Promise<PaginatedPosts> {
    try {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      const feed = params?.feed ?? 'news';
      const cacheKey = feedCacheKey(feed, params?.authorId);

      if (page === 1) {
        feedCursorStacks.set(cacheKey, [null]);
      }

      const stack = feedCursorStacks.get(cacheKey) ?? [null];
      const cursor = stack[page - 1] ?? null;

      let url = `${SOCIAL_BASE}/posts`;
      const query: Record<string, string | number> = { limit };

      if (feed === 'saved') {
        url = `${SOCIAL_BASE}/saved`;
      } else {
        if (cursor) query.cursor = cursor;
        if (params?.authorId) query.authorId = params.authorId;
        if (params?.hashtag) query.hashtag = params.hashtag;
        if (feed === 'trending') query.hashtag = params?.hashtag ?? 'xfoodi';
      }

      if (feed === 'saved' && cursor) query.cursor = cursor;

      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(url, {
        params: query,
      });

      const data = unwrap(response) as Record<string, unknown>;
      const result = normalizePaginated(data, page, params?.authorId);

      const nextCursor = (data.pagination as { nextCursor?: string | null })?.nextCursor ?? null;
      const nextStack = [...stack];
      nextStack[page] = nextCursor;
      feedCursorStacks.set(cacheKey, nextStack);

      return result;
    } catch (error) {
      extractError(error, 'Không thể tải bài viết');
    }
  },

  async getPostById(id: string): Promise<SocialPost> {
    if (isOptimisticPostId(id)) {
      throw new Error('Bài viết chưa được lưu trên máy chủ');
    }
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
    if (isOptimisticPostId(id)) {
      throw new Error('Bài viết chưa được lưu trên máy chủ');
    }
    try {
      await axiosInstance.post(`${SOCIAL_BASE}/reactions`, {
        postId: id,
        type: toApiReaction(reaction),
      });
      return this.getPostById(id);
    } catch (error) {
      extractError(error, 'Không thể phản ứng bài viết');
    }
  },

  async clearReaction(postId: string, currentReaction: ReactionType): Promise<SocialPost> {
    return this.reactPost(postId, currentReaction);
  },

  async commentPost(
    postId: string,
    content: string,
    parentId?: string
  ): Promise<SocialComment> {
    if (isOptimisticPostId(postId)) {
      throw new Error('Bài viết chưa được lưu trên máy chủ');
    }
    try {
      const response = await axiosInstance.post<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/comments`,
        { postId, content, parentId }
      );
      return normalizeComment(unwrap(response) as Record<string, unknown>);
    } catch (error) {
      extractError(error, 'Không thể bình luận');
    }
  },

  async editComment(commentId: string, content: string): Promise<SocialComment> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/comments/${commentId}`,
        { content }
      );
      return normalizeComment(unwrap(response) as Record<string, unknown>);
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
    if (isOptimisticPostId(id)) {
      return { shareCount: 0 };
    }
    try {
      await axiosInstance.post(`${SOCIAL_BASE}/share/${id}`);
      const post = await this.getPostById(id);
      return { shareCount: post.shareCount };
    } catch (error) {
      extractError(error, 'Không thể chia sẻ bài viết');
    }
  },

  async savePost(id: string, _saved?: boolean): Promise<{ isSaved: boolean }> {
    if (isOptimisticPostId(id)) {
      return { isSaved: !!_saved };
    }
    try {
      const response = await axiosInstance.post<ApiResponse<{ saved: boolean }>>(
        `${SOCIAL_BASE}/save/${id}`
      );
      const data = unwrap(response);
      return { isSaved: data.saved };
    } catch (error) {
      extractError(error, 'Không thể lưu bài viết');
    }
  },

  async editPost(id: string, payload: EditPostPayload): Promise<SocialPost> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts/${id}`,
        { content: payload.content }
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
  },

  async getProfile(): Promise<SocialUser> {
    try {
      const user = await userService.getMe();
      return normalizeUser({
        id: user.id,
        userName: user.email?.split('@')[0],
        fullName: user.fullName || user.name,
        avatarUrl: user.avatar,
      });
    } catch {
      return { id: '', username: 'guest', followersCount: 0, followingCount: 0, postsCount: 0 };
    }
  },

  async getComments(postId: string): Promise<SocialComment[]> {
    if (isOptimisticPostId(postId)) return [];
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/posts/${postId}/comments`,
        { params: { limit: 50 } }
      );
      const data = unwrap(response) as Record<string, unknown>;
      const items = (data.items ?? data) as Record<string, unknown>[];
      return Array.isArray(items) ? items.map((c) => normalizeComment(c)) : [];
    } catch (error) {
      extractError(error, 'Không thể tải bình luận');
    }
  },

  async getUserProfile(userId: string, currentUserId?: string): Promise<SocialProfile> {
    try {
      const response = await axiosInstance.get<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/profile/${userId}`
      );
      return normalizeSocialProfile(unwrap(response) as Record<string, unknown>, currentUserId);
    } catch (error) {
      extractError(error, 'Không thể tải hồ sơ');
    }
  },

  async updateSocialProfile(payload: UpdateSocialProfilePayload): Promise<SocialProfile> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Record<string, unknown>>>(
        `${SOCIAL_BASE}/profile/me`,
        payload
      );
      const raw = unwrap(response) as Record<string, unknown>;
      return normalizeSocialProfile(raw, String(raw.id ?? ''));
    } catch (error) {
      extractError(error, 'Không thể cập nhật hồ sơ');
    }
  },

  async uploadProfileImage(file: File): Promise<string> {
    return uploadPostImage(file);
  },

  /** Client-side stats from existing post APIs (no DB changes). */
  async getProfileEngagementStats(
    userId: string,
    isSelf: boolean
  ): Promise<{ likesReceivedCount: number; savedPostsCount: number }> {
    try {
      const postsResult = await this.getPosts({
        feed: 'my',
        authorId: userId,
        page: 1,
        limit: 50,
      });
      const likesReceivedCount = postsResult.items.reduce(
        (sum, p) => sum + (p.reactions.total ?? 0),
        0
      );

      let savedPostsCount = 0;
      if (isSelf) {
        const savedResult = await this.getPosts({ feed: 'saved', page: 1, limit: 50 });
        savedPostsCount = savedResult.items.length;
      }

      return { likesReceivedCount, savedPostsCount };
    } catch {
      return { likesReceivedCount: 0, savedPostsCount: 0 };
    }
  },

  async getPostsByHashtag(tag: string, params?: { page?: number; limit?: number }): Promise<PaginatedPosts> {
    const normalized = tag.replace(/^#/, '');
    return this.getPosts({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      feed: 'news',
      hashtag: normalized,
    });
  },
};

export default socialService;
