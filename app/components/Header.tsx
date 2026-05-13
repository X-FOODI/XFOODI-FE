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

const { Header: AntHeader } = Layout;

import { useTranslation } from "react-i18next";
import authService from "../../lib/services/authService";

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { tenant } = useTenant();

  const tenantName = "RestX";
  const tenantLogoUrl =
    tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png";

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
      const token = localStorage.getItem("accessToken");
      const user = authService.getCurrentUser();
      setIsAuthenticated(!!token);
      setDisplayName(user?.name || user?.fullName || "");
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

  const handleLogout = async () => {
    try {
      await authService.logoutServer();
    } catch (e) {
      console.warn("Server logout failed", e);
    }
    authService.logout();
    setIsAuthenticated(false);
    setDisplayName("");
    window.location.href = "/";
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <ProfileOutlined />,
      label: <Link href="/profile">{t("homepage.header.view_profile", "View Profile")}</Link>,
    },
    {
      key: "dashboard",
      icon: <UserOutlined />,
      label: <Link href="/admin">{t("homepage.header.dashboard", "Dashboard")}</Link>,
    },
    {
      type: "divider" as const,
    },
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
                    "/images/logo/restx-removebg-preview.png";
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
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                  <Button type="primary" shape="round" style={{ fontWeight: 600 }}>
                    {displayName || t("homepage.header.dashboard", "Dashboard")}
                  </Button>
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
                    "/images/logo/restx-removebg-preview.png";
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
              <Link href="/admin" style={{ width: '100%' }}>
                <Button type="primary" block size="large" icon={<UserOutlined />} style={{ fontWeight: 600 }}>
                  {displayName || t("homepage.header.dashboard", "Dashboard")}
                </Button>
              </Link>
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
