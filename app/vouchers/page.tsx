'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Tag,
  Gift,
  RefreshCw,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useThemeMode } from '@/app/theme/AntdProvider';
import voucherService, { Voucher } from '@/lib/services/voucherService';
import VoucherCard from '@/components/vouchers/VoucherCard';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ── Filter type ─────────────────────────────────────────────────────────────────
type FilterTab = 'all' | 'platform' | 'owner';

function sortByEnd(a: Voucher, b: Voucher) {
  return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
}

// ── Page ─────────────────────────────────────────────────────────────────────────
export default function CustomerVouchersPage() {
  const { user, isAuthReady } = useAuth();
  const { mode } = useThemeMode();
  const router = useRouter();

  const isDark = mode === 'dark';

  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformVouchers, setPlatformVouchers] = useState<Voucher[]>([]);
  const [ownerVouchers, setOwnerVouchers] = useState<Voucher[]>([]);

  // Private code lookup
  const [privateCode, setPrivateCode] = useState('');
  const [resolving, setResolving] = useState(false);
  const [privateVouchers, setPrivateVouchers] = useState<Voucher[]>([]);
  const [privateError, setPrivateError] = useState('');
  const [privateOpen, setPrivateOpen] = useState(false);

  // Redeem state
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemMsg, setRedeemMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  // ── Load public vouchers ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await voucherService.getEligibleVouchers();
      setPlatformVouchers([...result.platformVouchers].sort(sortByEnd));
      setOwnerVouchers([...result.ownerVouchers].sort(sortByEnd));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Không tải được danh sách voucher.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      if (!user) {
        router.replace('/login?redirect=/vouchers');
        return;
      }
      load();
    }
  }, [isAuthReady, user, load, router]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filteredList = useMemo(() => {
    let list: Voucher[] = [];
    if (filter === 'platform') list = [...platformVouchers];
    else if (filter === 'owner') list = [...ownerVouchers];
    else list = [...platformVouchers, ...ownerVouchers];
    return list.sort(sortByEnd);
  }, [filter, platformVouchers, ownerVouchers]);

  // ── Private code resolve ────────────────────────────────────────────────────
  const handleResolvePrivate = async () => {
    const code = privateCode.trim().toUpperCase();
    if (!code) return;
    setResolving(true);
    setPrivateError('');
    try {
      const res = await voucherService.resolveVoucherCode({
        code,
        catalogMode: true,
        applicableService: 'booking',
        targetIds: [],
        cartTotal: 1,
      });
      if (!res.success || !res.data?._id) {
        setPrivateError(res.message ?? 'Mã không hợp lệ hoặc đã hết hạn.');
        return;
      }
      const v = res.data;
      setPrivateVouchers((prev) => {
        const rest = prev.filter((x) => x._id !== v._id);
        return [...rest, v];
      });
      setPrivateCode('');
    } catch (e: any) {
      setPrivateError(e?.response?.data?.message ?? 'Không thể tra mã. Vui lòng thử lại.');
    } finally {
      setResolving(false);
    }
  };

  // ── Redeem voucher ──────────────────────────────────────────────────────────
  const handleRedeem = async (voucher: Voucher) => {
    if (redeemingId) return;
    setRedeemingId(voucher._id);
    setRedeemMsg(null);
    try {
      const voucherId = (voucher as any).id || voucher._id;
      const res = await voucherService.redeemVoucher({ voucherId });
      setRedeemMsg({
        id: voucher._id,
        msg: res.message ?? 'Áp dụng thành công!',
        ok: res.success,
      });
    } catch (e: any) {
      setRedeemMsg({
        id: voucher._id,
        msg: e?.response?.data?.message ?? 'Không thể đổi voucher.',
        ok: false,
      });
    } finally {
      setRedeemingId(null);
      setTimeout(() => setRedeemMsg(null), 4000);
    }
  };

  // ── Loading / guard ─────────────────────────────────────────────────────────
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0A0E14] transition-colors duration-200">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const totalCount = platformVouchers.length + ownerVouchers.length;

  const FilterBtn = ({ value, label }: { value: FilterTab; label: string }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
        filter === value
          ? 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30 dark:border-orange-500/40 text-orange-600 dark:text-orange-300'
          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {label}
    </button>
  );

  const renderCard = (v: Voucher) => (
    <div key={v._id} className="w-full transition-all hover:-translate-y-1 duration-200">
      <VoucherCard
        voucher={v}
        surface={isDark ? 'dark' : 'light'}
        onApply={() => handleRedeem(v)}
        selected={redeemMsg?.id === v._id && redeemMsg.ok}
      />
      {redeemMsg?.id === v._id && (
        <div
          className={`mt-2 px-3 py-2 rounded-xl text-xs font-semibold ${
            redeemMsg.ok
              ? 'bg-green-500/10 dark:bg-green-500/15 border border-green-500/20 dark:border-green-500/25 text-green-700 dark:text-green-300'
              : 'bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 dark:border-red-500/25 text-red-700 dark:text-red-300'
          }`}
        >
          {redeemMsg.msg}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E14] text-neutral-900 dark:text-white transition-colors duration-200">
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
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-24 space-y-8">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={15} /> Trang chủ
          </Link>

          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 dark:shadow-orange-500/30 flex-shrink-0">
                <Tag size={24} className="text-[#ffffff] dark:text-gray-900" />
              </div>
              <div>
                <h1 className="text-2xl font-black leading-none text-neutral-900 dark:text-white">Voucher của bạn</h1>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  Mã <strong className="text-neutral-900 dark:text-white">công khai</strong> đang hiệu lực · Mã{' '}
                  <strong className="text-neutral-900 dark:text-white">riêng</strong> tra ở cuối trang
                </p>
              </div>
            </div>

            {!loading && (
              <span className="sm:ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 dark:border-orange-500/25 text-orange-600 dark:text-orange-300">
                <Gift size={13} />
                {totalCount} mã đang mở
              </span>
            )}
          </div>
        </div>

        {/* ── Horizontal scroll preview ── */}
        {!loading && !error && filteredList.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 p-4">
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Xem nhanh (cuộn ngang)
            </p>
            <div
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {filteredList.map((v) => (
                <div
                  key={`strip-${v._id}`}
                  className="flex-shrink-0 w-[min(92vw,400px)]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {renderCard(v)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter + grid ── */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="font-bold text-sm text-neutral-900 dark:text-white">Lọc danh sách</p>
            <div className="flex gap-2 flex-wrap">
              <FilterBtn value="all" label={`Tất cả (${totalCount})`} />
              <FilterBtn value="platform" label={`XFOODI (${platformVouchers.length})`} />
              <FilterBtn value="owner" label={`Đối tác (${ownerVouchers.length})`} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-7 h-7 animate-spin text-orange-500" />
            </div>
          ) : error ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={load}
                className="px-5 py-2 rounded-xl border border-zinc-300 dark:border-white/15 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:border-zinc-400 dark:hover:border-white/30 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-zinc-200/30 dark:bg-zinc-900/30">
              <Ticket size={32} className="mx-auto mb-3 text-neutral-400 dark:text-neutral-600" />
              <p className="font-bold text-neutral-600 dark:text-neutral-300">Chưa có mã công khai nào</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                Khi admin hoặc đối tác phát hành voucher công khai, thẻ sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((v) => renderCard(v))}
            </div>
          )}
        </div>

        {/* ── Private code section ── */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 overflow-hidden">
          <button
            onClick={() => setPrivateOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-200/20 dark:hover:bg-zinc-900/30 transition-colors"
          >
            <div className="text-left">
              <p className="font-bold text-sm text-neutral-900 dark:text-white">Mã riêng (Private)</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                Nhập mã bạn được cấp để xem điều kiện & đổi thưởng
              </p>
            </div>
            {privateOpen ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
          </button>

          {privateOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-zinc-200 dark:border-zinc-800/80">
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={privateCode}
                    onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleResolvePrivate()}
                    placeholder="NHẬP MÃ VOUCHER"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono font-bold placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 text-neutral-900 dark:text-white tracking-widest uppercase"
                    disabled={resolving}
                  />
                </div>
                <button
                  onClick={handleResolvePrivate}
                  disabled={resolving || !privateCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-[#ffffff] dark:text-gray-900 text-sm font-black hover:bg-orange-600 dark:hover:bg-orange-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {resolving ? <RefreshCw size={14} className="animate-spin" /> : 'Tra mã'}
                </button>
              </div>

              {privateError && (
                <p className="text-red-500 dark:text-red-400 text-xs font-semibold">{privateError}</p>
              )}

              {privateVouchers.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider">
                    Mã riêng đã tra ({privateVouchers.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {privateVouchers.map((v) => renderCard(v))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 px-1">
          Dữ liệu lấy từ server — mã công khai còn hiệu lực. Nếu trống, liên hệ admin hoặc kiểm tra cài đặt API.
        </p>
      </main>

      <Footer />
    </div>
  );
}
