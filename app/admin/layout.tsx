"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();

  // Auth guard — chỉ Admin / SuperAdmin mới vào được
  useEffect(() => {
    if (!isAuthReady) return;
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    if (!user || (!roles.includes("Admin") && !roles.includes("SuperAdmin") && !roles.includes("System Admin"))) {
      router.replace("/login-email?redirect=/admin/dashboard");
    }
  }, [isAuthReady, user, router]);

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  const displayName = user.fullName || user.name || "Admin";
  const email = user.email || "";

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="admin"
        userName={displayName}
        title="XFoodi Platform"
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="admin"
          userName={displayName}
          userEmail={email}
        />

        {/* Content area — chỉ phần này thay đổi khi navigate */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
