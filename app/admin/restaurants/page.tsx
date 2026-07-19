"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import axiosInstance from "@/lib/services/axiosInstance";
import { Modal, Switch, message, Spin, Input } from "antd";
import { ExclamationCircleOutlined, SearchOutlined } from "@ant-design/icons";

interface RestaurantTenant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  status: 'ACTIVE' | 'DISABLED';
  disabledReason: string | null;
  createdAt: string;
  owner: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
}

export default function AdminTenantsPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    restaurant: RestaurantTenant | null;
    loading: boolean;
    reason: string;
  }>({
    visible: false,
    restaurant: null,
    loading: false,
    reason: "",
  });

  useEffect(() => {
    fetchRestaurants();
  }, [user, page]); // Re-fetch when page changes, but we will handle search manually

  const fetchRestaurants = async (searchQuery = search, pageNum = page) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/tenants/admin/list`, {
        params: { page: pageNum, limit: 15, search: searchQuery },
      });
      if (res.data?.success) {
        setRestaurants(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Lỗi khi lấy danh sách nhà hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchRestaurants(val, 1);
  };

  const handleToggleClick = (checked: boolean, restaurant: RestaurantTenant) => {
    if (!checked) {
      setConfirmModal({
        visible: true,
        restaurant,
        loading: false,
        reason: "",
      });
    } else {
      enableRestaurant(restaurant.id);
    }
  };

  const disableRestaurant = async (id: string, reason: string) => {
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      const res = await axiosInstance.patch(`/admin/restaurants/${id}/disable`, { reason });
      if (res.data?.success) {
        message.success(res.data.message);
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: 'DISABLED', disabledReason: reason } : r));
        setConfirmModal({ visible: false, restaurant: null, loading: false, reason: "" });
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Lỗi khi vô hiệu hóa");
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const enableRestaurant = async (id: string) => {
    try {
      const res = await axiosInstance.patch(`/admin/restaurants/${id}/enable`);
      if (res.data?.success) {
        message.success(res.data.message);
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: 'ACTIVE', disabledReason: null } : r));
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Lỗi khi kích hoạt lại");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              Quản lý danh sách nhà hàng
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {total} nhà hàng trên hệ thống
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Tìm tên, slug nhà hàng..."
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
          ) : restaurants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Không tìm thấy nhà hàng nào</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Nhà hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Chủ sở hữu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Liên hệ</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Ngày tham gia</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-[var(--bg-base)]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden" style={{ background: "var(--primary)" }}>
                          {r.logoUrl ? (
                            <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                          ) : (
                            r.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.name}</p>
                          <a href={`http://${r.slug}.xfoodi.website`} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
                            {r.slug}.xfoodi.website
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.owner?.fullName || "—"}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.owner?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ color: "var(--text)" }}>{r.phone || "—"}</p>
                      <p className="text-xs truncate max-w-[200px]" title={r.address || ""} style={{ color: "var(--text-muted)" }}>
                        {r.address || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Switch
                        checked={r.status === 'ACTIVE'}
                        onChange={(checked) => handleToggleClick(checked, r)}
                        style={{ background: r.status === 'ACTIVE' ? "var(--primary)" : "var(--border)" }}
                      />
                      {r.status === 'DISABLED' && r.disabledReason && (
                        <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate ml-auto" title={r.disabledReason}>
                          {r.disabledReason}
                        </div>
                      )}
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
            <span>Xác nhận vô hiệu hóa nhà hàng</span>
          </div>
        }
        open={confirmModal.visible}
        onCancel={() => !confirmModal.loading && setConfirmModal({ visible: false, restaurant: null, loading: false, reason: "" })}
        onOk={() => {
          if (confirmModal.restaurant) {
            const reason = confirmModal.reason.trim();
            if (!reason) {
              message.error("Vui lòng nhập lý do khóa");
              return;
            }
            if (reason.length < 10 || reason.length > 500) {
              message.error("Lý do khóa phải từ 10 đến 500 ký tự");
              return;
            }
            disableRestaurant(confirmModal.restaurant.id, reason);
          }
        }}
        okText="Vô hiệu hóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: confirmModal.loading }}
        cancelButtonProps={{ disabled: confirmModal.loading }}
      >
        <p>Bạn có chắc chắn muốn vô hiệu hóa nhà hàng <strong>{confirmModal.restaurant?.name}</strong>?</p>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Lý do vô hiệu hóa <span className="text-red-500">*</span></label>
          <Input.TextArea
            rows={3}
            value={confirmModal.reason}
            onChange={(e) => setConfirmModal(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Nhập lý do để thông báo qua email..."
          />
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Khi bị vô hiệu hóa, nhà hàng và toàn bộ nhân viên sẽ không thể đăng nhập. Subdomain <code>{confirmModal.restaurant?.slug}.xfoodi.website</code> cũng sẽ bị khóa tạm thời.
        </p>
      </Modal>
    </div>
  );
}
