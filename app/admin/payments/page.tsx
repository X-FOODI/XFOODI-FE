"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import axiosInstance from "@/lib/services/axiosInstance";
import { message, Spin, Input, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface PaymentTransaction {
  id: string;
  amount: number;
  status: number;
  paymentDate: string;
  transactionId: string | null;
  paymentMethod?: {
    code: string;
    name: string;
  };
  order?: {
    reference: string;
    totalAmount: number;
    restaurant?: {
      name: string;
      slug: string;
    };
  };
  reservation?: {
    confirmationCode: string;
    depositAmount: number;
    restaurant?: {
      name: string;
      slug: string;
    };
  };
}

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [user, page]);

  const fetchPayments = async (searchQuery = search, pageNum = page) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/payments/admin/list`, {
        params: { page: pageNum, limit: 15, search: searchQuery },
      });
      if (res.data?.success) {
        setPayments(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Lỗi khi lấy danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchPayments(val, 1);
  };

  const getStatusTag = (status: number) => {
    switch (status) {
      case 1: return <Tag color="success">Thành công</Tag>;
      case 0: return <Tag color="warning">Đang xử lý</Tag>;
      case -1: return <Tag color="error">Thất bại/Hủy</Tag>;
      default: return <Tag color="default">Không xác định</Tag>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              Quản lý giao dịch hệ thống
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {total} giao dịch đã được ghi nhận
            </p>
          </div>
          <div className="w-full sm:w-auto flex gap-2">
            <Input
              placeholder="Tìm mã đơn, mã GD..."
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
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Mã Giao Dịch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Nhà Hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tham chiếu</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Số tiền</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Trạng thái</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Ngày giờ</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const restaurant = p.order?.restaurant || p.reservation?.restaurant;
                  const reference = p.order?.reference || p.reservation?.confirmationCode;
                  const type = p.order ? "Đơn hàng" : (p.reservation ? "Đặt bàn" : "Khác");
                  
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-[var(--bg-base)]" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-medium" style={{ color: "var(--text)" }}>{p.transactionId || p.id.split('-')[0]}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.paymentMethod?.name || "Chưa rõ"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{restaurant?.name || "—"}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{restaurant?.slug ? `${restaurant.slug}.xfoodi.website` : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{type}: {reference || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(p.amount)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusTag(p.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm" style={{ color: "var(--text)" }}>{new Date(p.paymentDate).toLocaleDateString("vi-VN")}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(p.paymentDate).toLocaleTimeString("vi-VN")}</p>
                      </td>
                    </tr>
                  );
                })}
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
    </div>
  );
}
