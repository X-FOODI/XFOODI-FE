"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import authService from "../../lib/services/authService";
import axiosInstance from "../../lib/services/axiosInstance";
import { useTenant } from "@/lib/contexts/TenantContext";
import { Home, User, Settings, Moon, Sun, Bell, ChevronDown, LogOut, Utensils } from "lucide-react";
import { useThemeMode } from "@/app/theme/AntdProvider";

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
  const { mode: theme, toggleTheme } = useThemeMode();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Resolve user from auth if props not passed (with hydration-safe state)
  const [resolvedName, setResolvedName] = useState(userName || "User");
  const [resolvedEmail, setResolvedEmail] = useState(userEmail || "");
  const [resolvedAvatar, setResolvedAvatar] = useState("");
  const [initials, setInitials] = useState(() => {
    const defaultName = userName || "User";
    return defaultName
      .split(" ")
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    const name = userName || currentUser?.fullName || currentUser?.name || "User";
    const email = userEmail || currentUser?.email || "";
    const avatar = currentUser?.avatar || "";
    const init = name
      .split(" ")
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

    setResolvedName(name);
    setResolvedEmail(email);
    setResolvedAvatar(avatar);
    setInitials(init);
  }, [userName, userEmail]);

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
      icon: <Home size={18} />, 
    },
    {
      key: "profile",
      label: "Hồ sơ cá nhân",
      href: "/profile",
      icon: <User size={18} />, 
    },
    {
      key: "settings",
      label: "Cài đặt tài khoản",
      href: "/profile",
      icon: <Settings size={18} />, 
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
        background: "color-mix(in srgb, var(--card) 95%, transparent)",
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
              <Utensils size={16} color="white" />
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

        {/* Page title — only show if a custom title is passed (otherwise tenant name is already shown in logo) */}
        {title && (
          <h1
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text, #111111)",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h1>
        )}
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
            <Moon size={17} />
          ) : (
            <Sun size={17} />
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
            <Bell size={17} />
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
            <ChevronDown
              size={13}
              style={{
                color: "var(--text-muted)",
                flexShrink: 0,
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
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
                  <LogOut size={18} />
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
