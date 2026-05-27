export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad';

export type FeedFilter = 'news' | 'my' | 'trending' | 'saved';

export interface SocialUser {
  id: string;
  username: string;
  fullName?: string;
  name?: string;
  avatarUrl?: string;
  avatar?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  author: SocialUser;
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  replies?: SocialComment[];
}

export interface PostReactions {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  total?: number;
  userReaction?: ReactionType | null;
}

export interface SocialPost {
  id: string;
  author: SocialUser;
  content: string;
  images: string[];
  hashtags?: string[];
  mentions?: string[];
  reactions: PostReactions;
  commentsCount: number;
  shareCount: number;
  savesCount?: number;
  isSaved?: boolean;
  isOwner?: boolean;
  comments?: SocialComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedPosts {
  items: SocialPost[];
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export interface TrendingHashtag {
  tag: string;
  count: number;
}

export interface SuggestedUser extends SocialUser {
  mutualFriends?: number;
}

export interface SocialSidebarData {
  trendingHashtags: TrendingHashtag[];
  topCreators: SocialUser[];
  suggestedUsers: SuggestedUser[];
  recentActivity: { id: string; text: string; createdAt: string }[];
}

export interface CreatePostPayload {
  content: string;
  hashtags?: string[];
  mentions?: string[];
  images?: File[];
}

export interface EditPostPayload {
  content: string;
  hashtags?: string[];
  mentions?: string[];
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'share';

export interface SocialNotification {
  id: string;
  type: NotificationType;
  actor: SocialUser;
  postId?: string;
  commentId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SocialProfile extends SocialUser {
  bio?: string;
  coverUrl?: string;
  isFollowing?: boolean;
  isSelf?: boolean;
}

export type ProfileTab = 'posts' | 'media' | 'saved';

export interface SearchResults {
  users: SocialUser[];
  posts: SocialPost[];
  hashtags: TrendingHashtag[];
}
