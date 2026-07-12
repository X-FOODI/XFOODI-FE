"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import axiosInstance from "@/lib/services/axiosInstance";
import { Modal, Switch, message, Spin, Input, Tag } from "antd";
import { ExclamationCircleOutlined, SearchOutlined } from "@ant-design/icons";

interface SystemUser {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: boolean; // mapped from ACTIVE/BANNED
  createdAt: string;
  roles: string[];
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    sysUser: SystemUser | null;
    nextState: boolean;
    loading: boolean;
  }>({
    visible: false,
    sysUser: null,
    nextState: false,
    loading: false,
  });

  useEffect(() => {
    fetchUsers();
  }, [user, page]);

  const fetchUsers = async (searchQuery = search, pageNum = page) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/users/admin/list`, {
        params: { page: pageNum, limit: 15, search: searchQuery },
      });
      if (res.data?.success) {
        setUsers(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Lỗi khi lấy danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchUsers(val, 1);
  };

  const handleToggleClick = (checked: boolean, sysUser: SystemUser) => {
    if (!checked) {
      setConfirmModal({
        visible: true,
        sysUser,
        nextState: false,
        loading: false,
      });
    } else {
      updateStatus(sysUser.id, true);
    }
  };

  const updateStatus = async (id: string, isActive: boolean) => {
    try {
      if (!isActive) setConfirmModal(prev => ({ ...prev, loading: true }));
      
      const res = await axiosInstance.patch(`/users/admin/${id}/status`, { isActive });
      if (res.data?.success) {
        message.success(res.data.message);
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: isActive } : u));
        setConfirmModal({ visible: false, sysUser: null, nextState: false, loading: false });
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
      if (!isActive) setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "System Admin": return "red";
      case "SuperAdmin": return "volcano";
      case "Admin": return "orange";
      case "Owner": return "blue";
      case "Manager": return "cyan";
      case "Staff": return "green";
      case "Customer": return "default";
      default: return "default";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              Quản lý tài khoản
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {total} người dùng trên hệ thống
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Tìm theo tên, email..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="w-full sm:w-72"
              onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
              onChange={(e) => {
                if (e.target.value === "") handleSearch(""); // clear search
              }}
              allowClear
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden shadow-sm overflow-x-auto" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Spin size="large" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Không tìm thấy tài khoản nào</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Người dùng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Liên hệ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Vai trò</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Ngày tham gia</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[var(--bg-base)]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden" style={{ background: "var(--primary)" }}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName || "User"} className="w-full h-full object-cover" />
                          ) : (
                            (u.fullName || u.email).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{u.fullName || "Chưa cập nhật"}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ color: "var(--text)" }}>{u.phoneNumber || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length > 0 ? u.roles.map(role => (
                          <Tag color={getRoleColor(role)} key={role}>{role}</Tag>
                        )) : <span className="text-xs text-gray-400">Không có</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Switch
                        checked={u.status}
                        onChange={(checked) => handleToggleClick(checked, u)}
                        style={{ background: u.status ? "var(--primary)" : "var(--border)" }}
                        disabled={u.id === user?.id} // Cannot disable self
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}>
              ←
            </button>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Trang {page} / {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}>
              →
            </button>
          </div>
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-red-500">
            <ExclamationCircleOutlined />
            <span>Xác nhận khóa tài khoản</span>
          </div>
        }
        open={confirmModal.visible}
        onCancel={() => !confirmModal.loading && setConfirmModal({ visible: false, sysUser: null, nextState: false, loading: false })}
        onOk={() => {
          if (confirmModal.sysUser) {
            updateStatus(confirmModal.sysUser.id, false);
          }
        }}
        okText="Khóa tài khoản"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: confirmModal.loading }}
        cancelButtonProps={{ disabled: confirmModal.loading }}
      >
        <p>Bạn có chắc chắn muốn khóa tài khoản <strong>{confirmModal.sysUser?.fullName || confirmModal.sysUser?.email}</strong>?</p>
        <p className="text-sm text-gray-500 mt-2">
          Khi bị khóa, người dùng sẽ bị đăng xuất khỏi tất cả các thiết bị và không thể đăng nhập lại vào bất kỳ nhà hàng nào trên nền tảng.
        </p>
      </Modal>
    </div>
  );
}
