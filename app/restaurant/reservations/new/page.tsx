
"use client";

import reservationService, { AvailableTable } from "@/lib/services/reservationService";
import axiosInstance from "@/lib/services/axiosInstance";
import paymentService, { TransferInfo } from "@/lib/services/paymentService";
import PaymentDeadlineCountdown from "@/components/reservations/PaymentDeadlineCountdown";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { useThemeMode } from "@/app/theme/AntdProvider";
import Header from "@/app/components/Header";
import { Button, DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  Calendar, 
  Users, 
  Clock, 
  ChevronRight,
  ChevronDown,
  User, 
  Phone, 
  Mail, 
  FileText,
  MapPin,
  Check,
  Info,
  Landmark,
  Search
} from "lucide-react";
import { TableMap2D, Layout, Floor } from "@/app/restaurant/tables/components/TableMap2D";

// ── Vietnamese banks (reused from wallet page) ─────────────────────────────────
const VIETNAMESE_BANKS = [
  { bin: "970415", code: "VTB",  name: "VietinBank",   color: "#1a6fd4", short: "CTG" },
  { bin: "970436", code: "VCB",  name: "Vietcombank",  color: "#007b5e", short: "VCB" },
  { bin: "970422", code: "MB",   name: "MBBank",        color: "#9b59b6", short: "MB"  },
  { bin: "970418", code: "BIDV", name: "BIDV",          color: "#1a3a6b", short: "BIDV"},
  { bin: "970405", code: "AGR",  name: "Agribank",      color: "#e74c3c", short: "AGR" },
  { bin: "970407", code: "TCB",  name: "Techcombank",   color: "#e91e1e", short: "TCB" },
  { bin: "970423", code: "TPB",  name: "TPBank",        color: "#7b2ff7", short: "TP"  },
  { bin: "970432", code: "VPB",  name: "VPBank",        color: "#00a650", short: "VPB" },
  { bin: "970416", code: "ACB",  name: "ACB",            color: "#003087", short: "ACB" },
  { bin: "970403", code: "STB",  name: "Sacombank",     color: "#0066b3", short: "STB" },
  { bin: "970400", code: "SEAB", name: "SeABank",       color: "#d4a017", short: "SEA" },
  { bin: "970454", code: "VIB",  name: "VIB",            color: "#005bac", short: "VIB" },
  { bin: "970440", code: "SHB",  name: "SHB",            color: "#c0392b", short: "SHB" },
  { bin: "970443", code: "SGB",  name: "SaigonBank",    color: "#f39c12", short: "SGB" },
  { bin: "970412", code: "PVB",  name: "PVcomBank",     color: "#2980b9", short: "PVC" },
  { bin: "970414", code: "OCB",  name: "OCB",            color: "#27ae60", short: "OCB" },
  { bin: "970428", code: "HDB",  name: "HDBank",         color: "#1abc9c", short: "HDB" },
  { bin: "970439", code: "NCB",  name: "NCB",            color: "#8e44ad", short: "NCB" },
];

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = ["Thời gian & Khách", "Chọn bàn", "Thông tin", "Xác nhận & Cọc"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 w-full">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center flex-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: i < current ? "var(--primary)" : i === current ? "var(--primary)" : "var(--border)",
                color: i <= current ? "#fff" : "var(--text-muted)",
                boxShadow: i === current ? "0 0 12px var(--primary-glow)" : "none",
                border: i === current ? "2px solid #fff" : "none"
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span 
              className="text-[10px] mt-2 font-medium text-center leading-tight transition-all duration-300"
              style={{
                color: i === current ? "var(--primary)" : "var(--text-muted)",
                fontWeight: i === current ? 700 : 400
              }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div 
              className="flex-1 h-0.5 transition-all duration-300 -mt-4"
              style={{
                background: i < current ? "var(--primary)" : "var(--border)"
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── SePay QR waiting screen ────────────────────────────────────────────────────
function SePayQR({ info, deadline, onSuccess, onSkip }: {
  info: TransferInfo;
  deadline?: string | null;
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const [polling, setPolling] = useState(true);
  const [dots, setDots] = useState(".");
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const dotsInterval = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    if (isExpired) {
      setPolling(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isExpired]);

  useEffect(() => {
    if (!polling || isExpired) return;
    intervalRef.current = setInterval(async () => {
      try {
        const { status } = await paymentService.pollStatus(info.paymentId);
        if (status === 1) { // COMPLETED
          setPolling(false);
          clearInterval(intervalRef.current!);
          onSuccess();
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [polling, isExpired, info.paymentId, onSuccess]);

  return (
    <div className="text-center py-6">
      <h3 className="text-lg font-bold text-[var(--text)] mb-2">Thanh toán đặt cọc</h3>
      <p className="text-sm text-[var(--text-muted)] mb-5">
        Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
      </p>

      {deadline && (
        <div className="mb-5 flex justify-center">
          <div style={{ maxWidth: 360, width: "100%" }}>
            <PaymentDeadlineCountdown
              deadline={deadline}
              onExpired={() => setIsExpired(true)}
            />
          </div>
        </div>
      )}

      {isExpired && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "var(--card, #1c1c1e)",
            border: "1px solid var(--border, #3a3a3c)",
            borderRadius: 24,
            padding: "32px 24px",
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            animation: "fadeIn 0.3s ease"
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⏰</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text, #fff)", margin: "0 0 10px" }}>
              Hết hạn thời gian giữ bàn
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted, #a1a1a6)", lineHeight: "1.6", margin: "0 0 24px" }}>
              Thời gian thanh toán cọc (5 phút) đã hết hạn. Đặt bàn của bạn đã bị hủy tự động để giải phóng bàn cho thực khách khác. Vui lòng thực hiện đặt bàn mới.
            </p>
            <Button
              type="primary"
              onClick={() => {
                window.location.reload();
              }}
              style={{
                width: "100%",
                height: 46,
                borderRadius: 12,
                fontWeight: 700,
                background: "var(--primary, #FF380B)",
                borderColor: "var(--primary, #FF380B)",
                color: "#fff"
              }}
            >
              Đặt bàn mới
            </Button>
          </div>
        </div>
      )}

      {info.qrUrl ? (
        <img 
          src={info.qrUrl} 
          alt="QR chuyển khoản" 
          className="w-56 h-56 rounded-xl border border-[var(--border)] block mx-auto mb-5 shadow-md" 
        />
      ) : (
        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl mb-5 text-sm">
          <p className="m-0 text-[var(--text-muted)]">Chưa cấu hình QR. Chuyển khoản thủ công:</p>
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-left mb-5 text-sm space-y-2.5">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Ngân hàng</span>
          <b className="text-[var(--text)]">{info.bankInfo.bankCode || "—"}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Số tài khoản</span>
          <b className="text-[var(--text)]">{info.bankInfo.accountNumber || "—"}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Tên tài khoản</span>
          <b className="text-[var(--text)]">{info.bankInfo.accountName || "—"}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Số tiền</span>
          <b className="text-[var(--primary)] text-base">{info.amount.toLocaleString("vi-VN")}đ</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Nội dung chuyển khoản</span>
          <b className="text-[var(--text)] font-mono bg-zinc-800/10 dark:bg-zinc-100/10 px-2 py-0.5 rounded">{info.transferContent}</b>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-5">
        Đang chờ xác nhận thanh toán {dots}
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function NewReservationPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const { mode } = useThemeMode();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0 — time & guests
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [guests, setGuests] = useState(2);

  // Step 1 — table selection
  const [allTables, setAllTables] = useState<AvailableTable[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [currentFloorId, setCurrentFloorId] = useState<string>("");
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "manual">("auto");
  const [pendingConflictTable, setPendingConflictTable] = useState<AvailableTable | null>(null);

  // Step 2 — personal info
  const [name, setName] = useState(user?.fullName || user?.name || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [email, setEmail] = useState(user?.email || "");
  const [requests, setRequests] = useState("");

  // Step 2 — bank refund info (for deposit refund via PayOS payout)
  const [bankBin, setBankBin] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  // Visual layout state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(600);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.fullName || user.name || "");
      setPhone((prev) => prev || user.phoneNumber || "");
      setEmail((prev) => prev || user.email || "");
    }
  }, [user]);

  // Step 3 — result
  const [createdId, setCreatedId] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [createdReservation, setCreatedReservation] = useState<any>(null);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const [depositPaid, setDepositPaid] = useState(false);

  // Step 2 — pre-order dishes state
  const [wantPreOrder, setWantPreOrder] = useState(false);
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<Record<string, { quantity: number; name: string; price: number; note?: string }>>({});
  const [menuSearch, setMenuSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [menuLoading, setMenuLoading] = useState(false);

  const brandColor = tenant?.primaryColor || "#FF5A2C";
  const restaurantId = tenant?.id || user?.restaurantId || "";

  // Group tables by floor
  const floorsMap: Record<string, { id: string; name: string; tables: AvailableTable[] }> = {};
  allTables.forEach((t) => {
    if (!floorsMap[t.floorId]) {
      floorsMap[t.floorId] = {
        id: t.floorId,
        name: t.floor?.name || "Tầng chưa đặt tên",
        tables: [],
      };
    }
    floorsMap[t.floorId].tables.push(t);
  });
  const floorsList = Object.values(floorsMap);

  // Set default floor on load
  useEffect(() => {
    if (floorsList.length > 0 && !currentFloorId) {
      setCurrentFloorId(floorsList[0].id);
    }
  }, [allTables, floorsList, currentFloorId]);

  // Init active floor when available tables load
  useEffect(() => {
    if (allTables.length > 0) {
      setCurrentFloorId(prev => prev || allTables[0].floorId);
    }
  }, [allTables]);

  // Build 2D layout for the reservation table picker (auto-positions, no floor layout API needed)
  const reservationLayout = useMemo((): Layout => {
    if (!allTables.length) return { id: "empty", name: "", floors: [], activeFloorId: "" };

    const floorMap = new Map<string, { id: string; name: string; tables: AvailableTable[] }>();
    for (const t of allTables) {
      if (!floorMap.has(t.floorId)) floorMap.set(t.floorId, { id: t.floorId, name: t.floor.name, tables: [] });
      floorMap.get(t.floorId)!.tables.push(t);
    }

    const COLS = 5, TW = 72, TH = 64, GX = 44, GY = 52, MARGIN = 36;
    const selectedSet = new Set(selectedTableIds);

    const floors: Floor[] = Array.from(floorMap.values()).map(({ id, name, tables }) => ({
      id,
      name,
      width: Math.max(640, COLS * (TW + GX) + MARGIN * 2 - GX),
      height: Math.ceil(tables.length / COLS) * (TH + GY) + MARGIN * 2,
      tables: tables.map((t, i) => ({
        id: t.id,
        tenantId: "",
        name: t.code,
        seats: t.seatingCapacity,
        status: (selectedSet.has(t.id) ? "SELECTED" : "AVAILABLE") as "SELECTED" | "AVAILABLE",
        area: name,
        position: { x: (i % COLS) * (TW + GX) + MARGIN, y: Math.floor(i / COLS) * (TH + GY) + MARGIN },
        shape: (t.seatingCapacity >= 8 ? "Rectangle" : t.seatingCapacity >= 5 ? "Oval" : "Square") as "Rectangle" | "Oval" | "Square",
        width: TW,
        height: TH,
        rotation: 0,
      })),
    }));

    const resolvedFloorId = (currentFloorId && floors.some(f => f.id === currentFloorId))
      ? currentFloorId : floors[0]?.id || "";

    return { id: "reservation", name: "Chọn bàn", floors, activeFloorId: resolvedFloorId };
  }, [allTables, selectedTableIds, currentFloorId]);

  const handleReservationLayoutChange = (updated: Layout) => {
    if (updated.activeFloorId !== currentFloorId) setCurrentFloorId(updated.activeFloorId);
  };

  const handleTableToggle = (tableId: string) => {
    setSelectedTableIds(prev =>
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const totalSelectedCapacity = useMemo(
    () => selectedTableIds.reduce((sum, id) => sum + (allTables.find(t => t.id === id)?.seatingCapacity ?? 0), 0),
    [selectedTableIds, allTables]
  );

    useEffect(() => {
    if (wantPreOrder && menu.length === 0 && restaurantId) {
      setMenuLoading(true);
      Promise.all([
        axiosInstance.get("/categories", { params: { restaurantId } }),
        axiosInstance.get("/dishes", { params: { restaurantId } })
      ])
        .then(([catRes, dishRes]) => {
          const categoriesData = catRes.data?.data || [];
          const dishesData = dishRes.data?.data || [];

          // Format to MenuCategory structure: { categoryId, categoryName, items }
          const formattedMenu = categoriesData.map((cat: any) => {
            const items = dishesData.filter((dish: any) => dish.categoryId === cat.id && dish.isActive);
            return {
              categoryId: cat.id,
              categoryName: cat.name,
              items
            };
          }).filter((cat: any) => cat.items.length > 0);

          setMenu(formattedMenu);
          if (formattedMenu.length > 0) {
            setActiveCategory(formattedMenu[0].categoryId);
          }
        })
        .catch(err => {
          console.error("Failed to load menu:", err);
          showToast("error", "Lỗi tải thực đơn", "Không thể tải danh sách món ăn từ nhà hàng");
        })
        .finally(() => {
          setMenuLoading(false);
        });
    }
  }, [wantPreOrder, menu.length, restaurantId, showToast]);

  // Estimate deposit amount (25k per seat capacity of selected tables, or per guest if auto-arranged)
  const estimatedDeposit = (assignmentMode === "manual" && selectedTableIds.length > 0)
    ? selectedTableIds.reduce((sum, id) => {
        const tbl = allTables.find((t) => t.id === id);
        return sum + (tbl ? tbl.seatingCapacity * 25000 : 0);
      }, 0)
    : guests * 25000;

  // ── Step 0 → 1: check available tables ──────────────────────────────────────
  const handleCheckTables = async () => {
    if (!date || !time || !restaurantId) {
      showToast("error", "Thiếu thông tin", "Vui lòng chọn ngày, giờ và nhà hàng");
      return;
    }

    const selectedDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();
    if (selectedDateTime.getTime() < now.getTime()) {
      showToast("error", "Thời gian không hợp lệ", "Thời gian đặt bàn không được ở trong quá khứ");
      return;
    }
    if (selectedDateTime.getTime() - now.getTime() < 30 * 60 * 1000) {
      showToast("error", "Thời gian không hợp lệ", "Vui lòng đặt bàn trước giờ nhận ít nhất 30 phút");
      return;
    }

    setLoading(true);
    try {
      const isoTime = new Date(`${date}T${time}:00`).toISOString();
      const dishesPayload = wantPreOrder
        ? Object.entries(selectedDishes)
            .filter(([_, item]) => item.quantity > 0)
            .map(([dishId, item]) => ({
              dishId,
              quantity: item.quantity,
              note: item.note || undefined,
            }))
        : undefined;
      const tables = await reservationService.checkTables({ restaurantId, time: isoTime, numberOfGuests: guests });
      setAllTables(tables);
      setStep(1);
    } catch (err: any) {
      showToast("error", "Lỗi", err?.response?.data?.message || err.message || "Không thể kiểm tra bàn trống");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: submit reservation ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!restaurantId) { showToast("error", "Lỗi", "Không xác định được nhà hàng"); return; }
    if (!email || !email.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập địa chỉ email để nhận thông tin đặt bàn");
      return;
    }
    // Validate bank info if deposit is required
    if (estimatedDeposit > 0) {
      if (!bankBin || !bankAccountNumber.trim() || !bankAccountName.trim()) {
        showToast("error", "Thiếu thông tin hoàn tiền", "Vui lòng điền đầy đủ tài khoản ngân hàng để nhận hoàn cọc nếu cần");
        return;
      }
    }
    setLoading(true);
    try {
      const isoTime = new Date(`${date}T${time}:00`).toISOString();
      const dishesPayload = wantPreOrder
        ? Object.entries(selectedDishes)
            .filter(([_, item]) => item.quantity > 0)
            .map(([dishId, item]) => ({
              dishId,
              quantity: item.quantity,
              note: item.note || undefined,
            }))
        : undefined;
      // Build bank refund payload if deposit exists
      const bankRefund = estimatedDeposit > 0 && bankBin ? {
        bankBin,
        bankCode,
        bankName: VIETNAMESE_BANKS.find(b => b.bin === bankBin)?.name ?? "",
        accountNumber: bankAccountNumber.trim(),
        accountName: bankAccountName.trim().toUpperCase(),
      } : undefined;
      const res = await reservationService.create({
        restaurantId,
        numberOfGuests: guests,
        time: isoTime,
        specialRequests: requests || undefined,
        tableIds: assignmentMode === "manual" ? selectedTableIds : [],
        fullName: name,
        phoneNumber: phone,
        email: email.trim(),
        bankRefund,
        dishes: dishesPayload,
      });
      setCreatedId(res.id);
      setCreatedCode(res.confirmationCode || "");
      setCreatedReservation(res);

      // Auto-get transfer info if deposit > 0
      if (Number(res.depositAmount) > 0) {
        showToast("info", "Yêu cầu thanh toán cọc", "Vui lòng chuyển khoản cọc để hoàn tất đặt bàn");
        try {
          const info = await paymentService.getTransferInfo({
            reservationId: res.id,
            amount: Number(res.depositAmount),
            restaurantId,
          });
          setTransferInfo(info);
        } catch { /* optional */ }
      } else {
        showToast("success", "Đặt bàn thành công", `Mã xác nhận: ${res.confirmationCode}`);
      }
      setStep(3);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Không thể đặt bàn";
      showToast("error", "Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSuccess = () => {
    setDepositPaid(true);
    setTransferInfo(null);
    showToast("success", "Đã nhận cọc", "Đặt bàn của bạn đã được xác nhận");
  };

  const today = new Date().toISOString().split("T")[0];

  const currentFloorTables = floorsMap[currentFloorId]?.tables || [];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text)] transition-colors duration-300">
      {/* Homepage Header */}
      <Header />

      <div 
        className="mx-auto px-4 pb-24 pt-32 transition-all duration-300"
        style={{ maxWidth: step === 1 && assignmentMode === "manual" && allTables.length > 0 ? "1100px" : "640px" }}
      >
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-xs">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
            Trang chủ
          </Link>
          <span className="text-[var(--border)]">/</span>
          <span className="text-[var(--text)] font-semibold">Đặt bàn trực tuyến</span>
        </div>

        <StepBar current={step} />

        {!user && step < 3 && (
          <div 
            className="p-4 rounded-2xl flex items-center justify-between gap-4 mb-6 shadow-sm border"
            style={{
              background: `${brandColor}0D`,
              borderColor: `${brandColor}30`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="m-0 font-bold text-[var(--text)] text-sm">Tích lũy điểm thưởng!</p>
                <p className="m-0 mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                  Đăng nhập để nhận ưu đãi và tích lũy điểm thưởng khi đặt bàn.
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push(`/login?redirect=${encodeURIComponent('/restaurant/reservations/new')}`)}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm flex-shrink-0"
              style={{
                background: brandColor,
                boxShadow: `0 4px 12px ${brandColor}30`,
              }}
            >
              Đăng nhập
            </button>
          </div>
        )}

        <div 
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl transition-all duration-300 shadow-sm"
          style={{ padding: step === 1 && assignmentMode === "manual" && allTables.length > 0 ? "20px 20px 24px" : "24px" }}
        >

          {/* Step 0: Time & Guests */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)] m-0">Thời gian & Số khách</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Vui lòng chọn thời gian và số lượng chỗ ngồi mong muốn.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Ngày đặt bàn
                  </label>
                  <DatePicker 
                    value={date ? dayjs(date) : null}
                    onChange={(val) => setDate(val ? val.format("YYYY-MM-DD") : "")}
                    disabledDate={(current) => current && current < dayjs().startOf("day")}
                    className="w-full h-11 rounded-xl"
                    placeholder="Chọn ngày đặt bàn"
                    format="DD/MM/YYYY"
                    allowClear={false}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Giờ đến
                  </label>
                  <TimePicker 
                    value={time ? dayjs(time, "HH:mm") : null}
                    onChange={(val) => setTime(val ? val.format("HH:mm") : "")}
                    format="HH:mm"
                    minuteStep={15}
                    className="w-full h-11 rounded-xl"
                    placeholder="Chọn giờ đến"
                    allowClear={false}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Số lượng khách đi cùng
                  </label>
                  <div className="flex items-center gap-4 py-1">
                    <button 
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xl text-[var(--text)] flex items-center justify-center hover:bg-[var(--border)] transition-colors active:scale-95"
                    >
                      −
                    </button>
                    <span className="text-2xl font-extrabold text-[var(--text)] min-w-[32px] text-center">{guests}</span>
                    <button 
                      onClick={() => setGuests((g) => Math.min(100, g + 1))}
                      className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xl text-[var(--text)] flex items-center justify-center hover:bg-[var(--border)] transition-colors active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="primary" 
                block 
                size="large" 
                loading={loading} 
                onClick={handleCheckTables}
                className="rounded-xl h-12 font-bold text-sm shadow-md mt-6 flex items-center justify-center gap-2 border-none"
                style={{ background: brandColor, color: "#fff" }}
              >
                Kiểm tra bàn trống <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Table selection (Visual Floor Plan Map or Auto Assign) */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)] m-0">Phương thức chọn bàn</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Chọn phương thức xếp bàn hoặc sơ đồ vị trí ngồi phù hợp với sở thích của bạn.
                </p>
              </div>

              {allTables.length === 0 ? (
                <div className="p-6 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-2xl text-center space-y-3">
                  <p className="font-bold text-[var(--text)] text-base">Không tìm thấy bàn trống phù hợp</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Nhà hàng sẽ tự động sắp xếp ghép bàn hoặc thiết kế chỗ ngồi thích hợp nhất cho đoàn của bạn. Bạn chỉ cần nhấn tiếp tục để hoàn tất giữ chỗ.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Assignment mode selector */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setAssignmentMode("auto");
                        setSelectedTableIds([]);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        assignmentMode === "auto"
                          ? "bg-[var(--primary)]/5 border-[var(--primary)] text-[var(--primary)]"
                          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                      style={assignmentMode === "auto" ? { borderColor: brandColor, color: brandColor, backgroundColor: `${brandColor}08` } : {}}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        <span>✨</span>
                        <span>Để nhà hàng sắp xếp</span>
                      </div>
                      <p className="text-[11px] opacity-85 m-0 leading-normal">Hệ thống tự động xếp bàn trống tối ưu và phù hợp nhất cho đoàn của bạn.</p>
                    </button>

                    <button
                      onClick={() => setAssignmentMode("manual")}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        assignmentMode === "manual"
                          ? "bg-[var(--primary)]/5 border-[var(--primary)] text-[var(--primary)]"
                          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                      style={assignmentMode === "manual" ? { borderColor: brandColor, color: brandColor, backgroundColor: `${brandColor}08` } : {}}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        <span>🪑</span>
                        <span>Tự chọn bàn trực tuyến</span>
                      </div>
                      <p className="text-[11px] opacity-85 m-0 leading-normal">Xem sơ đồ bàn trực quan 2D và chủ động chọn bàn phù hợp với bạn.</p>
                    </button>
                  </div>

                  {assignmentMode === "auto" && (
                    <div className="p-6 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-2xl text-center space-y-3">
                      <p className="font-bold text-[var(--text)] text-sm">Xác nhận tự động xếp bàn</p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Bạn đã chọn chế độ để nhà hàng tự động sắp xếp bàn trống tối ưu nhất cho đoàn khách {guests} người.
                      </p>
                      <div className="flex gap-3 mt-6">
                        <Button 
                          onClick={() => setStep(0)} 
                          className="flex-1 rounded-xl h-11 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold"
                        >
                          ← Quay lại
                        </Button>
                        <Button 
                          type="primary" 
                          onClick={() => setStep(2)} 
                          className="flex-[2] rounded-xl h-11 font-bold border-none"
                          style={{ background: brandColor, color: "#fff" }}
                        >
                          Tiếp tục đặt bàn →
                        </Button>
                      </div>
                    </div>
                  )}

                  {assignmentMode === "manual" && (
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Left: Floor map */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                          <h3 className="text-lg font-bold text-[var(--text)] m-0">Sơ đồ nhà hàng</h3>
                          <span className="text-xs text-[var(--text-muted)]">
                            {allTables.length} bàn trống · {guests} khách
                          </span>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 mb-4 flex-wrap text-xs">
                          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border-2 border-emerald-500 inline-block" />
                            Trống — Click để chọn
                          </span>
                          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: `${brandColor}20`, border: `2px solid ${brandColor}` }} />
                            Đã chọn
                          </span>
                        </div>

                        <div className="h-[420px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
                          <TableMap2D
                            layout={reservationLayout}
                            onLayoutChange={handleReservationLayoutChange}
                            onTableClick={(table) => handleTableToggle(table.id)}
                            onTablePositionChange={() => {}}
                            readOnly={true}
                            selectedTableIds={selectedTableIds}
                          />
                        </div>
                      </div>

                      {/* Right: Selection panel */}
                      <div className="w-full md:w-[240px] shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sticky top-24">
                        <p className="m-0 mb-3 font-bold text-sm text-[var(--text)] flex items-center justify-between">
                          <span>Bàn đã chọn</span>
                          {selectedTableIds.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-white text-xs font-bold" style={{ background: brandColor }}>
                              {selectedTableIds.length}
                            </span>
                          )}
                        </p>

                        {selectedTableIds.length === 0 ? (
                          <p className="text-xs text-[var(--text-muted)] text-center py-4">
                            Click vào bàn trên sơ đồ để chọn
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2 mb-4 max-h-[160px] overflow-y-auto pr-1">
                            {selectedTableIds.map(id => {
                              const t = allTables.find(t => t.id === id);
                              if (!t) return null;
                              return (
                                <div key={id} className="flex items-center justify-between p-2 bg-[var(--card)] rounded-xl border border-[var(--border)] text-xs">
                                  <span className="font-bold text-[var(--text)]">Bàn {t.code}</span>
                                  <span className="text-[var(--text-muted)]">{t.seatingCapacity} chỗ</span>
                                  <button onClick={() => handleTableToggle(id)} className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] hover:text-red-500 text-sm p-0.5 leading-none">×</button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {selectedTableIds.length > 0 && (
                          <div className="pt-3 border-t border-dashed border-[var(--border)] text-xs text-[var(--text-muted)] flex flex-col gap-1.5 mb-4">
                            <div className="flex justify-between">
                              <span>Tổng sức chứa</span>
                              <strong className="text-[var(--text)]">{totalSelectedCapacity} chỗ</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Số khách</span>
                              <strong style={{ color: totalSelectedCapacity >= guests ? "#10b981" : "#f59e0b" }}>{guests} người</strong>
                            </div>
                            {totalSelectedCapacity < guests && (
                              <p className="m-0 mt-1 text-amber-500 text-[10px] leading-tight">⚠️ Chưa đủ chỗ cho {guests} khách</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <Button onClick={() => setStep(0)} className="w-full rounded-xl h-10 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold">← Quay lại</Button>
                          <Button
                            type="primary"
                            onClick={() => setStep(2)}
                            disabled={selectedTableIds.length === 0}
                            className="w-full rounded-xl h-10 font-bold border-none"
                            style={{ background: brandColor, color: "#fff" }}
                          >
                            Tiếp tục đặt bàn →
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Personal info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)] m-0">Thông tin liên hệ</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Xin vui lòng điền các thông tin liên lạc để hoàn tất giữ bàn.</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Họ và tên khách hàng", value: name, setter: setName, type: "text", placeholder: "Nguyễn Văn A", icon: <User className="w-4 h-4 text-zinc-400" /> },
                  { label: "Số điện thoại liên lạc", value: phone, setter: setPhone, type: "tel", placeholder: "0905 123 456", icon: <Phone className="w-4 h-4 text-zinc-400" /> },
                  { label: "Địa chỉ Email nhận mã xác nhận", value: email, setter: setEmail, type: "email", placeholder: "example@gmail.com", disabled: !!user, icon: <Mail className="w-4 h-4 text-zinc-400" /> },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">{f.label}</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        {f.icon}
                      </div>
                      <input 
                        type={f.type} 
                        value={f.value} 
                        placeholder={f.placeholder} 
                        onChange={(e) => f.setter(e.target.value)} 
                        disabled={f.disabled}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-60" 
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Yêu cầu bổ sung (không bắt buộc)</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-4">
                      <FileText className="w-4 h-4 text-zinc-400" />
                    </div>
                    <textarea 
                      value={requests} 
                      onChange={(e) => setRequests(e.target.value)} 
                      rows={3} 
                      placeholder="Ví dụ: ghế ăn dặm cho bé, có bánh kem sinh nhật, trang trí hoa..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none" 
                    />
                  </div>
                </div>

                {/* Bank refund info — shown only when deposit is required */}
                {estimatedDeposit > 0 && (
                  <div className="rounded-2xl border border-[var(--border)] p-4 space-y-3" style={{ background: "var(--surface)" }}>
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-bold text-[var(--text)]">Tài khoản nhận hoàn cọc</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--primary)20", color: "var(--primary)" }}>Bắt buộc</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed m-0">
                      Trong trường hợp đặt bàn bị hủy, tiền cọc sẽ được hoàn tự động về tài khoản này.
                    </p>
                    {/* Bank selector — custom beautiful dropdown */}
                    <div className="relative">
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Ngân hàng</label>
                      {/* Trigger */}
                      <button
                        type="button"
                        onClick={() => { setBankDropdownOpen(o => !o); setBankSearch(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-sm text-left"
                        style={{
                          background: "var(--surface)",
                          borderColor: bankDropdownOpen ? "var(--primary)" : "var(--border)",
                          boxShadow: bankDropdownOpen ? "0 0 0 3px var(--primary-glow, rgba(255,90,44,0.15))" : "none",
                          color: bankBin ? "var(--text)" : "var(--text-muted)",
                        }}
                      >
                        {bankBin ? (
                          <>
                            <span
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm"
                              style={{ background: VIETNAMESE_BANKS.find(b => b.bin === bankBin)?.color ?? "#666" }}
                            >
                              {VIETNAMESE_BANKS.find(b => b.bin === bankBin)?.short}
                            </span>
                            <span className="font-semibold flex-1">{VIETNAMESE_BANKS.find(b => b.bin === bankBin)?.name}</span>
                          </>
                        ) : (
                          <>
                            <Landmark className="w-4 h-4 opacity-40 shrink-0" />
                            <span className="flex-1">-- Chọn ngân hàng --</span>
                          </>
                        )}
                        <ChevronDown
                          className="w-4 h-4 shrink-0 transition-transform duration-200"
                          style={{
                            transform: bankDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                            color: "var(--text-muted)"
                          }}
                        />
                      </button>

                      {/* Dropdown panel */}
                      {bankDropdownOpen && (
                        <div
                          className="absolute left-0 right-0 mt-2 rounded-2xl border shadow-2xl z-50 overflow-hidden"
                          style={{
                            background: "var(--card)",
                            borderColor: "var(--border)",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
                          }}
                        >
                          {/* Search */}
                          <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                              <input
                                autoFocus
                                type="text"
                                value={bankSearch}
                                onChange={e => setBankSearch(e.target.value)}
                                placeholder="Tìm ngân hàng..."
                                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border-none outline-none"
                                style={{ background: "var(--surface)", color: "var(--text)" }}
                              />
                            </div>
                          </div>
                          {/* Bank list */}
                          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
                            {VIETNAMESE_BANKS
                              .filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.code.toLowerCase().includes(bankSearch.toLowerCase()))
                              .map(b => (
                                <button
                                  key={b.bin}
                                  type="button"
                                  onClick={() => {
                                    setBankBin(b.bin);
                                    setBankCode(b.code);
                                    setBankDropdownOpen(false);
                                    setBankSearch("");
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-all duration-150 hover:opacity-100"
                                  style={{
                                    background: bankBin === b.bin ? `${b.color}15` : "transparent",
                                    color: "var(--text)",
                                  }}
                                >
                                  <span
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm"
                                    style={{ background: b.color }}
                                  >
                                    {b.short}
                                  </span>
                                  <span className="flex-1 font-medium">{b.name}</span>
                                  {bankBin === b.bin && (
                                    <Check className="w-4 h-4 shrink-0" style={{ color: b.color }} />
                                  )}
                                </button>
                              ))
                            }
                            {VIETNAMESE_BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.code.toLowerCase().includes(bankSearch.toLowerCase())).length === 0 && (
                              <p className="text-center py-6 text-xs" style={{ color: "var(--text-muted)" }}>Không tìm thấy ngân hàng</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Backdrop */}
                      {bankDropdownOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => { setBankDropdownOpen(false); setBankSearch(""); }} />
                      )}
                    </div>
                    {/* Account number */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Số tài khoản</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="Nhập số tài khoản"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                    {/* Account name */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Tên chủ tài khoản</label>
                      <input
                        type="text"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm font-mono uppercase focus:outline-none focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Pre-order Option Toggle */}
                <div className="rounded-2xl border border-[var(--border)] p-4 space-y-3 animate-fade-in animate-duration-300" style={{ background: "var(--surface)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[var(--text)] block">🍽️ Bạn có muốn đặt món trước không?</span>
                      <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Nhà hàng sẽ chuẩn bị trước món ăn khi bạn đến</span>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setWantPreOrder(w => !w)}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{
                        background: wantPreOrder ? "var(--primary)" : "rgba(120, 120, 128, 0.3)"
                      }}
                    >
                      <span
                        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        style={{
                          transform: wantPreOrder ? "translateX(20px)" : "translateX(0px)"
                        }}
                      />
                    </button>
                  </div>

                  {wantPreOrder && (
                    <div className="space-y-4 pt-3 border-t border-[var(--border)]">
                      {menuLoading ? (
                        <div className="text-center py-6 text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
                          <span className="animate-spin text-lg">⏳</span>
                          <span>Đang tải thực đơn...</span>
                        </div>
                      ) : (
                        <>
                          {/* Search bar */}
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="text"
                              value={menuSearch}
                              onChange={(e) => setMenuSearch(e.target.value)}
                              placeholder="Tìm món ăn..."
                              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-colors"
                            />
                          </div>

                          {/* Category tabs */}
                          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                            {menu.map((cat) => (
                              <button
                                key={cat.categoryId}
                                type="button"
                                onClick={() => setActiveCategory(cat.categoryId)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
                                style={{
                                  background: activeCategory === cat.categoryId ? "var(--primary)" : "var(--card)",
                                  color: activeCategory === cat.categoryId ? "#fff" : "var(--text-muted)",
                                  border: activeCategory === cat.categoryId ? "none" : "1px solid var(--border)"
                                }}
                              >
                                {cat.categoryName}
                              </button>
                            ))}
                          </div>

                          {/* Dishes list */}
                          <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 280 }}>
                            {menu
                              .find(cat => cat.categoryId === activeCategory)
                              ?.items?.filter((item: any) => !menuSearch || item.name?.toLowerCase().includes(menuSearch.toLowerCase()))
                              .map((dish: any) => {
                                const qty = selectedDishes[dish.id]?.quantity || 0;
                                return (
                                  <div
                                    key={dish.id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-zinc-500 transition-colors"
                                  >
                                    {dish.imageUrl ? (
                                      <img
                                        src={dish.imageUrl}
                                        alt={dish.name}
                                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg bg-[var(--surface)] flex items-center justify-center shrink-0 text-lg">
                                        🍲
                                      </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-xs text-[var(--text)] truncate">{dish.name}</div>
                                      <div className="text-[9px] text-[var(--text-muted)] truncate">{dish.description || "Chưa có mô tả"}</div>
                                      <div className="text-xs font-black text-[var(--primary)] mt-0.5">
                                        {(dish.price || 0).toLocaleString("vi-VN")}đ
                                      </div>
                                    </div>

                                    {/* Quantity controls */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      {qty > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedDishes(prev => {
                                              const updated = { ...prev };
                                              if (updated[dish.id].quantity <= 1) {
                                                delete updated[dish.id];
                                              } else {
                                                updated[dish.id].quantity -= 1;
                                              }
                                              return updated;
                                            });
                                          }}
                                          className="w-6 h-6 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--text)]"
                                        >
                                          -
                                        </button>
                                      )}
                                      {qty > 0 && (
                                        <span className="text-xs font-bold text-[var(--text)] min-w-[14px] text-center">
                                          {qty}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedDishes(prev => ({
                                            ...prev,
                                            [dish.id]: {
                                              quantity: (prev[dish.id]?.quantity || 0) + 1,
                                              name: dish.name || "",
                                              price: dish.price || 0,
                                              note: prev[dish.id]?.note || ""
                                            }
                                          }));
                                        }}
                                        className="w-6 h-6 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs shadow-sm"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            {(!menu.find(cat => cat.categoryId === activeCategory)?.items ||
                              menu.find(cat => cat.categoryId === activeCategory)?.items?.filter((item: any) => !menuSearch || item.name?.toLowerCase().includes(menuSearch.toLowerCase())).length === 0) && (
                              <div className="text-center py-6 text-xs" style={{ color: "var(--text-muted)" }}>
                                Không có món ăn nào trong danh mục này
                              </div>
                            )}
                          </div>

                          {/* Selected Dishes Summary list */}
                          {Object.keys(selectedDishes).length > 0 && (
                            <div className="pt-2 border-t border-dashed border-[var(--border)] space-y-2">
                              <span className="text-xs font-bold text-[var(--text)] block">Món đã chọn đặt trước:</span>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {Object.entries(selectedDishes).map(([dishId, item]) => (
                                  <div key={dishId} className="flex flex-col gap-1.5 bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)]">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold text-[var(--text)]">
                                        {item.name} <span className="text-[var(--primary)] font-bold font-mono">x{item.quantity}</span>
                                      </span>
                                      <span className="font-bold text-[var(--text)]">
                                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                                      </span>
                                    </div>
                                    <input
                                      type="text"
                                      value={item.note || ""}
                                      onChange={(e) => {
                                        setSelectedDishes(prev => ({
                                          ...prev,
                                          [dishId]: {
                                            ...prev[dishId],
                                            note: e.target.value
                                          }
                                        }));
                                      }}
                                      placeholder="Ghi chú món ăn (ít cay, không hành...)"
                                      className="w-full bg-[var(--card)] text-[10px] text-[var(--text)] border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--primary)]"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary card */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs space-y-2.5">
                  <p className="m-0 font-bold text-sm text-[var(--text)] border-b border-[var(--border)] pb-2">Tóm tắt thông tin đặt chỗ</p>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">📅 Thời gian</span>
                    <span className="font-semibold text-[var(--text)]">{date} lúc {time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">👥 Số khách</span>
                    <span className="font-semibold text-[var(--text)]">{guests} người</span>
                  </div>
                  {selectedTableIds.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">🪑 Danh sách bàn</span>
                      <span className="font-semibold text-[var(--text)]">
                        {selectedTableIds.map(id => allTables.find(t => t.id === id)?.code).filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  {wantPreOrder && Object.keys(selectedDishes).length > 0 && (
                    <>
                      <div className="flex justify-between border-t border-dashed border-[var(--border)] pt-2 mt-1">
                        <span className="text-[var(--text-muted)]">🍽️ Số món đặt trước</span>
                        <span className="font-semibold text-[var(--text)]">
                          {Object.values(selectedDishes).reduce((s, item) => s + item.quantity, 0)} món
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">💵 Tổng tiền món ăn</span>
                        <span className="font-bold text-[var(--text)] text-[var(--primary)]">
                          {Object.values(selectedDishes).reduce((s, item) => s + item.quantity * item.price, 0).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-dashed border-[var(--border)] pt-2 mt-1">
                    <span className="text-[var(--text-muted)] font-medium">💰 Yêu cầu cọc (bắt buộc)</span>
                    <span className="font-black text-sm text-[var(--primary)]">{estimatedDeposit.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                <Button 
                  onClick={() => setStep(1)} 
                  className="flex-1 rounded-xl h-11 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold"
                >
                  ← Quay lại
                </Button>
                <Button 
                  type="primary" 
                  loading={loading} 
                  onClick={handleSubmit} 
                  disabled={!name || !phone || !email}
                  className="flex-[2] rounded-xl h-11 font-bold border-none"
                  style={{ background: brandColor, color: "#fff" }}
                >
                  Xác nhận đặt bàn
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation + SePay deposit */}
          {step === 3 && (
            <div className="space-y-6">
              {transferInfo && !depositPaid ? (
                <SePayQR 
                  info={transferInfo} 
                  deadline={createdReservation?.paymentDeadline}
                  onSuccess={handleDepositSuccess} 
                  onSkip={() => setTransferInfo(null)} 
                />
              ) : (
                <div className="text-center py-4">
                  {(() => {
                    const hasDeposit = Number(createdReservation?.depositAmount) > 0;
                    if (depositPaid) {
                      return (
                        <>
                          <div className="text-5xl mb-4">⏳</div>
                          <h2 className="text-xl font-extrabold text-[var(--text)] m-0 mb-2">
                            Thanh toán cọc thành công!
                          </h2>
                          <p className="text-sm text-[var(--text-muted)] m-0 mb-6 leading-relaxed">
                            Yêu cầu đặt bàn của bạn đang <strong>chờ chủ nhà hàng xác nhận</strong>. Mã nhận bàn và mã QR check-in sẽ được gửi qua email cho bạn ngay sau khi yêu cầu được phê duyệt.
                          </p>
                        </>
                      );
                    } else if (hasDeposit) {
                      return (
                        <>
                          <div className="text-5xl mb-4">⏳</div>
                          <h2 className="text-xl font-extrabold text-[var(--text)] m-0 mb-2">
                            Chờ thanh toán tiền cọc
                          </h2>
                          <p className="text-sm text-[var(--text-muted)] m-0 mb-6 leading-relaxed">
                            Yêu cầu đặt bàn của bạn đang chờ thanh toán tiền cọc để chuyển tới chủ nhà hàng phê duyệt. Vui lòng hoàn tất thanh toán trước thời hạn để tránh bị tự động hủy.
                          </p>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <div className="text-5xl mb-4">⏳</div>
                          <h2 className="text-xl font-extrabold text-[var(--text)] m-0 mb-2">
                            Đang chờ xác nhận từ nhà hàng!
                          </h2>
                          <p className="text-sm text-[var(--text-muted)] m-0 mb-6 leading-relaxed">
                            Yêu cầu đặt bàn đã được tiếp nhận thành công và <strong>đang chờ chủ nhà hàng xác nhận</strong>. Mã xác nhận nhận bàn và QR check-in sẽ được tự động gửi qua email của bạn sau khi nhà hàng đồng ý.
                          </p>
                        </>
                      );
                    }
                  })()}

                  {/* Payment deadline countdown */}
                  {createdReservation?.paymentDeadline && !depositPaid && (
                    <div className="mb-6">
                      <PaymentDeadlineCountdown
                        deadline={createdReservation.paymentDeadline}
                        onExpired={() => showToast("warning", "Hết hạn cọc", "Đặt bàn có thể đã bị hủy do hết hạn thanh toán cọc")}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border)]">
                    <Button 
                      type="primary" 
                      block 
                      size="large" 
                      onClick={() => router.push("/")}
                      className="rounded-xl h-12 font-bold text-sm border-none"
                      style={{ background: brandColor, color: "#fff" }}
                    >
                      Quay về trang chủ
                    </Button>
                    <Button 
                      block 
                      onClick={() => router.push(`/your-reservation/${createdId}`)}
                      className="rounded-xl h-11 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold"
                    >
                      Xem chi tiết lịch trình đặt bàn
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Soft Conflict Confirmation Modal */}
      {pendingConflictTable && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-xl text-left">
            <div className="text-amber-500 text-3xl mb-3">⚠️</div>
            <h3 className="text-base font-bold text-[var(--text)] mb-2">Thông báo thời gian bàn bận</h3>
            <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
              Bàn <strong className="text-[var(--text)] font-semibold">{pendingConflictTable.code}</strong> hiện đang có một lượt khách đặt lúc{" "}
              <strong className="text-[var(--text)] font-semibold">
                {new Date(pendingConflictTable.conflictTime!).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
              .
              <br />
              <br />
              Trong trường hợp khách trước dùng bữa lâu hơn dự kiến, nhà hàng sẽ chủ động sắp xếp một bàn trống khác tương đương cho bạn khi bạn đến nhận bàn.
              <br />
              <br />
              Bạn có đồng ý với sắp xếp này không?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setPendingConflictTable(null)}
                className="flex-1 rounded-xl h-10 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setSelectedTableIds((prev) => [...prev, pendingConflictTable.id]);
                  setPendingConflictTable(null);
                }}
                className="flex-1 rounded-xl h-10 font-bold border-none"
                style={{ background: brandColor, color: "#fff" }}
              >
                Đồng ý
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
