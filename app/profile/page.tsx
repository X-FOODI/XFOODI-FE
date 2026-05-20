"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/lib/contexts/ToastContext";
import userService from "@/lib/services/userService";
import { ArrowLeftOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import AvatarUpload from "./components/AvatarUpload";
import ChangePasswordForm, { type ChangePasswordFormValues } from "./components/ChangePasswordForm";
import ProfileInfoForm, { type ProfileFormValues } from "./components/ProfileInfoForm";

// ── Section card wrapper ──────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white dark:bg-white/5 shadow-sm backdrop-blur-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/10">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h2>
      </div>
      {/* Card body */}
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [user, authLoading, router]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    setProfileLoading(true);
    try {
      const updated = await userService.updateProfile({
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || undefined,
        avatarUrl: user?.avatar,
      });

      // Merge with current user to preserve fields the API might not return
      const merged = { ...user!, ...updated };
      updateUser(merged);

      showToast("success", "Profile updated", "Your profile information has been saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      showToast("error", "Update failed", msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: ChangePasswordFormValues) => {
    setPasswordLoading(true);
    try {
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      showToast("success", "Password changed", "Your password has been updated successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      showToast("error", "Password update failed", msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const avatarUrl = await userService.uploadAvatar(file);

      // Persist the new avatar URL to the backend
      const updated = await userService.updateProfile({
        fullName: user?.fullName || user?.name || "",
        phoneNumber: user?.phoneNumber,
        avatarUrl,
      });

      const merged = { ...user!, ...updated, avatar: avatarUrl };
      updateUser(merged);

      showToast("success", "Avatar updated", "Your profile picture has been changed.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Avatar upload failed.";
      showToast("error", "Upload failed", msg);
      throw err; // Let AvatarUpload revert the preview
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light-base,#f9fafb)] dark:bg-[var(--bg-dark-base,#0f1117)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.fullName || user.name || user.email;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-light-base,#f9fafb)] dark:bg-[var(--bg-dark-base,#0f1117)] transition-colors duration-300">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeftOutlined />
            <span>Back</span>
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">My Profile</span>
        </div>
      </div>

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your profile information and security settings.
          </p>
        </div>

        {/* ── Profile Info Card ── */}
        <SectionCard title="Profile Information" icon={<UserOutlined />}>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar column */}
            <div className="flex-shrink-0 flex flex-col items-center md:items-start">
              <AvatarUpload
                currentAvatar={user.avatar}
                displayName={displayName}
                onUpload={handleAvatarUpload}
                uploading={avatarUploading}
              />
            </div>

            {/* Form column */}
            <div className="flex-1 min-w-0">
              <ProfileInfoForm
                user={user}
                loading={profileLoading}
                onSubmit={handleProfileSubmit}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Change Password Card ── */}
        <SectionCard title="Change Password" icon={<LockOutlined />}>
          <div className="max-w-md">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Choose a strong password with at least 8 characters, one uppercase letter, and one number.
            </p>
            <ChangePasswordForm
              loading={passwordLoading}
              onSubmit={handlePasswordSubmit}
            />
          </div>
        </SectionCard>

        {/* ── Account info footer ── */}
        <div className="rounded-2xl border border-white/10 bg-white dark:bg-white/5 shadow-sm px-6 py-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">User ID: </span>
              <span className="font-mono text-xs">{user.id}</span>
            </span>
            {user.role && (
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">Role: </span>
                {user.role}
              </span>
            )}
            {user.email && (
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">Email: </span>
                {user.email}
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
