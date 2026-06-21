"use client";

import { DropDown } from "@/components/ui/DropDown";
import { Spin } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  Eye,
  Loader2,
  QrCode,
  Save,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied";
  area: string;
  floorId?: string;
  currentOrder?: string;
  reservationTime?: string;
  shape?: "Square" | "Circle" | "Rectangle" | "Oval";
  width?: number;
  height?: number;
  rotation?: number;
  qrCodeUrl?: string;
  cubeFrontImageUrl?: string;
  cubeBackImageUrl?: string;
  cubeLeftImageUrl?: string;
  cubeRightImageUrl?: string;
  cubeTopImageUrl?: string;
  cubeBottomImageUrl?: string;
  defaultViewUrl?: string;
}

interface FloorOption {
  id: string;
  name: string;
}

interface TableDetailsDrawerProps {
  open: boolean;
  table: Table | null;
  onClose: () => void;
  onSave: (values: Partial<Table>) => void;
  onSavePanorama?: (tableId: string, files: Record<string, File | null>, clear: boolean) => Promise<void>;
  onDelete?: () => void;
  floors?: FloorOption[];
  /** Called when admin clicks the 360° preview button. Only shown when table has a panorama image. */
  onView360?: () => void;
}

const STATUS_OPTIONS = [
  {
    labelKey: "status_available",
    value: "available",
    color: "#52c41a",
    gradient: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
  },
  {
    labelKey: "status_occupied",
    value: "occupied",
    color: "var(--primary)",
    gradient:
      "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
  },
];

const SHAPE_OPTIONS = [
  { labelKey: "shape_square", value: "Square" },
  { labelKey: "shape_circle", value: "Circle" },
  { labelKey: "shape_rectangle", value: "Rectangle" },
  { labelKey: "shape_oval", value: "Oval" },
];

function translateTableDetails(t: any, key: string, options?: Record<string, unknown>): string {
  const fullKey = `dashboard.tables.details.${key}`;
  const result = t(fullKey, options);
  if (result === fullKey) {
    switch (key) {
      case "status.available":
        return "Sẵn sàng";
      case "status.occupied":
        return "Có khách";
      case "status_unknown":
        return "Không xác định";
      case "qr_title":
        return `Mã QR Bàn ${options?.number ?? ""}`;
      case "qr_scan":
        return "Quét để gọi món";
      case "qr_load_failed":
        return "Tải mã QR thất bại";
      case "copied":
        return "Đã sao chép";
      case "copy_link":
        return "Sao chép liên kết";
      case "download_qr":
        return "Tải mã QR";
      case "title":
        return "Chi tiết bàn ăn";
      case "subtitle":
        return "Quản lý và cấu hình thông tin chi tiết của bàn ăn";
      case "current_status":
        return "Trạng thái hiện tại";
      default:
        return key;
    }
  }
  return result;
}

// ─── QR Code Section ───────────────────────────────────────────────────────────
function QRCodeSection({ qrCodeUrl, tableNumber, tableId }: { qrCodeUrl: string; tableNumber: string; tableId: string }) {
  const { t } = useTranslation();
  const tDetails = (key: string, options?: Record<string, unknown>) =>
    translateTableDetails(t, key, options);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = () => {
    const tableLink = typeof window !== "undefined"
      ? `${window.location.origin}/customer/${tableId}`
      : `/customer/${tableId}`;
    navigator.clipboard.writeText(tableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `table-${tableNumber}-qr.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.15 }}
      style={{
        marginBottom: 28,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <QrCode width={16} height={16} stroke="var(--primary)" strokeWidth={2} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {tDetails("qr_title", { number: tableNumber })}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '2px 8px',
        }}>
          {tDetails("qr_scan")}
        </span>
      </div>

      {/* QR Image */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '20px 18px',
      }}>
        {imgError ? (
          <div style={{
            width: 160, height: 160,
            borderRadius: 10,
            background: 'var(--card)',
            border: '2px dashed var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 12,
          }}>
            <QrCode width={32} height={32} stroke="currentColor" strokeWidth={1.5} />
            <span style={{ textAlign: 'center' }}>{tDetails("qr_load_failed")}</span>
          </div>
        ) : (
          <div style={{
            padding: 12,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}>
            <img
              src={qrCodeUrl}
              alt={`QR Code bàn ${tableNumber}`}
              width={148}
              height={148}
              style={{ display: 'block', borderRadius: 4 }}
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 8,
              border: '1.5px solid var(--border)',
              background: copied ? 'rgba(82,196,26,0.1)' : 'var(--card)',
              color: copied ? '#52c41a' : 'var(--text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            {copied ? (
              <>
                <Check width={13} height={13} strokeWidth={2.5} />
                {tDetails("copied")}
              </>
            ) : (
              <>
                <Copy width={13} height={13} strokeWidth={2} />
                {tDetails("copy_link")}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 8px var(--primary-glow)',
            }}
          >
            <Download width={13} height={13} strokeWidth={2.5} />
            {tDetails("download_qr")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PanoramaSection({
  table,
  cubeFiles,
  setCubeFiles,
  cubePreviews,
  setCubePreviews,
  clearPanorama,
  setClearPanorama,
  saving,
  onSavePanorama,
  onView360,
}: {
  table: Table;
  cubeFiles: Record<string, File | null>;
  setCubeFiles: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
  cubePreviews: Record<string, string | null>;
  setCubePreviews: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  clearPanorama: boolean;
  setClearPanorama: (v: boolean) => void;
  saving: boolean;
  onSavePanorama?: (tableId: string, files: Record<string, File | null>, clear: boolean) => Promise<void>;
  onView360?: () => void;
}) {
  const { t } = useTranslation();
  const faces = [
    { key: 'Front', label: 'Trước (Front)' },
    { key: 'Back', label: 'Sau (Back)' },
    { key: 'Left', label: 'Trái (Left)' },
    { key: 'Right', label: 'Phải (Right)' },
    { key: 'Top', label: 'Trên (Top)' },
    { key: 'Bottom', label: 'Dưới (Bottom)' },
  ];

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const leftInputRef = useRef<HTMLInputElement | null>(null);
  const rightInputRef = useRef<HTMLInputElement | null>(null);
  const topInputRef = useRef<HTMLInputElement | null>(null);
  const bottomInputRef = useRef<HTMLInputElement | null>(null);

  const fileRefs: Record<string, React.MutableRefObject<HTMLInputElement | null>> = {
    Front: frontInputRef,
    Back: backInputRef,
    Left: leftInputRef,
    Right: rightInputRef,
    Top: topInputRef,
    Bottom: bottomInputRef,
  };

  const hasAnyImage = faces.some(
    (f) => cubePreviews[f.key] || (table as any)[`cube${f.key}ImageUrl`] || table.defaultViewUrl
  );

  return (
    <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.18 }} style={{ marginBottom: 28, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t('dashboard.tables.details.panorama_title', { defaultValue: 'Ảnh Cubemap 360° (6 mặt)' })}</span>
        {onSavePanorama && (Object.values(cubeFiles).some(Boolean) || clearPanorama) && (
          <button type="button" disabled={saving} onClick={() => onSavePanorama(table.id, cubeFiles, clearPanorama)} style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 8, border: 'none', background: saving ? 'var(--border)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', color: saving ? 'var(--text-muted)' : '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving && (
              <Loader2 width={12} height={12} strokeWidth={3} className="animate-spin" />
            )}
            {saving ? 'Đang lưu...' : t('dashboard.tables.details.panorama_save', { defaultValue: 'Lưu 6 mặt' })}
          </button>
        )}
      </div>
      <div style={{ padding: '16px 18px' }}>
        {/* VIEW 360 BANNER BUTTON */}
        {hasAnyImage && onView360 && (
          <div 
            onClick={onView360}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              marginBottom: 16,
              boxShadow: '0 4px 15px rgba(255, 90, 44, 0.25)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            <Eye width={16} height={16} strokeWidth={2.5} />
            XEM KHÔNG GIAN 360° (CUBEMAP)
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {faces.map((f) => {
            const currentUrl = cubePreviews[f.key] || (table as any)[`cube${f.key}ImageUrl`] || null;
            return (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{f.label}</span>
                <div 
                  onClick={() => !clearPanorama && fileRefs[f.key].current?.click()}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 8,
                    border: '1.5px dashed var(--border)',
                    background: 'var(--card)',
                    overflow: 'hidden',
                    cursor: clearPanorama ? 'not-allowed' : 'pointer',
                    opacity: clearPanorama ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {currentUrl ? (
                    <img src={currentUrl} alt={f.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 4 }}>
                      + Tải lên
                    </div>
                  )}

                  {/* Edit overlay */}
                  {currentUrl && !clearPanorama && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                    >
                      Thay đổi
                    </div>
                  )}
                </div>

                <input 
                  ref={fileRefs[f.key]} 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setCubeFiles(prev => ({ ...prev, [f.key]: file }));
                    if (file) {
                      setCubePreviews(prev => ({ ...prev, [f.key]: URL.createObjectURL(file) }));
                    }
                  }} 
                />
              </div>
            );
          })}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 14 }}>
          <input type="checkbox" checked={clearPanorama} onChange={e => setClearPanorama(e.target.checked)} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('dashboard.tables.details.panorama_clear', { defaultValue: 'Xóa toàn bộ ảnh Cubemap hiện tại' })}</span>
        </label>
      </div>
    </motion.div>
  );
}

function DynamicLoadingOverlay({ isSaving }: { isSaving: boolean }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isSaving) {
      setStep(0);
      return;
    }
    const timer = setInterval(() => {
      setStep(prev => (prev < 3 ? prev + 1 : 3));
    }, 4500); // Changes every 4.5 seconds

    return () => clearInterval(timer);
  }, [isSaving]);

  if (!isSaving) return null;

  const OVERLAY_STATES = [
    { 
      text: t('dashboard.tables.details.saving_step1', { defaultValue: 'Đang lưu thay đổi...' }), 
      icon: <Spin size="large" /> 
    },
    { 
      text: t('dashboard.tables.details.saving_step2', { defaultValue: 'Đang xử lý hình ảnh độ phân giải cao...' }), 
      icon: (
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
      )
    },
    { 
      text: t('dashboard.tables.details.saving_step3', { defaultValue: 'Đang tải lên máy chủ Cloudinary...' }), 
      icon: (
        <div style={{ position: 'relative', width: '48px', height: '48px' }}>
          <div className="absolute inset-0 border-4 border-t-[var(--primary)] border-r-transparent border-b-[var(--primary)] border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-t-transparent border-r-white border-b-transparent border-l-white rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
      )
    },
    { 
      text: t('dashboard.tables.details.saving_step4', { defaultValue: 'Sẽ hơi lâu đấy, cảm phiền đợi xíu nhé...' }), 
      icon: (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-3 h-3 bg-[var(--primary)] rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
        </div>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {OVERLAY_STATES[step].icon}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ color: "#fff", fontSize: 17, fontWeight: 500, letterSpacing: "0.2px", textAlign: 'center' }}
        >
          {OVERLAY_STATES[step].text}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export const TableDetailsDrawer: React.FC<TableDetailsDrawerProps> = ({
  open,
  table,
  onClose,
  onSave,
  onSavePanorama,
  onDelete,
  floors = [],
  onView360,
}) => {
  const { t } = useTranslation();
  const tDetails = (key: string, options?: Record<string, unknown>) =>
    translateTableDetails(t, key, options);
  const [formData, setFormData] = React.useState({
    number: "",
    capacity: 4,
    area: "" as string,
    status: "available" as "available" | "occupied",
    shape: "Square" as "Square" | "Circle" | "Rectangle" | "Oval",
    width: 80,
    height: 80,
    rotation: 0,
  });
  const [, setErrors] = React.useState<Record<string, string>>({});
  const [cubeFiles, setCubeFiles] = useState<Record<string, File | null>>({
    Front: null, Back: null, Left: null, Right: null, Top: null, Bottom: null
  });
  const [cubePreviews, setCubePreviews] = useState<Record<string, string | null>>({
    Front: null, Back: null, Left: null, Right: null, Top: null, Bottom: null
  });
  const [clearPanorama, setClearPanorama] = useState(false);
  const [panoramaSaving, setPanoramaSaving] = useState(false);

  const isDeco = formData.number.startsWith("DECO_");
  let decoType = "PLANT";
  let decoName = "";
  if (isDeco) {
    if (formData.number.startsWith("DECO_PLANT_")) {
      decoType = "PLANT";
      decoName = formData.number.replace("DECO_PLANT_", "");
    } else if (formData.number.startsWith("DECO_WALL_")) {
      decoType = "WALL";
      decoName = formData.number.replace("DECO_WALL_", "");
    } else if (formData.number.startsWith("DECO_RECEPTION_")) {
      decoType = "RECEPTION";
      decoName = formData.number.replace("DECO_RECEPTION_", "");
    } else if (formData.number.startsWith("DECO_WINDOW_")) {
      decoType = "WINDOW";
      decoName = formData.number.replace("DECO_WINDOW_", "");
    } else if (formData.number.startsWith("DECO_DOOR_")) {
      decoType = "DOOR";
      decoName = formData.number.replace("DECO_DOOR_", "");
    } else if (formData.number.startsWith("DECO_BAR_")) {
      decoType = "BAR";
      decoName = formData.number.replace("DECO_BAR_", "");
    } else if (formData.number.startsWith("DECO_STAIRS_")) {
      decoType = "STAIRS";
      decoName = formData.number.replace("DECO_STAIRS_", "");
    } else {
      const parts = formData.number.split("_");
      if (parts.length >= 3) {
        decoType = parts[1];
        decoName = parts.slice(2).join("_");
      } else {
        decoName = formData.number.replace("DECO_", "");
      }
    }
  }

  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number,
        capacity: table.capacity,
        area: table.floorId || floors[0]?.id || "",
        status: table.status,
        shape: table.shape || "Square",
        width: table.width || 80,
        height: table.height || 80,
        rotation: table.rotation || 0,
      });
    }
    setCubeFiles({
      Front: null, Back: null, Left: null, Right: null, Top: null, Bottom: null
    });
    setCubePreviews({
      Front: null, Back: null, Left: null, Right: null, Top: null, Bottom: null
    });
    setClearPanorama(false);
  }, [table, floors]);


  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (isDeco) {
      if (!decoName.trim()) {
        newErrors.number = tDetails("errors.deco_name_required", { defaultValue: "Tên vật phẩm trang trí không được để trống" });
      }
    } else {
      if (!formData.number.trim())
        newErrors.number = tDetails("errors.number_required");
      if (formData.capacity < 1)
        newErrors.capacity = t("dashboard.tables.add_table_modal.errors.capacity_min");
      if (formData.capacity > 20)
        newErrors.capacity = t("dashboard.tables.add_table_modal.errors.capacity_max");
    }
    if (formData.width < 20) newErrors.width = tDetails("errors.width_too_small");
    if (formData.height < 20) newErrors.height = tDetails("errors.height_too_small");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !table) return;

    setIsSaving(true);
    try {
      await Promise.resolve(onSave(formData));
      if (onSavePanorama && (Object.values(cubeFiles).some(Boolean) || clearPanorama)) {
        setPanoramaSaving(true);
        try {
          await onSavePanorama(table.id, cubeFiles, clearPanorama);
        } finally {
          setPanoramaSaving(false);
        }
      }
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const handlePanoramaSaveClick = async (tableId: string, files: Record<string, File | null>, clear: boolean) => {
    if (!onSavePanorama) return;
    setPanoramaSaving(true);
    try {
      await onSavePanorama(tableId, files, clear);
      setCubeFiles({
        Front: null, Back: null, Left: null, Right: null, Top: null, Bottom: null
      });
      setCubePreviews({
        Front: null, Back: null, Left: null, Right: null, Top: null, Bottom: null
      });
      setClearPanorama(false);
    } finally {
      setPanoramaSaving(false);
    }
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === formData.status);

  return (
    <AnimatePresence>
      {open && (
        <>
          <DynamicLoadingOverlay isSaving={isSaving} />
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 999,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, x: "-50%", y: "-50%" }}
            animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
            exit={{ scale: 0.9, opacity: 0, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              width: "520px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              background: "var(--card)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}>
            {/* Header */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                padding: "28px 28px 34px",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
              }}>
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: 220,
                  height: 220,
                  background: "rgba(255, 255, 255, 0.08)",
                  borderRadius: "50%",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 8,
                      }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(10px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                        <UtensilsCrossed width={22} height={22} stroke="#fff" strokeWidth={2} />
                      </div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 24,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}>
                        {tDetails("title")}
                      </h2>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.9, lineHeight: 1.45 }}>
                      {tDetails("subtitle")}
                    </p>
                    {/* 360° Preview Button — shown only when the table has a panorama image */}
                    {onView360 && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={onView360}
                        style={{
                          marginTop: 14,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '9px 18px',
                          borderRadius: 10,
                          border: '2px solid rgba(255,255,255,0.5)',
                          background: 'rgba(255,255,255,0.18)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          letterSpacing: '0.3px',
                        }}
                      >
                        <Eye width={16} height={16} strokeWidth={2.5} />
                        Xem không gian 360°
                      </motion.button>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                      border: "none",
                      cursor: "pointer",
                      padding: 8,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      color: "#fff",
                      marginTop: -4,
                    }}>
                    <X width={20} height={20} strokeWidth={2.5} />
                  </motion.button>
                </div>


              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px 28px" }}>
              {table && (
                <form onSubmit={handleSubmit}>
                  {/* Current Status Card */}
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      background: currentStatus?.gradient,
                      padding: "24px",
                      borderRadius: 12,
                      marginBottom: 28,
                      textAlign: "center",
                      color: "#fff",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                    }}>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: 11,
                          opacity: 0.85,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          fontWeight: 600,
                        }}>
                        {tDetails("current_status")}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 26,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}>
                        {currentStatus
                          ? tDetails(`status_${currentStatus.value}`)
                          : tDetails("status_unknown")}
                      </p>
                    </div>
                  </motion.div>

                  {/* QR Code Section */}
                  {!isDeco && table.qrCodeUrl && (
                    <QRCodeSection qrCodeUrl={table.qrCodeUrl} tableNumber={table.number} tableId={table.id} />
                  )}

                  {/* Panorama Section */}
                  {!isDeco && (
                    <PanoramaSection
                      table={table}
                      cubeFiles={cubeFiles}
                      setCubeFiles={setCubeFiles}
                      cubePreviews={cubePreviews}
                      setCubePreviews={setCubePreviews}
                      clearPanorama={clearPanorama}
                      setClearPanorama={setClearPanorama}
                      saving={panoramaSaving}
                      onSavePanorama={handlePanoramaSaveClick}
                      onView360={onView360}
                    />
                  )}

                  {/* Form Fields */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                    }}>
                    {isDeco ? (
                      // ─── DECORATION FIELDS ───
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                              {tDetails("deco_type", { defaultValue: "Loại vật phẩm trang trí" })}
                            </label>
                            <DropDown
                              value={decoType}
                              onChange={(e) => {
                                const nextType = e.target.value;
                                setFormData({
                                  ...formData,
                                  number: `DECO_${nextType}_${decoName}`,
                                });
                              }}
                              className="py-[14px]"
                              style={{
                                borderRadius: 10,
                                border: "2px solid var(--border)",
                              }}
                            >
                              <option value="PLANT">{tDetails("deco_type_plant", { defaultValue: "Cây cảnh (Plant)" })}</option>
                              <option value="WALL">{tDetails("deco_type_wall", { defaultValue: "Vách tường / Vách ngăn (Wall)" })}</option>
                              <option value="RECEPTION">{tDetails("deco_type_reception", { defaultValue: "Quầy lễ tân (Reception)" })}</option>
                              <option value="WINDOW">{tDetails("deco_type_window", { defaultValue: "Cửa sổ (Window)" })}</option>
                              <option value="DOOR">{tDetails("deco_type_door", { defaultValue: "Cửa ra vào (Door)" })}</option>
                              <option value="BAR">{tDetails("deco_type_bar", { defaultValue: "Quầy bar (Bar)" })}</option>
                              <option value="STAIRS">{tDetails("deco_type_stairs", { defaultValue: "Cầu thang (Stairs)" })}</option>
                            </DropDown>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                              {tDetails("deco_name", { defaultValue: "Tên vật phẩm" })}
                            </label>
                            <input
                              type="text"
                              value={decoName}
                              onChange={(e) => {
                                const nextName = e.target.value;
                                setFormData({
                                  ...formData,
                                  number: `DECO_${decoType}_${nextName}`,
                                });
                              }}
                              style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 10,
                                border: "2px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                            {tDetails("deco_rotation", { defaultValue: "Góc xoay (độ)" })}
                          </label>
                          <input
                            type="number"
                            value={formData.rotation || ""}
                            onChange={(e) => setFormData({ ...formData, rotation: parseInt(e.target.value) || 0 })}
                            style={{
                              width: "100%",
                              padding: "14px 16px",
                              borderRadius: 10,
                              border: "2px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              outline: "none",
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      // ─── NORMAL TABLE FIELDS ───
                      <>
                        {/* Table Number */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text)",
                                marginBottom: 8,
                              }}>
                              {tDetails("table_code")}
                            </label>
                            <input
                              type="text"
                              value={formData.number}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  number: e.target.value,
                                });
                              }}
                              style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 10,
                                border: "2px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                outline: "none",
                              }}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text)",
                                marginBottom: 8,
                              }}>
                              {tDetails("seating_capacity")}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.capacity || ""}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  capacity: parseInt(e.target.value) || 0,
                                });
                              }}
                              style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 10,
                                border: "2px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>

                        {/* Shape and Rotation */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                              {tDetails("shape")}
                            </label>
                            <DropDown
                              value={formData.shape}
                              onChange={(e) => setFormData({ ...formData, shape: e.target.value as any })}
                              className="py-[14px]"
                              style={{
                                borderRadius: 10,
                                border: "2px solid var(--border)",
                              }}
                            >
                              {SHAPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{tDetails(opt.labelKey)}</option>
                              ))}
                            </DropDown>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                              {tDetails("rotation")}
                            </label>
                            <input
                              type="number"
                              value={formData.rotation || ""}
                              onChange={(e) => setFormData({ ...formData, rotation: parseInt(e.target.value) || 0 })}
                              style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 10,
                                border: "2px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Dimensions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                          {tDetails("width")} (px)
                        </label>
                        <input
                          type="number"
                          value={formData.width || ""}
                          onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 0 })}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                          {tDetails("height")} (px)
                        </label>
                        <input
                          type="number"
                          value={formData.height || ""}
                          onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {/* Area */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: 8,
                          letterSpacing: "-0.01em",
                        }}>
                        {tDetails("floor")}
                      </label>
                      <DropDown
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            area: e.target.value as any,
                          })
                        }
                        className="py-[14px] font-medium"
                        style={{
                          borderRadius: 10,
                          border: "2px solid var(--border)",
                        }}
                      >
                        {floors.map((floor) => (
                          <option key={floor.id} value={floor.id}>
                            {floor.name}
                          </option>
                        ))}
                      </DropDown>
                    </motion.div>

                    {/* Status */}
                    {!isDeco && (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                            marginBottom: 12,
                            letterSpacing: "-0.01em",
                          }}>
                          {tDetails("table_status")}
                        </label>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                          }}>
                          {STATUS_OPTIONS.map((status) => (
                            <motion.button
                              key={status.value}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  status: status.value as any,
                                })
                              }
                              style={{
                                padding: "14px",
                                borderRadius: 10,
                                border:
                                  formData.status === status.value
                                    ? `2px solid ${status.color}`
                                    : "2px solid var(--border)",
                                background:
                                  formData.status === status.value
                                    ? `${status.color}15`
                                    : "var(--surface)",
                                color:
                                  formData.status === status.value
                                    ? status.color
                                    : "var(--text)",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                letterSpacing: "-0.01em",
                              }}>
                              {tDetails(status.labelKey)}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                </form>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "20px 28px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
                display: "flex",
                gap: 12,
              }}>
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDelete}
                  style={{
                    flex: 1,
                    padding: "13px 20px",
                    borderRadius: 10,
                    border: "2px solid #ff4d4f",
                    background: "transparent",
                    color: "#ff4d4f",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    letterSpacing: "-0.01em",
                  }}>
                  <Trash2 width={16} height={16} strokeWidth={2.5} />
                  {tDetails("delete")}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "2px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}>
                {tDetails("cancel")}
              </motion.button>
              <motion.button
                whileHover={isSaving ? {} : {
                  scale: 1.02,
                  boxShadow: "0 8px 24px var(--primary-glow)",
                }}
                whileTap={isSaving ? {} : { scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSaving}
                style={{
                  flex: 2,
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSaving ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: isSaving ? "0 2px 8px var(--primary-glow)" : "0 4px 16px var(--primary-glow)",
                  letterSpacing: "-0.01em",
                  opacity: isSaving ? 0.8 : 1,
                  transition: "all 0.2s",
                }}>
                {isSaving ? (
                  <>
                    <Loader2 width={16} height={16} strokeWidth={2.5} className="animate-spin" />
                    {t('dashboard.tables.details.save_changes', { defaultValue: 'Save Changes' })}...
                  </>
                ) : (
                  <>
                    <Save width={16} height={16} strokeWidth={2.5} />
                    {t('dashboard.tables.details.save_changes', { defaultValue: 'Save changes' })}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
