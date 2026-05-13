"use client";

import I18nProvider from "@/components/I18nProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import AntdProvider from "./theme/AntdProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
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
