'use client';

import { getAvatarUrl, getDisplayName } from '@/app/social/utils/socialHelpers';
import socialService from '@/lib/services/socialService';
import type { SocialProfile } from '@/lib/types/social';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/lib/contexts/ToastContext';

interface EditProfileModalProps {
  profile: SocialProfile;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: SocialProfile) => void;
}

export default function EditProfileModal({
  profile,
  open,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(profile.fullName ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? profile.avatar ?? '');
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFullName(profile.fullName ?? '');
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatarUrl ?? profile.avatar ?? '');
      setCoverUrl(profile.coverUrl ?? '');
    }
  }, [open, profile]);

  if (!open) return null;

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    setUploading(type);
    try {
      const url = await socialService.uploadProfileImage(file);
      if (type === 'avatar') setAvatarUrl(url);
      else setCoverUrl(url);
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể tải ảnh');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await socialService.updateSocialProfile({
        fullName: fullName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        coverImageUrl: coverUrl || undefined,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      showToast('error', 'Lỗi', e instanceof Error ? e.message : 'Không thể lưu hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 id="edit-profile-title" className="text-lg font-semibold text-[var(--text)]">
            Chỉnh sửa hồ sơ
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface)]"
            aria-label="Đóng"
          >
            <CloseIcon sx={{ fontSize: 22 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">
              Ảnh bìa
            </label>
            <div
              className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary-soft)] to-[var(--primary)]/40"
              style={
                coverUrl
                  ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover' }
                  : undefined
              }
            >
              <button
                type="button"
                disabled={uploading === 'cover'}
                onClick={() => coverInputRef.current?.click()}
                className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/50 px-3 py-1 text-xs text-white"
              >
                <PhotoCameraOutlinedIcon sx={{ fontSize: 14 }} />
                {uploading === 'cover' ? 'Đang tải...' : 'Đổi ảnh bìa'}
              </button>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file, 'cover');
              }}
            />
          </div>

          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl || getAvatarUrl(profile)}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--primary)]"
            />
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                {getDisplayName({ fullName, username: profile.username })}
              </p>
              <button
                type="button"
                disabled={uploading === 'avatar'}
                onClick={() => avatarInputRef.current?.click()}
                className="mt-1 text-sm text-[var(--primary)] hover:underline"
              >
                {uploading === 'avatar' ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageUpload(file, 'avatar');
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-fullName" className="mb-1 block text-sm font-medium text-[var(--text)]">
              Tên hiển thị
            </label>
            <input
              id="profile-fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label htmlFor="profile-bio" className="mb-1 block text-sm font-medium text-[var(--text)]">
              Giới thiệu
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Viết vài dòng về bạn..."
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1 text-right text-xs text-[var(--text-muted)]">{bio.length}/500</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || uploading !== null}
              className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
