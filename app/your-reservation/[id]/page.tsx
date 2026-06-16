"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Spin, Alert, Badge, Tag, Descriptions, Divider, Modal } from "antd";
import { ArrowLeftOutlined, CopyOutlined, CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, WalletOutlined } from "@ant-design/icons";
import Header from "../../components/Header";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import reservationService, { Reservation } from "@/lib/services/reservationService";
import paymentService, { TransferInfo } from "@/lib/services/paymentService";

export default function CustomerReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState<Reservation | null>(null);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [depositPaid, setDepositPaid] = useState(false);

  const brandColor = tenant?.primaryColor || "#FF380B";

  const fetchReservation = async () => {
    try {
      let data: Reservation;
      if (id.length === 6) {
        // Search by code
        data = await reservationService.getByCode(id.toUpperCase());
      } else {
        // Search by ID
        data = await reservationService.getById(id);
      }
      setRes(data);

      const isPaid = data.payments?.some(p => p.status === 1) || false;
      setDepositPaid(isPaid);

      // If deposit is required but not paid, fetch transfer info
      if (Number(data.depositAmount) > 0 && !isPaid && data.statusValue?.code !== "CANCELLED") {
        fetchTransferDetails(data.id, Number(data.depositAmount));
      }
    } catch (err: any) {
      showToast("error", "Lỗi", err?.response?.data?.message || "Không thể tải thông tin đặt bàn");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferDetails = async (reservationId: string, amount: number) => {
    if (!tenant) return;
    setTransferLoading(true);
    try {
      const info = await paymentService.getTransferInfo({
        reservationId,
        amount,
        restaurantId: tenant.id,
      });
      setTransferInfo(info);
      startPolling(info.paymentId);
    } catch (err) {
      console.warn("Failed to get transfer info", err);
    } finally {
      setTransferLoading(false);
    }
  };

  const startPolling = (paymentId: string) => {
    if (pollInterval) clearInterval(pollInterval);

    const interval = setInterval(async () => {
      try {
        const check = await paymentService.pollStatus(paymentId);
        if (check && check.status === 1) {
          setDepositPaid(true);
          setTransferInfo(null);
          showToast("success", "Thành công", "Đã nhận tiền cọc thanh toán!");
          clearInterval(interval);
          fetchReservation();
        }
      } catch (e) {
        console.warn("Polling error", e);
      }
    }, 4000);

    setPollInterval(interval);
  };

  useEffect(() => {
    if (tenant && id) {
      fetchReservation();
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [tenant, id]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    showToast("info", "Đã sao chép", `Đã sao chép ${fieldName}`);
  };

  const getStatusDisplay = (code: string) => {
    switch (code?.toUpperCase()) {
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          color: "orange",
          bg: "bg-orange-500/10 border-orange-500/20 text-orange-500",
          desc: "Lịch đặt bàn đang được quản lý kiểm tra và phê duyệt. Bạn sẽ nhận được email thông báo ngay sau khi được duyệt."
        };
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          color: "green",
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
          desc: "Lịch đặt bàn của bạn đã được xác nhận thành công! Vui lòng xuất trình mã hoặc quét QR check-in khi đến nhà hàng."
        };
      case "CHECKED_IN":
        return {
          label: "Đã nhận bàn",
          color: "blue",
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-500",
          desc: "Bạn đã check-in thành công và đang dùng bữa tại nhà hàng."
        };
      case "COMPLETED":
        return {
          label: "Đã hoàn thành",
          color: "purple",
          bg: "bg-purple-500/10 border-purple-500/20 text-purple-500",
          desc: "Lịch đặt bàn đã hoàn tất. Cảm ơn bạn đã lựa chọn sử dụng dịch vụ của nhà hàng!"
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          color: "red",
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-500",
          desc: "Lịch đặt bàn của bạn đã bị hủy."
        };
      default:
        return {
          label: code || "Không rõ",
          color: "gray",
          bg: "bg-neutral-800 border-neutral-700 text-neutral-400",
          desc: ""
        };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-32">
          <Spin size="large" />
          <p className="mt-4 text-xs text-[var(--text-muted)]">Đang tải chi tiết lịch đặt...</p>
        </div>
      </div>
    );
  }

  if (!res) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col">
        <Header />
        <div className="flex-1 max-w-md mx-auto flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="text-rose-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold">Không tìm thấy lịch đặt bàn</h1>
          <p className="text-xs text-[var(--text-muted)] mt-2">Mã đặt bàn không tồn tại hoặc bạn không có quyền xem thông tin này.</p>
          <Link href="/your-reservation" className="mt-6 inline-flex items-center gap-1 text-xs font-bold hover:underline" style={{ color: brandColor }}>
            <ArrowLeftOutlined /> Quay lại trang tra cứu
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(res.statusValue?.code || "PENDING");
  const isCancelled = res.statusValue?.code === "CANCELLED";
  const isPending = res.statusValue?.code === "PENDING";
  const isConfirmed = res.statusValue?.code === "CONFIRMED";
  const isCheckedIn = res.statusValue?.code === "CHECKED_IN";
  const isCompleted = res.statusValue?.code === "COMPLETED";

  // Check cancellation info
  const cancelMeta = res.metadata?.cancellationInfo;
  
  // Find associated refund details
  const refund = res.refunds && res.refunds.length > 0 ? res.refunds[0] : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Navigation / Back Button */}
        <div className="mb-6">
          <Link 
            href="/your-reservation" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeftOutlined /> Quay lại lịch sử đặt bàn
          </Link>
        </div>

        {/* Outer Wrapper */}
        <div className="space-y-6">
          
          {/* 1. Main Status & Code Card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6 mb-6">
              <div>
                <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider block mb-1">Trạng thái đặt bàn</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.bg}`}>
                    {statusInfo.label}
                  </span>
                  {Number(res.depositAmount) > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${depositPaid ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400"}`}>
                      {depositPaid ? "Đã cọc" : "Yêu cầu cọc"}
                    </span>
                  )}
                </div>
              </div>

              {/* Code display (only if confirmed or later) */}
              {(isConfirmed || isCheckedIn || isCompleted) && (
                <div className="text-left md:text-right">
                  <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider block mb-1">Mã check-in</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black tracking-wider text-[var(--text)] bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-xl">
                      {res.confirmationCode}
                    </span>
                    <Button
                      type="text"
                      icon={<CopyOutlined className="text-neutral-400 hover:text-white" />}
                      onClick={() => handleCopy(res.confirmationCode, "Mã check-in")}
                    />
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{statusInfo.desc}</p>

            {/* Check-in QR code block (Strictly visible ONLY if confirmed/checked_in/completed) */}
            {(isConfirmed || isCheckedIn || isCompleted) && res.metadata?.qrCodeUrl && (
              <div className="mt-8 pt-8 border-t border-neutral-800 flex flex-col items-center text-center">
                <div className="bg-white p-4 rounded-2xl shadow-xl inline-block">
                  <img src={res.metadata.qrCodeUrl} alt="Check-in QR" className="w-40 h-40 object-contain" />
                </div>
                <p className="mt-4 text-xs font-bold text-[var(--text)]">Mã QR Check-in nhận bàn</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 max-w-xs leading-relaxed">
                  Đưa mã QR này cho nhân viên nhà hàng khi bạn đến để tiến hành check-in và nhận bàn nhanh chóng.
                </p>
              </div>
            )}

            {/* Hidden Check-in code message for Pending state */}
            {isPending && (
              <div className="mt-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                <InfoCircleOutlined className="text-orange-400 mt-0.5 text-sm" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-orange-400">Ẩn thông tin Check-in</h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                    Mã xác nhận bàn và mã QR check-in được ẩn tạm thời để bảo mật cho đến khi chủ nhà hàng duyệt và đồng ý yêu cầu đặt bàn của bạn.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Cancellation and Refund Details Box */}
          {isCancelled && (
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ExclamationCircleOutlined />
                <span>Chi tiết hủy & Hoàn tiền cọc</span>
              </div>
              
              <div className="space-y-3 text-xs leading-relaxed">
                {cancelMeta?.cancelledReason && (
                  <div>
                    <span className="text-[var(--text-muted)] font-medium">Lý do hủy:</span>
                    <p className="text-[var(--text)] bg-neutral-900 border border-neutral-800 p-3 rounded-lg mt-1 font-medium italic">
                      &ldquo;{cancelMeta.cancelledReason}&rdquo;
                    </p>
                  </div>
                )}

                {Number(res.depositAmount) > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                    <div>
                      <span className="text-[var(--text-muted)] block">Tiền cọc ban đầu:</span>
                      <strong className="text-sm">{Number(res.depositAmount).toLocaleString("vi-VN")}đ</strong>
                    </div>

                    <div>
                      <span className="text-[var(--text-muted)] block">Số tiền hoàn cọc:</span>
                      <strong className="text-sm text-emerald-400">
                        {cancelMeta?.refundAmount !== undefined 
                          ? `${Number(cancelMeta.refundAmount).toLocaleString("vi-VN")}đ` 
                          : "Đang tính toán..."}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Refund Status display */}
                {refund && (
                  <div className="pt-3 border-t border-neutral-800">
                    <span className="text-[var(--text-muted)] block mb-1">Trạng thái hoàn tiền:</span>
                    {refund.status === "COMPLETED" ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2">
                        <CheckCircleOutlined />
                        <span>
                          Đã hoàn trả thành công về tài khoản ngân hàng của bạn (Số TK: {refund.metadata?.refund_bank?.accountNumber || "..."}).
                        </span>
                      </div>
                    ) : refund.status === "FAILED" ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center gap-2">
                        <ExclamationCircleOutlined />
                        <span>
                          Gặp sự cố khi tự động hoàn cọc qua cổng thanh toán (Lỗi: {refund.metadata?.payout_error || "IP restriction"}). Nhà hàng đang xử lý hoàn tiền thủ công cho bạn.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg flex items-center gap-2">
                        <InfoCircleOutlined />
                        <span>
                          Hồ sơ hoàn cọc đang ở trạng thái xử lý chờ duyệt. Tiền sẽ được tự động chuyển về tài khoản của bạn.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Deposit Payment Block (Visible only if deposit is pending and reservation not cancelled) */}
          {Number(res.depositAmount) > 0 && !depositPaid && !isCancelled && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-orange-400 mb-4">
                <WalletOutlined />
                <span>Yêu cầu thanh toán cọc</span>
              </div>

              {transferLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Spin size="default" />
                  <p className="mt-2 text-[10px] text-[var(--text-muted)]">Đang tải thông tin chuyển khoản...</p>
                </div>
              ) : transferInfo ? (
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="bg-white p-3 rounded-xl shadow-md shrink-0">
                    <img src={transferInfo.qrUrl || ""} alt="QR Pay" className="w-32 h-32 object-contain" />
                  </div>
                  
                  <div className="flex-1 space-y-3 text-xs w-full">
                    <p className="text-[var(--text-muted)]">
                      Lịch đặt bàn yêu cầu thanh toán cọc <strong className="text-[var(--text)]">{Number(res.depositAmount).toLocaleString("vi-VN")}đ</strong> để giữ chỗ. Quét mã QR bên cạnh hoặc chuyển khoản theo thông tin:
                    </p>
                    
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Ngân hàng:</span>
                        <strong className="text-[var(--text)]">MB (Ngân hàng Quân Đội)</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Số tài khoản:</span>
                        <span className="flex items-center gap-1">
                          <strong className="text-[var(--text)]">{transferInfo.transferContent?.split(" ")[2] || "0949064234"}</strong>
                          <Button size="small" type="text" icon={<CopyOutlined className="text-neutral-500" />} onClick={() => handleCopy("0949064234", "Số tài khoản")} />
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Nội dung CK:</span>
                        <span className="flex items-center gap-1">
                          <strong className="text-orange-400 text-xs font-bold">{transferInfo.transferContent}</strong>
                          <Button size="small" type="text" icon={<CopyOutlined className="text-neutral-500" />} onClick={() => handleCopy(transferInfo.transferContent || "", "Nội dung chuyển khoản")} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Số tiền:</span>
                        <strong className="text-[var(--text)]">{Number(res.depositAmount).toLocaleString("vi-VN")}đ</strong>
                      </div>
                    </div>

                    <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">
                      * Hệ thống tự động kiểm tra tài khoản. Sau khi chuyển khoản thành công từ 10-30s, trạng thái sẽ tự động đổi sang "Đã đặt cọc".
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Không thể hiển thị thông tin chuyển khoản vào lúc này.</p>
              )}
            </div>
          )}

          {/* 4. Detailed Information */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text)] mb-4 border-b border-neutral-800 pb-3">Chi tiết đặt bàn</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Thời gian</span>
                  <span className="font-semibold text-sm">{formatDateTime(res.time)}</span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Số lượng khách</span>
                  <span className="font-semibold text-sm">{res.numberOfGuests} người</span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Bàn xếp</span>
                  <span className="font-semibold text-sm">
                    {res.tables && res.tables.length > 0 
                      ? res.tables.map(t => t.table?.code).join(", ") 
                      : "Nhà hàng tự sắp xếp bàn tương đương"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Khách hàng</span>
                  <span className="font-semibold text-sm">{res.customer?.user?.fullName || "Khách vãng lai"}</span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Số điện thoại</span>
                  <span className="font-semibold text-sm">{res.customer?.user?.phoneNumber || "-"}</span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Yêu cầu đặc biệt</span>
                  <span className="font-medium text-[var(--text-muted)] italic">
                    {res.specialRequests || "Không có yêu cầu đặc biệt"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
