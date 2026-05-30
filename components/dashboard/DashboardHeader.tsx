"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

interface DashboardHeaderProps {
  role: "admin" | "restaurant";
  title?: string;
  restaurantName?: string;
  userName?: string;
}

export default function DashboardHeader({
  role,
  title,
  restaurantName,
  userName = "Admin",
}: DashboardHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    logout();
    router.push("/login-email");
  };

  const pageTitle = title ?? (role === "admin" ? "Admin Panel" : restaurantName ?? "Nhà hàng");

  return (
    <header
      className="dashboard-header"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
    >
      {/* Left: Logo / Title */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: "1.75rem",
              height: "1.75rem",
              background: "var(--primary)",
              borderRadius: "0.375rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--primary)" }}>XFoodi</span>
        </Link>

        <div style={{ width: "1px", height: "1.25rem", background: "var(--border)" }} />

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: role === "admin" ? "rgba(168,85,247,0.12)" : "var(--primary-soft)",
              color: role === "admin" ? "#a855f7" : "var(--primary)",
              border: `1px solid ${role === "admin" ? "rgba(168,85,247,0.3)" : "var(--primary-border)"}`,
            }}
          >
            {role === "admin" ? "Admin" : "Chủ nhà hàng"}
          </span>
          <h1 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* badge */}
          <span
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "8px",
              height: "8px",
              background: "var(--danger)",
              borderRadius: "50%",
              border: "2px solid var(--card)",
            }}
          />
        </button>

        {/* User avatar */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                background: "var(--primary)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {userName[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{userName}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {role === "admin" ? "Quản trị viên" : "Chủ nhà hàng"}
              </p>
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "180px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                boxShadow: "var(--shadow-md)",
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              {[
                { label: "Hồ sơ", icon: "👤" },
                { label: "Cài đặt", icon: "⚙️" },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <div style={{ borderTop: "1px solid var(--border)" }} />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left"
                style={{ color: "var(--danger)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>🚪</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
