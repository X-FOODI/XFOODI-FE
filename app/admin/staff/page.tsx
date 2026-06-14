"use client";

import EmployeeManagement from "@/components/dashboard/EmployeeManagement";

export default function AdminStaffPage() {
  return <EmployeeManagement isAdminMode={true} />;
}
