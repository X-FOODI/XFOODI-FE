import I18nProvider from "@/components/I18nProvider";
import { GoogleOAuthAppProvider } from "@/components/providers/GoogleOAuthAppProvider";
import TenantFavicon from "@/components/TenantFavicon";
import { AuthProvider } from "@/lib/contexts/AuthContext";
// import { CartProvider } from "@/lib/contexts/CartContext"; // TODO: Re-enable when cart services are ready
import { TenantProvider } from "@/lib/contexts/TenantContext";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "timepicker-ui/main.css";
import "./globals.css";
import AntdProvider from "./theme/AntdProvider";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Restaurant Platform",
  description:
    "Tối ưu vận hành nhà hàng với một nền tảng quản lý thống nhất.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var STORAGE_KEY = 'xfoodi-theme-mode';
                var TENANT_COLORS_KEY = 'xfoodi-tenant-colors';
                try {
                  // 1. Apply theme mode (dark/light) immediately
                  var stored = localStorage.getItem(STORAGE_KEY);
                  var mode = (stored === 'dark' || stored === 'light')
                    ? stored
                    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  var root = document.documentElement;
                  root.setAttribute('data-theme', mode);
                  if (mode === 'dark') {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }
                  
                  // Keep AntD portal popups synced (they render under body)
                  var bodyEl = document.body;
                  if (bodyEl) {
                    bodyEl.setAttribute('data-theme', mode);
                    if (mode === 'dark') {
                      bodyEl.classList.add('dark');
                    } else {
                      bodyEl.classList.remove('dark');
                    }
                  }
                  
                  // 2. Preload ALL tenant colors from localStorage (prevents FOUC)
                  var tenantColors = localStorage.getItem(TENANT_COLORS_KEY);
                  if (tenantColors) {
                    try {
                      var c = JSON.parse(tenantColors);
                      // Color field -> CSS variable mapping (must match themeDefaults THEME_COLOR_MAP)
                      var map = {
                        primaryColor: '--primary',
                        lightBaseColor: '--bg-light-base',
                        lightSurfaceColor: '--light-surface',
                        lightCardColor: '--light-card',
                        darkBaseColor: '--bg-dark-base',
                        darkSurfaceColor: '--dark-surface',
                        darkCardColor: '--dark-card'
                      };
                      // Apply each cached color field
                      for (var field in map) {
                        var val = (c[field] || '').trim();
                        if (val) {
                          root.style.setProperty(map[field], val);
                        }
                      }
                      // Logo URL
                      if (c.logoUrl && c.logoUrl.trim()) {
                        root.style.setProperty('--brand-logo-url', c.logoUrl.trim());
                      }
                      // Auto-calculate readable text color on primary (WCAG)
                      var p = (c.primaryColor || '').trim();
                      if (p) {
                        var hex = p.replace('#','').trim();
                        if (hex.length <= 4) hex = hex.split('').map(function(ch){return ch+ch}).join('');
                        var pr = parseInt(hex.slice(0,2),16), pg = parseInt(hex.slice(2,4),16), pb = parseInt(hex.slice(4,6),16);
                        if (!isNaN(pr) && !isNaN(pg) && !isNaN(pb)) {
                          var f = function(v){v=v/255; return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
                          var lum = 0.2126*f(pr)+0.7152*f(pg)+0.0722*f(pb);
                          var onP = lum > 0.55 ? '#111111' : '#FFFFFF';
                          root.style.setProperty('--text-inverse', onP);
                          root.style.setProperty('--on-primary', onP);
                        }
                      }
                    } catch (e) {
                      // Invalid JSON, ignore
                    }
                  }
                } catch (e) {
                  // silent fallback; globals.css will provide default light theme
                }
              })();
            `,
          }}
        />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* Custom Ant Design overrides using theme tokens */
          .ant-rate-star-full .ant-rate-star-second {
            color: var(--primary) !important;
          }
          .ant-card:hover {
            border-color: var(--primary) !important;
            box-shadow: 0 8px 32px var(--primary-glow) !important;
          }
          .ant-menu-horizontal > .ant-menu-item:hover::after,
          .ant-menu-horizontal > .ant-menu-item-selected::after {
            border-bottom-color: var(--primary) !important;
          }
        `}</style>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* I18n Provider Wrapper */}
        <I18nProvider>
          <TenantProvider>
            <TenantFavicon />
            <GoogleOAuthAppProvider>
              <AuthProvider>
                <ToastProvider>
                  <AntdProvider>{children}</AntdProvider>
                </ToastProvider>
              </AuthProvider>
            </GoogleOAuthAppProvider>
          </TenantProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
