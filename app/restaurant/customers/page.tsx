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

export default function CustomerManagementPage() {
  const router = useRouter();
  
  // State variables
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
    <div className="min-h-screen bg-[#0d0907] text-white p-6 md:p-10">
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Quản Lý Khách Hàng
            </h1>
            <p className="text-zinc-400 text-sm mt-1.5">
              Xem danh sách, kiểm tra chi tiết giao dịch, đặt bàn và quản lý trạng thái tài khoản khách hàng.
            </p>
          </div>
          
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl font-bold transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          >
            <DownloadOutlined />
            Xuất Excel
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <SearchOutlined />
              </span>
              <input
                type="text"
                placeholder="Tìm tên, email hoặc số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-[var(--primary)]/60 focus:ring-1 focus:ring-[var(--primary)]/20 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200"
              />
            </div>

            {/* Filter Dropdown & Control Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Trạng thái:</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="bg-zinc-950/60 border border-zinc-800 focus:border-[var(--primary)]/60 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors duration-200"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Đang khóa</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[#ff5722] text-white rounded-xl font-bold transition-all duration-200 shadow-[0_3px_10px_rgba(255,56,11,0.2)] text-sm"
              >
                Tìm kiếm
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all duration-200 text-sm"
                title="Làm mới bộ lọc"
              >
                <ReloadOutlined />
              </button>
            </div>
          </form>
        </div>

        {/* Customer Table Container */}
        <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              
              {/* Table Headers */}
              <thead>
                <tr className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Avatar</th>
                  
                  {/* Sortable Header Name */}
                  <th 
                    onClick={() => handleSort("fullName")}
                    className="py-4 px-6 cursor-pointer hover:text-white transition-colors duration-200"
                  >
                    <div className="flex items-center gap-1.5">
                      Khách hàng
                      {sortBy === "fullName" && (
                        sortOrder === "asc" ? <ArrowUpOutlined className="text-[10px]" /> : <ArrowDownOutlined className="text-[10px]" />
                      )}
                    </div>
                  </th>
                  
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Số điện thoại</th>
                  
                  {/* Sortable Header Total Orders */}
                  <th 
                    onClick={() => handleSort("totalOrders")}
                    className="py-4 px-6 cursor-pointer hover:text-white transition-colors duration-200 text-right"
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
                    className="py-4 px-6 cursor-pointer hover:text-white transition-colors duration-200 text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Chi tiêu
                      {sortBy === "totalSpent" && (
                        sortOrder === "asc" ? <ArrowUpOutlined className="text-[10px]" /> : <ArrowDownOutlined className="text-[10px]" />
                      )}
                    </div>
                  </th>
                  
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6">Ngày đăng ký</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  // Skeleton Rows
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-5 px-6"><div className="w-10 h-10 bg-zinc-800 rounded-full" /></td>
                      <td className="py-5 px-6"><div className="h-4 bg-zinc-800 rounded w-28" /></td>
                      <td className="py-5 px-6"><div className="h-4 bg-zinc-800 rounded w-36" /></td>
                      <td className="py-5 px-6"><div className="h-4 bg-zinc-800 rounded w-24" /></td>
                      <td className="py-5 px-6"><div className="h-4 bg-zinc-800 rounded w-12 ml-auto" /></td>
                      <td className="py-5 px-6"><div className="h-4 bg-zinc-800 rounded w-16 ml-auto" /></td>
                      <td className="py-5 px-6 text-center"><div className="h-6 bg-zinc-800 rounded-full w-20 mx-auto" /></td>
                      <td className="py-5 px-6"><div className="h-4 bg-zinc-800 rounded w-20" /></td>
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-medium">
                      Không tìm thấy dữ liệu khách hàng phù hợp.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      onClick={() => router.push(`/restaurant/customers/${customer.id}`)}
                      className="hover:bg-zinc-800/30 cursor-pointer transition-all duration-150 border-b border-zinc-800/30"
                    >
                      {/* Avatar */}
                      <td className="py-4 px-6">
                        {customer.avatarUrl ? (
                          <img 
                            src={customer.avatarUrl} 
                            alt={customer.fullName} 
                            className="w-10 h-10 rounded-full object-cover border border-zinc-800 shadow-md"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-700 shadow-md">
                            <UserOutlined />
                          </div>
                        )}
                      </td>
                      
                      {/* Name */}
                      <td className="py-4 px-6 font-semibold text-zinc-100 hover:text-[var(--primary)] transition-colors">
                        {customer.fullName}
                      </td>
                      
                      {/* Email */}
                      <td className="py-4 px-6 text-zinc-400 text-sm">{customer.email}</td>
                      
                      {/* Phone */}
                      <td className="py-4 px-6 text-zinc-400 text-sm font-mono">{customer.phoneNumber}</td>
                      
                      {/* Total Orders */}
                      <td className="py-4 px-6 text-right font-mono text-zinc-300 font-semibold">{customer.totalOrders}</td>
                      
                      {/* Total Spent */}
                      <td className="py-4 px-6 text-right font-mono text-[var(--primary)] font-bold">
                        ${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      
                      {/* Status Badge */}
                      <td className="py-4 px-6 text-center">
                        {customer.isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold rounded-full">
                            <CheckCircleOutlined className="text-[10px]" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-full">
                            <CloseCircleOutlined className="text-[10px]" />
                            Bị khóa
                          </span>
                        )}
                      </td>
                      
                      {/* Created Date */}
                      <td className="py-4 px-6 text-zinc-500 text-xs font-mono">
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
            <div className="bg-zinc-900/40 border-t border-zinc-800 px-6 py-4 flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-400">
                Hiển thị <span className="font-semibold text-white">{customers.length}</span> trên <span className="font-semibold text-white">{totalItems}</span> khách hàng
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg disabled:opacity-40 disabled:hover:border-zinc-800 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <LeftOutlined />
                </button>
                
                <span className="text-sm text-zinc-300 font-bold px-3">
                  Trang {page} / {totalPages}
                </span>

                <button
                  disabled={page === totalPages || loading}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg disabled:opacity-40 disabled:hover:border-zinc-800 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <RightOutlined />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
