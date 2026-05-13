"use client";

import { App as AntdApp, ConfigProvider, theme } from "antd";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { darkTheme, lightTheme, ThemeMode } from "./themeConfig";

const { darkAlgorithm, defaultAlgorithm } = theme;
const STORAGE_KEY = "restx-theme-mode";

type ThemeContextValue = {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggleTheme: () => { },
  setTheme: () => { },
});

export const useThemeMode = () => useContext(ThemeContext);

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>("light");

  // read initial
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null)
        : null;
    if (stored === "dark" || stored === "light") {
      setMode(stored);
    }
  }, []);

  // apply CSS variables and persist
  useEffect(() => {
    const theme = mode === "dark" ? darkTheme : lightTheme;
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const bodyEl = document.body;
    if (bodyEl) {
      bodyEl.setAttribute("data-theme", mode);
      if (mode === "dark") {
        bodyEl.classList.add("dark");
      } else {
        bodyEl.classList.remove("dark");
      }
    }

    const vars = theme.customColors;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  const setTheme = (m: ThemeMode) => setMode(m);

  // Ant Design theme configuration
  const antdTheme = useMemo(() => {
    const themeTokens = mode === "dark" ? darkTheme.tokens : lightTheme.tokens;
    return {
      algorithm: mode === "dark" ? darkAlgorithm : defaultAlgorithm,
      token: {
        ...themeTokens.token,
        // Override with CSS variables for dynamic tenant branding
        colorPrimary: "var(--primary)",
        colorLink: "var(--primary)",
        colorLinkHover: "var(--primary-hover)",
        borderRadius: 12,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      components: {
        ...themeTokens.components,
        // Additional global component overrides
        Button: {
          ...themeTokens.components?.Button,
          borderRadius: 8,
          controlHeight: 44,
          fontWeight: 600,
        },
        Input: {
          colorBgContainer: "var(--surface)",
          colorBorder: "var(--border)",
          activeBorderColor: "var(--primary)",
          hoverBorderColor: "var(--primary)",
        },
        Select: {
          colorBgContainer: "var(--surface)",
          colorBorder: "var(--border)",
          selectorBg: "var(--surface)",
          optionSelectedBg: "var(--primary-soft)",
          colorTextPlaceholder: "var(--text-muted)",
        },
        DatePicker: {
          colorBgElevated: "var(--card)",
          colorBgContainer: "var(--surface)",
          colorText: "var(--text)",
          colorTextHeading: "var(--text)",
          colorIcon: "var(--text-muted)",
          colorIconHover: "var(--primary)",
        },
        Modal: {
          contentBg: "var(--card)",
          headerBg: "var(--card)",
          titleColor: "var(--text)",
        },
        Card: {
          colorBgContainer: "var(--card)",
          colorBorderSecondary: "var(--border)",
        },
        Table: {
          headerBg: "var(--surface)",
          headerColor: "var(--text)",
          colorBgContainer: "var(--card)",
          colorText: "var(--text)",
          colorTextHeading: "var(--text)",
          borderColor: "var(--border)",
          rowHoverBg: "var(--surface-subtle)",
        },
        Badge: {
          colorError: "var(--primary)",
        },
        Descriptions: {
          labelBg: "var(--surface)",
          contentBg: "var(--card)",
          colorText: "var(--text)",
          colorTextLabel: "var(--text)",
          colorBorder: "var(--border)",
        },
        Popover: {
          colorBgElevated: "var(--card)",
          colorText: "var(--text)",
          colorTextHeading: "var(--text)",
        },
        Tabs: {
          itemSelectedColor: "var(--primary)",
          itemHoverColor: "var(--primary)",
          itemActiveColor: "var(--primary)",
          inkBarColor: "var(--primary)",
          titleFontSize: 15,
        },
        Layout: {
          bodyBg: "var(--bg-base)",
          headerBg: "var(--card)",
        },
        Message: {
          contentBg: "#FFFFFF",
          contentPadding: "12px 16px",
          colorText: "#000000",
          colorSuccess: "#52c41a",
          colorError: "#ff4d4f",
          colorWarning: "#faad14",
          colorInfo: "#1890ff",
        },
        Notification: {
          colorBgElevated: "#FFFFFF",
          colorText: "#000000",
          colorTextHeading: "#000000",
          colorSuccess: "#52c41a",
          colorError: "#ff4d4f",
          colorWarning: "#faad14",
          colorInfo: "#1890ff",
        },
      },
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider
        theme={antdTheme}
        form={{ requiredMark: false }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
      <style jsx global>{`
        /* Ant Design message toast - always on top */
        .ant-message {
          z-index: 999999 !important;
        }

        /* Body & Layout Base */
        body {
          background: var(--bg-base);
          color: var(--text);
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }
        .ant-layout,
        .ant-layout-content {
          background: var(--bg-base);
        }

        /* Override hardcoded colors with CSS variables */
        .ant-btn-primary:not(.ant-btn-dangerous):not(.ant-btn-disabled):not(:disabled) {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
        }
        .ant-btn-primary:not(.ant-btn-dangerous):not(.ant-btn-disabled):not(:disabled):hover {
          background: var(--primary-hover) !important;
          border-color: var(--primary-hover) !important;
        }
        .ant-btn-primary.ant-btn-disabled,
        .ant-btn-primary:disabled {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text-muted) !important;
          box-shadow: none !important;
        }
        .ant-typography strong,
        .ant-typography-danger {
          color: var(--primary);
        }

        /* Links */
        a {
          color: var(--primary);
        }
        a:hover {
          color: var(--primary-hover);
        }

        /* Toast/Message - Always white background, black text */
        .ant-message-notice-content {
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow:
            0 6px 16px 0 rgba(0, 0, 0, 0.08),
            0 3px 6px -4px rgba(0, 0, 0, 0.12),
            0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
        }

        .ant-message .anticon {
          color: inherit !important;
        }

        .ant-message-success .anticon {
          color: #52c41a !important;
        }

        .ant-message-error .anticon {
          color: #ff4d4f !important;
        }

        .ant-message-warning .anticon {
          color: #faad14 !important;
        }

        .ant-message-info .anticon {
          color: #1890ff !important;
        }

        /* Notification - Always white background, black text */
        .ant-notification-notice {
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow:
            0 6px 16px 0 rgba(0, 0, 0, 0.08),
            0 3px 6px -4px rgba(0, 0, 0, 0.12),
            0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
        }

        .ant-notification-notice-message {
          color: #000000 !important;
        }

        .ant-notification-notice-description {
          color: #000000 !important;
        }

        .ant-notification-notice-icon-success {
          color: #52c41a !important;
        }

        .ant-notification-notice-icon-error {
          color: #ff4d4f !important;
        }

        .ant-notification-notice-icon-warning {
          color: #faad14 !important;
        }

        .ant-notification-notice-icon-info {
          color: #1890ff !important;
        }

        /* Tabs - Orange active state */
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: var(--primary) !important;
        }
        .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: var(--primary) !important;
        }
        .ant-tabs-ink-bar {
          background: var(--primary) !important;
        }
        .ant-tabs-tab-btn {
          color: var(--text-muted) !important;
        }

        /* Pagination - Orange theme */
        .ant-pagination-item-active {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
        }
        .ant-pagination-item-active a {
          color: #ffffff !important;
        }
        .ant-pagination-item:hover {
          border-color: var(--primary) !important;
        }
        .ant-pagination-item:hover a {
          color: var(--primary) !important;
        }
        .ant-select-selector:hover {
          border-color: var(--primary-border) !important;
        }

        /* Admin Tenants Table - Consistent styling */
        .admin-tenants-table .ant-table-thead > tr > th {
          background: var(--table-header-bg, var(--surface)) !important;
          color: var(--table-header-text, var(--text)) !important;
          border-bottom: 1px solid var(--border) !important;
          font-weight: 600 !important;
        }
        
        .admin-tenants-table .ant-table-tbody > tr {
          background: var(--card) !important;
        }
        
        .admin-tenants-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border) !important;
          color: var(--text) !important;
        }
        
        .admin-tenants-table .ant-table-tbody > tr:hover > td {
          background: var(--table-row-hover-bg, var(--surface-subtle)) !important;
        }
        
        .admin-tenants-table .ant-table {
          background: transparent !important;
        }
        
        .admin-tenants-table .ant-table-container {
          border: none !important;
        }
        
        .admin-tenants-table .ant-table-cell {
          background: transparent !important;
        }
        
        /* Table pagination in dark mode */
        .admin-tenants-table .ant-pagination {
          color: var(--text) !important;
        }
        
        .admin-tenants-table .ant-pagination-item {
          background: var(--card) !important;
          border-color: var(--border) !important;
        }
        
        .admin-tenants-table .ant-pagination-item a {
          color: var(--text) !important;
        }
        
        .admin-tenants-table .ant-select-selector {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }
        
        .admin-tenants-table .ant-select-arrow {
          color: var(--text-muted) !important;
        }
        
        .admin-tenants-table .ant-pagination-options-quick-jumper input {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }

        /* Select dropdown - Match theme */
        .ant-select-dropdown {
          background: var(--card) !important;
          border-color: var(--border) !important;
        }
        
        .ant-select-item {
          color: var(--text) !important;
        }
        
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background: var(--primary-soft) !important;
          color: var(--text) !important;
        }
        
        .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background: var(--surface-subtle) !important;
        }
        
        .ant-select-item-option:hover {
          background: var(--surface-subtle) !important;
        }
        
        /* Input in filter - consistent styling */
        .ant-input {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }
        
        .ant-input::placeholder {
          color: var(--text-muted) !important;
        }
        
        .ant-input:hover {
          border-color: var(--primary) !important;
        }
        
        .ant-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px var(--primary-soft) !important;
        }
        
        /* Button styling consistency */
        .ant-btn-link {
          color: var(--text) !important;
        }
        
        .ant-btn-link:hover {
          color: var(--primary) !important;
        }
        
        .ant-btn-link[style*="color: var(--success)"] {
          color: #34d399 !important;
        }
        
        .ant-btn-link[style*="color: var(--success)"]:hover {
          color: #10b981 !important;
        }
        
        .ant-btn-link.ant-btn-dangerous {
          color: var(--danger) !important;
        }
        
        .ant-btn-link.ant-btn-dangerous:hover {
          color: #ff7875 !important;
        }
        
        .ant-btn-default {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }
        
        .ant-btn-default:hover {
          border-color: var(--primary-border) !important;
          color: var(--primary) !important;
        }

        /* Soften hover border/shadow in light mode */
        .ant-card-hoverable:hover {
          border-color: var(--primary-border) !important;
          box-shadow: var(--shadow-sm) !important;
        }

        /* Popconfirm/Popover - force follow current CSS variables */
        .ant-popover,
        .ant-popconfirm {
          --ant-popover-bg: var(--card) !important;
        }

        .ant-popover .ant-popover-inner {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          box-shadow: var(--shadow-md) !important;
        }

        .ant-popover .ant-popover-inner,
        .ant-popover .ant-popover-inner-content,
        .ant-popover .ant-popover-message,
        .ant-popover .ant-popover-message-title,
        .ant-popover .ant-popover-title,
        .ant-popover .ant-popover-description {
          color: var(--text) !important;
        }
        
        .ant-modal-title {
          color: var(--text) !important;
        }
        
        .ant-modal-body {
          color: var(--text) !important;
        }
        
        .ant-modal-footer {
          border-top-color: var(--border) !important;
        }
        
        /* Descriptions in modal */
        .ant-descriptions-bordered .ant-descriptions-item-label {
          background: var(--surface) !important;
          color: var(--text) !important;
        }
        
        .ant-descriptions-bordered .ant-descriptions-item-content {
          background: var(--card) !important;
          color: var(--text) !important;
        }
        
        .ant-descriptions-bordered .ant-descriptions-view {
          border-color: var(--border) !important;
        }
        
        .ant-descriptions-bordered .ant-descriptions-row {
          border-color: var(--border) !important;
        }
        
        /* Tag styling */
        .ant-tag {
          border-color: transparent !important;
        }
        .ant-tag:not(.ant-tag-has-color) {
          background: var(--surface) !important;
          color: var(--text) !important;
          border: 1px solid var(--border) !important;
        }
        
        /* Empty state */
        .ant-empty-description {
          color: var(--text-muted) !important;
        }
        
        /* Responsive adjustments for small screens */
        @media (max-width: 768px) {
          .admin-tenants-table .ant-table {
            font-size: 13px !important;
          }
          
          .admin-tenants-table .ant-table-thead > tr > th {
            padding: 8px 4px !important;
            font-size: 12px !important;
          }
          
          .admin-tenants-table .ant-table-tbody > tr > td {
            padding: 8px 4px !important;
          }
          
          .ant-pagination {
            font-size: 13px !important;
          }
          
          .ant-pagination-item {
            min-width: 28px !important;
            height: 28px !important;
            line-height: 26px !important;
            margin: 0 2px !important;
          }
          
          .ant-pagination-prev,
          .ant-pagination-next {
            min-width: 28px !important;
            height: 28px !important;
            line-height: 26px !important;
          }
          
          .ant-modal {
            max-width: calc(100vw - 16px) !important;
            margin: 8px auto !important;
          }
          
          .ant-modal-body {
            padding: 16px 12px !important;
          }
        }
      `}</style>
    </ThemeContext.Provider>
  );
}
