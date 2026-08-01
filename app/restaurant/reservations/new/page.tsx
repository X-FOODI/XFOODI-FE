
"use client";

import reservationService, { AvailableTable } from "@/lib/services/reservationService";
import axiosInstance from "@/lib/services/axiosInstance";
import paymentService, { TransferInfo } from "@/lib/services/paymentService";
import voucherService from "@/lib/services/voucherService";
import PaymentDeadlineCountdown from "@/components/reservations/PaymentDeadlineCountdown";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { useThemeMode } from "@/app/theme/AntdProvider";
import Header from "@/app/components/Header";
import { Button, DatePicker, TimePicker, Modal } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io as socketIO } from "socket.io-client";
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
  Search,
  Hourglass,
  Ticket,
  AlertCircle,
  Loader2,
  Tag
} from "lucide-react";
import { TableMap2D, Layout, Floor } from "@/app/restaurant/tables/components/TableMap2D";
import TablePreview3DModal from "@/app/restaurant/tables/components/TablePreview3DModal";
import Recommendations from "@/components/menu/Recommendations";
import ReservationTimeline from "@/components/reservations/ReservationTimeline";

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

export default function NewReservationPage() {
  const { user } = useAuth();
  const { tenant, refreshTenant } = useTenant();
  const { showToast } = useToast();
  const { mode } = useThemeMode();
  const router = useRouter();

  useEffect(() => {
    refreshTenant();
  }, []);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [configFromApi, setConfigFromApi] = useState<any>(null);

  // Step 0 — time & guests
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [isManualTime, setIsManualTime] = useState(false);
  const [guests, setGuests] = useState(2);

  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictError, setConflictError] = useState("");
  
  // Real-time available slots status
  const [availableSlots, setAvailableSlots] = useState<Record<string, boolean>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 1 — table selection
  const [allTables, setAllTables] = useState<AvailableTable[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [currentFloorId, setCurrentFloorId] = useState<string>("");
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "manual">("auto");
  const [pendingConflictTable, setPendingConflictTable] = useState<AvailableTable | null>(null);
  const [acceptTimeLimit, setAcceptTimeLimit] = useState(false);
  const [acceptWaitForPendingCheckin, setAcceptWaitForPendingCheckin] = useState(false);
  const [conflictingTableCode, setConflictingTableCode] = useState("");
  const [raceConditionModalOpen, setRaceConditionModalOpen] = useState(false);
  const [preview360Open, setPreview360Open] = useState(false);
  const [preview360Table, setPreview360Table] = useState<AvailableTable | null>(null);

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

  useEffect(() => {
    if (!tenant) {
      axiosInstance.get("/restaurants/me")
        .then((res) => {
          if (res.data?.data?.metadata?.reservationConfig) {
            setConfigFromApi(res.data.data.metadata.reservationConfig);
          }
        })
        .catch(err => console.log("Lỗi tải cấu hình:", err));
    }
  }, [tenant]);

  // Step 3 — result
  const [createdId, setCreatedId] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [createdReservation, setCreatedReservation] = useState<any>(null);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const [depositPaid, setDepositPaid] = useState(false);

  // Listen for real-time status changes in Step 3
  useEffect(() => {
    if (step !== 3 || !createdId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://api.xfoodi.website";
    const socket = socketIO(socketUrl, {
      transports: ["polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join_reservation", createdId);
    });

    socket.on("RESERVATION_STATUS_CHANGED", (data: {
      reservationId: string;
      status: string;
      statusName: string;
    }) => {
      if (data.reservationId !== createdId) return;
      setCreatedReservation((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          statusValue: {
            ...prev.statusValue,
            code: data.status,
            name: data.statusName || data.status,
          },
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [step, createdId]);

  // Step 2 — pre-order dishes state
  const [wantPreOrder, setWantPreOrder] = useState(false);
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<Record<string, { quantity: number; name: string; price: number; note?: string }>>({});
  const [menuSearch, setMenuSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [menuLoading, setMenuLoading] = useState(false);

  // Step 2 — voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [selectedUserVoucher, setSelectedUserVoucher] = useState<any>(null);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [showVoucherList, setShowVoucherList] = useState(false);

  const brandColor = tenant?.primaryColor || "#FF5A2C";
  const restaurantId = tenant?.id || user?.restaurantId || "";

  // Fetch my vouchers when logged-in user enters step 2
  useEffect(() => {
    if (step !== 2 || !user || !restaurantId) return;
    setVoucherLoading(true);
    voucherService.getMyVouchers(restaurantId, true)
      .then((res) => {
        const list = res?.data ?? [];
        setMyVouchers(list);
      })
      .catch(() => setMyVouchers([]))
      .finally(() => setVoucherLoading(false));
  }, [step, user, restaurantId]);

  // Apply voucher by code input
  const handleApplyByCode = async () => {
    if (!voucherCodeInput.trim()) return;
    setApplyingVoucher(true);
    setVoucherError("");
    try {
      const code = voucherCodeInput.trim().toUpperCase();
      // 1. Check in already-redeemed vouchers first
      const found = myVouchers.find(
        (uv) => uv.voucher?.code?.toUpperCase() === code
      );
      if (found) {
        setSelectedUserVoucher(found);
        setShowVoucherList(false);
        return;
      }
      // 2. Otherwise try to find in eligible vouchers and auto-redeem if free
      const eligibleRes = await voucherService.getEligibleVouchers();
      const allEligible = [
        ...(eligibleRes?.platformVouchers ?? []),
        ...(eligibleRes?.ownerVouchers ?? []),
      ];
      const match = allEligible.find((v: any) => v.code?.toUpperCase() === code);
      if (!match) {
        setVoucherError("Không tìm thấy mã voucher hoặc voucher không khả dụng.");
        return;
      }
      if (Number(match.pointsRequired) > 0) {
        setVoucherError(`Voucher này yêu cầu ${match.pointsRequired} điểm để đổi. Vui lòng đổi điểm tại trang Voucher trước.`);
        return;
      }
      // Auto-redeem free voucher (pass voucherId in payload)
      await voucherService.redeemVoucher({ voucherId: match.id });
      // Re-fetch my-vouchers to get the newly created UserVoucher
      const refreshed = await voucherService.getMyVouchers(restaurantId, true);
      const refreshedList = refreshed?.data ?? [];
      setMyVouchers(refreshedList);
      const newUv = refreshedList.find((uv: any) => uv.voucher?.code?.toUpperCase() === code);
      if (newUv) {
        setSelectedUserVoucher(newUv);
        setShowVoucherList(false);
      }
    } catch (err: any) {
      setVoucherError(err?.response?.data?.message || err?.message || "Áp dụng voucher thất bại.");
    } finally {
      setApplyingVoucher(false);
    }
  };

  const addRecommendedDish = (dishId: string) => {
    let foundDish: any = null;
    for (const category of menu) {
      const dish = category.items?.find((item: any) => item.id === dishId);
      if (dish) {
        foundDish = dish;
        break;
      }
    }
    if (!foundDish) return;
    setSelectedDishes(prev => ({
      ...prev,
      [dishId]: {
        quantity: (prev[dishId]?.quantity || 0) + 1,
        name: foundDish.name || "",
        price: foundDish.price || 0,
        note: prev[dishId]?.note || ""
      }
    }));
  };

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
  // Build 2D layout for the reservation table picker using real coordinates, dimensions and floor backgrounds
  const reservationLayout = useMemo((): Layout => {
    if (!allTables.length) return { id: "empty", name: "", floors: [], activeFloorId: "" };

    const floorMap = new Map<string, { id: string; name: string; tables: AvailableTable[] }>();
    for (const t of allTables) {
      const floorName = t.floor?.name || "Tầng chưa đặt tên";
      if (!floorMap.has(t.floorId)) floorMap.set(t.floorId, { id: t.floorId, name: floorName, tables: [] });
      floorMap.get(t.floorId)!.tables.push(t);
    }

    const selectedSet = new Set(selectedTableIds);

    const hasAvailableSmallerTable = allTables.some(
      (t) => t.isAvailable !== false && t.seatingCapacity >= guests && t.seatingCapacity <= guests + 2
    );

    const floors: Floor[] = Array.from(floorMap.values()).map(({ id, name, tables }) => {
      const firstTableFloor = tables[0]?.floor;
      const floorWidth = firstTableFloor?.width !== undefined && firstTableFloor?.width !== null ? Number(firstTableFloor.width) : 1200;
      const floorHeight = firstTableFloor?.height !== undefined && firstTableFloor?.height !== null ? Number(firstTableFloor.height) : 800;
      const floorImageUrl = firstTableFloor?.imageUrl || undefined;

      return {
        id,
        name,
        width: floorWidth,
        height: floorHeight,
        backgroundImage: floorImageUrl,
        tables: tables.map((t) => ({
          id: t.id,
          tenantId: "",
          name: t.code,
          seats: t.seatingCapacity,
          status: (
            selectedSet.has(t.id)
              ? "SELECTED"
              : t.isAvailable === false
                ? "RESERVED"
                : (t.seatingCapacity > guests + 2 && hasAvailableSmallerTable)
                  ? "UNAVAILABLE"
                  : "AVAILABLE"
          ) as "SELECTED" | "RESERVED" | "UNAVAILABLE" | "AVAILABLE",
          area: name,
          position: {
            x: t.positionX !== undefined && t.positionX !== null ? Number(t.positionX) : 0,
            y: t.positionY !== undefined && t.positionY !== null ? Number(t.positionY) : 0,
          },
          shape: (t.shape || "Square") as "Rectangle" | "Oval" | "Square" | "Circle",
          width: t.width !== undefined && t.width !== null ? Number(t.width) : 80,
          height: t.height !== undefined && t.height !== null ? Number(t.height) : 80,
          rotation: t.rotation !== undefined && t.rotation !== null ? Number(t.rotation) : 0,
        })),
      };
    });

    const resolvedFloorId = (currentFloorId && floors.some(f => f.id === currentFloorId))
      ? currentFloorId : floors[0]?.id || "";

    return { id: "reservation", name: "Chọn bàn", floors, activeFloorId: resolvedFloorId };
  }, [allTables, selectedTableIds, currentFloorId, guests]);

  const handleReservationLayoutChange = (updated: Layout) => {
    if (updated.activeFloorId !== currentFloorId) setCurrentFloorId(updated.activeFloorId);
  };

  const selectedDayKey = useMemo(() => {
    if (!date) return "";
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const d = dayjs(date);
    return days[d.day()];
  }, [date]);

  const timeSlots = useMemo(() => {
    const config = configFromApi || tenant?.metadata?.reservationConfig || {};
    let openStr = config.opening_time ?? "10:00";
    let closeStr = config.closing_time ?? "22:00";

    if (selectedDayKey) {
      const meta = tenant?.metadata || {};
      const operatingHours = meta.operatingHours || {};
      const dayConfig = operatingHours[selectedDayKey];
      if (dayConfig && dayConfig.isOpen) {
        openStr = dayConfig.open || openStr;
        closeStr = dayConfig.close || closeStr;
      }
    }

    const openParts = openStr.split(":");
    const closeParts = closeStr.split(":");
    const openMin = parseInt(openParts[0]) * 60 + parseInt(openParts[1] || "0");
    let closeMin = parseInt(closeParts[0]) * 60 + parseInt(closeParts[1] || "0");
    
    if (closeMin < openMin) {
      closeMin += 24 * 60;
    }
    
    const lastBookingBeforeClose = config.last_booking_before_close_minutes ?? 60;
    const latestBookingMin = closeMin - lastBookingBeforeClose;

    // Check mode
    if (config.time_slot_mode === "FIXED_SLOTS" && Array.isArray(config.fixed_time_slots) && config.fixed_time_slots.length > 0) {
      // Filter fixed slots that fall within operating hours
      return config.fixed_time_slots.filter((slotStr: string) => {
        const parts = slotStr.split(":");
        if (parts.length < 2) return false;
        const slotMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        return slotMin >= openMin && slotMin <= latestBookingMin;
      });
    }
    
    // Default INTERVAL mode
    const step = config.slot_interval_minutes ?? 30;
    const slots = [];
    for (let min = openMin; min <= latestBookingMin; min += step) {
      const displayMin = min % (24 * 60);
      const h = Math.floor(displayMin / 60).toString().padStart(2, '0');
      const m = (displayMin % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  }, [configFromApi, tenant, selectedDayKey]);

  // Fetch available slots from backend whenever date, guests or restaurant change
  useEffect(() => {
    if (!date || !guests || !restaurantId) return;
    
    let active = true;
    const fetchAvailableSlots = async () => {
      try {
        setLoadingSlots(true);
        const slotsStatus = await reservationService.checkSlots({
          restaurantId,
          date,
          numberOfGuests: guests,
        });
        if (active) {
          setAvailableSlots(slotsStatus);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra khung giờ trống:", err);
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    };

    fetchAvailableSlots();
    return () => {
      active = false;
    };
  }, [date, guests, restaurantId]);

  useEffect(() => {
    if (timeSlots.length > 0) {
      // Find first slot that is neither in past nor has zero available tables
      const firstAvailable = timeSlots.find((slot: string) => {
        const isPast = isSlotInPast(slot);
        const isBooked = availableSlots[slot] === false;
        return !isPast && !isBooked;
      });
      // If current selected time is not valid or no longer exists/is unavailable, fallback to first available
      const currentIsUnavailable = availableSlots[time] === false;
      if (firstAvailable && (currentIsUnavailable || isSlotInPast(time) || !timeSlots.includes(time))) {
        setTime(firstAvailable);
      }
    }
  }, [timeSlots, availableSlots, time, date]);

  // Max allowed table capacity = guests + 2 (buffer to avoid wasting big tables)
  const maxTableCapacity = guests + 2;

  const handleTableToggle = (tableId: string) => {
    const table = allTables.find(t => t.id === tableId);
    // Deselect always allowed
    if (selectedTableIds.includes(tableId)) {
      setSelectedTableIds(prev => prev.filter(id => id !== tableId));
      setAcceptTimeLimit(false);
      setAcceptWaitForPendingCheckin(false);
      return;
    }
    // Show warning modal for conflict cases (pending check-in / time limit / unavailable)
    if (
      table &&
      (table.isAvailable === false ||
        table.conflictType === "PENDING_CHECKIN" ||
        table.conflictType === "TIME_LIMIT")
    ) {
      setPendingConflictTable(table);
      return;
    }
    // Block if table is on a different floor than already selected tables
    if (selectedTableIds.length > 0) {
      const firstTable = allTables.find(t => t.id === selectedTableIds[0]);
      if (firstTable && table && firstTable.floorId !== table.floorId) {
        showToast(
          "error",
          "Không thể chọn bàn khác tầng",
          `Bàn ${table.code} nằm ở tầng khác với các bàn bạn đã chọn trước đó. Vui lòng chỉ chọn các bàn cùng một tầng.`
        );
        return;
      }
    }
    // Block if table alone is way too large (capacity > guests + 2) ONLY IF smaller available tables exist
    const hasAvailableSmallerTable = allTables.some(
      (t) => t.isAvailable !== false && t.seatingCapacity >= guests && t.seatingCapacity <= guests + 2
    );
    if (table && table.seatingCapacity > maxTableCapacity && hasAvailableSmallerTable) {
      showToast(
        "error",
        "Bàn quá lớn cho nhóm của bạn",
        `Bàn ${table.code} có sức chứa ${table.seatingCapacity} chỗ, trong khi nhóm của bạn chỉ có ${guests} người. Vui lòng chọn bàn phù hợp hơn (tối đa ${maxTableCapacity} chỗ).`
      );
      return;
    }
    setSelectedTableIds(prev => [...prev, tableId]);
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

  // Estimate deposit amount based on restaurant settings (reservationConfig)
  const reservationConfig = configFromApi || tenant?.metadata?.reservationConfig || {};
  const depositEnabled = reservationConfig.deposit_enabled === true;
  const depositAmountSetting = reservationConfig.deposit_amount;

  const estimatedDeposit = !depositEnabled
    ? 0
    : (depositAmountSetting !== undefined && depositAmountSetting !== null && Number(depositAmountSetting) > 0)
      ? Number(depositAmountSetting)
      : (assignmentMode === "manual" && selectedTableIds.length > 0)
        ? selectedTableIds.reduce((sum, id) => {
            const tbl = allTables.find((t) => t.id === id);
            return sum + (tbl ? tbl.seatingCapacity * 25000 : 0);
          }, 0)
        : guests * 25000;

  const getSafeIsoTime = useCallback((dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return "";
    const config = configFromApi || tenant?.metadata?.reservationConfig || {};
    let openStr = config.opening_time ?? "10:00";
    if (selectedDayKey) {
      const meta = tenant?.metadata || {};
      const operatingHours = meta.operatingHours || {};
      const dayConfig = operatingHours[selectedDayKey];
      if (dayConfig && dayConfig.isOpen) {
        openStr = dayConfig.open || openStr;
      }
    }

    const [h, m] = timeStr.split(":").map(Number);
    const [opH, opM] = openStr.split(":").map(Number);
    const openMin = opH * 60 + opM;
    const currentMin = h * 60 + m;

    let d = dayjs(dateStr);
    if (currentMin < openMin) {
      d = d.add(1, "day");
    }
    return d.hour(h).minute(m).second(0).millisecond(0).toISOString();
  }, [configFromApi, tenant, selectedDayKey]);

  const isSlotInPast = useCallback((slot: string) => {
    if (!date) return false;
    const todayStr = dayjs().format("YYYY-MM-DD");
    if (date !== todayStr) return false;
    
    const [h, m] = slot.split(":").map(Number);
    const slotTime = dayjs().hour(h).minute(m).second(0).millisecond(0);
    const minBookingTime = dayjs().add(30, "minute");
    return slotTime.isBefore(minBookingTime);
  }, [date]);

  // ── Step 0 → 1: check available tables ──────────────────────────────────────
  const handleCheckTables = async () => {
    if (!date || !time || !restaurantId) {
      showToast("error", "Thiếu thông tin", "Vui lòng chọn ngày, giờ và nhà hàng");
      return;
    }

    // Reset previous selection when performing a new search
    setSelectedTableIds([]);
    setAcceptTimeLimit(false);
    setAcceptWaitForPendingCheckin(false);
    setAssignmentMode("auto");

    const isoTime = getSafeIsoTime(date, time);
    const selectedDateTime = new Date(isoTime);
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
      // Early conflict check for logged-in users
      if (user) {
        const conflictRes = await reservationService.checkConflict({
          restaurantId,
          time: isoTime,
        });
        if (conflictRes.conflict) {
          showToast("error", "Lịch đặt trùng", "Bạn đã có một lịch đặt bàn khác trùng khung giờ này (hoặc đang ngồi ăn tại nhà hàng)");
          setLoading(false);
          return;
        }
      }

      const tables = await reservationService.checkTables({ restaurantId, time: isoTime, numberOfGuests: guests });
      setAllTables(tables);
      setStep(1);
    } catch (err: any) {
      showToast("error", "Lỗi", err?.response?.data?.message || err.message || "Không thể kiểm tra bàn trống");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailBlur = async (emailVal: string) => {
    if (!emailVal || !emailVal.trim() || !date || !time) return;
    try {
      setCheckingConflict(true);
      const isoTime = getSafeIsoTime(date, time);
      const res = await reservationService.checkConflict({
        restaurantId,
        time: isoTime,
        email: emailVal.trim(),
      });
      if (res.conflict) {
        setConflictError("Bạn đã có một lịch đặt bàn khác trùng khung giờ này.");
        showToast("error", "Lịch đặt trùng", "Bạn đã có một lịch đặt bàn khác trùng khung giờ này");
      } else {
        setConflictError("");
      }
    } catch (e) {
      // Ignore network errors
    } finally {
      setCheckingConflict(false);
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
      const isoTime = getSafeIsoTime(date, time);
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
        acceptTimeLimit: acceptTimeLimit || undefined,
        acceptWaitForPendingCheckin: acceptWaitForPendingCheckin || undefined,
        fullName: name,
        phoneNumber: phone,
        email: email.trim(),
        bankRefund,
        dishes: dishesPayload,
        userVoucherId: selectedUserVoucher?.id || undefined,
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
        showToast("success", "Tiếp nhận thành công", "Yêu cầu đặt bàn đã được gửi và đang chờ xác nhận");
      }
      setStep(3);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Không thể đặt bàn";
      if (msg.includes("đã có lượt đặt trước") || msg.includes("trùng khung giờ")) {
        const match = msg.match(/Bàn\s+([A-Za-z0-9_\-]+)/i);
        const code = match ? match[1] : "bạn chọn";
        setConflictingTableCode(code);
        setRaceConditionModalOpen(true);
      } else {
        showToast("error", "Lỗi", msg);
      }
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

              <div className="space-y-5">
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

                <div className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Giờ đến
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManualTime(!isManualTime)}
                      className="text-xs font-bold bg-transparent border-none cursor-pointer hover:underline transition-colors p-0"
                      style={{ color: brandColor }}
                    >
                      {isManualTime ? "Chọn từ danh sách" : "Nhập giờ tự chọn"}
                    </button>
                  </div>
                  
                  {isManualTime ? (
                    <TimePicker 
                      value={time ? dayjs(time, "HH:mm") : null}
                      onChange={(val) => setTime(val ? val.format("HH:mm") : "")}
                      format="HH:mm"
                      minuteStep={5}
                      className="w-full h-11 rounded-xl"
                      placeholder="Chọn giờ tự do (ví dụ: 18:15)"
                      allowClear={false}
                    />
                  ) : (
                    <div className="relative border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-2">
                      {loadingSlots && (
                        <div className="absolute inset-0 bg-[var(--surface)]/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                          <div className="w-5 h-5 rounded-full border-2 animate-spin border-[var(--primary)] border-t-transparent" style={{ borderColor: brandColor, borderTopColor: "transparent" }} />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[160px] overflow-y-auto p-1">
                        {timeSlots.length === 0 ? (
                          <p className="col-span-full text-center text-xs text-[var(--text-muted)] py-4 m-0">
                            Nhà hàng đóng cửa hoặc không nhận đặt bàn vào ngày này
                          </p>
                        ) : (
                          timeSlots.map((slot) => {
                            const isSelected = time === slot;
                            const isPast = isSlotInPast(slot);
                            // Disabled if slot is in past OR no available tables
                            const isUnavailable = availableSlots[slot] === false;
                            const isDisabled = isPast || isUnavailable;

                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setTime(slot)}
                                disabled={isDisabled}
                                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all duration-200 border text-center ${
                                  isDisabled
                                    ? "bg-zinc-800/10 dark:bg-zinc-100/5 text-zinc-400 dark:text-zinc-600 border-zinc-200/50 dark:border-zinc-800/50 cursor-not-allowed opacity-30"
                                    : isSelected
                                      ? "text-white cursor-pointer"
                                      : "bg-[var(--card)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)] cursor-pointer"
                                }`}
                                style={isSelected && !isDisabled ? { background: brandColor, borderColor: brandColor } : {}}
                                title={isUnavailable ? "Không còn bàn trống phù hợp" : isPast ? "Thời gian đã trôi qua" : ""}
                              >
                                {slot}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
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
                        setAcceptTimeLimit(false);
                        setAcceptWaitForPendingCheckin(false);
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

                        <div className="h-[500px] md:h-[650px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
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
                          <div className="flex flex-col gap-2 mb-4 max-h-[200px] overflow-y-auto pr-1">
                            {selectedTableIds.map(id => {
                              const t = allTables.find(t => t.id === id);
                              if (!t) return null;
                              const has360 = !!(t.cubeFrontImageUrl || t.defaultViewUrl);
                              return (
                                <div key={id} className="flex flex-col gap-1.5 p-2 bg-[var(--card)] rounded-xl border border-[var(--border)] text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[var(--text)]">Bàn {t.code}</span>
                                    <span className="text-[var(--text-muted)]">{t.seatingCapacity} chỗ</span>
                                    <button onClick={() => handleTableToggle(id)} className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] hover:text-red-500 text-sm p-0.5 leading-none">×</button>
                                  </div>
                                  {has360 && (
                                    <button
                                      onClick={() => {
                                        setPreview360Table(t);
                                        setPreview360Open(true);
                                      }}
                                      className="flex items-center justify-center gap-1.5 w-full rounded-lg py-1 text-[10px] font-bold border cursor-pointer transition-all"
                                      style={{ background: `${brandColor}18`, borderColor: brandColor, color: brandColor }}
                                    >
                                      <span>360°</span>
                                      <span>Xem góc nhìn 360°</span>
                                    </button>
                                  )}
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
                            disabled={selectedTableIds.length === 0 || totalSelectedCapacity < guests}
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
                {/* Họ tên */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Họ và tên khách hàng</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input 
                      type="text" 
                      value={name} 
                      placeholder="Nguyễn Văn A" 
                      onChange={(e) => setName(e.target.value)} 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" 
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Số điện thoại liên lạc</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Phone className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input 
                      type="tel" 
                      value={phone} 
                      placeholder="0905 123 456" 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" 
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Địa chỉ Email nhận mã xác nhận</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Mail className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input 
                      type="email" 
                      value={email} 
                      placeholder="example@gmail.com" 
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (conflictError) setConflictError("");
                      }}
                      onBlur={(e) => handleEmailBlur(e.target.value)}
                      disabled={!!user}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none transition-colors disabled:opacity-60 ${
                        conflictError ? "border-red-500 focus:border-red-500" : "border-[var(--border)] focus:border-[var(--primary)]"
                      }`}
                    />
                  </div>
                  {checkingConflict && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 animate-pulse">Đang kiểm tra lịch trùng...</p>
                  )}
                  {conflictError && (
                    <p className="text-[11px] text-red-500 mt-1 font-semibold">⚠️ {conflictError}</p>
                  )}
                </div>

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

                          {/* AI Recommendations for Pre-order — luôn hiện khi toggle bật */}
                          {restaurantId && (
                            <div className="pt-4 border-t border-dashed border-[var(--border)] space-y-4">
                              {/* Bán chạy & thói quen — luôn hiện */}
                              <Recommendations
                                variant="top-sellers"
                                restaurantId={restaurantId}
                                excludeIds={Object.keys(selectedDishes)}
                                onAdd={addRecommendedDish}
                              />
                              {/* Thường được gọi kèm — hiện khi đã có món */}
                              {Object.keys(selectedDishes).length > 0 && (
                                <Recommendations
                                  variant="frequently-bought"
                                  restaurantId={restaurantId}
                                  dishId={Object.keys(selectedDishes)[0]}
                                  excludeIds={Object.keys(selectedDishes)}
                                  onAdd={addRecommendedDish}
                                />
                              )}
                              {/* AI gợi ý theo giỏ — hiện khi đã có món */}
                              {Object.keys(selectedDishes).length > 0 && (
                                <Recommendations
                                  variant="for-cart"
                                  restaurantId={restaurantId}
                                  cartDishIds={Object.keys(selectedDishes)}
                                  excludeIds={Object.keys(selectedDishes)}
                                  onAdd={addRecommendedDish}
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Voucher Section (shown when pre-ordering or always logged-in) ── */}
                {user && (
                  <div className="rounded-2xl border border-[var(--border)] p-4 space-y-3" style={{ background: "var(--surface)" }}>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-bold text-[var(--text)]">Mã Voucher</span>
                      {selectedUserVoucher && (
                        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full text-green-400 bg-green-400/10 border border-green-400/20">
                          Áp dụng: {selectedUserVoucher.voucher?.code}
                        </span>
                      )}
                    </div>

                    {selectedUserVoucher ? (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-green-500/30 bg-green-500/5">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-green-400" />
                          <div>
                            <p className="text-xs font-bold text-[var(--text)] m-0">{selectedUserVoucher.voucher?.code}</p>
                            <p className="text-[10px] text-[var(--text-muted)] m-0">
                              {selectedUserVoucher.voucher?.discountType === 'percentage'
                                ? `Giảm ${selectedUserVoucher.voucher?.discountValue}%`
                                : `Giảm ${Number(selectedUserVoucher.voucher?.discountValue).toLocaleString('vi-VN')}đ`
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedUserVoucher(null); setVoucherCodeInput(""); setVoucherError(""); }}
                          className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nhập mã voucher (ví dụ: SALE25)"
                            value={voucherCodeInput}
                            onChange={(e) => { setVoucherCodeInput(e.target.value); setVoucherError(""); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyByCode()}
                            disabled={applyingVoucher}
                            className="flex-1 pl-3 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyByCode}
                            disabled={applyingVoucher || !voucherCodeInput.trim()}
                            className="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: voucherCodeInput.trim() ? "var(--primary)" : "var(--border)",
                              color: voucherCodeInput.trim() ? "#fff" : "var(--text-muted)"
                            }}
                          >
                            {applyingVoucher && <Loader2 className="w-3 h-3 animate-spin" />}
                            Áp dụng
                          </button>
                        </div>

                        {myVouchers.length > 0 && (
                          <>
                            <div className="text-center text-[10px] text-[var(--text-muted)]">hoặc chọn từ danh sách</div>
                            <button
                              type="button"
                              onClick={() => setShowVoucherList(v => !v)}
                              disabled={voucherLoading}
                              className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all text-xs"
                            >
                              <span>
                                {voucherLoading ? 'Đang tải voucher...' : `Voucher của tôi (${myVouchers.length} khả dụng)`}
                              </span>
                              <Ticket className="w-4 h-4" />
                            </button>
                            {showVoucherList && (
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {myVouchers.map((uv: any) => (
                                  <button
                                    key={uv.id}
                                    type="button"
                                    onClick={() => { setSelectedUserVoucher(uv); setShowVoucherList(false); setVoucherError(""); }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] transition-all text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Ticket className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
                                      <div>
                                        <p className="text-xs font-bold text-[var(--text)] m-0">{uv.voucher?.code}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] m-0">
                                          {uv.voucher?.discountType === 'percentage'
                                            ? `Giảm ${uv.voucher?.discountValue}%`
                                            : `Giảm ${Number(uv.voucher?.discountValue).toLocaleString('vi-VN')}đ`
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    <Check className="w-3.5 h-3.5 text-green-400 opacity-0 group-hover:opacity-100" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {voucherError && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1 m-0">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {voucherError}
                      </p>
                    )}
                  </div>
                )}

                {/* Summary card */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs space-y-2.5">
                  <p className="m-0 font-bold text-sm text-[var(--text)] border-b border-[var(--border)] pb-2">Tóm tắt thông tin đặt chỗ</p>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Calendar className="w-3.5 h-3.5" /> Thời gian
                    </span>
                    <span className="font-semibold text-[var(--text)]">{date} lúc {time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Users className="w-3.5 h-3.5" /> Số khách
                    </span>
                    <span className="font-semibold text-[var(--text)]">{guests} người</span>
                  </div>
                  {selectedTableIds.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        <MapPin className="w-3.5 h-3.5" /> Danh sách bàn
                      </span>
                      <span className="font-semibold text-[var(--text)]">
                        {selectedTableIds.map(id => allTables.find(t => t.id === id)?.code).filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  {wantPreOrder && Object.keys(selectedDishes).length > 0 && (() => {
                    const subT = Object.values(selectedDishes).reduce((s, item) => s + item.quantity * item.price, 0);
                    let cappedDisc = 0;
                    let voucherCode = "";
                    if (selectedUserVoucher) {
                      const v = selectedUserVoucher.voucher;
                      voucherCode = v?.code || "";
                      const disc = v?.discountType === 'percentage'
                        ? subT * (Number(v?.discountValue) / 100)
                        : Number(v?.discountValue ?? 0);
                      cappedDisc = Math.min(disc, subT);
                    }
                    const taxable = Math.max(0, subT - cappedDisc);
                    const tax = taxable * 0.1;
                    const totalPayable = taxable + tax;

                    return (
                      <>
                        <div className="flex justify-between items-center border-t border-dashed border-[var(--border)] pt-2 mt-1">
                          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <FileText className="w-3.5 h-3.5" /> Số món đặt trước
                          </span>
                          <span className="font-semibold text-[var(--text)]">
                            {Object.values(selectedDishes).reduce((s, item) => s + item.quantity, 0)} món
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Landmark className="w-3.5 h-3.5" /> Tổng tiền món ăn
                          </span>
                          <span className="font-semibold text-[var(--text)]">
                            {subT.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                        {cappedDisc > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-green-500 font-medium">
                              <Ticket className="w-3.5 h-3.5" /> Giảm giá {voucherCode ? `(${voucherCode})` : ""}
                            </span>
                            <span className="font-bold text-green-500">-{cappedDisc.toLocaleString("vi-VN")}đ</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Landmark className="w-3.5 h-3.5" /> Thuế VAT (10%)
                          </span>
                          <span className="font-semibold text-[var(--text)]">
                            {tax.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border)]">
                          <span className="flex items-center gap-1.5 text-[var(--text)] font-bold">
                            <Landmark className="w-3.5 h-3.5" /> Số tiền phải trả
                          </span>
                          <span className="font-extrabold text-[var(--primary)] text-sm">
                            {totalPayable.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  {estimatedDeposit > 0 ? (
                    <div className="flex justify-between items-center border-t border-dashed border-[var(--border)] pt-2 mt-1">
                      <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
                        <Landmark className="w-3.5 h-3.5" /> Yêu cầu cọc (bắt buộc)
                      </span>
                      <span className="font-black text-sm text-[var(--primary)]">{estimatedDeposit.toLocaleString("vi-VN")}đ</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-t border-dashed border-[var(--border)] pt-2 mt-1">
                      <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
                        <Landmark className="w-3.5 h-3.5" /> Yêu cầu cọc
                      </span>
                      <span className="font-bold text-sm text-green-500">Miễn phí (Không yêu cầu)</span>
                    </div>
                  )}
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
                  disabled={!name || !phone || !email || checkingConflict || !!conflictError}
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
                <div className="text-center py-4 space-y-6">
                  <div className="border border-[var(--border)] rounded-2xl p-4 md:p-6 bg-[var(--surface)]">
                    <ReservationTimeline currentStatus={createdReservation?.statusValue?.code || "PENDING"} />
                  </div>
                  
                  {(() => {
                    const hasDeposit = Number(createdReservation?.depositAmount) > 0;
                    if (depositPaid) {
                      return (
                        <>
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

      {/* Table Conflict/Reservation Warning Modal */}
      {pendingConflictTable && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-xl text-left">
            {pendingConflictTable.conflictType === "PENDING_CHECKIN" ? (
              <>
                <div className="text-orange-500 text-3xl mb-3">⏳</div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2">Bàn có lượt đặt chưa check-in</h3>
                <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                  Bàn <strong className="text-[var(--text)] font-semibold">{pendingConflictTable.code}</strong> đang có lượt đặt lúc{" "}
                  <strong className="text-[var(--text)] font-semibold">
                    {pendingConflictTable.pendingReservation
                      ? dayjs(pendingConflictTable.pendingReservation.time).format("HH:mm")
                      : pendingConflictTable.conflictTime
                        ? dayjs(pendingConflictTable.conflictTime).format("HH:mm")
                        : time}
                  </strong>{" "}
                  nhưng khách chưa check-in.
                  <br />
                  <br />
                  {pendingConflictTable.pendingReservation?.expectedEndTime && (
                    <>
                      Dự kiến bàn trống sau{" "}
                      <strong className="text-[var(--text)] font-semibold">
                        {dayjs(pendingConflictTable.pendingReservation.expectedEndTime).format("HH:mm")}
                      </strong>
                      . Nếu khách đặt trước không đến, bạn sẽ được ưu tiên sử dụng bàn này.
                    </>
                  )}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setPendingConflictTable(null)}
                      className="flex-1 rounded-xl h-10 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold text-xs"
                    >
                      Tự chọn bàn khác
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        setAssignmentMode("auto");
                        setSelectedTableIds([]);
                        setAcceptTimeLimit(false);
                        setAcceptWaitForPendingCheckin(false);
                        setPendingConflictTable(null);
                      }}
                      className="flex-1 rounded-xl h-10 font-bold border-none text-xs"
                      style={{ background: brandColor, color: "#fff" }}
                    >
                      Đợi có bàn
                    </Button>
                  </div>
                  <Button
                    type="primary"
                    onClick={() => {
                      setSelectedTableIds((prev) => [...prev, pendingConflictTable.id]);
                      setAcceptWaitForPendingCheckin(true);
                      setAcceptTimeLimit(false);
                      setPendingConflictTable(null);
                    }}
                    className="w-full rounded-xl h-10 font-bold border-none text-xs"
                    style={{ background: brandColor, color: "#fff" }}
                  >
                    Đợi đến khi bàn trống
                  </Button>
                </div>
              </>
            ) : pendingConflictTable.isAvailable === false || pendingConflictTable.conflictType === "TIME_LIMIT" ? (
              <>
                <div className="text-amber-500 text-3xl mb-3">⚠️</div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2">Bàn đã được đặt trước</h3>
                <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                  Bàn <strong className="text-[var(--text)] font-semibold">{pendingConflictTable.code}</strong> đã có khách khác đặt trước trùng với khung giờ của bạn ({time}).
                  <br />
                  <br />
                  Vì không thể chắc chắn thời gian khách trước trả bàn, bạn có muốn chuyển sang chế độ <strong className="text-[var(--text)] font-semibold">"Tự động xếp bàn"</strong> để nhà hàng chủ động bố trí bàn trống phù hợp khác cho bạn khi bạn đến không?
                </p>
                {(pendingConflictTable.mustLeaveBy || pendingConflictTable.conflictTime) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
                    <p className="text-xs text-blue-800 dark:text-blue-200 m-0 leading-relaxed">
                      💡 <strong>Hoặc:</strong> Bạn cam kết trả bàn trước{" "}
                      <strong>
                        {pendingConflictTable.mustLeaveBy ||
                          dayjs(pendingConflictTable.conflictTime).subtract(30, "minute").format("HH:mm")}
                      </strong>{" "}
                      (trước 30 phút so với lượt đặt tiếp theo).
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setPendingConflictTable(null)}
                      className="flex-1 rounded-xl h-10 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold text-xs"
                    >
                      Tự chọn bàn khác
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        setAssignmentMode("auto");
                        setSelectedTableIds([]);
                        setAcceptTimeLimit(false);
                        setAcceptWaitForPendingCheckin(false);
                        setPendingConflictTable(null);
                      }}
                      className="flex-1 rounded-xl h-10 font-bold border-none text-xs"
                      style={{ background: brandColor, color: "#fff" }}
                    >
                      Tự động xếp bàn
                    </Button>
                  </div>
                  <Button
                    type="primary"
                    onClick={() => {
                      setSelectedTableIds((prev) => [...prev, pendingConflictTable.id]);
                      setAcceptTimeLimit(true);
                      setAcceptWaitForPendingCheckin(false);
                      setPendingConflictTable(null);
                    }}
                    className="w-full rounded-xl h-10 font-bold border-none text-xs"
                    style={{ background: brandColor, color: "#fff" }}
                  >
                    Đồng ý trả bàn trước 30p
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-amber-500 text-3xl mb-3">⚠️</div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2">Thông báo thời gian bàn bận</h3>
                <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
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
                {(pendingConflictTable.mustLeaveBy || pendingConflictTable.conflictTime) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
                    <p className="text-xs text-blue-800 dark:text-blue-200 m-0 leading-relaxed">
                      💡 Bạn cam kết trả bàn trước{" "}
                      <strong>
                        {pendingConflictTable.mustLeaveBy ||
                          dayjs(pendingConflictTable.conflictTime).subtract(30, "minute").format("HH:mm")}
                      </strong>{" "}
                      (trước 30 phút so với lượt đặt tiếp theo).
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setPendingConflictTable(null)}
                    className="flex-1 rounded-xl h-10 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setSelectedTableIds((prev) => [...prev, pendingConflictTable.id]);
                      setAcceptTimeLimit(true);
                      setPendingConflictTable(null);
                    }}
                    className="flex-1 rounded-xl h-10 font-bold border-none text-xs"
                    style={{ background: brandColor, color: "#fff" }}
                  >
                    Đồng ý trả bàn trước 30p
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Race Condition Conflict Modal */}
      {raceConditionModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-xl text-left">
            <div className="text-red-500 text-3xl mb-3">🚨</div>
            <h3 className="text-base font-bold text-[var(--text)] mb-2">Bàn vừa được đặt chỗ</h3>
            <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
              Bàn bạn chọn (<strong className="text-[var(--text)] font-semibold">Bàn {conflictingTableCode}</strong>) vừa được một khách hàng khác đặt thành công trước đó vài giây trong lúc bạn đang điền thông tin.
              <br />
              <br />
              Bạn có muốn hệ thống tự động tìm và xếp một bàn trống tương đương khác cho bạn không?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setRaceConditionModalOpen(false);
                  setStep(1); // Go back to floor plan
                }}
                className="flex-1 rounded-xl h-10 border-[var(--border)] text-[var(--text)] bg-transparent font-semibold text-xs"
              >
                Quay lại tự chọn
              </Button>
              <Button
                type="primary"
                onClick={async () => {
                  setRaceConditionModalOpen(false);
                  setAssignmentMode("auto");
                  setSelectedTableIds([]);
                  setAcceptTimeLimit(false);
                  setAcceptWaitForPendingCheckin(false);
                  setTimeout(() => {
                    handleSubmit();
                  }, 100);
                }}
                className="flex-1 rounded-xl h-10 font-bold border-none text-xs"
                style={{ background: brandColor, color: "#fff" }}
              >
                Tự động xếp bàn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 360° PANORAMA PREVIEW MODAL ─── */}
      {preview360Table && (() => {
        const t = preview360Table;
        const getFullUrl = (rawUrl?: string | null) => {
          if (!rawUrl) return '';
          if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          const cleanBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
          const cleanUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
          return `${cleanBase}${cleanUrl}`;
        };
        const rawUrl = t.cubeFrontImageUrl || t.defaultViewUrl;
        const imageUrl = rawUrl ? getFullUrl(rawUrl) : undefined;
        const hasCubemap = !!(t.cubeFrontImageUrl && t.cubeBackImageUrl && t.cubeLeftImageUrl && t.cubeRightImageUrl && t.cubeTopImageUrl && t.cubeBottomImageUrl);
        const cubeUrls = hasCubemap ? [
          getFullUrl(t.cubeRightImageUrl),
          getFullUrl(t.cubeLeftImageUrl),
          getFullUrl(t.cubeTopImageUrl),
          getFullUrl(t.cubeBottomImageUrl),
          getFullUrl(t.cubeFrontImageUrl),
          getFullUrl(t.cubeBackImageUrl),
        ] : undefined;
        return (
          <TablePreview3DModal
            open={preview360Open}
            table={{
              id: t.id,
              tenantId: '',
              name: t.code,
              seats: t.seatingCapacity,
              status: 'AVAILABLE',
              area: t.floor?.name || '',
              position: { x: 0, y: 0 },
              shape: (t.shape || 'Square') as any,
              width: t.width ? Number(t.width) : 80,
              height: t.height ? Number(t.height) : 80,
              rotation: t.rotation ? Number(t.rotation) : 0,
            }}
            tableImageUrl={imageUrl}
            cubeUrls={cubeUrls}
            onClose={() => setPreview360Open(false)}
            onBookNow={() => setPreview360Open(false)}
          />
        );
      })()}
    </div>
  );
}
