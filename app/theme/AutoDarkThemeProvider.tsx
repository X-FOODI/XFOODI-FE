'use client';

import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConfigProvider, theme } from "antd";
import { lightTheme, darkTheme, ThemeMode } from "./themeConfig";

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

const AutoDarkThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Initialize from localStorage immediately to prevent flash
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "light") {
        return stored;
      }
      // Fallback to OS preference
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      return media.matches ? "dark" : "light";
    }
    return "light";
  });

  // Detect OS + stored preference on mount
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "dark" || stored === "light") {
      setMode(stored);
    } else {
      setMode(media.matches ? "dark" : "light");
    }
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (!saved) setMode(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Apply CSS variables + persist
  useEffect(() => {
    const themeObj = mode === "dark" ? darkTheme : lightTheme;
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    Object.entries(themeObj.customColors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val);
    });
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));
  const setTheme = (m: ThemeMode) => setMode(m);

  const algorithm = useMemo(
    () => (mode === "dark" ? darkAlgorithm : defaultAlgorithm),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider
        theme={{
          algorithm,
          token: (mode === "dark" ? darkTheme : lightTheme).tokens.token,
          components: (mode === "dark" ? darkTheme : lightTheme).tokens.components,
        }}
        form={{ requiredMark: false }}
      >
        <style jsx global>{`
          /* Scrollbar Styling - Webkit (Chrome, Safari, Edge) */
          ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          ::-webkit-scrollbar-track {
            background: var(--card);
            border-radius: 5px;
          }
          ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 5px;
            border: 2px solid var(--card);
          }
          ::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted);
          }
          
          /* Scrollbar Styling - Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: var(--border) var(--card);
          }
          
          /* Ant Design Drawer/Modal scrollbar */
          .ant-drawer-body,
          .ant-modal-body {
            scrollbar-width: thin !important;
            scrollbar-color: var(--border) var(--card) !important;
          }
          .ant-drawer-body::-webkit-scrollbar,
          .ant-modal-body::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }
          .ant-drawer-body::-webkit-scrollbar-track,
          .ant-modal-body::-webkit-scrollbar-track {
            background: var(--card) !important;
            border-radius: 4px !important;
          }
          .ant-drawer-body::-webkit-scrollbar-thumb,
          .ant-modal-body::-webkit-scrollbar-thumb {
            background: var(--border) !important;
            border-radius: 4px !important;
          }
          .ant-drawer-body::-webkit-scrollbar-thumb:hover,
          .ant-modal-body::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted) !important;
          }
        `}</style>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default AutoDarkThemeProvider;

