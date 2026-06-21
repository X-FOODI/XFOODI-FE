
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import axiosInstance from "../../lib/services/axiosInstance";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useAuth } from "../../lib/contexts/AuthContext";
import authService from "../../lib/services/authService";
import {
  LayoutDashboard,
  Store,
  Users,
  ClipboardList,
  CreditCard,
  Bot,
  UserCheck,
  Settings,
  ShieldCheck,
  Calendar,
  History,
  ChefHat,
  Star,
  Utensils,
  Grid,
  Package,
  Wallet,
  Palette,
  Play,
  ChevronLeft
} from "lucide-react";

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
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);

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
        console.error("Sidebar failed to fetch active orders:", e);
      }

      try {
        const resRes = await axiosInstance.get("/reservations", { params: { limit: 100 } });
        if (resRes.data?.success) {
          const items = resRes.data.data?.items || [];
          const pending = items.filter((r: any) => r.statusValue?.code === "PENDING");
          setPendingReservationsCount(pending.length);
        }
      } catch (e) {
        console.error("Sidebar failed to fetch pending reservations:", e);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [role]);

  const adminSections: NavSection[] = [
    {
      items: [
        {
          id: "dashboard",
          label: "Tổng quan",
          path: "/admin/dashboard",
          icon: <LayoutDashboard className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          icon: <Store className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "users",
          label: "Người dùng",
          path: "/admin/users",
          icon: <Users className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "tenant-requests",
          label: "Yêu cầu đăng ký",
          path: "/admin/applications",
          badge: 2,
          icon: <ClipboardList className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "payments",
          label: "Thanh toán",
          path: "/admin/payments",
          icon: <CreditCard className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "knowledge-base",
          label: "Cài đặt AI chatbox",
          path: "/admin/knowledge-base",
          icon: <Bot className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "staff",
          label: "Nhân viên",
          path: "/admin/staff",
          icon: <UserCheck className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          icon: <Settings className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "security",
          label: "Bảo mật 2FA",
          path: "/admin/security",
          icon: <ShieldCheck className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          icon: <LayoutDashboard className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          badge: pendingReservationsCount > 0 ? pendingReservationsCount : undefined,
          icon: <Calendar className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "orders",
          label: "Lịch sử đơn",
          path: "/restaurant/orders",
          icon: <History className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "live-orders",
          label: "Màn hình Bếp",
          path: "/restaurant/live-orders",
          badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
          icon: <ChefHat className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "customers",
          label: "Khách hàng",
          path: "/restaurant/customers",
          icon: <Users className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "feedbacks",
          label: "Đánh giá",
          path: "/restaurant/feedbacks",
          icon: <Star className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "payments",
          label: "Thanh toán",
          path: "/restaurant/payments",
          icon: <CreditCard className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          icon: <Utensils className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "tables",
          label: "Bàn ăn",
          path: "/restaurant/tables",
          icon: <Grid className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "staff",
          label: "Nhân viên",
          path: "/restaurant/staff",
          icon: <UserCheck className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "ingredients",
          label: "Nguyên liệu",
          path: "/restaurant/ingredients",
          icon: <Package className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          icon: <Wallet className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "payments",
          label: "Thanh toán",
          path: "/restaurant/payments",
          icon: <CreditCard className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          icon: <Settings className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "knowledge-base",
          label: "Cài đặt AI chatbox",
          path: "/restaurant/dashboard/knowledge-base",
          icon: <Bot className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
        },
        {
          id: "builder",
          label: "Thiết kế Website",
          path: `${process.env.NEXT_PUBLIC_BUILDER_URL || "http://localhost:3001"}/editor?tenantId=${user?.restaurantId || ""}&token=${authService.getAccessToken() || ""}`,
          icon: <Palette className="dashboard-sidebar-item-icon" size={20} strokeWidth={2} />,
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
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.5rem",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
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
              <Play size={16} fill="white" color="white" />
            </div>
          )}
          {!collapsed && (
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text)", lineHeight: 1.2 }}>
                {tenant?.name || "XFoodi"}
              </p>
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
        <ChevronLeft
          className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`}
        />
      </button>
    </aside>
  );
}
