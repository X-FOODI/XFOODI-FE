"use client";

import { CameraOutlined, LoadingOutlined, UserOutlined } from "@ant-design/icons";
import React, { useRef, useState } from "react";

interface AvatarUploadProps {
  currentAvatar?: string;
  displayName?: string;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export default function AvatarUpload({
  currentAvatar,
  displayName,
  onUpload,
  uploading = false,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;

  const avatarSrc = preview || currentAvatar || null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, WebP, or GIF images are allowed.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      await onUpload(file);
    } catch {
      // Parent handles the error toast; revert preview
      setPreview(null);
    } finally {
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative group">
        <div
          className="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--primary)]/30 shadow-lg bg-[var(--primary)]/10 flex items-center justify-center select-none"
          style={{ background: avatarSrc ? undefined : "var(--primary-glow, rgba(255,87,34,0.15))" }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : initials ? (
            <span className="text-3xl font-bold text-[var(--primary)]">{initials}</span>
          ) : (
            <UserOutlined className="text-4xl text-[var(--primary)]" />
          )}

          {/* Upload overlay */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Upload avatar"
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            {uploading ? (
              <LoadingOutlined className="text-white text-2xl" />
            ) : (
              <CameraOutlined className="text-white text-2xl" />
            )}
          </button>
        </div>

        {/* Small camera badge */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change avatar"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md hover:bg-[#ff5722] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <LoadingOutlined className="text-xs" />
          ) : (
            <CameraOutlined className="text-xs" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <p className="text-xs text-gray-400">
        {uploading ? "Uploading…" : "Click to change avatar · JPG, PNG, WebP, GIF · max 5 MB"}
      </p>

      {error && (
        <p className="text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
