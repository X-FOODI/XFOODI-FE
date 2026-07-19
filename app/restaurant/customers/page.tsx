"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SearchOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { message } from "antd";
import * as XLSX from "xlsx";
import axiosInstance from "@/lib/services/axiosInstance";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdDate: string;
  totalOrders: number;
  totalSpent: number;
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

export default function CustomerManagementPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { loading: tenantLoading } = useTenant();
  
  // State variables
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 10;

  useEffect(() => {
    if (!isAuthReady || tenantLoading) return;
    if (!user) {
      router.replace("/login-email?redirect=/restaurant/customers");
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
  }, [isAuthReady, user, router, tenantLoading]);

  // Fetch customers from backend API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/restaurant/customers", {
        params: {
          page,
          limit,
          search: search || undefined,
          status: status !== "all" ? status : undefined,
          sortBy,
          sortOrder
        }
      });

      if (response.data?.success) {
        const { customers: list, pagination } = response.data.data;
        setCustomers(list || []);
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || 0);
      } else {
        message.error("Không thể tải danh sách khách hàng");
      }
    } catch (error: any) {
      console.error("Fetch customers error:", error);
      message.error(error.response?.data?.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, status, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setSortBy("fullName");
    setSortOrder("asc");
    setPage(1);
  };

  // Toggle sort order or field
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Export all current customers in table to Excel file
  const handleExportExcel = () => {
    if (customers.length === 0) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }

    try {
      const dataToExport = customers.map(c => ({
        "Họ và Tên": c.fullName,
        "Email": c.email,
        "Số điện thoại": c.phoneNumber,
        "Tổng đơn hàng": c.totalOrders,
        "Tổng chi tiêu ($)": c.totalSpent,
        "Trạng thái": c.isActive ? "Hoạt động" : "Bị khóa",
        "Ngày tham gia": new Date(c.createdDate).toLocaleDateString("vi-VN")
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Auto-fit column widths
      const maxLens = Object.keys(dataToExport[0]).map(key => {
        let maxLen = key.length;
        dataToExport.forEach(row => {
          const val = String((row as any)[key] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 4 };
      });
      worksheet["!cols"] = maxLens;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Khách hàng");
      XLSX.writeFile(workbook, `XFOODI_Danh_Sach_Khach_Hang_${new Date().toISOString().split('T')[0]}.xlsx`);
      message.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Export Excel error:", error);
      message.error("Lỗi xuất file Excel");
    }
  };

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
            
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                  Quản Lý Khách Hàng
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Xem danh sách, kiểm tra chi tiết giao dịch, đặt bàn và quản lý trạng thái tài khoản khách hàng.
                </p>
              </div>
              
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm border"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <DownloadOutlined />
                Xuất Excel
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="rounded-xl p-4 shadow-sm border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search Input */}
                <div className="relative w-full md:max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: "var(--text-muted)" }}>
                    <SearchOutlined />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm tên, email hoặc số điện thoại..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg py-2 pl-9 pr-4 text-sm outline-none transition-all duration-200 border"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                  />
                </div>

                {/* Filter Dropdown & Control Buttons */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Trạng thái:</span>
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-200 border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Đang khóa</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm text-sm"
                    style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                  >
                    Tìm kiếm
                  </button>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="p-2 rounded-lg transition-all duration-200 text-sm border"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                    title="Làm mới bộ lọc"
                  >
                    <ReloadOutlined />
                  </button>
                </div>
              </form>
            </div>

            {/* Customer Table Container */}
            <div className="rounded-xl overflow-hidden shadow-sm border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  
                  {/* Table Headers */}
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-wider border-b" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      <th className="py-3.5 px-6">Avatar</th>
                      
                      {/* Sortable Header Name */}
                      <th 
                        onClick={() => handleSort("fullName")}
                        className="py-3.5 px-6 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-center gap-1.5">
                          Khách hàng
                          {sortBy === "fullName" && (
                            sortOrder === "asc" ? <ArrowUpOutlined className="text-[10px]" /> : <ArrowDownOutlined className="text-[10px]" />
                          )}
                        </div>
                      </th>
                      
                      <th className="py-3.5 px-6">Email</th>
                      <th className="py-3.5 px-6">Số điện thoại</th>
                      
                      {/* Sortable Header Total Orders */}
                      <th 
                        onClick={() => handleSort("totalOrders")}
                        className="py-3.5 px-6 cursor-pointer transition-colors duration-200 text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Đơn hàng
                          {sortBy === "totalOrders" && (
                            sortOrder === "asc" ? <ArrowUpOutlined className="text-[10px]" /> : <ArrowDownOutlined className="text-[10px]" />
                          )}
                        </div>
                      </th>
                      
                      {/* Sortable Header Total Spent */}
                      <th 
                        onClick={() => handleSort("totalSpent")}
                        className="py-3.5 px-6 cursor-pointer transition-colors duration-200 text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Chi tiêu
                          {sortBy === "totalSpent" && (
                            sortOrder === "asc" ? <ArrowUpOutlined className="text-[10px]" /> : <ArrowDownOutlined className="text-[10px]" />
                          )}
                        </div>
                      </th>
                      
                      <th className="py-3.5 px-6 text-center">Trạng thái</th>
                      <th className="py-3.5 px-6">Ngày đăng ký</th>
                    </tr>
                  </thead>
                  
                  {/* Table Body */}
                  <tbody>
                    {loading ? (
                      // Skeleton Rows
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse border-b" style={{ borderColor: "var(--border)" }}>
                          <td className="py-4 px-6"><div className="w-9 h-9 rounded-full" style={{ background: "var(--surface)" }} /></td>
                          <td className="py-4 px-6"><div className="h-4 rounded w-28" style={{ background: "var(--surface)" }} /></td>
                          <td className="py-4 px-6"><div className="h-4 rounded w-36" style={{ background: "var(--surface)" }} /></td>
                          <td className="py-4 px-6"><div className="h-4 rounded w-24" style={{ background: "var(--surface)" }} /></td>
                          <td className="py-4 px-6"><div className="h-4 rounded w-12 ml-auto" style={{ background: "var(--surface)" }} /></td>
                          <td className="py-4 px-6"><div className="h-4 rounded w-16 ml-auto" style={{ background: "var(--surface)" }} /></td>
                          <td className="py-4 px-6 text-center"><div className="h-6 rounded-full w-20 mx-auto" style={{ background: "var(--surface)" }} /></td>
                          <td className="py-4 px-6"><div className="h-4 rounded w-20" style={{ background: "var(--surface)" }} /></td>
                        </tr>
                      ))
                    ) : customers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center font-medium" style={{ color: "var(--text-muted)" }}>
                          Không tìm thấy dữ liệu khách hàng phù hợp.
                        </td>
                      </tr>
                    ) : (
                      customers.map((customer) => (
                        <tr 
                          key={customer.id} 
                          onClick={() => router.push(`/restaurant/customers/${customer.id}`)}
                          className="cursor-pointer transition-all border-b"
                          style={{ borderColor: "var(--border)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Avatar */}
                          <td className="py-3.5 px-6">
                            {customer.avatarUrl ? (
                              <img 
                                src={customer.avatarUrl} 
                                alt={customer.fullName} 
                                className="w-9 h-9 rounded-full object-cover border shadow-sm"
                                style={{ borderColor: "var(--border)" }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full flex items-center justify-center border shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                                <UserOutlined />
                              </div>
                            )}
                          </td>
                          
                          {/* Name */}
                          <td className="py-3.5 px-6 font-semibold" style={{ color: "var(--text)" }}>
                            {customer.fullName || <span style={{ color: "var(--text-muted)" }} className="italic">Chưa có tên</span>}
                          </td>
                          
                          {/* Email */}
                          <td className="py-3.5 px-6 text-sm" style={{ color: "var(--text-muted)" }}>{customer.email}</td>
                          
                          {/* Phone */}
                          <td className="py-3.5 px-6 text-sm font-mono" style={{ color: "var(--text-muted)" }}>{customer.phoneNumber}</td>
                          
                          {/* Total Orders */}
                          <td className="py-3.5 px-6 text-right font-mono font-semibold" style={{ color: "var(--text)" }}>{customer.totalOrders}</td>
                          
                          {/* Total Spent */}
                          <td className="py-3.5 px-6 text-right font-mono font-bold" style={{ color: "var(--primary)" }}>
                            ${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          
                          {/* Status Badge */}
                          <td className="py-3.5 px-6 text-center">
                            {customer.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold rounded-full">
                                <CheckCircleOutlined className="text-[10px]" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 text-xs font-bold rounded-full">
                                <CloseCircleOutlined className="text-[10px]" />
                                Bị khóa
                              </span>
                            )}
                          </td>
                          
                          {/* Created Date */}
                          <td className="py-3.5 px-6 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                            {new Date(customer.createdDate).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="border-t px-6 py-3.5 flex items-center justify-between gap-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Hiển thị <span className="font-semibold" style={{ color: "var(--text)" }}>{customers.length}</span> trên <span className="font-semibold" style={{ color: "var(--text)" }}>{totalItems}</span> khách hàng
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1 || loading}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 border"
                      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      <LeftOutlined />
                    </button>
                    
                    <span className="text-sm font-bold px-2" style={{ color: "var(--text)" }}>
                      Trang {page} / {totalPages}
                    </span>

                    <button
                      disabled={page === totalPages || loading}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 border"
                      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      <RightOutlined />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
