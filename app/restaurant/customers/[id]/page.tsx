"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  DollarOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined
} from "@ant-design/icons";
import { message, Modal, Switch } from "antd";
import axiosInstance from "@/lib/services/axiosInstance";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";

interface CustomerDetails {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdDate: string;
}

interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  primaryColor: string;
  owner: {
    fullName: string;
    email: string;
  };
}

interface Stats {
  totalOrders: number;
  totalSpent: number;
  totalReservations: number;
}

interface OrderHistoryItem {
  id: string;
  reference: string;
  createdDate: string;
  totalAmount: number;
  status: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isAuthReady } = useAuth();
  const { loading: tenantLoading } = useTenant();

  // States
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ordersHistory, setOrdersHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false);
  
  // Modal State for status block blocker
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!isAuthReady || tenantLoading) return;
    if (!user) {
      router.replace(`/login-email?redirect=/restaurant/customers/${id}`);
      return;
    }
    
    axiosInstance
      .get<{ success: boolean; data: any }>("/restaurants/me")
      .then((res) => {
        setRestaurantInfo(res.data.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [isAuthReady, user, router, tenantLoading, id]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/restaurant/customers/${id}`);
      if (response.data?.success) {
        const { customer: c, stats: s, ordersHistory: oh } = response.data.data;
        setCustomer(c);
        setStats(s);
        setOrdersHistory(oh || []);
      } else {
        message.error("Không tìm thấy thông tin khách hàng");
        router.push("/restaurant/customers");
      }
    } catch (error: any) {
      console.error("Fetch customer detail error:", error);
      message.error(error.response?.data?.message || "Lỗi tải thông tin chi tiết");
      router.push("/restaurant/customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  // Handle customer active status toggle
  const handleStatusToggle = async (checked: boolean) => {
    setTogglingStatus(true);
    try {
      const response = await axiosInstance.patch(`/restaurant/customers/${id}/status`, {
        isActive: checked
      });

      if (response.data?.success) {
        setCustomer(prev => prev ? { ...prev, isActive: checked } : null);
        message.success(
          checked 
            ? "Đã mở khóa tài khoản khách hàng thành công!" 
            : "Đã khóa tài khoản khách hàng thành công!"
        );
      }
    } catch (error: any) {
      console.error("Toggle customer status error:", error);
      const msg = error.response?.data?.message || "Lỗi cập nhật trạng thái tài khoản";
      
      // If error is due to pending orders, show modal instead of simple toast
      if (error.response?.status === 400 && msg.includes("active orders")) {
        setErrorMessage(msg);
        setErrorModalOpen(true);
      } else {
        message.error(msg);
      }
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-primary border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="restaurant"
        restaurantName={restaurantInfo?.name ?? ""}
        userName={restaurantInfo?.owner?.fullName ?? user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={restaurantInfo?.name ?? user?.name ?? "đang tải..."}
          userName={restaurantInfo?.owner?.fullName ?? user?.name ?? ""}
          userEmail={restaurantInfo?.owner?.email ?? user?.email ?? ""}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Back Button */}
            <button
              onClick={() => router.push("/restaurant/customers")}
              className="flex items-center gap-2 transition-colors duration-200 group text-sm font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform duration-200" />
              Quay lại danh sách
            </button>

            {/* Page Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Customer Info Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="rounded-xl p-6 shadow-sm relative overflow-hidden border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  
                  {/* Card top gradient indicator */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-amber-600" />
                  
                  {/* Profile Avatar & Name */}
                  <div className="text-center pb-6 border-b mt-3" style={{ borderColor: "var(--border)" }}>
                    <div className="inline-block relative mb-4">
                      {customer.avatarUrl ? (
                        <img 
                          src={customer.avatarUrl} 
                          alt={customer.fullName} 
                          className="w-20 h-20 rounded-full object-cover border shadow-md"
                          style={{ borderColor: "var(--border)" }}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full flex items-center justify-center border shadow-md text-2xl" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                          <UserOutlined />
                        </div>
                      )}
                      {/* Status indicator on avatar */}
                      <span className={`absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full border-4 ${customer.isActive ? "bg-green-500" : "bg-red-500"}`} style={{ borderColor: "var(--card)" }} />
                    </div>
                    <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{customer.fullName}</h2>
                    <span className="text-xs font-semibold uppercase tracking-wider block mt-1" style={{ color: "var(--text-muted)" }}>Khách Hàng</span>
                  </div>

                  {/* Contact Information & Info Items */}
                  <div className="py-6 space-y-4 border-b" style={{ borderColor: "var(--border)" }}>
                    
                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <MailOutlined className="mt-1" style={{ color: "var(--text-muted)" }} />
                      <div>
                        <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Địa chỉ Email</span>
                        <span className="text-sm font-medium break-all" style={{ color: "var(--text)" }}>{customer.email}</span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                      <PhoneOutlined className="mt-1" style={{ color: "var(--text-muted)" }} />
                      <div>
                        <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Số điện thoại</span>
                        <span className="text-sm font-mono font-medium" style={{ color: "var(--text)" }}>{customer.phoneNumber}</span>
                      </div>
                    </div>

                    {/* Registration Date */}
                    <div className="flex items-start gap-3">
                      <CalendarOutlined className="mt-1" style={{ color: "var(--text-muted)" }} />
                      <div>
                        <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Ngày đăng ký</span>
                        <span className="text-sm font-mono font-medium" style={{ color: "var(--text)" }}>
                          {new Date(customer.createdDate).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Switcher Panel */}
                  <div className="pt-6 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                        {customer.isActive ? (
                          <>
                            <UnlockOutlined className="text-green-500" />
                            Tài khoản hoạt động
                          </>
                        ) : (
                          <>
                            <LockOutlined className="text-red-500" />
                            Tài khoản đang khóa
                          </>
                        )}
                      </span>
                      <span className="text-xs block mt-0.5" style={{ color: "var(--text-muted)" }}>Khóa tài khoản này tạm thời</span>
                    </div>

                    <Switch
                      checked={customer.isActive}
                      onChange={handleStatusToggle}
                      loading={togglingStatus}
                      className={customer.isActive ? "bg-green-500" : "bg-red-500"}
                    />
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: Statistics & Order History */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Stats Counter Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Stat 1: Total Orders */}
                  <div className="rounded-xl p-5 relative overflow-hidden shadow-sm border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tổng Đơn Hàng</span>
                      <div className="p-2 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-lg text-base">
                        <ShoppingOutlined />
                      </div>
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: "var(--text)" }}>{stats?.totalOrders || 0}</div>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Đơn đặt đồ ăn thành công & đang xử lý</p>
                  </div>

                  {/* Stat 2: Total Spent */}
                  <div className="rounded-xl p-5 relative overflow-hidden shadow-sm border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tổng Chi Tiêu</span>
                      <div className="p-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-base">
                        <DollarOutlined />
                      </div>
                    </div>
                    <div className="text-2xl font-black font-mono text-green-600">
                      ${stats?.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Tổng số tiền thanh toán thực tế</p>
                  </div>

                  {/* Stat 3: Total Reservations */}
                  <div className="rounded-xl p-5 relative overflow-hidden shadow-sm border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Lượt Đặt Bàn</span>
                      <div className="p-2 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-base">
                        <CalendarOutlined />
                      </div>
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: "var(--text)" }}>{stats?.totalReservations || 0}</div>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Số lượt đặt chỗ ăn tại nhà hàng</p>
                  </div>

                </div>

                {/* Order History Table Card */}
                <div className="rounded-xl p-6 shadow-sm border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-1.5 rounded-lg text-xs" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                      <HistoryOutlined />
                    </div>
                    <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Lịch Sử Đơn Hàng Gần Đây</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-bold uppercase tracking-wider border-b" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                          <th className="py-2.5 px-4">Mã đơn hàng</th>
                          <th className="py-2.5 px-4">Ngày đặt</th>
                          <th className="py-2.5 px-4 text-right">Tổng thanh toán</th>
                          <th className="py-2.5 px-4 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      
                      <tbody>
                        {ordersHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                              Khách hàng này chưa có đơn hàng nào.
                            </td>
                          </tr>
                        ) : (
                          ordersHistory.map((order) => (
                            <tr key={order.id} className="border-b transition-all" style={{ borderColor: "var(--border)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              
                              {/* Reference ID */}
                              <td className="py-3 px-4 font-semibold text-sm" style={{ color: "var(--text)" }}>
                                {order.reference}
                              </td>
                              
                              {/* Date */}
                              <td className="py-3 px-4 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                                {new Date(order.createdDate).toLocaleString("vi-VN")}
                              </td>
                              
                              {/* Total Amount */}
                              <td className="py-3 px-4 text-right text-sm font-bold font-mono text-primary">
                                ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              
                              {/* Status Badge */}
                              <td className="py-3 px-4 text-center">
                                {order.status === "COMPLETED" || order.status === "Completed" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold rounded-full">
                                    Hoàn thành
                                  </span>
                                ) : order.status === "CANCELLED" || order.status === "Cancelled" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 text-xs font-bold rounded-full">
                                    Đã hủy
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-500/10 text-orange-600 border border-orange-500/20 text-xs font-bold rounded-full">
                                    {order.status}
                                  </span>
                                )}
                              </td>

                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Error Alert Modal for Blocked Status Toggle */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-500 font-extrabold text-lg">
            <ExclamationCircleOutlined />
            Không Thể Khóa Tài Khoản!
          </div>
        }
        open={errorModalOpen}
        onOk={() => setErrorModalOpen(false)}
        onCancel={() => setErrorModalOpen(false)}
        okText="Tôi đã hiểu"
        cancelButtonProps={{ style: { display: "none" } }}
        okButtonProps={{ className: "bg-gray-800 hover:bg-gray-700 text-white font-bold" }}
        modalRender={(modal) => (
          <div className="dark-theme-modal">
            {modal}
          </div>
        )}
      >
        <div className="py-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {errorMessage}
          <p className="mt-3 text-xs font-semibold italic" style={{ color: "var(--text-muted)" }}>
            * Vui lòng xử lý hoặc chuyển trạng thái các đơn hàng đang xử lý của khách hàng này về Hoàn thành/Đã hủy trước khi thực hiện khóa tài khoản.
          </p>
        </div>
      </Modal>

      {/* Custom Styles for Dark/Light Theme Modal inside Antd */}
      <style jsx global>{`
        .dark-theme-modal .ant-modal-content {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
        }
        .dark-theme-modal .ant-modal-header {
          background-color: transparent !important;
          border-bottom: 1px solid #f3f4f6 !important;
          padding-bottom: 10px !important;
        }
        .dark-theme-modal .ant-modal-title {
          color: #111827 !important;
        }
        .dark-theme-modal .ant-modal-body {
          color: #374151 !important;
        }
        .dark-theme-modal .ant-modal-footer {
          border-top: 1px solid #f3f4f6 !important;
          padding-top: 10px !important;
        }
        .dark-theme-modal .ant-modal-close {
          color: #6b7280 !important;
        }

        /* Dark mode modal styles */
        .dark .dark-theme-modal .ant-modal-content {
          background-color: #18181b !important;
          border: 1px solid #27272a !important;
        }
        .dark .dark-theme-modal .ant-modal-header {
          border-bottom: 1px solid #27272a !important;
        }
        .dark .dark-theme-modal .ant-modal-title {
          color: #ffffff !important;
        }
        .dark .dark-theme-modal .ant-modal-body {
          color: #d4d4d8 !important;
        }
        .dark .dark-theme-modal .ant-modal-footer {
          border-top: 1px solid #27272a !important;
        }
        .dark .dark-theme-modal .ant-modal-close {
          color: #a1a1aa !important;
        }
        .dark .dark-theme-modal .ant-modal-close:hover {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
