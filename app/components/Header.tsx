"use client";

import { CloseOutlined, MenuOutlined, LogoutOutlined, ProfileOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Divider, Drawer, Layout, Menu, Space, Dropdown } from "antd";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useTenant } from "../../lib/contexts/TenantContext";
import { useThemeMode } from "../theme/AntdProvider";
import { usePageTransition } from "./PageTransition";
import ThemeToggle from "./ThemeToggle";
import { Security as SecurityIcon, Storefront as StorefrontIcon } from "@mui/icons-material";

const { Header: AntHeader } = Layout;

import { useTranslation } from "react-i18next";
import authService from "../../lib/services/authService";

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { tenant } = useTenant();

  const tenantName = tenant?.name || "XFoodi";
  const tenantLogoUrl =
    tenant?.logoUrl?.trim() || "/images/logo/xfoodi-logo.png";

  const navItems = [
    {
      key: "product",
      label: <a href="#product">{t("homepage.header.product")}</a>,
    },
    {
      key: "workflow",
      label: <a href="#workflow">{t("homepage.header.workflow")}</a>,
    },
    {
      key: "restaurants",
      label: <a href="#restaurants">{t("homepage.header.restaurants", "Restaurants")}</a>,
    },
    {
      key: "about",
      label: <a href="#about-us">{t("homepage.header.about")}</a>,
    },
    {
      key: "testimonials",
      label: <a href="#testimonials">{t("homepage.header.testimonials")}</a>,
    },
    {
      key: "contact",
      label: <a href="#footer">{t("homepage.header.contact")}</a>,
    },
  ];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { isAnimationReady } = usePageTransition();
  const { mode } = useThemeMode();

  useEffect(() => {
    setMounted(true);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const syncAuth = () => {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      const user = authService.getCurrentUser();
      setIsAuthenticated(!!token);
      setDisplayName(user?.name || user?.fullName || "");
      setUserEmail(user?.email || "");
      setUserAvatar(user?.avatar || "");
      const roles = user?.roles || (user?.role ? [user.role] : []);
      setUserRoles(roles);
    };

    handleResize();
    syncAuth();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("focus", syncAuth);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const handleLogout = async () => {
    try {
      await authService.logoutServer();
    } catch (e) {
      console.warn("Server logout failed", e);
    }
    authService.logout();
    setIsAuthenticated(false);
    setDisplayName("");
    setUserEmail("");
    window.location.href = "/";
  };

  const hasRole = (role: string) =>
    userRoles.some((r) => r.toLowerCase() === role.toLowerCase());
  const isAdmin = hasRole("Admin") || hasRole("SuperAdmin") || hasRole("System Admin");
  const isOwner = hasRole("Owner");

  const userMenuItems = [
    {
      key: "profile",
      icon: <ProfileOutlined />,
      label: <Link href="/profile">{t("homepage.header.view_profile", "View Profile")}</Link>,
    },
    // Admin Dashboard — chỉ hiện cho Admin
    ...(isAdmin ? [{
      key: "admin-dashboard",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: "inline" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: (
        <Link href="/admin/dashboard">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <SecurityIcon sx={{ fontSize: 14 }} />
            {t("homepage.header.admin_dashboard", "Admin Dashboard")}
          </span>
        </Link>
      ),
    }] : []),
    // Restaurant Dashboard — chỉ hiện cho Owner
    ...(isOwner ? [{
      key: "restaurant-dashboard",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: "inline" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: <Link href="/restaurant/dashboard">{t("homepage.header.restaurant_dashboard", "Restaurant Dashboard")}</Link>,
    }] : []),
    // Nếu là Customer và chưa có nhà hàng — hiện link đăng ký
    ...(!isAdmin && !isOwner ? [{
      key: "open-restaurant",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: "inline" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      label: <Link href="/register-restaurant">{t("homepage.header.open_restaurant", "Register Restaurant")}</Link>,
    }] : []),
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("homepage.header.logout", "Logout"),
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Don't render until mounted to prevent FOUC
  if (!mounted) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={
          isAnimationReady ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }
        }
        transition={{
          duration: 0.6,
          ease: [0.25, 0.4, 0.25, 1],
          delay: 0.1,
        }}>
        <AntHeader
          style={{
            position: "fixed",
            top: scrolled ? 10 : 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: scrolled ? "calc(100% - 40px)" : "calc(100% - 80px)",
            maxWidth: 1400,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            background:
              mode === "dark"
                ? scrolled
                  ? "rgba(20, 25, 39, 0.95)"
                  : "rgba(20, 25, 39, 0.9)"
                : scrolled
                  ? "rgba(255, 255, 255, 0.95)"
                  : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 60,
            boxShadow: scrolled
              ? "0 8px 32px rgba(0, 0, 0, 0.12)"
              : "0 4px 24px rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            transition: "all 0.3s ease",
            height: 64,
          }}>
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}>
            <div
              style={{
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
              <img
                src={tenantLogoUrl}
                alt={t("homepage.header.logo_alt")}
                className="app-logo-img"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "/images/logo/xfoodi-logo.png";
                }}
              />
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: mode === "dark" ? "#ECECEC" : "#111111",
              }}>
              {tenantName || t("homepage.header.brand")}
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Menu
              mode="horizontal"
              items={navItems}
              style={{
                background: "transparent",
                border: "none",
                flex: 1,
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 500,
              }}
              selectable={false}
            />
          )}

          {/* Desktop Buttons */}
          {!isMobile && (
            <Space size={12}>
              {isAuthenticated ? (
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  trigger={['click']}
                  popupRender={(menu) => (
                    <div style={{
                      background: mode === "dark" ? "#141927" : "#ffffff",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      border: mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f0f0f0",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        padding: "12px 16px",
                        borderBottom: mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f0f0f0"
                      }}>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: mode === "dark" ? "#ffffff" : "#111111", marginBottom: 2 }}>
                          {displayName || "User"}
                        </div>
                        <div style={{ fontSize: "12px", color: mode === "dark" ? "#9ca3af" : "#6b7280" }}>
                          {userEmail || "user@example.com"}
                        </div>
                      </div>
                      {React.cloneElement(menu as React.ReactElement<any>, {
                        style: { boxShadow: "none", border: "none", background: "transparent" }
                      })}
                    </div>
                  )}
                >
                  <button
                    aria-label="User menu"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid var(--primary, #ff5722)",
                      padding: 0,
                      cursor: "pointer",
                      background: "var(--primary-soft, rgba(255,87,34,0.15))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "border-color 0.2s",
                    }}
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={displayName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary, #ff5722)", userSelect: "none" }}>
                        {initials}
                      </span>
                    )}
                  </button>
                </Dropdown>
              ) : (
                <Link href="/login">
                  <Button type="primary" shape="round" style={{ fontWeight: 600 }}>
                    {t("login_button.login_text", "Login")}
                  </Button>
                </Link>
              )}
              <LanguageSwitcher />
              <ThemeToggle />
            </Space>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setDrawerOpen(true)}
              style={{ color: mode === "dark" ? "#ECECEC" : "#111111" }}
            />
          )}
        </AntHeader>
      </motion.div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}>
            <div
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
              <img
                src={tenantLogoUrl}
                alt={t("homepage.header.logo_alt")}
                className="app-logo-img"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: "4px",
                }}
                onError={(e) => {
                  e.currentTarget.src =
                    "/images/logo/xfoodi-logo.png";
                }}
              />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: mode === "dark" ? "#ECECEC" : "#111111",
              }}>
              {tenantName || t("homepage.header.brand")}
            </span>
          </Link>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        closeIcon={
          <CloseOutlined
            style={{ color: mode === "dark" ? "#ECECEC" : "#111111" }}
          />
        }
        size="default"
        styles={{
          header: {
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
          },
          body: {
            background: "var(--surface)",
          },
          mask: {
            backdropFilter: "blur(4px)",
          },
        }}>
        <Menu
          mode="vertical"
          items={navItems}
          style={{
            background: "transparent",
            border: "none",
            fontSize: 16,
            fontWeight: 500,
          }}
          theme={mode === "dark" ? "dark" : "light"}
          selectable={false}
        />
        <Divider />
        <div style={{ marginBottom: 16 }}>
          {isAuthenticated ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link href="/profile" style={{ width: '100%' }}>
                <Button block size="large" icon={<ProfileOutlined />} style={{ fontWeight: 500 }}>
                  {t("homepage.header.view_profile", "View Profile")}
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/admin/dashboard" style={{ width: '100%' }}>
                  <Button block size="large" icon={<SecurityIcon sx={{ fontSize: 14 }} />} style={{ fontWeight: 500 }}>
                    {t("homepage.header.admin_dashboard", "Admin Dashboard")}
                  </Button>
                </Link>
              )}
              {isOwner && (
                <Link href="/restaurant/dashboard" style={{ width: '100%' }}>
                  <Button type="primary" block size="large" style={{ fontWeight: 600 }}>
                    {t("homepage.header.restaurant_dashboard", "Restaurant Dashboard")}
                  </Button>
                </Link>
              )}
              {!isAdmin && !isOwner && (
                <Link href="/register-restaurant" style={{ width: '100%' }}>
                  <Button block size="large" style={{ fontWeight: 500 }}>
                    {t("homepage.header.open_restaurant", "Register Restaurant")}
                  </Button>
                </Link>
              )}
              <Button block danger size="large" icon={<LogoutOutlined />} style={{ fontWeight: 500 }} onClick={handleLogout}>
                {t("homepage.header.logout", "Logout")}
              </Button>
            </Space>
          ) : (
            <Link href="/login">
              <Button type="primary" block size="large" style={{ fontWeight: 600 }}>
                {t("login_button.login_text", "Login")}
              </Button>
            </Link>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </Drawer>
    </>
  );
};

export default Header;
