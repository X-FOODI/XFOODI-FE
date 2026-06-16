"use client";

import EmployeeManagement from "@/components/dashboard/EmployeeManagement";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function RestaurantStaffPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  // Guard: ensure user is authenticated; redirect to login if not
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-[#FF5A2C] border-t-transparent" />
      </div>
    );
  }
  if (!user) {
    router.replace("/login?redirect=/restaurant/staff");
    return null;
  }

  // Owner's restaurant ID is derived from the user context (tenant guard provides it)
  const restaurantId = user.restaurantId || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#0A0E14]" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="restaurant"
        restaurantName={tenant?.name ?? "Cửa hàng"}
        userName={user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={tenant?.name ?? "Cửa hàng"}
          userName={user?.name ?? ""}
          userEmail={user?.email ?? ""}
        />

        <main className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
          <div className="max-w-[1400px] mx-auto w-full flex-1">
            <EmployeeManagement
              isAdminMode={false}
              userRestaurantId={restaurantId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
