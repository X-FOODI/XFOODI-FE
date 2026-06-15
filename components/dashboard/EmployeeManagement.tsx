"use client";

import { useEffect, useState, useMemo } from "react";
import employeeService, { Employee, ListEmployeesParams } from "@/lib/services/employeeService";
import restaurantService, { PublicRestaurant } from "@/lib/services/restaurantService";
import { message } from "antd";

interface EmployeeManagementProps {
  isAdminMode?: boolean;
  userRestaurantId?: string | null;
}

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  Owner: { label: "Chủ nhà hàng", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  Waiter: { label: "Phục vụ", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Kitchen: { label: "Bếp", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Kitchen Staff": { label: "Nhân viên bếp", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  Cashier: { label: "Thu ngân", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Hoạt động", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  INACTIVE: { label: "Tạm ngưng", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

export default function EmployeeManagement({
  isAdminMode = false,
  userRestaurantId = null,
}: EmployeeManagementProps) {
  // Global context or selection
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>("");

  // Employee list states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters & Search & Sort
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals state
  const [activeModal, setActiveModal] = useState<"create" | "edit" | "detail" | "resetPassword" | "delete" | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Waiter",
    position: "",
    status: "ACTIVE",
  });
  const [resetPwdData, setResetPwdData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Determine effective restaurant ID
  const activeRestaurantId = useMemo(() => {
    return isAdminMode ? selectedRestId : (userRestaurantId || "");
  }, [isAdminMode, selectedRestId, userRestaurantId]);

  // Load restaurants if in Admin Mode
  useEffect(() => {
    if (isAdminMode) {
      restaurantService
        .listPublic()
        .then((data) => {
          setRestaurants(data);
          if (data.length > 0) {
            setSelectedRestId(data[0].id);
          }
        })
        .catch((err) => {
          console.error(err);
          message.error("Không thể tải danh sách nhà hàng.");
        });
    }
  }, [isAdminMode]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch employees list
  const fetchEmployees = async () => {
    if (!activeRestaurantId) return;
    setLoading(true);
    try {
      const params: ListEmployeesParams = {
        restaurantId: activeRestaurantId,
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        sortBy,
        sortOrder,
      };
      const res = await employeeService.list(params);
      console.log('--- EMPLOYEE LIST RESPONSE ---', res);
      // Backend might return either items (newer) or data (older compiled version)
      let listData: Employee[] = [];
      let totalCount = 0;
      let pagesCount = 1;

      if (res) {
        if (Array.isArray(res)) {
          listData = res;
          totalCount = res.length;
        } else if (Array.isArray((res as any).items)) {
          listData = (res as any).items;
          totalCount = (res as any).total ?? listData.length;
          pagesCount = (res as any).totalPages ?? 1;
        } else if ((res as any).data) {
          if (Array.isArray((res as any).data)) {
            listData = (res as any).data;
            totalCount = (res as any).data.length;
          } else if ((res as any).data.items && Array.isArray((res as any).data.items)) {
            listData = (res as any).data.items;
            totalCount = (res as any).data.total ?? listData.length;
            pagesCount = (res as any).data.totalPages ?? 1;
          }
        }
      }

      // Normalize items to handle both old and new backend schemas (e.g. role/roles, status/isActive, phone/phoneNumber, avatar/avatarUrl)
      const normalizedData = listData.map((emp: any) => {
        const rawRole = emp.role || (Array.isArray(emp.roles) && emp.roles.length > 0 ? emp.roles[0] : 'Waiter');
        const rawStatus = emp.status || (emp.isActive === true ? 'ACTIVE' : emp.isActive === false ? 'INACTIVE' : 'ACTIVE');
        return {
          ...emp,
          role: rawRole,
          status: rawStatus,
          phone: emp.phone || emp.phoneNumber || '',
          avatar: emp.avatar || emp.avatarUrl || '',
        };
      });

      setEmployees(normalizedData);
      setTotal(totalCount);
      setTotalPages(pagesCount);
    } catch (err: any) {
      message.error(err.message || "Không thể tải danh sách nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [activeRestaurantId, page, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder]);

  const handleOpenCreate = () => {
    setFormData({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "Waiter",
      position: "Nhân viên phục vụ",
      status: "ACTIVE",
    });
    setActiveModal("create");
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      username: emp.username,
      email: emp.email,
      phone: emp.phone,
      password: "",
      confirmPassword: "",
      role: emp.role,
      position: emp.position,
      status: emp.status,
    });
    setActiveModal("edit");
  };

  const handleOpenDetail = (emp: Employee) => {
    setSelectedEmployee(emp);
    setActiveModal("detail");
  };

  const handleOpenResetPassword = (emp: Employee) => {
    setSelectedEmployee(emp);
    setResetPwdData({
      newPassword: "",
      confirmPassword: "",
    });
    setActiveModal("resetPassword");
  };

  const handleOpenDelete = (emp: Employee) => {
    setSelectedEmployee(emp);
    setActiveModal("delete");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await employeeService.create({
        ...formData,
        restaurantId: activeRestaurantId,
      });
      message.success(res.message || "Tạo nhân viên thành công.");
      setActiveModal(null);
      fetchEmployees();
    } catch (err: any) {
      message.error(err.message || "Tạo nhân viên thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setSubmitting(true);
    try {
      const res = await employeeService.update(selectedEmployee.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        position: formData.position,
        status: formData.status,
        restaurantId: activeRestaurantId,
      });
      message.success(res.message || "Cập nhật nhân viên thành công.");
      setActiveModal(null);
      fetchEmployees();
    } catch (err: any) {
      message.error(err.message || "Cập nhật thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await employeeService.delete(selectedEmployee.id);
      message.success("Xóa nhân viên thành công.");
      setActiveModal(null);
      fetchEmployees();
    } catch (err: any) {
      message.error(err.message || "Xóa thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    if (resetPwdData.newPassword !== resetPwdData.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      await employeeService.resetPassword(selectedEmployee.id, {
        newPassword: resetPwdData.newPassword,
        restaurantId: activeRestaurantId,
      });
      message.success("Đặt lại mật khẩu thành công.");
      setActiveModal(null);
    } catch (err: any) {
      message.error(err.message || "Đặt lại mật khẩu thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateTempPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    // Ensure policy: 1 uppercase, 1 lowercase, 1 number, min 10 chars
    password += "A";
    password += "a";
    password += "1";
    password += "!";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // shuffle
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    setResetPwdData({
      newPassword: password,
      confirmPassword: password,
    });
  };

  const selectedRestName = useMemo(() => {
    if (!isAdminMode) return "Nhà hàng của bạn";
    const rest = restaurants.find((r) => r.id === selectedRestId);
    return rest ? rest.name : "Nhà hàng";
  }, [isAdminMode, restaurants, selectedRestId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              Quản lý nhân sự
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {isAdminMode
                ? `Xem và quản trị danh sách nhân viên của nhà hàng: ${selectedRestName}`
                : "Quản lý tài khoản, phân quyền và chức vụ của nhân viên nhà hàng của bạn"}
            </p>
          </div>

          {activeRestaurantId && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-[0_4px_12px_rgba(255,56,11,0.2)] hover:shadow-[0_6px_16px_rgba(255,56,11,0.3)] hover:-translate-y-0.5"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              Thêm nhân viên +
            </button>
          )}
        </div>

        {/* Restaurant selector for Admin */}
        {isAdminMode && (
          <div className="p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>Chọn nhà hàng cần quản lý:</span>
            <select
              value={selectedRestId}
              onChange={(e) => {
                setSelectedRestId(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-80 px-3 py-2 rounded-xl text-sm outline-none transition-colors border"
              style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search, Filter and Sorting toolbar */}
        {activeRestaurantId ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2">
              <input
                type="text"
                placeholder="Tìm tên, tài khoản, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors border"
                style={{ background: "var(--card)", color: "var(--text)", borderColor: "var(--border)" }}
              />
              <span className="absolute left-3.5 top-3.5 material-icons text-sm" style={{ color: "var(--text-muted)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors"
              style={{ background: "var(--card)", color: "var(--text)", borderColor: "var(--border)" }}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="Waiter">Phục vụ</option>
              <option value="Kitchen Staff">Nhân viên bếp</option>
              <option value="Cashier">Thu ngân</option>
              <option value="Owner">Chủ sở hữu</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors"
              style={{ background: "var(--card)", color: "var(--text)", borderColor: "var(--border)" }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>

            {/* Sort & Order Controls */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors"
                style={{ background: "var(--card)", color: "var(--text)", borderColor: "var(--border)" }}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="name">Tên nhân viên</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 rounded-xl border flex items-center justify-center transition-colors"
                style={{ background: "var(--card)", color: "var(--text)", borderColor: "var(--border)" }}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Employee Table Card */}
        <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {!activeRestaurantId ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <svg className="w-12 h-12" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-base font-semibold" style={{ color: "var(--text)" }}>Chưa chọn nhà hàng</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Vui lòng chọn nhà hàng phía trên để quản trị danh sách nhân sự.</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Không tìm thấy nhân viên nào phù hợp.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-base)" }}>
                    {["Nhân viên", "Tài khoản", "Vai trò / Chức vụ", "Liên hệ", "Trạng thái", "Ngày bắt đầu", "Hành động"].map((h) => (
                      <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const rBadge = ROLE_BADGE[emp.role] || { label: emp.role, color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
                    const sBadge = STATUS_BADGE[emp.status] || { label: emp.status, color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
                    const initials = emp.fullName.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "?";

                    return (
                      <tr key={emp.id} className="hover:bg-[var(--bg-base)] transition-colors border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        {/* Avatar / Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "var(--primary)" }}>
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{emp.fullName}</p>
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>ID: {emp.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: "var(--text)" }}>
                          {emp.username}
                        </td>

                        {/* Role / Position */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: rBadge.color, background: rBadge.bg }}>
                              {rBadge.label}
                            </span>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{emp.position}</p>
                          </div>
                        </td>

                        {/* Contact info */}
                        <td className="px-6 py-4 text-xs space-y-0.5" style={{ color: "var(--text-muted)" }}>
                          <p>{emp.email}</p>
                          <p>{emp.phone || "—"}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: sBadge.color, background: sBadge.bg }}>
                            {sBadge.label}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                          {new Date(emp.createdAt).toLocaleDateString("vi-VN")}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDetail(emp)}
                              className="p-1.5 rounded-lg border transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                              title="Xem chi tiết"
                              style={{ color: "var(--text)", borderColor: "var(--border)" }}
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 rounded-lg border transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                              title="Sửa"
                              style={{ color: "#2563eb", borderColor: "var(--border)" }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleOpenResetPassword(emp)}
                              className="p-1.5 rounded-lg border transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                              title="Đặt lại mật khẩu"
                              style={{ color: "#faad14", borderColor: "var(--border)" }}
                            >
                              🔑
                            </button>
                            <button
                              onClick={() => handleOpenDelete(emp)}
                              className="p-1.5 rounded-lg border transition-colors hover:bg-red-50 dark:hover:bg-red-950/10"
                              title="Xóa nhân viên"
                              style={{ color: "#ef4444", borderColor: "var(--border)" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {activeRestaurantId && totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Hiển thị {employees.length} trên {total} nhân viên
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}
              >
                ← Trước
              </button>
              <span className="px-4 py-2 text-sm font-semibold rounded-xl" style={{ color: "var(--text)" }}>
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* Create or Edit Employee Modal */}
      {(activeModal === "create" || activeModal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl shadow-xl transition-all border animate-in fade-in zoom-in-95 duration-200"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>
              {activeModal === "create" ? "Thêm nhân viên mới" : "Cập nhật thông tin nhân viên"}
            </h2>

            <form onSubmit={activeModal === "create" ? handleCreateSubmit : handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    disabled={activeModal === "edit"}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none border disabled:opacity-60"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                </div>

                {activeModal === "create" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Mật khẩu *</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                        style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Xác nhận mật khẩu *</label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                        style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Vai trò *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  >
                    <option value="Waiter">Phục vụ</option>
                    <option value="Kitchen Staff">Nhân viên bếp</option>
                    <option value="Cashier">Thu ngân</option>
                    <option value="Owner">Chủ sở hữu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Chức vụ *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Trạng thái *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors border"
                  style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--card)" }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >
                  {submitting ? "Đang xử lý..." : activeModal === "create" ? "Tạo nhân viên" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {activeModal === "detail" && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-xl border animate-in fade-in zoom-in-95 duration-200"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white" style={{ background: "var(--primary)" }}>
                {selectedEmployee.fullName.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{selectedEmployee.fullName}</h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>ID: {selectedEmployee.id}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Tên tài khoản:</span>
                <span style={{ color: "var(--text)" }}>{selectedEmployee.username}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Email:</span>
                <span style={{ color: "var(--text)" }}>{selectedEmployee.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Số điện thoại:</span>
                <span style={{ color: "var(--text)" }}>{selectedEmployee.phone || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Vai trò:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" 
                  style={{ color: ROLE_BADGE[selectedEmployee.role]?.color || "#6b7280", background: ROLE_BADGE[selectedEmployee.role]?.bg || "rgba(107,114,128,0.1)" }}>
                  {ROLE_BADGE[selectedEmployee.role]?.label || selectedEmployee.role}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Chức vụ:</span>
                <span style={{ color: "var(--text)" }}>{selectedEmployee.position}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Trạng thái:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" 
                  style={{ color: STATUS_BADGE[selectedEmployee.status]?.color || "#6b7280", background: STATUS_BADGE[selectedEmployee.status]?.bg || "rgba(107,114,128,0.1)" }}>
                  {STATUS_BADGE[selectedEmployee.status]?.label || selectedEmployee.status}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Ngày bắt đầu:</span>
                <span style={{ color: "var(--text)" }}>{new Date(selectedEmployee.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Lần đăng nhập cuối:</span>
                <span style={{ color: "var(--text)" }}>
                  {selectedEmployee.lastLogin 
                    ? new Date(selectedEmployee.lastLogin).toLocaleString("vi-VN") 
                    : "Chưa từng đăng nhập"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors border"
                style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--card)" }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {activeModal === "delete" && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl shadow-xl border animate-in fade-in zoom-in-95 duration-200"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center text-xl animate-pulse">
                ⚠️
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Xác nhận xóa</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Bạn có chắc chắn muốn xóa nhân viên <strong className="text-red-500">{selectedEmployee.fullName}</strong>?
                Tài khoản này sẽ bị ngừng kích hoạt và không thể truy cập hệ thống.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
                style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--card)" }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/10"
              >
                {submitting ? "Đang xóa..." : "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {activeModal === "resetPassword" && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl shadow-xl border animate-in fade-in zoom-in-95 duration-200"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>
              Đặt lại mật khẩu: {selectedEmployee.fullName}
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Mật khẩu mới phải đáp ứng điều kiện bảo mật (8+ ký tự, có chữ hoa, chữ thường và chữ số).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Mật khẩu mới *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={resetPwdData.newPassword}
                    onChange={(e) => setResetPwdData({ ...resetPwdData, newPassword: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border"
                    style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateTempPassword}
                    className="px-3 rounded-xl border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    style={{ color: "var(--text)", borderColor: "var(--border)", background: "var(--card)" }}
                  >
                    Tạo tự động
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  value={resetPwdData.confirmPassword}
                  onChange={(e) => setResetPwdData({ ...resetPwdData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                  style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors border"
                  style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--card)" }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >
                  {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
