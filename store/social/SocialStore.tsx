'use client';

import type { FeedFilter, SocialPost, SocialSidebarData } from '@/lib/types/social';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface SocialStoreValue {
  activeFeed: FeedFilter;
  setActiveFeed: (feed: FeedFilter) => void;
  sidebar: SocialSidebarData | null;
  setSidebar: (data: SocialSidebarData | null) => void;
  feedPosts: SocialPost[];
  setFeedPosts: React.Dispatch<React.SetStateAction<SocialPost[]>>;
  createPostOpen: boolean;
  setCreatePostOpen: (open: boolean) => void;
}

const SocialStoreContext = createContext<SocialStoreValue | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const [activeFeed, setActiveFeed] = useState<FeedFilter>('news');
  const [sidebar, setSidebar] = useState<SocialSidebarData | null>(null);
  const [feedPosts, setFeedPosts] = useState<SocialPost[]>([]);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const value = useMemo(
    () => ({
      activeFeed,
      setActiveFeed,
      sidebar,
      setSidebar,
      feedPosts,
      setFeedPosts,
      createPostOpen,
      setCreatePostOpen,
    }),
    [activeFeed, sidebar, feedPosts, createPostOpen]
  );

  return <SocialStoreContext.Provider value={value}>{children}</SocialStoreContext.Provider>;
}

export function useSocialStore() {
  const ctx = useContext(SocialStoreContext);
  if (!ctx) {
    throw new Error('useSocialStore must be used within SocialProvider');
  }
  return ctx;
}

/** Safe accessor when outside social layout */
export function useSocialStoreOptional() {
  return useContext(SocialStoreContext);
}
