"use client";

import EmployeeManagement from "@/components/dashboard/EmployeeManagement";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RestaurantStaffPage() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();

  // Guard: ensure user is authenticated; redirect to login if not
  if (!isAuthReady) {
    return null; // could show loading spinner
  }
  if (!user) {
    router.replace("/login?redirect=/restaurant/staff");
    return null;
  }

  // Owner's restaurant ID is derived from the user context (tenant guard provides it)
  const restaurantId = user.restaurantId || null;

  return (
    <EmployeeManagement
      isAdminMode={false}
      userRestaurantId={restaurantId}
    />
  );
}
