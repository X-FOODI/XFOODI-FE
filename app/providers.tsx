"use client";

import I18nProvider from "@/components/I18nProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import AntdProvider from "./theme/AntdProvider";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
    // Handle Google OAuth callback globally inside popup window
    useEffect(() => {
        if (typeof window !== "undefined" && window.opener) {
            let idToken: string | null = null;
            
            // Check in URL hash fragment (#id_token=...)
            if (window.location.hash) {
                const params = new URLSearchParams(window.location.hash.substring(1));
                idToken = params.get("id_token");
            }
            
            // Fallback to URL search query parameters (?id_token=...)
            if (!idToken && window.location.search) {
                const params = new URLSearchParams(window.location.search);
                idToken = params.get("id_token");
            }

            if (idToken) {
                window.opener.postMessage(
                    { type: "GOOGLE_OAUTH_TOKEN", token: idToken },
                    window.location.origin
                );
                window.close();
            }
        }
    }, []);

    return (
        <I18nProvider>
            <AuthProvider>
                <ToastProvider>
                    <AntdProvider>{children}</AntdProvider>
                </ToastProvider>
            </AuthProvider>
        </I18nProvider>
    );
}
