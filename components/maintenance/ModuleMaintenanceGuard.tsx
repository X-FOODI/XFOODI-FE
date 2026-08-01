"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axiosInstance from "@/lib/services/axiosInstance";
import ModuleMaintenanceScreen from "./ModuleMaintenanceScreen";

interface ModuleStatus {
  key: string;
  label: string;
  enabled: boolean;
  message: string;
  estimatedFinish: string;
  fePrefixes: string[];
}

export default function ModuleMaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [blocked, setBlocked] = useState<ModuleStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Fetch trạng thái mỗi lần đổi route (không cache dài — admin tắt là lần sau hết ngay)
    axiosInstance
      .get("/settings/modules-status")
      .then((res) => {
        if (cancelled) return;
        const modules: ModuleStatus[] = res.data?.data || [];
        const hit = modules.find(
          (m) => m.enabled && m.fePrefixes.some((p) => p && pathname?.startsWith(p)),
        );
        setBlocked(hit || null);
      })
      .catch(() => {
        if (!cancelled) setBlocked(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (blocked) {
    return <ModuleMaintenanceScreen label={blocked.label} message={blocked.message} estimatedFinish={blocked.estimatedFinish} />;
  }
  return <>{children}</>;
}
