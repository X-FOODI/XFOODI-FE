'use client';

import React, { useId, useState } from 'react';
import { Info, X, Tag, Percent, DollarSign, MapPin, Calendar, Eye, Building2, BarChart2, Ticket } from 'lucide-react';
import type { Voucher } from '@/lib/services/voucherService';

// ── Types ───────────────────────────────────────────────────────────────────────

export interface VoucherCardProps {
  voucher: Voucher;
  surface?: 'light' | 'dark';
  /** Checkout mode: hiển thị nút Chọn / Hủy */
  onToggleSelect?: () => void;
  selected?: boolean;
  /** Simple apply callback */
  onApply?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function fmtDateVi(d?: string | Date | null): string {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return x.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtNumber(n?: number | null): string {
  if (n == null) return '0';
  return Number(n).toLocaleString('vi-VN');
}

function serviceLabel(s?: string) {
  if (!s || s === 'all') return 'Đặt bàn & Cửa hàng';
  if (s === 'booking') return 'Đặt bàn';
  if (s === 'shop') return 'Cửa hàng';
  return s;
}

function payScopeLabel(s?: string) {
  if (s === 'coins') return 'Chỉ Điểm / Coin';
  if (s === 'qr') return 'Chỉ QR / Online';
  return 'Mọi hình thức';
}

// ── Detail Dialog ───────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  dark,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  dark: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl ${
        dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white border border-black/[0.06] shadow-sm'
      }`}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          dark ? 'bg-teal-400/10 text-teal-400' : 'bg-teal-600/10 text-teal-700'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
            dark ? 'text-white/50' : 'text-slate-400'
          }`}
        >
          {label}
        </p>
        <div className={`text-sm font-semibold leading-snug ${dark ? 'text-white/90' : 'text-slate-800'}`}>
          {typeof value === 'string' ? <span>{value}</span> : value}
        </div>
      </div>
    </div>
  );
}

function VoucherDetailDialog({
  voucher,
  dark,
  onClose,
}: {
  voucher: Voucher;
  dark: boolean;
  onClose: () => void;
}) {
  const isPlatform = voucher.voucherScope === 'platform';

  const displayValue =
    voucher.discountType === 'percentage'
      ? `${voucher.discountValue}%`
      : `${fmtNumber(voucher.discountValue)} điểm`;

  const headerGradient = isPlatform
    ? 'from-orange-700 via-orange-500 to-amber-400'
    : 'from-sky-700 via-sky-500 to-cyan-400';

  const usagePercent =
    voucher.usageLimit && voucher.usageLimit > 0
      ? Math.min(100, Math.round(((voucher.usedCount ?? 0) / voucher.usageLimit) * 100))
      : 0;

  const scopeLine =
    voucher.venueApplication?.label?.trim() ||
    (isPlatform ? 'Áp dụng toàn hệ thống' : 'Theo phạm vi của chủ sân');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl ${
          dark ? 'bg-[#0c1014] border border-white/10' : 'bg-slate-50 border border-slate-200'
        }`}
        style={{ maxHeight: 'min(92vh, 720px)', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className={`relative px-5 pt-5 pb-6 bg-gradient-to-br ${headerGradient} text-white`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/35 transition-colors"
          >
            <X size={15} />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[3px] opacity-90 mb-0.5">Chi tiết ưu đãi</p>
          <h2 className="text-3xl font-black tracking-widest font-mono">{voucher.code}</h2>
          {voucher.title && <p className="mt-1 font-semibold opacity-95">{voucher.title}</p>}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-5xl font-black leading-none tracking-tight">{displayValue}</span>
            {voucher.discountType === 'percentage' && voucher.maxDiscount && (
              <span className="text-sm font-semibold opacity-90">
                tối đa {fmtNumber(voucher.maxDiscount)} điểm
              </span>
            )}
          </div>

          <span
            className="absolute top-5 right-12 text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 border border-white/30 uppercase tracking-wider"
          >
            {isPlatform ? 'XFOODI' : 'ĐỐI TÁC'}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {voucher.description && (
            <div
              className={`p-3 rounded-xl ${
                dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white border border-slate-100'
              }`}
            >
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dark ? 'text-white/50' : 'text-slate-400'}`}>
                Mô tả
              </p>
              <p className={`text-sm leading-relaxed ${dark ? 'text-white/85' : 'text-slate-700'}`}>
                {voucher.description}
              </p>
            </div>
          )}

          <p className={`text-[10px] font-black uppercase tracking-widest pt-1 ${dark ? 'text-teal-400' : 'text-teal-700'}`}>
            Điều kiện & phạm vi
          </p>

          <DetailRow dark={dark} icon={<Percent size={16} />} label="Giảm giá" value={
            voucher.discountType === 'percentage'
              ? `${voucher.discountValue}%${voucher.maxDiscount ? ` · tối đa ${fmtNumber(voucher.maxDiscount)} điểm` : ''}`
              : `${fmtNumber(voucher.discountValue)} điểm (trực tiếp)`
          } />
          <DetailRow dark={dark} icon={<DollarSign size={16} />} label="Đơn tối thiểu" value={
            voucher.minOrderValue && voucher.minOrderValue > 0
              ? `${fmtNumber(voucher.minOrderValue)} điểm`
              : 'Không yêu cầu'
          } />
          <DetailRow dark={dark} icon={<MapPin size={16} />} label="Phạm vi" value={scopeLine} />

          {voucher.venueApplication?.venues && voucher.venueApplication.venues.length > 0 && (
            <DetailRow dark={dark} icon={<Building2 size={16} />} label="Sân / địa điểm" value={
              <div className="flex flex-wrap gap-1.5 mt-1">
                {voucher.venueApplication.venues.map((vn) => (
                  <span
                    key={vn._id}
                    className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                      dark
                        ? 'bg-teal-400/10 border-teal-400/25 text-teal-300'
                        : 'bg-teal-50 border-teal-200 text-teal-700'
                    }`}
                  >
                    {vn.name}
                  </span>
                ))}
              </div>
            } />
          )}

          <DetailRow dark={dark} icon={<Tag size={16} />} label="Dịch vụ" value={serviceLabel(voucher.applicableService)} />
          <DetailRow dark={dark} icon={<Eye size={16} />} label="Hiển thị" value={
            <div className="flex items-center gap-2 flex-wrap">
              <span>{voucher.distributionMode === 'private' ? 'Riêng tư — cần nhập mã' : 'Công khai'}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                voucher.distributionMode === 'private'
                  ? dark ? 'bg-violet-400/15 border-violet-400/25 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'
                  : dark ? 'bg-teal-400/15 border-teal-400/25 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                {voucher.distributionMode === 'private' ? 'PRIVATE' : 'PUBLIC'}
              </span>
            </div>
          } />

          <p className={`text-[10px] font-black uppercase tracking-widest pt-2 ${dark ? 'text-teal-400' : 'text-teal-700'}`}>
            Thời gian & lượt dùng
          </p>

          <DetailRow dark={dark} icon={<Calendar size={16} />} label="Hiệu lực" value={
            `${fmtDateVi(voucher.startDate)} → ${fmtDateVi(voucher.endDate)}`
          } />

          {voucher.usageLimit != null && (
            <DetailRow dark={dark} icon={<BarChart2 size={16} />} label="Lượt dùng / Giới hạn" value={
              <div className="w-full space-y-1.5 mt-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{voucher.usedCount ?? 0} / {voucher.usageLimit}</span>
                  <span className={`text-xs ${dark ? 'text-white/50' : 'text-slate-400'}`}>{usagePercent}% đã dùng</span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden ${dark ? 'bg-white/10' : 'bg-slate-200'}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            } />
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t ${dark ? 'bg-black/30 border-white/[0.08]' : 'bg-white border-slate-100'}`}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 text-gray-900 font-black text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            Đã xem xong
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main VoucherCard Component ───────────────────────────────────────────────────

export const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  surface = 'dark',
  onToggleSelect,
  selected,
  onApply,
}) => {
  const patternId = useId().replace(/:/g, '');
  const [dialogOpen, setDialogOpen] = useState(false);

  const isDark = surface === 'dark';
  const isPlatform = voucher.voucherScope === 'platform';

  const displayValue =
    voucher.discountType === 'percentage'
      ? `${voucher.discountValue}%`
      : `${fmtNumber(voucher.discountValue)} điểm`;

  const minNum = voucher.minOrderValue != null ? Number(voucher.minOrderValue) : 0;
  const minLine = minNum > 0 ? `Đơn tối thiểu ${fmtNumber(minNum)} điểm.` : '';

  const scopeLine =
    voucher.venueApplication?.label?.trim() ||
    (isPlatform ? 'Áp dụng toàn hệ thống.' : 'Theo phạm vi sân đối tác.');

  // Color themes
  const rightGradient = isPlatform
    ? 'linear-gradient(135deg,#c2410c 0%,#ea580c 50%,#fb923c 100%)'
    : 'linear-gradient(135deg,#0369a1 0%,#0284c7 50%,#06b6d4 100%)';
  const codeGradient = isPlatform
    ? 'linear-gradient(90deg,#c2410c 0%,#ea580c 100%)'
    : 'linear-gradient(90deg,#0369a1 0%,#0284c7 100%)';
  const patternColor1 = isPlatform ? '#fb923c' : '#38bdf8';
  const patternColor2 = isPlatform ? '#ea580c' : '#0284c7';

  const leftBg = isDark ? '#16191e' : '#ffffff';
  const titleColor = isDark ? '#f3f4f6' : '#111827';
  const descColor = isDark ? '#9ca3af' : '#6b7280';
  const dashColor = isDark ? '#374151' : '#e5e7eb';

  const handleCardClick = () => {
    if (onApply) { onApply(); return; }
    if (onToggleSelect) { onToggleSelect(); return; }
    setDialogOpen(true);
  };

  return (
    <>
      {/* ── Card ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          maxWidth: 600,
          height: 192,
          borderRadius: 14,
          overflow: 'hidden',
          cursor: 'pointer',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          boxShadow: selected
            ? '0 0 0 3px #f97316, 0 12px 40px rgba(0,0,0,0.2)'
            : '0 8px 32px rgba(0,0,0,0.15)',
          transform: selected ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.25s, box-shadow 0.25s',
        }}
      >
        {/* Info button */}
        <button
          onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
          aria-label="Chi tiết voucher"
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            zIndex: 40,
            width: 28,
            height: 28,
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)',
            color: isDark ? '#d1d5db' : '#374151',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.2s',
          }}
        >
          <Info size={14} />
        </button>

        {/* LEFT panel */}
        <div
          style={{
            position: 'relative',
            width: '68%',
            height: '100%',
            background: leftBg,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 22px',
            borderTopLeftRadius: 14,
            borderBottomLeftRadius: 14,
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {/* Decorative pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
            <svg width="100%" height="100%">
              <pattern
                id={`vp-${patternId}`}
                x="0" y="0"
                width="80" height="80"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="15" cy="15" r="4" fill={patternColor1} />
                <path d="M60 20 L70 30 M70 20 L60 30" stroke={patternColor2} strokeWidth="2.5" strokeLinecap="round" />
                <rect x="30" y="60" width="10" height="3" rx="1.5" fill={patternColor1} />
                <circle cx="70" cy="65" r="3" fill={patternColor2} />
                <circle cx="20" cy="70" r="5" fill="none" stroke={patternColor1} strokeWidth="1.5" />
                <rect x="40" y="10" width="10" height="3" rx="1.5" fill={patternColor2} />
              </pattern>
              <rect fill={`url(#vp-${patternId})`} width="100%" height="100%" />
            </svg>
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10, paddingRight: 16 }}>
            {/* Code badge */}
            <div
              style={{
                display: 'inline-block',
                padding: '6px 20px',
                marginBottom: 10,
                background: codeGradient,
                transform: 'skewX(-4deg)',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  transform: 'skewX(4deg)',
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                {voucher.code}
              </span>
            </div>

            <h3
              style={{
                margin: '0 0 5px 0',
                color: titleColor,
                fontWeight: 800,
                fontSize: 16,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {voucher.title || voucher.code}
            </h3>
            <div style={{ color: descColor, fontSize: 11, fontWeight: 500, lineHeight: 1.5 }}>
              {voucher.description && (
                <p style={{ margin: '0 0 3px' }}>{voucher.description.slice(0, 72)}</p>
              )}
              {minLine && <p style={{ margin: '0 0 2px' }}>{minLine}</p>}
              <p style={{ margin: 0 }}>{scopeLine}</p>
            </div>
          </div>

          {/* Dashed divider */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              bottom: 16,
              right: 0,
              borderRight: `2px dashed ${dashColor}`,
              opacity: 0.6,
            }}
          />
        </div>

        {/* RIGHT panel */}
        <div
          style={{
            position: 'relative',
            width: '32%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: rightGradient,
            borderTopRightRadius: 14,
            borderBottomRightRadius: 14,
            color: '#fff',
            zIndex: 10,
          }}
        >
          {/* Notch circles */}
          {[{ top: -8 }, { bottom: -8 }].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: -10,
                ...pos,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: leftBg,
                zIndex: 20,
              }}
            />
          ))}

          {/* Discount value */}
          <div
            style={{
              padding: '7px 18px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.35)',
              marginBottom: 2,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em' }}>
              {displayValue}
            </span>
          </div>

          {/* Expiry */}
          <p style={{ fontSize: 9.5, textAlign: 'center', padding: '0 14px', lineHeight: 1.5, opacity: 0.9, fontWeight: 500, margin: '10px 0 0' }}>
            Hạn dùng:{' '}
            <span style={{ fontWeight: 800 }}>{fmtDateVi(voucher.endDate)}</span>
          </p>

          {/* Brand badge */}
          <div style={{ marginTop: 'auto', marginBottom: 10, textAlign: 'center' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 3px',
              }}
            >
              <Ticket size={14} color={isPlatform ? '#c2410c' : '#0369a1'} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.95 }}>
              {isPlatform ? 'XFOODI' : 'PARTNER'}
            </span>
          </div>

          {/* Select button (checkout mode) */}
          {(onApply || onToggleSelect) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApply ? onApply() : onToggleSelect?.();
              }}
              style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                padding: '4px 12px',
                background: '#fff',
                color: '#111827',
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'opacity 0.2s',
              }}
            >
              {selected ? 'Hủy' : 'Chọn'}
            </button>
          )}
        </div>
      </div>

      {/* ── Detail Dialog ── */}
      {dialogOpen && (
        <VoucherDetailDialog
          voucher={voucher}
          dark={isDark}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
};

export default VoucherCard;
