"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/services/axiosInstance";
import paymentService, { PaymentStatus } from "@/lib/services/paymentService";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { 
  ArrowLeft, 
  CreditCard, 
  Coins, 
  QrCode, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  Sparkles,
  Utensils,
  Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useAuth } from "@/lib/contexts/AuthContext";

interface TableInfo {
  id: string;
  code: string;
  floor: { name: string };
  restaurant: {
    id: string;
    name: string;
    logoUrl: string | null;
    address: string | null;
    phone: string | null;
  };
}

interface ActiveOrder {
  id: string;
  reference: string;
  totalAmount: number;
  createdAt: string;
  reservationId?: string | null;
  depositPaid?: number; // tổng tiền cọc đã thanh toán
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    note: string | null;
  }>;
}

export default function CustomerCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tableId = params.tableId as string;

  // States
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash">("bank");
  
  // Bank transfer states
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [transferContent, setTransferContent] = useState<string>("");
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [polling, setPolling] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Staff calling states
  const [callingStaff, setCallingStaff] = useState(false);
  const [staffCalled, setStaffCalled] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    if (!tableId) return;
    try {
      setLoading(true);
      // 1. Get Table Details
      const tableRes = await axiosInstance.get(`/tables/public/${tableId}`);
      if (tableRes.data?.success) {
        const tableData = tableRes.data.data;
        setTable(tableData);

        // 2. Get active orders for current session
        const orderRes = await axiosInstance.get("/orders", { params: { tableId } });
        if (orderRes.data?.success && orderRes.data.data.length > 0) {
          const order = orderRes.data.data[0];

          // Nếu order có reservation, fetch thêm tiền cọc đã thanh toán
          if (order.reservationId) {
            try {
              const resRes = await axiosInstance.get(`/reservations/${order.reservationId}`);
              if (resRes.data?.success) {
                const reservation = resRes.data.data;
                const depositPaid = (reservation.payments ?? [])
                  .filter((p: any) => p.status === 1 /* COMPLETED */ )
                  .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                order.depositPaid = depositPaid;
              }
            } catch { /* không có reservation hoặc lỗi — bỏ qua */ }
          }

          setActiveOrder(order);
        }
      }
    } catch (err) {
      console.error("Lỗi tải thông tin thanh toán:", err);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Bank Transfer QR Code Generation
  const generateQRCode = useCallback(async () => {
    if (!activeOrder || !table) return;
    try {
      setGeneratingQR(true);
      const depositPaid = activeOrder.depositPaid ?? 0;
      const amountDue = Math.max(0, activeOrder.totalAmount - depositPaid);
      const res = await paymentService.getTransferInfo({
        orderId: activeOrder.id,
        amount: amountDue,
        restaurantId: table.restaurant.id,
      });

      if (res) {
        setQrUrl(res.qrUrl);
        setTransferContent(res.transferContent);
        setBankInfo(res.bankInfo);
        setPaymentId(res.paymentId);
        setPolling(true);
      }
    } catch (err: any) {
      console.error("Lỗi tạo mã QR chuyển khoản:", err);
    } finally {
      setGeneratingQR(false);
    }
  }, [activeOrder, table]);

  // Auto-generate QR if bank method is active and order is loaded
  useEffect(() => {
    if (activeOrder && table && paymentMethod === "bank" && !qrUrl && !generatingQR) {
      generateQRCode();
    }
  }, [activeOrder, table, paymentMethod, qrUrl, generatingQR, generateQRCode]);

  // Real-time socket updates & polling status check
  useEffect(() => {
    if (!paymentId || !polling) return;

    // 1. Socket connection for instant webhook detection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
    const socket = io(socketUrl, {
      transports: ["websocket"],
    });

    if (table?.restaurant.id) {
      socket.emit("join_restaurant", table.restaurant.id);
    }

    socket.on("ORDER_STATUS_CHANGED", (data: any) => {
      if (data.orderId === activeOrder?.id && data.status === "COMPLETED") {
        setPaymentSuccess(true);
        setPolling(false);
        // Hiện feedback sau 1.5s để animation success kịp chạy
        setTimeout(() => setShowFeedback(true), 1500);
      }
    });

    // 2. Backup polling
    const interval = setInterval(async () => {
      try {
        const check = await paymentService.pollStatus(paymentId);
        if (check.status === PaymentStatus.COMPLETED) {
          setPaymentSuccess(true);
          setPolling(false);
          clearInterval(interval);
          setTimeout(() => setShowFeedback(true), 1500);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
      }
    }, 4000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [paymentId, polling, activeOrder, table]);

  // Call Staff
  const handleCallStaff = async () => {
    if (!table || !activeOrder) return;
    try {
      setCallingStaff(true);
      
      // Emit a socket event to let the owner/staff dashboard know this table needs cash checkout assistance.
      // The socket only lives long enough to deliver the message, then closes
      // immediately — so it can never leak if the component unmounts.
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
      const socket = io(socketUrl, {
        transports: ["websocket"],
      });

      const closeSocket = () => {
        if (socket.connected) socket.disconnect();
        else socket.close();
      };

      socket.on("connect", () => {
        socket.emit("CALL_STAFF", {
          tableId: table.id,
          tableCode: table.code,
          floorName: table.floor.name,
          restaurantId: table.restaurant.id,
          type: "CASH_CHECKOUT",
          orderId: activeOrder.id,
          orderReference: activeOrder.reference,
          message: `Bàn ${table.code} yêu cầu thanh toán tiền mặt (Đơn: ${activeOrder.reference})`,
        });
        closeSocket();
      });
      // Safety net: ensure the socket is torn down even if it never connects.
      setTimeout(closeSocket, 5000);

      // Quick UI feedback (independent of the socket lifecycle)
      setTimeout(() => {
        setCallingStaff(false);
        setStaffCalled(true);
      }, 1000);

    } catch (err) {
      console.error("Lỗi yêu cầu nhân viên:", err);
      setCallingStaff(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-zinc-400 font-medium">Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  if (!table || !activeOrder) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center gap-4">
        <AlertCircle className="w-16 h-16 text-zinc-600" />
        <h1 className="text-xl font-bold">Không có hoá đơn hoạt động</h1>
        <p className="text-zinc-400 max-w-sm">Bàn của bạn hiện chưa có món ăn nào đang chờ thanh toán hoặc hoá đơn đã được hoàn tất.</p>
        <button 
          onClick={() => router.push(`/menu/${tableId}`)}
          className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-all active:scale-95"
        >
          Quay lại Thực đơn
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center pb-12 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-md bg-zinc-900/40 min-h-screen flex flex-col relative border-x border-zinc-800/60 shadow-2xl backdrop-blur-2xl">
        
        {/* Success Screen */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center p-6 text-center"
            >
              <motion.div 
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-12 h-12 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-white">Thanh toán thành công!</h2>
                  <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                    Cảm ơn quý khách đã dùng bữa tại <span className="text-white font-semibold">{table.restaurant.name}</span>. Phiên bàn đã được hoàn tất tự động.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 max-w-xs mx-auto text-left space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Mã đơn hàng:</span>
                    <span className="font-semibold text-white">{activeOrder.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bàn phục vụ:</span>
                    <span className="font-semibold text-white">{table.code} ({table.floor.name})</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-850 pt-1.5 mt-1.5 text-sm font-bold text-white">
                    <span>Đã thanh toán:</span>
                    <span className="text-amber-400">
                      {Math.max(0, activeOrder.totalAmount - (activeOrder.depositPaid ?? 0)).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {(activeOrder.depositPaid ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-400 text-[11px]">
                      <span>Tiền cọc đã trừ:</span>
                      <span>-{activeOrder.depositPaid!.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => router.push(`/menu/${tableId}`)}
                  className="px-8 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-95 transition-all"
                >
                  Quay lại Trang chủ
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── HEADER ─── */}
        <header className="sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/60 p-4 flex items-center gap-3">
          <button 
            onClick={() => router.push(`/menu/${tableId}`)}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/30 flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-300" />
          </button>
          <div>
            <h1 className="font-bold text-base text-white">Hoá đơn & Thanh toán</h1>
            <p className="text-xs text-zinc-400">{table.floor.name} • {table.code}</p>
          </div>
        </header>

        <div className="p-4 flex-1 space-y-5 overflow-y-auto">
          
          {/* Loyalty Point Banner */}
          {!user && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 shadow-md flex items-center justify-between gap-3 text-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-2.5 text-zinc-350">
                <span className="text-xl">🎁</span>
                <div className="text-left">
                  <p className="font-bold text-white leading-tight">Tích lũy điểm thưởng!</p>
                  <p className="text-[10px] text-zinc-450 mt-0.5">Đăng nhập để tích điểm cho hoá đơn này.</p>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/menu/${tableId}/checkout`)}`)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] shadow-lg shadow-amber-500/10 transition-all active:scale-95 whitespace-nowrap"
              >
                Đăng nhập
              </button>
            </motion.div>
          )}

          {/* ─── BILL SUMMARY ─── */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Receipt className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-sm text-white">Chi tiết hoá đơn</h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-mono ml-auto">
                {activeOrder.reference}
              </span>
            </div>

            {/* Dishes list */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs">
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="font-semibold text-zinc-200 leading-tight">{item.name}</p>
                    {item.note && <p className="text-[10px] text-zinc-500 italic">"{item.note}"</p>}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-zinc-500 mr-2">x{item.quantity}</span>
                    <span className="font-medium text-zinc-300">{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-zinc-850 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Cộng món</span>
                <span>{(activeOrder.totalAmount / 1.1).toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Thuế VAT (10%)</span>
                <span>{(activeOrder.totalAmount - (activeOrder.totalAmount / 1.1)).toLocaleString("vi-VN")}đ</span>
              </div>
              {(activeOrder.depositPaid ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span className="flex items-center gap-1">
                    ✓ Đã đặt cọc
                  </span>
                  <span>-{(activeOrder.depositPaid!).toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-850">
                <span className="flex items-center gap-1">
                  {(activeOrder.depositPaid ?? 0) > 0 ? "Còn lại phải trả" : "Tổng tiền thanh toán"}
                </span>
                <span className="text-amber-400 text-base">
                  {Math.max(0, activeOrder.totalAmount - (activeOrder.depositPaid ?? 0)).toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>

          {/* ─── PAYMENT METHOD CHOICE ─── */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Phương thức thanh toán</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPaymentMethod("bank")}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === "bank"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-bold">Chuyển khoản ngân hàng</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === "cash"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Coins className="w-5 h-5" />
                <span className="text-xs font-bold">Tiền mặt tại bàn</span>
              </button>
            </div>
          </div>

          {/* ─── METHOD CONTENT DETAILS ─── */}
          <div className="flex-1">
            {paymentMethod === "bank" ? (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-md">Tự động nhận diện</span>
                  <h3 className="text-sm font-bold text-white mt-1.5">Quét QR chuyển khoản nhanh</h3>
                  <p className="text-xs text-zinc-400">Hệ thống sẽ tự nhận diện giao dịch sau khi chuyển khoản thành công.</p>
                </div>

                {generatingQR ? (
                  <div className="w-48 h-48 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center gap-3 mx-auto">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-[10px] text-zinc-500">Đang tạo mã QR...</span>
                  </div>
                ) : qrUrl ? (
                  <div className="space-y-4">
                    {/* Compact QR Card */}
                    <div className="p-3 bg-white rounded-2xl inline-block shadow-md">
                      <img 
                        src={qrUrl} 
                        alt="VietQR SePay Link" 
                        className="w-48 h-48 object-contain"
                      />
                    </div>

                    {/* Bank Info Details */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850/80 text-left space-y-1.5 text-xs text-zinc-400 max-w-xs mx-auto">
                      <div className="flex justify-between">
                        <span>Ngân hàng:</span>
                        <span className="font-semibold text-white">{bankInfo?.bankCode || "MB Bank"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Số tài khoản:</span>
                        <span className="font-semibold text-white">{bankInfo?.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chủ tài khoản:</span>
                        <span className="font-semibold text-white">{bankInfo?.accountName}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-850 pt-1.5 mt-1.5">
                        <span>Nội dung chuyển khoản:</span>
                        <span className="font-extrabold text-amber-400 font-mono select-all">{transferContent}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-medium animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                      Đang chờ quét mã chuyển khoản...
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-zinc-500 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto opacity-30 text-rose-500" />
                    <p className="text-xs max-w-xs mx-auto">Nhà hàng chưa cấu hình thông tin tài khoản nhận chuyển khoản. Vui lòng chọn phương thức Tiền mặt.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-5">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h3 className="text-sm font-bold text-white">Thanh toán tiền mặt</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Vui lòng bấm nút dưới đây để thông báo cho nhân viên phục vụ mang hoá đơn giấy và thu tiền mặt trực tiếp tại bàn.
                  </p>
                </div>

                <button 
                  disabled={callingStaff || staffCalled}
                  onClick={handleCallStaff}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 border ${
                    staffCalled 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-amber-500 text-black hover:bg-amber-400 border-amber-500 shadow-lg shadow-amber-500/10"
                  }`}
                >
                  {callingStaff ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi yêu cầu...
                    </>
                  ) : staffCalled ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Nhân viên đang đến hỗ trợ
                    </>
                  ) : (
                    <>Gọi nhân viên thanh toán tiền mặt</>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
      
      {/* ─── FEEDBACK MODAL — hiện phía khách sau khi thanh toán thành công ─── */}
      {showFeedback && activeOrder && (
        <FeedbackModal
          orderId={activeOrder.id}
          orderReference={activeOrder.reference}
          restaurantName={table?.restaurant.name ?? ""}
          brandColor="#f59e0b"
          onClose={() => setShowFeedback(false)}
          onSubmitted={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}
