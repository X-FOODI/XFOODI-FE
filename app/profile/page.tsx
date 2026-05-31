"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/lib/contexts/ToastContext";
import userService from "@/lib/services/userService";
import {
  ArrowLeftOutlined,
  IdcardOutlined,
  LockOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import AvatarUpload from "./components/AvatarUpload";
import ProfileInfoForm, { type ProfileFormValues } from "./components/ProfileInfoForm";

// ── Section card ──────────────────────────────────────────────────────────────

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
    <div
      style={{
        borderRadius: "1rem",
        border: "1px solid var(--border)",
        background: "var(--card)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2rem",
            height: "2rem",
            borderRadius: "0.5rem",
            background: "var(--primary-soft)",
            color: "var(--primary)",
            fontSize: "1rem",
          }}
        >
          {icon}
        </span>
        <h2
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--text)",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [profileLoading, setProfileLoading] = useState(false);
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
        gender: values.gender || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address || undefined,
      });
      updateUser({ ...user!, ...updated });
      showToast("success", "Profile updated", "Your information has been saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      showToast("error", "Update failed", msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      // uploadAvatar gọi PUT /api/users/me (multipart) → BE upload Cloudinary
      // + lưu avatarUrl vào DB trong 1 request — không cần gọi updateProfile thêm
      const avatarUrl = await userService.uploadAvatar(file);
      updateUser({ ...user!, avatar: avatarUrl });
      showToast("success", "Avatar updated", "Your profile picture has been changed.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Avatar upload failed.";
      showToast("error", "Upload failed", msg);
      throw err;
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-base)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "50%",
              border: "3px solid var(--primary)",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Loading profile…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.fullName || user.name || user.email;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", transition: "background 0.3s" }}>

      {/* ── Top bar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "3.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeftOutlined />
            <span>Back</span>
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
            My Profile
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          maxWidth: "56rem",
          margin: "0 auto",
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Page heading */}
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Account Settings
          </h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Manage your personal information and account security.
          </p>
        </div>

        {/* ── Profile Info Card ── */}
        <SectionCard title="Profile Information" icon={<IdcardOutlined />}>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div style={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
              <AvatarUpload
                currentAvatar={user.avatar}
                displayName={displayName}
                onUpload={handleAvatarUpload}
                uploading={avatarUploading}
              />
            </div>
            {/* Form */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ProfileInfoForm
                user={user}
                loading={profileLoading}
                onSubmit={handleProfileSubmit}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Security Card ── */}
        <SectionCard title="Security" icon={<LockOutlined />}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
              Keep your account secure by using a strong, unique password.
            </p>

            {/* Change Password button */}
            <button
              type="button"
              onClick={() => router.push("/change-password")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: "28rem",
                padding: "0.875rem 1.25rem",
                borderRadius: "0.875rem",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-faint)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "0.625rem",
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  <LockOutlined />
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                    Change Password
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Update your account password
                  </p>
                </div>
              </div>
              <RightOutlined style={{ color: "var(--text-muted)", fontSize: "0.75rem" }} />
            </button>
          </div>
        </SectionCard>


      </main>
    </div>
  );
}
