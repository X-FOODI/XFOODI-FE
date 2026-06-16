"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { message, Modal, Input, Select, Button, Table, Tag, Space, DatePicker } from "antd";
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from "@ant-design/icons";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";

interface OrderItem {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  price: number;
  note: string | null;
  status: string;
  statusName: string;
}

interface Order {
  id: string;
  reference: string;
  subTotal: number;
  totalAmount: number;
  createdAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  isPaid: boolean;
  table: string;
  tableId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Guard redirection if not logged in
  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace("/login?redirect=/restaurant/orders");
    }
  }, [isAuthReady, user, router]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      
      const res = await axiosInstance.get("/orders", { params });
      if (res.data?.success) {
        setOrders(res.data.data || []);
      } else {
        message.error("Không thể tải danh sách đơn hàng");
      }
    } catch (err: any) {
      console.error("[OrderHistory] Fetch error:", err);
      message.error(err.response?.data?.message || "Lỗi khi lấy danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setActionLoading(true);
      const res = await axiosInstance.patch(`/orders/${orderId}/status`, { status: nextStatus });
      if (res.data?.success) {
        message.success("Cập nhật trạng thái đơn hàng thành công");
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => prev ? { ...prev, status: nextStatus as any } : null);
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Tag color="gold">Chờ xác nhận</Tag>;
      case "CONFIRMED":
        return <Tag color="blue">Đã xác nhận</Tag>;
      case "COMPLETED":
        return <Tag color="green">Hoàn thành</Tag>;
      case "CANCELLED":
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      o.reference.toLowerCase().includes(searchLower) ||
      (o.table && o.table.toLowerCase().includes(searchLower)) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "reference",
      key: "reference",
      render: (text: string, record: Order) => (
        <span className="font-mono font-bold text-gray-900 dark:text-white">{text}</span>
      ),
    },
    {
      title: "Bàn ăn",
      dataIndex: "table",
      key: "table",
      render: (text: string) => (
        <span className="font-semibold text-gray-700 dark:text-zinc-300">{text}</span>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => (
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          {new Date(text).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: Order) => (
        <div className="text-xs">
          <p className="font-semibold text-gray-800 dark:text-zinc-200">{record.customerName || "Khách vãng lai"}</p>
          {record.customerPhone && <p className="text-gray-500 dark:text-zinc-400">{record.customerPhone}</p>}
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => (
        <span className="font-extrabold text-gray-950 dark:text-white">
          {amount.toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "isPaid",
      key: "isPaid",
      render: (isPaid: boolean) => (
        isPaid ? (
          <Tag color="success">Đã thanh toán</Tag>
        ) : (
          <Tag color="error">Chưa thanh toán</Tag>
        )
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setIsDetailOpen(true);
            }}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-[#FF5A2C] border-t-transparent" />
      </div>
    );
  }

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
          <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col gap-6">
            
            {/* Header section */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Lịch sử đơn hàng</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Xem và quản lý tất cả đơn hàng phát sinh tại nhà hàng.
                </p>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchOrders}
                className="flex items-center gap-1.5"
              >
                Làm mới
              </Button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-[#1E293B]" style={{ borderColor: "var(--border)" }}>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "ALL", label: "Tất cả" },
                  { key: "PENDING", label: "Chờ xác nhận" },
                  { key: "CONFIRMED", label: "Đã xác nhận" },
                  { key: "COMPLETED", label: "Hoàn thành" },
                  { key: "CANCELLED", label: "Đã hủy" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setStatusFilter(t.key);
                      setPage(1);
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors border ${
                      statusFilter === t.key
                        ? "bg-[#FF5A2C] border-[#FF5A2C] text-white"
                        : "bg-transparent text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:max-w-xs">
                <Input
                  placeholder="Tìm theo mã đơn, bàn..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Table list */}
            <div className="rounded-xl border bg-white dark:bg-[#1E293B] overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <Table
                dataSource={filteredOrders}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                  current: page,
                  pageSize: limit,
                  onChange: (p, l) => {
                    setPage(p);
                    if (l) setLimit(l);
                  },
                }}
                className="dark:text-white"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Order Detail Modal */}
      <Modal
        title={
          <div className="pb-3 border-b border-gray-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              Chi tiết đơn hàng {selectedOrder?.reference}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Thời gian: {selectedOrder ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN") : ""}
            </p>
          </div>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={null}
        width={650}
        className="dark:bg-[#1E293B]"
      >
        {selectedOrder && (
          <div className="space-y-6 pt-4 dark:text-zinc-200">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800">
              <div>
                <p className="text-xs text-gray-400">BÀN ĂN</p>
                <p className="font-bold text-gray-800 dark:text-zinc-200 text-sm mt-0.5">{selectedOrder.table}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">TRẠNG THÁI ĐƠN</p>
                <div className="mt-0.5">{getStatusTag(selectedOrder.status)}</div>
              </div>
              <div>
                <p className="text-xs text-gray-400">KHÁCH HÀNG</p>
                <p className="font-bold text-gray-800 dark:text-zinc-200 text-sm mt-0.5">
                  {selectedOrder.customerName || "Khách vãng lai"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">THANH TOÁN</p>
                <div className="mt-0.5">
                  {selectedOrder.isPaid ? (
                    <Tag color="success">Đã thanh toán</Tag>
                  ) : (
                    <Tag color="error">Chưa thanh toán</Tag>
                  )}
                </div>
              </div>
            </div>

            {/* Order items list */}
            <div>
              <h4 className="font-bold text-sm text-gray-800 dark:text-zinc-200 mb-3 uppercase tracking-wider">Danh sách món</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#1E293B]"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {item.name} <span className="text-xs text-amber-500 font-bold ml-1">x{item.quantity}</span>
                      </p>
                      {item.note && (
                        <p className="text-xs text-red-500 italic mt-0.5">Ghi chú: {item.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Đơn giá: {item.price.toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary calculations */}
            <div className="space-y-2 border-t border-gray-100 dark:border-zinc-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Tạm tính:</span>
                <span className="font-semibold">{selectedOrder.subTotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Thuế GTGT (10%):</span>
                <span className="font-semibold">{(selectedOrder.totalAmount - selectedOrder.subTotal).toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-base border-t border-dashed border-gray-100 dark:border-zinc-800 pt-2 font-black">
                <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                <span className="text-[#FF5A2C]">{selectedOrder.totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            {/* Quick action buttons for status change */}
            {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (
              <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
                {selectedOrder.status === "PENDING" && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "CONFIRMED")}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 border-none h-11"
                  >
                    Xác nhận đơn
                  </Button>
                )}
                {selectedOrder.status === "CONFIRMED" && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "COMPLETED")}
                    disabled={actionLoading}
                    className="flex-1 bg-green-500 hover:bg-green-600 border-none h-11"
                  >
                    Hoàn thành đơn
                  </Button>
                )}
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleUpdateStatus(selectedOrder.id, "CANCELLED")}
                  disabled={actionLoading}
                  className="flex-1 h-11"
                >
                  Hủy đơn hàng
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
