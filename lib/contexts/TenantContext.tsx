"use client";

import { THEME_COLOR_FIELDS } from "@/lib/constants/themeDefaults";
import { injectTenantBranding } from "@/lib/hooks/useThemeTokens";
import { TenantConfig, tenantService } from "@/lib/services/tenantService";
import React, { createContext, useContext, useEffect, useState } from "react";

interface TenantContextType {
  tenant: TenantConfig | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [disabledInfo, setDisabledInfo] = useState<{ message: string, reason: string } | null>(null);

  const fetchTenant = async () => {
    const host = window.location.host; // e.g., demo.xfoodi.com:3000
    const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
    const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;

    // 1. Check for Landing domains (Skip API call)
    if (
      hostWithoutPort === BASE_DOMAIN ||
      hostWithoutPort === `www.${BASE_DOMAIN}` ||
      hostWithoutPort === "localhost" ||
      hostWithoutPort === "127.0.0.1"
    ) {
      console.log(
        "[TenantContext] Landing domain detected, skipping tenant fetch",
      );
      setLoading(false);
      return;
    }

    // 2. Check for Admin domain (Skip tenant fetch, admin has its own context)
    if (
      hostWithoutPort === `admin.${BASE_DOMAIN}` ||
      hostWithoutPort === "admin.localhost" ||
      hostWithoutPort.startsWith("admin.")
    ) {
      console.log(
        "[TenantContext] Admin domain detected, skipping tenant fetch",
      );
      setLoading(false);
      return;
    }

    // 3. Get hostname for tenant lookup
    let hostname = hostWithoutPort;

    // For *.localhost in development, convert to equivalent production hostname
    // e.g., demo.localhost -> demo.xfoodi.com
    if (hostname.endsWith(".localhost")) {
      const subdomain = hostname.replace(".localhost", "");
      const actualBaseDomain = BASE_DOMAIN === "localhost" || BASE_DOMAIN === "127.0.0.1" ? "xfoodi.website" : BASE_DOMAIN;
      hostname = `${subdomain}.${actualBaseDomain}`;
    }

    try {
      // 5. Call API to get tenant config
      const data = await tenantService.getTenantConfig(hostname);

      if (data) {
        setTenant(data);
      } else {
        console.warn(
          "[TenantContext] Tenant not found for hostname:",
          hostname,
        );
        setError("Tenant not found");
      }
    } catch (err: any) {
      console.error("[TenantContext] Failed to load tenant config:", err);

      if (err.response?.status === 403 && err.response?.data?.message?.toLowerCase().includes("disabled")) {
        setDisabledInfo({
          message: err.response?.data?.message,
          reason: err.response?.data?.reason || "Không có lý do",
        });
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Unable to load tenant configuration");
      } else if (err.response?.status === 404) {
        setError("Tenant not found");
      } else if (!err.response) {
        setError("Network error - please check your connection");
      } else {
        setError("Failed to load tenant");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh tenant data (called after updates like branding changes)
  const refreshTenant = async () => {
    console.log("[TenantContext] Refreshing tenant data...");
    setLoading(true);
    setError(null);
    await fetchTenant();
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  // Apply tenant branding (theme colors) when tenant is loaded
  useEffect(() => {
    if (!tenant) return;
    const config: Record<string, string | undefined> = {
      logoUrl: tenant.logoUrl,
    };
    for (const f of THEME_COLOR_FIELDS) config[f] = (tenant as any)[f];
    injectTenantBranding(config);
  }, [tenant]);

  if (disabledInfo) {
    const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "xfoodi.website";
    const homeUrl = `http://${BASE_DOMAIN}${window.location.port ? ":" + window.location.port : ""}`;
    
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8f9fa", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", maxWidth: "500px", width: "90%", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="32" height="32" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 style={{ margin: "0 0 16px", fontSize: "24px", color: "#111827", fontWeight: 600 }}>Nhà hàng đã bị khóa</h1>
          <p style={{ margin: "0 0 24px", color: "#4b5563", fontSize: "16px", lineHeight: "1.5" }}>
            {disabledInfo.reason}
          </p>
          <a href={homeUrl} style={{ display: "inline-block", background: "#FF380B", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 500, transition: "opacity 0.2s" }}>
            Quay về XFOODI
          </a>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, error, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
