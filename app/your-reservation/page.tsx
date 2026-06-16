"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Spin, Badge, Tag, Empty } from "antd";
import { SearchOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Header from "../components/Header";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import reservationService, { Reservation } from "@/lib/services/reservationService";

export default function YourReservationsPage() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const brandColor = tenant?.primaryColor || "#FF380B";

  useEffect(() => {
    if (!tenant) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token) {
      // Authenticated: Load my reservations
      reservationService.getMy(tenant.id)
        .then((data) => {
          // Sort by date descending
          const sorted = [...data].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setReservations(sorted);
        })
        .catch((err) => {
          showToast("error", "Lỗi", err?.response?.data?.message || "Không thể tải danh sách đặt bàn");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Guest: Just stop loading and show search form
      setLoading(false);
    }
  }, [tenant]);

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) {
      showToast("warning", "Nhập mã", "Vui lòng nhập mã xác nhận 6 ký tự");
      return;
    }

    const code = searchCode.trim().toUpperCase();
    if (code.length !== 6) {
      showToast("warning", "Mã không hợp lệ", "Mã xác nhận phải có đúng 6 ký tự");
      return;
    }

    setSearchLoading(true);
    try {
      const res = await reservationService.getByCode(code);
      if (res && res.id) {
        showToast("success", "Tìm thấy đặt bàn", "Đang chuyển hướng...");
        router.push(`/your-reservation/${code}`);
      } else {
        showToast("error", "Không tìm thấy", "Không tìm thấy thông tin đặt bàn với mã này");
      }
    } catch (err: any) {
      showToast("error", "Lỗi tra cứu", err?.response?.data?.message || "Không tìm thấy thông tin đặt bàn");
    } finally {
      setSearchLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <Tag color="warning" className="px-2 py-0.5 rounded-md text-xs font-semibold">Chờ xác nhận</Tag>;
      case "CONFIRMED":
        return <Tag color="success" className="px-2 py-0.5 rounded-md text-xs font-semibold">Đã xác nhận</Tag>;
      case "CHECKED_IN":
        return <Tag color="processing" className="px-2 py-0.5 rounded-md text-xs font-semibold">Đã nhận bàn</Tag>;
      case "COMPLETED":
        return <Tag color="default" className="px-2 py-0.5 rounded-md text-xs font-semibold">Hoàn thành</Tag>;
      case "CANCELLED":
        return <Tag color="error" className="px-2 py-0.5 rounded-md text-xs font-semibold">Đã hủy</Tag>;
      default:
        return <Tag color="default" className="px-2 py-0.5 rounded-md text-xs font-semibold">{status}</Tag>;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long"
    });
  };

  const token = typeof window !== 'undefined' ? (localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")) : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 md:py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Spin size="large" />
            <p className="mt-4 text-xs text-[var(--text-muted)]">Đang tải lịch sử đặt bàn...</p>
          </div>
        ) : token ? (
          // Authenticated State
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-3xl">Lịch sử đặt bàn</h1>
                <p className="text-xs text-[var(--text-muted)] mt-1">Xem danh sách các lịch đặt bàn của bạn tại {tenant?.name || "nhà hàng"}</p>
              </div>
              <Button
                type="primary"
                onClick={() => router.push("/restaurant/reservations/new")}
                className="rounded-xl h-11 px-6 font-bold border-none shadow-lg shadow-orange-500/10"
                style={{ background: brandColor, color: "#fff" }}
              >
                Đặt bàn mới
              </Button>
            </div>

            {reservations.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center shadow-sm">
                <Empty
                  description={
                    <span className="text-[var(--text-muted)] text-sm">Bạn chưa có lịch đặt bàn nào</span>
                  }
                />
                <Button
                  onClick={() => router.push("/restaurant/reservations/new")}
                  className="mt-6 rounded-xl h-10 px-6 border-[var(--border)] text-[var(--text)] bg-transparent font-bold hover:bg-neutral-800"
                >
                  Đặt bàn ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((res) => {
                  const isDepositPaid = res.payments?.some(p => p.status === 1) || false;
                  return (
                    <div
                      key={res.id}
                      onClick={() => router.push(`/your-reservation/${res.id}`)}
                      className="bg-[var(--card)] border border-[var(--border)] hover:border-neutral-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[var(--text)] bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 uppercase">
                            Mã: {res.confirmationCode || res.id.slice(0, 6)}
                          </span>
                          {getStatusTag(res.statusValue?.code || "PENDING")}
                          {Number(res.depositAmount) > 0 && (
                            <Tag color={isDepositPaid ? "blue" : "volcano"} className="px-2 py-0.5 rounded-md text-xs font-semibold">
                              {isDepositPaid ? "Đã cọc" : "Chưa cọc"}
                            </Tag>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-[var(--text)] font-semibold">
                            <CalendarOutlined style={{ color: brandColor }} />
                            <span>{formatDateTime(res.time)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <UserOutlined />
                              {res.numberOfGuests} khách
                            </span>
                            {Number(res.depositAmount) > 0 && (
                              <span>Tiền cọc: {Number(res.depositAmount).toLocaleString("vi-VN")}đ</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end border-t md:border-t-0 pt-3 md:pt-0 border-neutral-800">
                        <span 
                          className="text-xs font-bold group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1"
                          style={{ color: brandColor }}
                        >
                          Chi tiết &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Guest State / Search Form
          <div className="max-w-md mx-auto my-8">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-xl relative overflow-hidden">
              {/* Background glow decorator */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full pointer-events-none"
                style={{ background: brandColor }}
              />

              <div className="text-center mb-8">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg"
                  style={{ background: `${brandColor}15`, color: brandColor }}
                >
                  <SearchOutlined />
                </div>
                <h1 className="text-xl font-black text-[var(--text)] tracking-tight">Tra cứu đặt bàn</h1>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Nhập mã xác nhận gồm 6 ký tự để tra cứu trạng thái và thông tin lịch đặt bàn của bạn.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-wider">
                    Mã xác nhận (Confirmation Code)
                  </label>
                  <Input
                    placeholder="VD: 7FB30D"
                    size="large"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    onPressEnter={handleSearchByCode}
                    maxLength={6}
                    className="h-12 rounded-xl bg-neutral-900 border-neutral-800 text-[var(--text)] font-mono font-bold text-center text-lg tracking-widest placeholder:text-neutral-600 focus:border-neutral-700"
                  />
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleSearchByCode}
                  loading={searchLoading}
                  className="rounded-xl h-12 font-bold text-sm border-none shadow-lg shadow-orange-500/10"
                  style={{ background: brandColor, color: "#fff" }}
                >
                  Tìm kiếm lịch đặt
                </Button>

                <div className="border-t border-neutral-800 pt-5 text-center">
                  <p className="text-xs text-[var(--text-muted)]">
                    Bạn muốn xem toàn bộ danh sách đặt bàn?
                  </p>
                  <Link 
                    href="/login?redirect=/your-reservation" 
                    className="text-xs font-bold mt-1.5 inline-block hover:underline"
                    style={{ color: brandColor }}
                  >
                    Đăng nhập tài khoản &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
