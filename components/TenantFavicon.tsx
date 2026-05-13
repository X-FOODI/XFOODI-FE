"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Dynamically injects tenant favicon into <head>.
 * Uses a ref to track the element we created so React's DOM tree stays consistent.
 * Falls back to /favicon.ico if no tenant favicon is configured.
 */
export default function TenantFavicon() {
    const { tenant } = useTenant();
    const pathname = usePathname();
    const linkRef = useRef<HTMLLinkElement | null>(null);
    const urlRef = useRef<string>("");

    const resolveType = (url: string) => {
        const cleanUrl = url.split("?")[0].toLowerCase();
        if (cleanUrl.endsWith(".png")) return "image/png";
        if (cleanUrl.endsWith(".svg")) return "image/svg+xml";
        if (cleanUrl.endsWith(".webp")) return "image/webp";
        if (cleanUrl.endsWith(".ico")) return "image/x-icon";
        return undefined;
    };

    const applyFavicon = (faviconUrl: string) => {
        const existing = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"));
        if (existing.length === 0) {
            const link = document.createElement("link");
            link.rel = "icon";
            link.id = "tenant-favicon";
            document.head.appendChild(link);
            linkRef.current = link;
            existing.push(link);
        }

        const type = resolveType(faviconUrl);
        existing.forEach((link) => {
            link.href = faviconUrl;
            if (type) {
                link.type = type;
            } else {
                link.removeAttribute("type");
            }
            if (!link.id) {
                link.id = "tenant-favicon";
            }
        });

        linkRef.current = existing[0] || null;
    };

    useEffect(() => {
        const faviconUrl = tenant?.faviconUrl?.trim() || "/favicon.ico";
        urlRef.current = faviconUrl;
        applyFavicon(faviconUrl);

        // Cleanup on unmount — avoid removing DOM nodes managed by Next/React
        return () => {
            linkRef.current = null;
        };
    }, [tenant?.faviconUrl]);

    // Re-apply on route changes to prevent Next head resets
    useEffect(() => {
        if (!urlRef.current) return;
        applyFavicon(urlRef.current);
    }, [pathname]);

    return null;
}
