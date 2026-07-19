'use client';

/**
 * VoucherFormModal — Component riêng biệt để tránh re-mount khi page re-render.
 */

import React, { useEffect, useRef } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useThemeMode } from '@/app/theme/AntdProvider';
import type { CreateOwnerVoucherPayload } from '@/lib/services/voucherService';

// ── Date helper: tính ngày hôm nay theo local timezone (YYYY-MM-DD) ──────────
// KHÔNG dùng toISOString() vì nó trả về UTC — ở múi giờ +7 sẽ bị lệch 1 ngày.
function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Kiểm tra xem một chuỗi YYYY-MM-DD có phải ngày trong quá khứ không
function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoucherFormData = CreateOwnerVoucherPayload & {
  venueScope: 'all' | 'single';
  venueId: string;
};

export interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VoucherFormData) => Promise<void>;
  /** Dữ liệu ban đầu — undefined = chế độ tạo mới, object = chỉnh sửa */
  initialData: VoucherFormData;
  /** true = đang gọi API (hiện spinner) */
  saving: boolean;
  /** true = đang ở chế độ edit (đã có id) */
  isEditing: boolean;
  /** Danh sách nhà hàng để chọn áp dụng */
  restaurants: { _id: string; name: string }[];
  /** Mã đã bị khóa khi usedCount > 0 */
  codeLocked?: boolean;
}

// ── Shared style ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-neutral-900 dark:text-white ' +
  'focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

// ── Field wrapper — defined at MODULE LEVEL (critical!) ────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main Modal Component ───────────────────────────────────────────────────────

export default function VoucherFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  saving,
  isEditing,
  restaurants,
  codeLocked = false,
}: VoucherFormModalProps) {
  const { mode } = useThemeMode();
  // Local form state
  const [form, setForm] = React.useState<VoucherFormData>(initialData);
  // Lỗi validation ngày
  const [dateError, setDateError] = React.useState<string>('');

  // Sync khi initialData thay đổi (mở modal mới / mở edit)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setForm(initialData);
      setDateError('');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialData]);

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // ── Validate ngày hết hạn ──────────────────────────────────────────────────
    if (!form.endDate) {
      setDateError('Vui lòng chọn ngày kết thúc.');
      return;
    }
    if (isPastDate(form.endDate)) {
      setDateError('Ngày hết hạn không được là ngày trong quá khứ.');
      return;
    }
    if (form.startDate && form.endDate < form.startDate) {
      setDateError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    setDateError('');
    onSubmit(form);
  };

  const set = <K extends keyof VoucherFormData>(key: K, value: VoucherFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111620] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-colors duration-200"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 flex-shrink-0">
          <h2 className="font-black text-neutral-900 dark:text-white text-base">
            {isEditing ? 'Chỉnh sửa Voucher' : 'Tạo Mã Ưu Đãi Mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 dark:text-zinc-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Mã code */}
          <Field label="Mã khuyến mãi *">
            <input
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="VD: SALE50"
              className={inputCls}
              disabled={codeLocked}
            />
            {codeLocked && (
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Voucher đã có lượt dùng — không thể đổi mã.
              </p>
            )}
          </Field>

          {/* Tên chiến dịch */}
          <Field label="Tên chiến dịch">
            <input
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Khuyến mãi hè 2025"
              className={inputCls}
            />
          </Field>

          {/* Mô tả */}
          <Field label="Mô tả (tuỳ chọn)">
            <textarea
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Giảm cho đơn đặt bàn buổi chiều..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Kiểu giảm + Mức giảm */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kiểu giảm">
              <select
                value={form.discountType}
                onChange={(e) => set('discountType', e.target.value as any)}
                className={inputCls}
              >
                <option value="percentage" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Phần trăm (%)</option>
                <option value="fixed" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Cố định (điểm)</option>
              </select>
            </Field>
            <Field label="Mức giảm *">
              <input
                type="number"
                min={0}
                value={form.discountValue === 0 ? '' : form.discountValue}
                onChange={(e) => set('discountValue', Number(e.target.value))}
                placeholder={form.discountType === 'percentage' ? 'VD: 10' : 'VD: 50000'}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Đơn tối thiểu + Giới hạn lượt */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Đơn tối thiểu (điểm)">
              <input
                type="number"
                min={0}
                value={form.minOrderValue === 0 ? '' : form.minOrderValue}
                onChange={(e) => set('minOrderValue', Number(e.target.value))}
                placeholder="0 = không yêu cầu"
                className={inputCls}
              />
            </Field>
            <Field label="Giới hạn lượt dùng">
              <input
                type="number"
                min={1}
                value={form.usageLimit === 0 ? '' : form.usageLimit}
                onChange={(e) => set('usageLimit', Number(e.target.value))}
                placeholder="100"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Hiển thị */}
          <Field label="Hiển thị với khách">
            <div className="flex gap-4">
              {(['public', 'private'] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.distributionMode === m}
                    onChange={() => set('distributionMode', m)}
                    className="accent-orange-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {m === 'public' ? 'Công khai' : 'Riêng tư (nhập mã)'}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {/* Áp dụng nhà hàng */}
          <Field label="Áp dụng cho nhà hàng / cơ sở">
            <div className="flex gap-4 mb-2">
              {(['all', 'single'] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.venueScope === s}
                    onChange={() => setForm((prev) => ({ ...prev, venueScope: s, venueId: '' }))}
                    className="accent-orange-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {s === 'all' ? 'Toàn bộ nhà hàng / cơ sở của tôi' : 'Một nhà hàng / cơ sở cụ thể'}
                  </span>
                </label>
              ))}
            </div>
            {form.venueScope === 'single' && (
              <select
                value={form.venueId}
                onChange={(e) => set('venueId', e.target.value)}
                className={inputCls}
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">-- Chọn nhà hàng / cơ sở --</option>
                {restaurants.map((vn) => (
                  <option key={vn._id} value={vn._id} className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">
                    {vn.name}
                  </option>
                ))}
              </select>
            )}
            {form.venueScope === 'all' && restaurants.length === 0 && (
              <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">
                Bạn chưa có nhà hàng / cơ sở nào được đăng ký.
              </p>
            )}
          </Field>

          {/* Dịch vụ */}
          <Field label="Áp dụng dịch vụ">
            <select
              value={form.applicableService ?? 'all'}
              onChange={(e) => set('applicableService', e.target.value as any)}
              className={inputCls}
            >
              <option value="all" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Tất cả (đặt bàn & cửa hàng)</option>
              <option value="booking" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Chỉ đặt bàn</option>
              <option value="shop" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Chỉ cửa hàng</option>
            </select>
          </Field>

          {/* Ngày */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày bắt đầu">
              <input
                type="date"
                value={form.startDate ?? ''}
                min={todayStr()}
                onChange={(e) => {
                  set('startDate', e.target.value);
                  setDateError('');
                }}
                className={inputCls}
              />
            </Field>
            <Field label="Ngày kết thúc">
              <input
                type="date"
                value={form.endDate}
                min={todayStr()}
                onChange={(e) => {
                  set('endDate', e.target.value);
                  setDateError('');
                }}
                className={`${inputCls} ${dateError ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {dateError && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">
                  ⚠ {dateError}
                </p>
              )}
            </Field>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 dark:border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold hover:text-neutral-950 dark:hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.code.trim() || !form.discountValue || (form.venueScope === 'single' && !form.venueId)}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white dark:text-gray-900 font-black text-sm hover:bg-orange-600 dark:hover:bg-orange-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <RefreshCw size={14} className="animate-spin" />
              : isEditing ? 'Lưu thay đổi' : 'Phát hành mã'}
          </button>
        </div>
      </div>
    </div>
  );
}
