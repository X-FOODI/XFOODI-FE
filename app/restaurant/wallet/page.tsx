'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTenant } from '@/lib/contexts/TenantContext';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WalletData {
  wallet: {
    id: string;
    balance: number;
    cashBalance: number;
    lifetimeEarned: number;
  };
  availableBalance: number;
  lockedBalance: number;
  transactions: Transaction[];
  pendingWithdrawals: Withdrawal[];
}

interface Transaction {
  id: string;
  type: 'ORDER_REVENUE' | 'WITHDRAWAL_DEBIT' | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  bankCode: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  processedAt?: string;
}

const VIETNAMESE_BANKS = [
  { bin: '970415', code: 'VTB', name: 'VietinBank' },
  { bin: '970436', code: 'VCB', name: 'Vietcombank' },
  { bin: '970422', code: 'MB', name: 'MBBank' },
  { bin: '970418', code: 'BIDV', name: 'BIDV' },
  { bin: '970405', code: 'AGR', name: 'Agribank' },
  { bin: '970407', code: 'TCB', name: 'Techcombank' },
  { bin: '970423', code: 'TPB', name: 'TPBank' },
  { bin: '970432', code: 'VPB', name: 'VPBank' },
  { bin: '970416', code: 'ACB', name: 'ACB' },
  { bin: '970403', code: 'STB', name: 'Sacombank' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.floor(n)) + 'đ';

const statusConfig = {
  PENDING:    { label: 'Chờ duyệt',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  COMPLETED:  { label: 'Hoàn thành', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  FAILED:     { label: 'Thất bại',   color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  CANCELLED:  { label: 'Đã hủy',    color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions');

  const [form, setForm] = useState({
    amount: '',
    bankBin: '',
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  // Guard redirection if not logged in
  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace("/login?redirect=/restaurant/wallet");
    }
  }, [isAuthReady, user, router]);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch('/api/wallet', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setData({
          ...json.data,
          wallet: {
            ...json.data.wallet,
            balance: Number(json.data.wallet.balance),
            cashBalance: Number(json.data.wallet.cashBalance ?? 0),
            lifetimeEarned: Number(json.data.wallet.lifetimeEarned),
          },
          transactions: json.data.transactions.map((t: any) => ({
            ...t,
            amount: Number(t.amount),
          })),
          pendingWithdrawals: json.data.pendingWithdrawals.map((w: any) => ({
            ...w,
            amount: Number(w.amount),
          })),
        });
      }
    } catch (e) {
      console.error('[Wallet]', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [fetchWallet, user]);

  const handleWithdraw = async () => {
    if (!form.amount || Number(form.amount) < 10000) {
      alert('Số tiền tối thiểu là 10.000đ');
      return;
    }
    if (!form.bankBin || !form.accountNumber || !form.accountName) {
      alert('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }
    try {
      setWithdrawLoading(true);
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(form.amount),
          bankCode: form.bankCode,
          bankBin: form.bankBin,
          accountNumber: form.accountNumber,
          accountName: form.accountName.toUpperCase(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowWithdraw(false);
        setForm({ amount: '', bankBin: '', bankCode: '', bankName: '', accountNumber: '', accountName: '' });
        await fetchWallet();
        setActiveTab('withdrawals');
      } else {
        alert(json.message || 'Gửi yêu cầu thất bại');
      }
    } catch (e) {
      alert('Lỗi kết nối');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const available = data?.availableBalance ?? 0;
  const cash = Number(data?.wallet?.cashBalance ?? 0);
  const lifetime = Number(data?.wallet?.lifetimeEarned ?? 0);
  const locked = data?.lockedBalance ?? 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#0A0E14]" style={{ background: "var(--bg-base)" }}>
      <DashboardHeader
        role="restaurant"
        restaurantName={tenant?.name ?? "Cửa hàng"}
        userName={user?.name ?? ""}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          role="restaurant"
          restaurantName={tenant?.name ?? "Cửa hàng"}
          userName={user?.name ?? ""}
          userEmail={user?.email ?? ""}
        />

        <main className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8" style={{ background: "var(--bg-base)" }}>
          <div className="max-w-[1400px] mx-auto w-full flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="p-6 space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-amber-400" />
                      Ví doanh thu
                    </h1>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      Theo dõi doanh thu tiền mặt tại bàn và tiền chuyển khoản tích lũy qua cổng hệ thống.
                    </p>
                  </div>
                  <button
                    onClick={fetchWallet}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Available */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400/70">Số dư khả dụng</span>
                    </div>
                    <p className="text-2xl font-black text-white">{fmt(available)}</p>
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      {locked > 0 ? (
                        <><Clock className="w-3 h-3 text-amber-400" /> {fmt(locked)} đang rút</>
                      ) : (
                        'Tiền chuyển khoản có thể rút'
                      )}
                    </p>
                  </div>

                  {/* Cash Balance */}
                  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-500/20 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tiền mặt thu trực tiếp</span>
                    </div>
                    <p className="text-2xl font-black text-white">{fmt(cash)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Không rút qua hệ thống</p>
                  </div>

                  {/* Lifetime */}
                  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tổng doanh thu</span>
                    </div>
                    <p className="text-2xl font-black text-white">{fmt(lifetime)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Cộng dồn tất cả</p>
                  </div>

                  {/* Withdraw CTA */}
                  <div
                    onClick={() => available >= 10000 && setShowWithdraw(true)}
                    className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                      available >= 10000
                        ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-zinc-900/40 border-zinc-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400/70">Yêu cầu rút</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">
                        {available >= 10000 ? 'Rút về tài khoản' : 'Tối thiểu 10.000đ'}
                      </p>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 w-fit">
                  {(['transactions', 'withdrawals'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === tab
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab === 'transactions' ? 'Lịch sử giao dịch' : 'Yêu cầu rút tiền'}
                    </button>
                  ))}
                </div>

                {/* Transaction List */}
                {activeTab === 'transactions' && (
                  <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden">
                    {(!data?.transactions || data.transactions.length === 0) ? (
                      <div className="py-16 flex flex-col items-center gap-3 text-zinc-500">
                        <TrendingUp className="w-8 h-8 opacity-30" />
                        <p className="text-sm">Chưa có giao dịch nào</p>
                        <p className="text-xs">Khi khách hàng thanh toán QR, doanh thu sẽ xuất hiện ở đây</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Loại</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Mô tả</th>
                            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Số tiền</th>
                            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.transactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md border ${
                                  tx.type === 'ORDER_REVENUE'
                                    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                                    : 'text-red-400 bg-red-400/10 border-red-400/20'
                                }`}>
                                  {tx.type === 'ORDER_REVENUE' ? (
                                    <><CheckCircle2 className="w-3 h-3" /> Doanh thu</>
                                  ) : (
                                    <><ArrowDownToLine className="w-3 h-3" /> Rút tiền</>
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-zinc-300">{tx.description}</td>
                              <td className={`px-4 py-3 text-right font-bold font-mono ${
                                tx.type === 'ORDER_REVENUE' ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {tx.type === 'ORDER_REVENUE' ? '+' : '-'}{fmt(tx.amount)}
                              </td>
                              <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                                {new Date(tx.createdAt).toLocaleString('vi-VN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Withdrawal History */}
                {activeTab === 'withdrawals' && (
                  <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden">
                    {(!data?.pendingWithdrawals || data.pendingWithdrawals.length === 0) ? (
                      <div className="py-16 flex flex-col items-center gap-3 text-zinc-500">
                        <ArrowDownToLine className="w-8 h-8 opacity-30" />
                        <p className="text-sm">Chưa có yêu cầu rút tiền nào</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Tài khoản</th>
                            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Số tiền</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Trạng thái</th>
                            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Ngày tạo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.pendingWithdrawals.map((w) => (
                            <tr key={w.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-zinc-500" />
                                  <div>
                                    <p className="font-bold text-white">{w.accountNumber}</p>
                                    <p className="text-xs text-zinc-400">{w.bankCode} · {w.accountName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-black text-white font-mono">{fmt(w.amount)}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${statusConfig[w.status]?.color}`}>
                                  {statusConfig[w.status]?.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                                {new Date(w.createdAt).toLocaleDateString('vi-VN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 rounded-3xl border border-zinc-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Rút tiền về ngân hàng</h2>
              <button onClick={() => setShowWithdraw(false)} className="text-zinc-500 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300">
                Yêu cầu rút tiền sẽ được admin xử lý trong 1–2 ngày làm việc.
                Tiền sẽ được chuyển về tài khoản bạn cung cấp.
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Số tiền muốn rút</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-amber-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">đ</span>
              </div>
              <p className="text-xs text-zinc-500">Khả dụng: <span className="text-amber-400 font-bold">{fmt(available)}</span></p>
            </div>

            {/* Bank */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tài khoản ngân hàng nhận</label>
              <select
                value={form.bankBin}
                onChange={(e) => {
                  const bank = VIETNAMESE_BANKS.find(b => b.bin === e.target.value);
                  setForm(f => ({ ...f, bankBin: e.target.value, bankCode: bank?.code ?? '', bankName: bank?.name ?? '' }));
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {VIETNAMESE_BANKS.map(b => (
                  <option key={b.bin} value={b.bin}>{b.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                placeholder="Số tài khoản"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={form.accountName}
                onChange={(e) => setForm(f => ({ ...f, accountName: e.target.value.toUpperCase() }))}
                placeholder="TEN CHU TAI KHOAN (VIET HOA KHONG DAU)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:text-white transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-zinc-950 font-black hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <><ArrowDownToLine className="w-4 h-4" /> Gửi yêu cầu</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
