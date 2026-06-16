"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import authService from "../../lib/services/authService";
import axiosInstance from "../../lib/services/axiosInstance";
import { useTenant } from "@/lib/contexts/TenantContext";

interface DashboardHeaderProps {
  role: "admin" | "restaurant";
  title?: string;
  restaurantName?: string;
  userName?: string;
  userEmail?: string;
}

export default function DashboardHeader({
  role,
  title,
  restaurantName,
  userName,
  userEmail,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { tenant } = useTenant();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Resolve user from auth if props not passed
  const currentUser = authService.getCurrentUser();
  const resolvedName =
    userName ||
    currentUser?.fullName ||
    currentUser?.name ||
    "User";
  const resolvedEmail =
    userEmail ||
    currentUser?.email ||
    "";
  const resolvedAvatar = currentUser?.avatar || "";
  const initials = resolvedName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const chipLabel =
    role === "admin"
      ? "Admin"
      : "Chủ nhà hàng";

  const chipStyle = {
    background:
      role === "admin"
        ? "rgba(168,85,247,0.12)"
        : "var(--primary-soft, rgba(255,87,34,0.12))",
    color:
      role === "admin"
        ? "#a855f7"
        : "var(--primary, #ff5722)",
    border: `1px solid ${
      role === "admin"
        ? "rgba(168,85,247,0.3)"
        : "var(--primary-border, rgba(255,87,34,0.3))"
    }`,
  };

  const pageTitle =
    title ??
    (role === "admin" ? "XFoodi Platform" : restaurantName ?? "Nhà hàng");

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (role !== "restaurant") return;

    const fetchCounts = async () => {
      try {
        const ordersRes = await axiosInstance.get("/orders");
        if (ordersRes.data?.success) {
          const active = (ordersRes.data.data as any[]).filter(
            (o) => o.status === "PENDING" || o.status === "CONFIRMED" || (o.status === "COMPLETED" && !o.isPaid)
          );
          setActiveOrdersCount(active.length);
        }
      } catch (e) {
        console.error("Header failed to fetch active orders:", e);
      }

      try {
        const resRes = await axiosInstance.get("/reservations", { params: { limit: 100 } });
        if (resRes.data?.success) {
          const items = resRes.data.data?.items || [];
          const pending = items.filter((r: any) => r.statusValue?.code === "PENDING");
          setPendingReservationsCount(pending.length);
        }
      } catch (e) {
        console.error("Header failed to fetch pending reservations:", e);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [role]);

  useEffect(() => {
    // Initial load
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("xfoodi-theme-mode", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark");
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
      document.body.setAttribute("data-theme", "light");
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await authService.logoutServer();
    } catch (e) {
      console.warn("Server logout failed", e);
    }
    authService.logout();
    window.location.href = "/login";
  };

  const menuItems = [
    {
      key: "home",
      label: "Trang chủ User",
      href: "/",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      key: "profile",
      label: "Hồ sơ cá nhân",
      href: "/profile",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: "settings",
      label: "Cài đặt tài khoản",
      href: "/profile",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "64px",
        background: "rgba(var(--card-rgb, 255,255,255), 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Left: Logo + Chip + Title ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          {/* Restaurant logo or fallback */}
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "var(--primary, #ff5722)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(255,87,34,0.35)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-2.81-1.17-4.15-2.17-5.15-1.47-1.46-3.45-2.03-5.52-2.17L8 6.2H1v4.09h-.97l.74 11.67h15.03L15.03 14.99z" />
              </svg>
            </div>
          )}
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text, #111111)",
              letterSpacing: "-0.3px",
            }}
          >
            {tenant?.name || "XFoodi"}
          </span>
        </Link>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "20px",
            background: "var(--border)",
            flexShrink: 0,
          }}
        />

        {/* Role chip */}
        <span
          style={{
            ...chipStyle,
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
          }}
        >
          {chipLabel}
        </span>

        {/* Page title */}
        <h1
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text, #111111)",
            whiteSpace: "nowrap",
          }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* ── Right: Bell + User button ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Chuyển sang chế độ Tối" : "Chuyển sang chế độ Sáng"}
          style={{
            position: "relative",
            width: "36px",
            height: "36px",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            background: "var(--card)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface)";
            e.currentTarget.style.borderColor = "var(--primary, #ff5722)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--card)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          {theme === "light" ? (
            <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        {/* Notification bell */}
        <div ref={notificationRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotificationOpen((v) => !v)}
            title="Thông báo"
            style={{
              position: "relative",
              width: "36px",
              height: "36px",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              background: "var(--card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.borderColor = "var(--primary, #ff5722)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--card)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {(activeOrdersCount > 0 || pendingReservationsCount > 0) && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  background: "var(--danger, #ef4444)",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: 700,
                  borderRadius: "50%",
                  width: "14px",
                  height: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 4px rgba(239,68,68,0.5)",
                }}
              >
                {(activeOrdersCount > 0 ? 1 : 0) + (pendingReservationsCount > 0 ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notificationOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                minWidth: "280px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                overflow: "hidden",
                zIndex: 200,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text)",
                  background: "var(--surface, rgba(0,0,0,0.02))",
                }}
              >
                Thông báo mới
              </div>
              <div style={{ padding: "8px" }}>
                {activeOrdersCount === 0 && pendingReservationsCount === 0 ? (
                  <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    Không có thông báo mới nào
                  </div>
                ) : (
                  <>
                    {pendingReservationsCount > 0 && (
                      <Link
                        href="/restaurant/reservations"
                        onClick={() => setNotificationOpen(false)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          color: "var(--text)",
                          textDecoration: "none",
                          fontSize: "13px",
                          transition: "background 0.12s ease",
                          borderBottom: activeOrdersCount > 0 ? "1px solid var(--border)" : "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--danger)" }}></span>
                          <strong>Yêu cầu đặt bàn mới</strong>
                        </div>
                        <span style={{ color: "var(--text-muted)", paddingLeft: "14px" }}>
                          Bạn có {pendingReservationsCount} yêu cầu đặt bàn đang chờ phê duyệt.
                        </span>
                      </Link>
                    )}

                    {activeOrdersCount > 0 && (
                      <Link
                        href="/restaurant/live-orders"
                        onClick={() => setNotificationOpen(false)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          color: "var(--text)",
                          textDecoration: "none",
                          fontSize: "13px",
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)" }}></span>
                          <strong>Đơn hàng đang xử lý</strong>
                        </div>
                        <span style={{ color: "var(--text-muted)", paddingLeft: "14px" }}>
                          Có {activeOrdersCount} đơn hàng đang hiển thị trên Màn hình Bếp.
                        </span>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── User trigger button (like booca) ── */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px 5px 6px",
              border: "1px solid var(--border)",
              borderRadius: "24px",
              background: "var(--card)",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.15s ease",
              maxWidth: "220px",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.borderColor = "var(--primary, #ff5722)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--card)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                flexShrink: 0,
                overflow: "hidden",
                background: "var(--primary, #ff5722)",
                border: "2px solid var(--card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt={resolvedName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>

            {/* Name + role */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text, #111111)",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "120px",
                }}
              >
                {resolvedName}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  lineHeight: 1,
                }}
              >
                {role === "admin" ? "Quản trị viên" : "Chủ nhà hàng"}
              </span>
            </div>

            {/* Chevron */}
            <svg
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                color: "var(--text-muted)",
                flexShrink: 0,
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* ── Dropdown panel (like booca Menu) ── */}
          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                minWidth: "240px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                boxShadow:
                  "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                overflow: "hidden",
                zIndex: 200,
              }}
            >
              {/* Header block: name + email */}
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--surface, rgba(0,0,0,0.02))",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text, #111111)",
                    marginBottom: "2px",
                  }}
                >
                  {resolvedName}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {resolvedEmail || "user@example.com"}
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "6px" }}>
                {menuItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      color: "var(--text, #111111)",
                      textDecoration: "none",
                      fontSize: "14px",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    background: "var(--border)",
                    margin: "6px 0",
                  }}
                />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    color: "var(--danger, #ef4444)",
                    background: "transparent",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--danger-soft, rgba(239,68,68,0.08))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
