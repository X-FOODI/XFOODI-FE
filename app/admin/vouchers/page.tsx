'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, RefreshCw, Search, Filter, Lock, Unlock, X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useThemeMode } from '@/app/theme/AntdProvider';
import { useRouter } from 'next/navigation';
import VoucherCard from '@/components/vouchers/VoucherCard';
import voucherService, { Voucher, CreateAdminVoucherPayload } from '@/lib/services/voucherService';

type TabKey = 'owner' | 'platform';

const defaultForm = (): CreateAdminVoucherPayload => ({
  code: '', title: '', description: '',
  discountType: 'percentage', discountValue: 0,
  minOrderValue: 0, usageLimit: 100,
  applicableService: 'all', distributionMode: 'public',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
});

const inputCls = "w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-purple-500 transition-colors";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default function AdminVouchersPage() {
  const { user, isAuthReady } = useAuth();
  const { mode } = useThemeMode();
  const router = useRouter();

  const isDark = mode === 'dark';

  const [tab, setTab] = useState<TabKey>('owner');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog/Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [codeLocked, setCodeLocked] = useState(false);
  const [form, setForm] = useState(defaultForm());
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState<'all'|'active'|'disabled'>('all');

  useEffect(() => {
    if (isAuthReady && !user) router.replace('/login');
  }, [isAuthReady, user, router]);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const list = await voucherService.getAllAdminVouchers();
      setVouchers(list);
    } catch (e) {
      console.error('[AdminVouchers] fetchVouchers:', e);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchVouchers();
  }, [user, fetchVouchers]);

  const ownerVouchers = useMemo(() => vouchers.filter(v => v.voucherScope === 'owner'), [vouchers]);
  const platformVouchers = useMemo(() => vouchers.filter(v => v.voucherScope === 'platform'), [vouchers]);

  const sourceRows = tab === 'owner' ? ownerVouchers : platformVouchers;

  const filtered = useMemo(() => {
    let list = [...sourceRows];
    const q = search.toLowerCase();
    if (q) list = list.filter(v => v.code.toLowerCase().includes(q) || (v.title ?? '').toLowerCase().includes(q));
    if (fStatus !== 'all') list = list.filter(v => v.status === fStatus);
    return list.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [sourceRows, search, fStatus]);

  const handleDisable = async (v: Voucher) => {
    if (!confirm(`Khóa voucher "${v.code}"?`)) return;
    try {
      await voucherService.disableVoucher(v._id);
      fetchVouchers();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Thao tác thất bại');
    }
  };

  const handleEnable = async (v: Voucher) => {
    try {
      await voucherService.enableVoucher(v._id);
      fetchVouchers();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Thao tác thất bại');
    }
  };

  const handleDelete = async (v: Voucher) => {
    // quantity trong DB bị giảm khi ai redeem, dùng nó để check
    const hasBeenRedeemed = (v.usedCount ?? 0) > 0;
    if (hasBeenRedeemed) {
      alert(`Voucher "${v.code}" đã có lượt dùng — không thể xóa.`);
      return;
    }
    if (!confirm(`Xóa vĩnh viễn mã "${v.code}"?`)) return;
    try {
      await voucherService.deleteVoucher(v._id);
      fetchVouchers();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Xóa thất bại';
      alert(msg);
    }
  };

  const openCreate = () => {
    setForm(defaultForm());
    setEditingId(null);
    setCodeLocked(false);
    setDialogOpen(true);
  };

  const openEdit = (v: Voucher) => {
    setForm({
      code: v.code,
      title: v.title ?? '',
      description: v.description ?? '',
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderValue: v.minOrderValue ?? 0,
      usageLimit: v.usageLimit ?? 100,
      applicableService: v.applicableService ?? 'all',
      startDate: v.startDate ? new Date(v.startDate).toISOString().split('T')[0] : '',
      endDate: v.endDate ? new Date(v.endDate).toISOString().split('T')[0] : '',
      distributionMode: v.distributionMode ?? 'public',
    });
    setEditingId(v._id);
    setCodeLocked((v.usedCount ?? 0) > 0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        // Map fields to match BE schema for platform vouchers
        pointsRequired: Number(form.minOrderValue ?? 0),
        expiryDate: form.endDate,
        quantity: Number(form.usageLimit ?? 100),
      };

      if (editingId) {
        await voucherService.updateVoucher(editingId, payload as any);
      } else {
        await voucherService.createAdminVoucher(payload as any);
      }
      setDialogOpen(false);
      setForm(defaultForm());
      setEditingId(null);
      fetchVouchers();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Quản lý Voucher</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Toàn bộ mã khuyến mãi trên hệ thống.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchVouchers} className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <RefreshCw size={16} />
            </button>
            {tab === 'platform' && (
              <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-black text-sm hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20">
                <Plus size={16} /> Tạo Voucher XFOODI
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--card)]/80 rounded-xl border border-[var(--border)] w-fit">
          {([['owner', `Chủ nhà hàng (${ownerVouchers.length})`], ['platform', `XFOODI / Admin (${platformVouchers.length})`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === key ? 'bg-purple-600 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 space-y-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-purple-500" />
            <span className="text-sm font-bold">Bộ lọc</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mã, tên chiến dịch…"
                className="w-full bg-[var(--card)]/80 border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500/50" />
            </div>
            <select value={fStatus} onChange={e => setFStatus(e.target.value as any)}
              className="bg-[var(--card)]/80 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-purple-500/50">
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="disabled">Đã khóa</option>
            </select>
          </div>
          <p className="text-xs text-[var(--text-muted)]">{filtered.length} / {sourceRows.length} mã {tab === 'owner' ? 'nhà hàng' : 'XFOODI'}</p>
        </div>

        {/* Voucher cards preview (cả Chủ sân & Platform) */}
        {!loading && filtered.filter(v => v.status === 'active').length > 0 && (
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Đang hoạt động (preview thẻ)</p>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filtered.filter(v => v.status === 'active').map(v => (
                <div key={v._id} className="flex-shrink-0 w-[min(92vw,400px)]">
                  <VoucherCard voucher={v} surface={isDark ? 'dark' : 'light'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/30 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] font-bold">Chưa có voucher nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Mã Code', 'Phạm vi', 'Giảm giá', 'Lượt dùng', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v._id} className="border-b border-[var(--border)]/50 hover:bg-[var(--card)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-purple-500 font-mono">{v.code}</p>
                        <p className="text-xs text-[var(--text-muted)]">{v.title}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 inline-block ${v.distributionMode === 'private' ? 'text-violet-300 bg-violet-400/10 border-violet-400/20' : 'text-teal-300 bg-teal-400/10 border-teal-400/20'}`}>
                          {v.distributionMode === 'private' ? 'PRIVATE' : 'PUBLIC'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {v.voucherScope === 'platform'
                          ? <span className="text-xs font-bold px-2 py-0.5 rounded-lg border text-amber-300 bg-amber-400/10 border-amber-400/20">XFOODI Platform</span>
                          : <div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-lg border text-sky-300 bg-sky-400/10 border-sky-400/20">Chủ nhà hàng</span>
                              {v.venueApplication?.label && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{v.venueApplication.label}</p>}
                            </div>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-teal-400">{v.discountType === 'percentage' ? `${v.discountValue}%` : `${(v.discountValue).toLocaleString('vi-VN')} điểm`}</p>
                        <p className="text-xs text-[var(--text-muted)]">Từ {(v.minOrderValue ?? 0).toLocaleString('vi-VN')} điểm</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text)]">{v.usedCount ?? 0} / {v.usageLimit ?? '∞'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${v.status === 'active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                          {v.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {v.status === 'active'
                            ? <button onClick={() => handleDisable(v)} className="inline-flex items-center gap-1 text-xs text-red-400 border border-red-400/30 px-2 py-1 rounded-lg hover:bg-red-400/10 transition-colors font-bold" title="Khóa"><Lock size={11} /> Khóa</button>
                            : <button onClick={() => handleEnable(v)} className="inline-flex items-center gap-1 text-xs text-teal-400 border border-teal-400/30 px-2 py-1 rounded-lg hover:bg-teal-400/10 transition-colors font-bold" title="Kích hoạt"><Unlock size={11} /> Mở</button>
                          }
                          {tab === 'platform' && (
                            <button onClick={() => openEdit(v)} className="p-1 text-xs text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10 transition-colors" title="Sửa">
                              <Edit2 size={11} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(v)}
                            disabled={(v.usedCount ?? 0) > 0}
                            className="p-1 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={(v.usedCount ?? 0) > 0 ? 'Đã có lượt dùng, không thể xóa' : 'Xóa'}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Dialog ── */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-black text-[var(--text)]">{editingId ? 'Chỉnh sửa Voucher XFOODI' : 'Tạo Voucher XFOODI (Platform)'}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <Field label="Mã code *">
                <input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} disabled={codeLocked} placeholder="VD: XFOODI10" className={inputCls} />
              </Field>
              <Field label="Tên chiến dịch">
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={inputCls} />
              </Field>
              <Field label="Hiển thị">
                <div className="flex gap-3">
                  {(['public', 'private'] as const).map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.distributionMode === m} onChange={() => setForm(f => ({...f, distributionMode: m}))} className="accent-purple-600" />
                      <span className="text-sm text-[var(--text)]">{m === 'public' ? 'Công khai' : 'Riêng tư'}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kiểu giảm">
                  <select value={form.discountType} onChange={e => setForm(f => ({...f, discountType: e.target.value as any}))} className={inputCls}>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Cố định (điểm)</option>
                  </select>
                </Field>
                <Field label="Mức giảm *">
                  <input type="number" value={form.discountValue || ''} onChange={e => setForm(f => ({...f, discountValue: +e.target.value}))} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Đơn tối thiểu">
                  <input type="number" value={form.minOrderValue || ''} onChange={e => setForm(f => ({...f, minOrderValue: +e.target.value}))} className={inputCls} />
                </Field>
                <Field label="Giới hạn lượt">
                  <input type="number" value={form.usageLimit || ''} onChange={e => setForm(f => ({...f, usageLimit: +e.target.value}))} className={inputCls} />
                </Field>
              </div>
              <Field label="Dịch vụ">
                <select value={form.applicableService} onChange={e => setForm(f => ({...f, applicableService: e.target.value as any}))} className={inputCls}>
                  <option value="all">Tất cả</option>
                  <option value="booking">Đặt bàn</option>
                  <option value="shop">Cửa hàng</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ngày bắt đầu">
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className={inputCls} />
                </Field>
                <Field label="Ngày kết thúc">
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
              <button onClick={() => setDialogOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-bold hover:text-[var(--text)] transition-colors text-sm">Hủy</button>
              <button onClick={handleSave} disabled={saving || !form.code || !form.discountValue}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-black text-sm hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : (editingId ? 'Lưu thay đổi' : 'Phát hành mã')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
