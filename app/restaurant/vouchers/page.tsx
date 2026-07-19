'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, RefreshCw, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTenant } from '@/lib/contexts/TenantContext';
import { useThemeMode } from '@/app/theme/AntdProvider';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import VoucherCard from '@/components/vouchers/VoucherCard';
import VoucherFormModal, { VoucherFormData } from '@/components/vouchers/VoucherFormModal';
import voucherService, { Voucher } from '@/lib/services/voucherService';
import axiosInstance from '@/lib/services/axiosInstance';

// ── Types & helpers ────────────────────────────────────────────────────────────
type SortKey = 'newest' | 'end_soon' | 'end_late' | 'usage_ratio';
type FilterStatus = 'all' | 'active' | 'disabled';

const defaultForm = (): VoucherFormData => ({
  code: '',
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderValue: 0,
  usageLimit: 100,
  applicableService: 'all',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
  distributionMode: 'public',
  venueScope: 'all',
  venueId: '',
});

function toDateInput(d?: string) {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toISOString().split('T')[0];
}

// Safe date helper — đọc cả endDate lẫn expiryDate từ BE
function safeDate(v: Voucher, field: 'start' | 'end'): number {
  const raw = field === 'end'
    ? (v as any).endDate ?? (v as any).expiryDate
    : (v as any).startDate;
  if (!raw) return field === 'end' ? Infinity : 0;
  const t = new Date(raw).getTime();
  return isNaN(t) ? (field === 'end' ? Infinity : 0) : t;
}

function formatDate(raw?: string | null): string {
  if (!raw) return 'Không giới hạn';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'Không giới hạn';
  return d.toLocaleDateString('vi-VN');
}

function runStatus(v: Voucher): { label: string; cls: string } {
  if (v.status !== 'active')
    return { label: 'Bị khóa', cls: 'text-red-600 bg-red-100/70 border-red-200/50 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20' };
  const now = Date.now();
  const s = safeDate(v, 'start');
  const e = safeDate(v, 'end');
  if (now < s)
    return { label: 'Chờ hiệu lực', cls: 'text-yellow-600 bg-yellow-100/70 border-yellow-200/50 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20' };
  if (now > e)
    return { label: 'Hết hiệu lực', cls: 'text-orange-600 bg-orange-100/70 border-orange-200/50 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-400/20' };
  return { label: 'Đang chạy', cls: 'text-emerald-600 bg-emerald-100/70 border-emerald-200/50 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20' };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OwnerVouchersPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const { mode } = useThemeMode();
  const router = useRouter();

  const isDark = mode === 'dark';

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [restaurants, setRestaurants] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [codeLocked, setCodeLocked] = useState(false);
  const [formInitial, setFormInitial] = useState<VoucherFormData>(defaultForm());

  // Filters
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState<FilterStatus>('all');
  const [fRestaurant, setFRestaurant] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchVouchers = useCallback(async (restaurantId: string) => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      const data = await voucherService.getAllVouchers(restaurantId);
      setVouchers(data);
    } catch (e) {
      console.error('[OwnerVouchers] fetchVouchers error:', e);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await axiosInstance.get<any>('/restaurants/me');
      const data = res.data?.data ?? res.data;
      let list = [];
      if (data && typeof data === 'object') {
        if (!Array.isArray(data)) {
          list = [{ _id: data.id ?? data._id, name: data.name }];
        } else {
          list = data.map((r: any) => ({ _id: r.id ?? r._id, name: r.name }));
        }
      } else {
        list = [{ _id: 'mock-restaurant-id-1', name: 'Nhà hàng XFoodi Mock' }];
      }
      setRestaurants(list);
      return list;
    } catch (e) {
      console.error('[OwnerVouchers] fetchRestaurants error:', e);
      const list = [{ _id: 'mock-restaurant-id-1', name: 'Nhà hàng XFoodi Mock' }];
      setRestaurants(list);
      return list;
    }
  }, []);

  useEffect(() => {
    fetchRestaurants().then((list) => {
      const rId = list && list.length > 0 ? list[0]._id : '';
      if (rId) {
        fetchVouchers(rId);
      }
    });
  }, [fetchRestaurants, fetchVouchers]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...vouchers];
    const q = search.toLowerCase();
    if (q)
      list = list.filter(
        (v) =>
          v.code.toLowerCase().includes(q) ||
          (v.title ?? '').toLowerCase().includes(q),
      );
    if (fStatus !== 'all') list = list.filter((v) => v.status === fStatus);
    if (fRestaurant !== 'all')
      list = list.filter(
        (v) => Array.isArray(v.applicableTargets) && v.applicableTargets.includes(fRestaurant),
      );
    list.sort((a, b) => {
      if (sortBy === 'newest')
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      if (sortBy === 'end_soon')
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      if (sortBy === 'end_late')
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      const ra = (a.usageLimit ?? 1) > 0 ? (a.usedCount ?? 0) / (a.usageLimit ?? 1) : 0;
      const rb = (b.usageLimit ?? 1) > 0 ? (b.usedCount ?? 0) / (b.usageLimit ?? 1) : 0;
      return rb - ra;
    });
    return list;
  }, [vouchers, search, fStatus, fRestaurant, sortBy]);

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormInitial(defaultForm());
    setEditingId(null);
    setCodeLocked(false);
    setDialogOpen(true);
  };

  const openEdit = (v: Voucher) => {
    const targets = v.applicableTargets ?? [];
    setFormInitial({
      code: v.code,
      title: v.title ?? '',
      description: v.description ?? '',
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderValue: v.minOrderValue ?? 0,
      usageLimit: v.usageLimit ?? 100,
      applicableService: v.applicableService ?? 'all',
      startDate: toDateInput(v.startDate),
      endDate: toDateInput(v.endDate),
      distributionMode: v.distributionMode ?? 'public',
      venueScope: targets.length === 1 ? 'single' : 'all',
      venueId: targets.length === 1 ? targets[0] : '',
    });
    setEditingId(v._id);
    setCodeLocked((v.usedCount ?? 0) > 0);
    setDialogOpen(true);
  };

  const handleModalSubmit = async (data: VoucherFormData) => {
    setSaving(true);
    try {
      const selectedRestaurantId =
        data.venueId || (restaurants.length > 0 ? restaurants[0]._id : 'mock-restaurant-id-1');

      // Map VoucherFormData → Backend CamelCase schema
      const payload: Record<string, unknown> = {
        code:            (data.code ?? '').trim().toUpperCase(),
        title:           (data.title ?? '').trim() || (data.code ?? '').trim().toUpperCase(),
        description:     (data.description ?? '').trim(),
        discountValue:   Number(data.discountValue) || 0,
        discountType:    data.discountType,
        pointsRequired:  Number(data.minOrderValue ?? 0),
        expiryDate:      data.endDate,
        quantity:        Number(data.usageLimit ?? 100),
        applicableService: data.applicableService ?? 'all',
        distributionMode:  data.distributionMode ?? 'public',
        startDate:         data.startDate || new Date().toISOString().split('T')[0],
        restaurantId:      selectedRestaurantId,
        isActive:          true,
      };

      if (editingId) {
        await voucherService.updateVoucher(editingId, payload as any);
      } else {
        await voucherService.createOwnerVoucher(payload as any);
      }
      setDialogOpen(false);
      if (selectedRestaurantId) {
        fetchVouchers(selectedRestaurantId);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Voucher) => {
    if ((v.usedCount ?? 0) > 0) {
      alert('Voucher đã có lượt dùng — không thể xóa.');
      return;
    }
    if (!confirm(`Xóa mã "${v.code}"?`)) return;
    try {
      await voucherService.deleteVoucher(v._id);
      const selectedRestaurantId = restaurants.length > 0 ? restaurants[0]._id : '';
      if (selectedRestaurantId) {
        fetchVouchers(selectedRestaurantId);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Xóa thất bại');
    }
  };

  const activeVouchers = filtered.filter((v) => v.status === 'active');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-[#0A0E14] text-neutral-900 dark:text-white transition-colors duration-200">
      <style dangerouslySetInnerHTML={{ __html: `
        .text-neutral-900 {
          color: #171717 !important;
        }
        .text-neutral-500 {
          color: #737373 !important;
        }
        .dark .dark\\:text-white {
          color: #ffffff !important;
        }
        .dark .dark\\:text-neutral-400 {
          color: #a3a3a3 !important;
        }
        .dark .dark\\:text-neutral-300 {
          color: #d4d4d4 !important;
        }
      `}} />
      <DashboardHeader
        role="restaurant"
        restaurantName={tenant?.name ?? 'Cửa hàng'}
        userName={user?.name ?? ''}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={tenant?.name ?? ''}
          userName={user?.name ?? ''}
          userEmail={user?.email ?? ''}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Mã Khuyến Mãi</h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5">
                  Tạo &amp; quản lý voucher giảm giá cho nhà hàng / cửa hàng.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (restaurants.length > 0) fetchVouchers(restaurants[0]._id); }}
                  className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-[#ffffff] dark:text-gray-900 font-black text-sm hover:bg-orange-600 dark:hover:bg-orange-400 transition-colors"
                >
                  <Plus size={16} /> Tạo Mã Mới
                </button>
              </div>
            </div>

            {/* ── Filters ── */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-orange-500" />
                <span className="text-sm font-bold text-neutral-900 dark:text-white">Bộ lọc</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative lg:col-span-2">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Mã, tên chiến dịch…"
                    className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value as FilterStatus)}
                  className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="all" className="bg-white dark:bg-zinc-900">Tất cả trạng thái</option>
                  <option value="active" className="bg-white dark:bg-zinc-900">Đang chạy</option>
                  <option value="disabled" className="bg-white dark:bg-zinc-900">Đã khóa</option>
                </select>
                <select
                  value={fRestaurant}
                  onChange={(e) => setFRestaurant(e.target.value)}
                  className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="all" className="bg-white dark:bg-zinc-900">Tất cả nhà hàng</option>
                  {restaurants.map((vn) => (
                    <option key={vn._id} value={vn._id} className="bg-white dark:bg-zinc-900">
                      {vn.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span>
                  {filtered.length} / {vouchers.length} mã
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="bg-transparent text-zinc-600 dark:text-zinc-400 focus:outline-none text-xs"
                >
                  <option value="newest" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Mới nhất</option>
                  <option value="end_soon" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Hết hạn sớm</option>
                  <option value="end_late" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Hết hạn muộn</option>
                  <option value="usage_ratio" className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white">Dùng nhiều nhất</option>
                </select>
              </div>
            </div>

            {/* ── Active voucher cards (horizontal scroll) ── */}
            {!loading && activeVouchers.length > 0 && (
              <div>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Đang chạy ({activeVouchers.length})
                </p>
                <div
                  className="flex gap-4 overflow-x-auto pb-2"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {activeVouchers.map((v) => (
                    <div key={v._id} className="flex-shrink-0 w-[min(92vw,400px)]">
                      <VoucherCard voucher={v} surface={isDark ? 'dark' : 'light'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Table ── */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16">
                  <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <p className="font-bold text-neutral-600 dark:text-neutral-400">Chưa có mã nào</p>
                  <button
                    onClick={openCreate}
                    className="mt-3 text-orange-500 text-sm font-bold hover:underline"
                  >
                    + Tạo mã đầu tiên
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {[
                          'Mã Code',
                          'Giảm giá',
                          'Đã dùng',
                          'Nhà hàng áp dụng',
                          'Hạn SD',
                          'Trạng thái',
                          '',
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((v) => {
                        const rs = runStatus(v);
                        const venueLabel = (() => {
                           const t = v.applicableTargets ?? [];
                           if (t.length === 0) return '—';
                           if (t.length === 1)
                             return restaurants.find((x) => x._id === t[0])?.name ?? 'Một nhà hàng';
                           return `${t.length} nhà hàng`;
                        })();
                        return (
                          <tr
                            key={v._id}
                            className="border-b border-zinc-150 dark:border-zinc-800/80 hover:bg-zinc-200/30 dark:hover:bg-zinc-900/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <p className="font-black text-orange-500 font-mono">{v.code}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{v.title}</p>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 inline-block ${
                                  v.distributionMode === 'private'
                                    ? 'text-violet-700 bg-violet-100 border-violet-200/50 dark:text-violet-300 dark:bg-violet-400/10 dark:border-violet-400/20'
                                    : 'text-teal-700 bg-teal-100 border-teal-200/50 dark:text-teal-300 dark:bg-teal-400/10 dark:border-teal-400/20'
                                }`}
                              >
                                {v.distributionMode === 'private' ? 'PRIVATE' : 'PUBLIC'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-teal-600 dark:text-teal-400">
                                {v.discountType === 'percentage'
                                  ? `${v.discountValue}%`
                                  : `${v.discountValue.toLocaleString('vi-VN')} điểm`}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Từ {(v.minOrderValue ?? 0).toLocaleString('vi-VN')} điểm
                              </p>
                            </td>
                            <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                              {v.usedCount ?? 0} / {v.usageLimit ?? '∞'}
                            </td>
                            <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 text-xs">{venueLabel}</td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">
                              {formatDate((v as any).endDate ?? (v as any).expiryDate)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${rs.cls}`}
                              >
                                {rs.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEdit(v)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-400/10 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(v)}
                                  disabled={(v.usedCount ?? 0) > 0}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors disabled:opacity-30"
                                  title={
                                    (v.usedCount ?? 0) > 0
                                      ? 'Đã có lượt dùng — không xóa được'
                                      : 'Xóa'
                                  }
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <VoucherFormModal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={formInitial}
        saving={saving}
        isEditing={!!editingId}
        restaurants={restaurants}
        codeLocked={codeLocked}
      />
    </div>
  );
}
