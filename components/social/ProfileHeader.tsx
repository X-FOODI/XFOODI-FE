'use client';

import { getAvatarUrl, getDisplayName } from '@/app/social/utils/socialHelpers';
import type { SocialProfile } from '@/lib/types/social';
import followService from '@/lib/services/social/followService';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProfileHeaderProps {
  profile: SocialProfile;
  onFollowChange?: (following: boolean) => void;
  onEdit?: () => void;
}

export default function ProfileHeader({ profile, onFollowChange, onEdit }: ProfileHeaderProps) {
  const [following, setFollowing] = useState(profile.isFollowing ?? false);
  const [busy, setBusy] = useState(false);

  const toggleFollow = async () => {
    if (profile.isSelf || busy) return;
    setBusy(true);
    try {
      if (following) {
        await followService.unfollow(profile.id);
        setFollowing(false);
        onFollowChange?.(false);
      } else {
        await followService.follow(profile.id);
        setFollowing(true);
        onFollowChange?.(true);
      }
    } catch {
      /* toast handled by parent if needed */
    } finally {
      setBusy(false);
    }
  };

  const showEngagementStats = profile.isSelf;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
    >
      <div
        className="h-32 bg-gradient-to-r from-[var(--primary-soft)] to-[var(--primary)]/40 sm:h-40"
        style={
          profile.coverUrl
            ? { backgroundImage: `url(${profile.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      />
      <div className="relative px-4 pb-6 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAvatarUrl(profile)}
          alt=""
          className="-mt-12 h-24 w-24 rounded-full border-4 border-[var(--card)] object-cover ring-2 ring-[var(--primary)] sm:-mt-14 sm:h-28 sm:w-28"
        />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">{getDisplayName(profile)}</h1>
            <p className="text-sm text-[var(--text-muted)]">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 max-w-xl text-sm text-[var(--text)]">{profile.bio}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.isSelf && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--primary-soft)]"
              >
                <EditOutlinedIcon sx={{ fontSize: 18 }} />
                Chỉnh sửa hồ sơ
              </button>
            )}
            {!profile.isSelf && (
              <button
                type="button"
                disabled={busy}
                onClick={toggleFollow}
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition ${
                  following
                    ? 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'
                    : 'bg-[var(--primary)] text-white hover:opacity-90'
                }`}
              >
                {following ? (
                  <>
                    <PersonRemoveOutlinedIcon sx={{ fontSize: 18 }} />
                    Đang theo dõi
                  </>
                ) : (
                  <>
                    <PersonAddOutlinedIcon sx={{ fontSize: 18 }} />
                    Theo dõi
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {showEngagementStats ? (
          <div className="mt-5 grid grid-cols-3 gap-4 text-center sm:text-left">
            <div>
              <p className="text-lg font-bold text-[var(--text)]">{profile.postsCount ?? 0}</p>
              <p className="text-xs text-[var(--text-muted)]">Bài viết</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text)]">
                {profile.likesReceivedCount ?? 0}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Lượt thích</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text)]">
                {profile.savedPostsCount ?? 0}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Đã lưu</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex gap-6 text-sm">
            <div>
              <span className="font-bold text-[var(--text)]">{profile.postsCount ?? 0}</span>
              <span className="ml-1 text-[var(--text-muted)]">Bài viết</span>
            </div>
            <div>
              <span className="font-bold text-[var(--text)]">{profile.followersCount ?? 0}</span>
              <span className="ml-1 text-[var(--text-muted)]">Người theo dõi</span>
            </div>
            <div>
              <span className="font-bold text-[var(--text)]">{profile.followingCount ?? 0}</span>
              <span className="ml-1 text-[var(--text-muted)]">Đang theo dõi</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
