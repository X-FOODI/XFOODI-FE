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

interface CustomerDetails {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdDate: string;
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

  // States
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ordersHistory, setOrdersHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false);
  
  // Modal State for status block blocker
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

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
      <div className="min-h-screen bg-[#0d0907] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Đang tải thông tin chi tiết khách hàng...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0d0907] text-white p-6 md:p-10">
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/restaurant/customers")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 mb-6 group text-sm font-semibold"
        >
          <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform duration-200" />
          Quay lại danh sách
        </button>

        {/* Page Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Customer Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              
              {/* Card top gradient indicator */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--primary)] to-amber-600" />
              
              {/* Profile Avatar & Name */}
              <div className="text-center pb-6 border-b border-zinc-800/60 mt-3">
                <div className="inline-block relative mb-4">
                  {customer.avatarUrl ? (
                    <img 
                      src={customer.avatarUrl} 
                      alt={customer.fullName} 
                      className="w-24 h-24 rounded-full object-cover border-2 border-zinc-800 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 border-2 border-zinc-700 shadow-lg text-3xl">
                      <UserOutlined />
                    </div>
                  )}
                  {/* Status indicator on avatar */}
                  <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#0d0907] ${customer.isActive ? "bg-green-500" : "bg-red-500"}`} />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">{customer.fullName}</h2>
                <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mt-1">Khách Hàng</span>
              </div>

              {/* Contact Information & Info Items */}
              <div className="py-6 space-y-4 border-b border-zinc-800/60">
                
                {/* Email */}
                <div className="flex items-start gap-3">
                  <MailOutlined className="text-zinc-500 mt-1" />
                  <div>
                    <span className="text-zinc-500 text-xs block">Địa chỉ Email</span>
                    <span className="text-zinc-200 text-sm font-medium break-all">{customer.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <PhoneOutlined className="text-zinc-500 mt-1" />
                  <div>
                    <span className="text-zinc-500 text-xs block">Số điện thoại</span>
                    <span className="text-zinc-200 text-sm font-mono font-medium">{customer.phoneNumber}</span>
                  </div>
                </div>

                {/* Registration Date */}
                <div className="flex items-start gap-3">
                  <CalendarOutlined className="text-zinc-500 mt-1" />
                  <div>
                    <span className="text-zinc-500 text-xs block">Ngày đăng ký</span>
                    <span className="text-zinc-200 text-sm font-mono font-medium">
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
                  <span className="text-zinc-200 font-semibold text-sm flex items-center gap-1.5">
                    {customer.isActive ? (
                      <>
                        <UnlockOutlined className="text-green-400" />
                        Tài khoản hoạt động
                      </>
                    ) : (
                      <>
                        <LockOutlined className="text-red-400" />
                        Tài khoản đang khóa
                      </>
                    )}
                  </span>
                  <span className="text-zinc-500 text-xs block mt-0.5">Khóa tài khoản này tạm thời</span>
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
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Tổng Đơn Hàng</span>
                  <div className="p-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl text-lg">
                    <ShoppingOutlined />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono text-zinc-100">{stats?.totalOrders || 0}</div>
                <p className="text-zinc-500 text-[11px] mt-1">Đơn đặt đồ ăn thành công & đang xử lý</p>
              </div>

              {/* Stat 2: Total Spent */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-600/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Tổng Chi Tiêu</span>
                  <div className="p-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-lg">
                    <DollarOutlined />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono text-green-400">
                  ${stats?.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
                <p className="text-zinc-500 text-[11px] mt-1">Tổng số tiền thanh toán thực tế</p>
              </div>

              {/* Stat 3: Total Reservations */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Lượt Đặt Bàn</span>
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-lg">
                    <CalendarOutlined />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono text-zinc-100">{stats?.totalReservations || 0}</div>
                <p className="text-zinc-500 text-[11px] mt-1">Số lượt đặt chỗ ăn tại nhà hàng</p>
              </div>

            </div>

            {/* Order History Table Card */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-800 text-zinc-200 rounded-lg text-sm">
                  <HistoryOutlined />
                </div>
                <h3 className="text-lg font-bold text-zinc-100">Lịch Sử Đơn Hàng Gần Đây</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/40 border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Mã đơn hàng</th>
                      <th className="py-3 px-4">Ngày đặt</th>
                      <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-zinc-800/50">
                    {ordersHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm font-medium">
                          Khách hàng này chưa có đơn hàng nào.
                        </td>
                      </tr>
                    ) : (
                      ordersHistory.map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-800/20 border-b border-zinc-800/20 transition-all">
                          
                          {/* Reference ID */}
                          <td className="py-3.5 px-4 font-semibold text-zinc-200 text-sm">
                            {order.reference}
                          </td>
                          
                          {/* Date */}
                          <td className="py-3.5 px-4 text-zinc-400 text-xs font-mono">
                            {new Date(order.createdDate).toLocaleString("vi-VN")}
                          </td>
                          
                          {/* Total Amount */}
                          <td className="py-3.5 px-4 text-right text-sm font-bold font-mono text-[var(--primary)]">
                            ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          
                          {/* Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {order.status === "COMPLETED" || order.status === "Completed" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold rounded-full">
                                Hoàn thành
                              </span>
                            ) : order.status === "CANCELLED" || order.status === "Cancelled" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-full">
                                Đã hủy
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold rounded-full">
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
        okButtonProps={{ className: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 font-bold" }}
        modalRender={(modal) => (
          <div className="dark-theme-modal">
            {modal}
          </div>
        )}
      >
        <div className="py-4 text-zinc-300 text-sm leading-relaxed">
          {errorMessage}
          <p className="mt-3 text-xs text-zinc-500 font-semibold italic">
            * Vui lòng xử lý hoặc chuyển trạng thái các đơn hàng đang xử lý của khách hàng này về Hoàn thành/Đã hủy trước khi thực hiện khóa tài khoản.
          </p>
        </div>
      </Modal>

      {/* Custom Styles for Dark Theme Modal inside Antd */}
      <style jsx global>{`
        .dark-theme-modal .ant-modal-content {
          background-color: #18181b !important;
          border: 1px solid #27272a !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
        }
        .dark-theme-modal .ant-modal-header {
          background-color: transparent !important;
          border-bottom: 1px solid #27272a !important;
          padding-bottom: 12px !important;
        }
        .dark-theme-modal .ant-modal-title {
          color: #ffffff !important;
        }
        .dark-theme-modal .ant-modal-close {
          color: #a1a1aa !important;
        }
        .dark-theme-modal .ant-modal-close:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .dark-theme-modal .ant-modal-body {
          color: #d4d4d8 !important;
        }
        .dark-theme-modal .ant-modal-footer {
          border-top: 1px solid #27272a !important;
          padding-top: 12px !important;
          margin-top: 12px !important;
        }
      `}</style>
    </div>
  );
}
