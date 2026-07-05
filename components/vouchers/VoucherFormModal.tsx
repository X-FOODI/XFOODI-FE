'use client';

/**
 * VoucherFormModal — Component riêng biệt để tránh re-mount khi page re-render.
 *
 * Lý do tách file: nếu component được định nghĩa BÊN TRONG hàm render của page
 * (ví dụ: `const Field = ...` trong `OwnerVouchersPage`), React sẽ coi đó là
 * kiểu component MỚI mỗi lần render → unmount + remount toàn bộ DOM của form
 * → input bị reset, mất focus sau mỗi lần gõ.
 *
 * Đặt component ra file riêng (module-level) đảm bảo React giữ nguyên identity
 * của component qua các lần render.
 */

import React, { useEffect, useRef } from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { CreateOwnerVoucherPayload } from '@/lib/services/voucherService';

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
  'w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white ' +
  'focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

// ── Field wrapper — defined at MODULE LEVEL (critical!) ────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
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
  // Local form state — tách hoàn toàn khỏi parent để tránh cascade re-render
  const [form, setForm] = React.useState<VoucherFormData>(initialData);

  // Sync khi initialData thay đổi (mở modal mới / mở edit)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    // Chỉ reset khi modal vừa được mở (transition false → true)
    if (isOpen && !prevOpenRef.current) {
      setForm(initialData);
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

  const handleSubmit = () => onSubmit(form);

  const set = <K extends keyof VoucherFormData>(key: K, value: VoucherFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#111620] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="font-black text-white text-base">
            {isEditing ? 'Chỉnh sửa Voucher' : 'Tạo Mã Ưu Đãi Mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
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
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Cố định (điểm)</option>
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
                  <span className="text-sm text-zinc-300">
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
                  <span className="text-sm text-zinc-300">
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
                <option value="">-- Chọn nhà hàng / cơ sở --</option>
                {restaurants.map((vn) => (
                  <option key={vn._id} value={vn._id}>
                    {vn.name}
                  </option>
                ))}
              </select>
            )}
            {form.venueScope === 'all' && restaurants.length === 0 && (
              <p className="text-[11px] text-red-400 mt-1">
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
              <option value="all">Tất cả (đặt bàn & cửa hàng)</option>
              <option value="booking">Chỉ đặt bàn</option>
              <option value="shop">Chỉ cửa hàng</option>
            </select>
          </Field>

          {/* Ngày */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày bắt đầu">
              <input
                type="date"
                value={form.startDate ?? ''}
                onChange={(e) => set('startDate', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Ngày kết thúc">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 font-bold hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.code.trim() || !form.discountValue || (form.venueScope === 'single' && !form.venueId)}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-gray-900 font-black text-sm hover:bg-orange-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
