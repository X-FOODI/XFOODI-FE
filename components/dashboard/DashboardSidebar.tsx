"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  role: "admin" | "restaurant";
  restaurantName?: string;
  userName?: string;
  userEmail?: string;
}

export default function DashboardSidebar({
  role,
  restaurantName = "Nhà hàng của tôi",
  userName = "Admin User",
  userEmail = "admin@xfoodi.com",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const adminSections: NavSection[] = [
    {
      items: [
        {
          id: "dashboard",
          label: "Tổng quan",
          path: "/admin/dashboard",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Quản lý",
      items: [
        {
          id: "restaurants",
          label: "Nhà hàng",
          path: "/admin/restaurants",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          id: "users",
          label: "Người dùng",
          path: "/admin/users",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          id: "tenant-requests",
          label: "Yêu cầu đăng ký",
          path: "/admin/applications",
          badge: 2,
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          id: "payments",
          label: "Thanh toán",
          path: "/admin/payments",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ),
        },
        {
          id: "knowledge-base",
          label: "Cài đặt AI chatbox",
          path: "/admin/knowledge-base",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
      {
  id: "staff",
  label: "Nhân viên",
  path: "/admin/staff",
  icon: (
    <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
},
],
    },
    {
      label: "Hệ thống",
      items: [
        {
          id: "settings",
          label: "Cài đặt",
          path: "/admin/settings",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          id: "security",
          label: "Bảo mật 2FA",
          path: "/admin/security",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const restaurantSections: NavSection[] = [
    {
      items: [
        {
          id: "dashboard",
          label: "Tổng quan",
          path: "/restaurant/dashboard",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Vận hành",
      items: [
        {
          id: "reservations",
          label: "Đặt bàn",
          path: "/restaurant/reservations",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: "orders",
          label: "Lịch sử đơn",
          path: "/restaurant/orders",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          id: "live-orders",
          label: "Màn hình Bếp",
          path: "/restaurant/live-orders",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        },
        {
          id: "customers",
          label: "Khách hàng",
          path: "/restaurant/customers",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          id: "feedbacks",
          label: "Đánh giá",
          path: "/restaurant/feedbacks",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
        },
        {
          id: "reservations",
          label: "Đặt bàn",
          path: "/restaurant/reservations",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: "payments",
          label: "Thanh toán",
          path: "/restaurant/payments",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Quản lý",
      items: [

        {
          id: "menu",
          label: "Thực đơn",
          path: "/restaurant/menu",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          id: "tables",
          label: "Bàn ăn",
          path: "/restaurant/tables",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: "staff",
          label: "Nhân viên",
          path: "/restaurant/staff",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        },
        {
          id: "ingredients",
          label: "Nguyên liệu",
          path: "/restaurant/ingredients",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Tài chính",
      items: [
        {
          id: "wallet",
          label: "Ví doanh thu",
          path: "/restaurant/wallet",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ),
        },
        {
          id: "payments",
          label: "Thanh toán",
          path: "/restaurant/payments",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        {
          id: "settings",
          label: "Cài đặt",
          path: "/restaurant/settings",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          id: "knowledge-base",
          label: "Cài đặt AI chatbox",
          path: "/restaurant/dashboard/knowledge-base",
          icon: (
            <svg className="dashboard-sidebar-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
      ],
    },
  ];


  const sections = role === "admin" ? adminSections : restaurantSections;
  const initials = userName.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "U";

  return (
    <aside className="dashboard-sidebar" style={{ width: collapsed ? "5rem" : "16rem" }}>
      {/* Logo / Brand */}
      <div className="dashboard-sidebar-brand" style={{ padding: collapsed ? "1rem 0.75rem" : "1rem 1.25rem" }}>
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              background: "var(--primary)",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text)", lineHeight: 1.2 }}>XFoodi</p>
              <p className="text-[10px] font-medium" style={{ color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {role === "admin" ? "Admin" : "Restaurant"}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Restaurant name banner (only for restaurant role) */}
      {!collapsed && role === "restaurant" && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg" style={{ background: "var(--primary-soft)", border: "1px solid var(--primary-border)" }}>
          <p className="text-xs font-semibold truncate" style={{ color: "var(--primary)" }}>{restaurantName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {!collapsed && section.label && (
              <div className="dashboard-sidebar-section-label">{section.label}</div>
            )}
            {collapsed && sIdx > 0 && (
              <div className="dashboard-section-divider" style={{ margin: "0.5rem 0.75rem" }} />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const [itemBasePath, itemQuery] = item.path.split("?");
                
                let isQueryMatch = true;
                if (typeof window !== "undefined") {
                  const currentParams = new URLSearchParams(window.location.search);
                  if (itemQuery) {
                    const itemParams = new URLSearchParams(itemQuery);
                    for (const [key, val] of itemParams.entries()) {
                      if (currentParams.get(key) !== val) {
                        isQueryMatch = false;
                        break;
                      }
                    }
                  } else {
                    // If this item has no query parameters, it should only match if the current URL
                    // has no active query parameter that matches other items (like tab=categories)
                    if (currentParams.get("tab")) {
                      isQueryMatch = false;
                    }
                  }
                }

                const isActive =
                  pathname === itemBasePath && isQueryMatch;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      className={`dashboard-sidebar-item ${isActive ? "dashboard-sidebar-item-active" : ""}`}
                      title={collapsed ? item.label : undefined}
                      style={collapsed ? { justifyContent: "center", padding: "0.625rem" } : undefined}
                    >
                      <div style={{ position: "relative" }}>
                        {item.icon}
                        {item.badge && !collapsed && (
                          <span
                            style={{
                              position: "absolute",
                              top: "-6px",
                              right: "-6px",
                              background: "var(--danger)",
                              color: "#fff",
                              fontSize: "9px",
                              fontWeight: 700,
                              borderRadius: "9999px",
                              width: "14px",
                              height: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span
                          className="ml-auto"
                          style={{
                            background: "var(--danger-soft)",
                            color: "var(--danger)",
                            border: "1px solid var(--danger-border)",
                            fontSize: "10px",
                            fontWeight: 700,
                            borderRadius: "9999px",
                            padding: "0 6px",
                            lineHeight: "18px",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="dashboard-sidebar-profile">
        <div
          className="dashboard-sidebar-avatar"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" style={{ color: "var(--text)" }}>{userName}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button onClick={() => setCollapsed(!collapsed)} className="dashboard-sidebar-toggle">
        <svg
          className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
