"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/services/axiosInstance";
import { useAuth } from "@/lib/contexts/AuthContext";
import { formatVND } from "@/lib/utils/currency";

interface OrderDish {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface OrderDetail {
  id: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  dish: OrderDish;
  statusValue?: { code: string; name: string; colorCode: string };
}

interface MyOrder {
  id: string;
  totalAmount: number;
  subTotal: number;
  createdAt: string;
  isPaid: boolean;
  statusValue?: { code: string; name: string; colorCode: string };
  table?: { id: string; name: string; code: string };
  restaurant?: { id: string; name: string; logoUrl?: string; slug: string };
  orderDetails: OrderDetail[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING:   { bg: "rgba(241,196,15,0.12)",  text: "#d4a017", border: "rgba(241,196,15,0.3)" },
  CONFIRMED: { bg: "rgba(52,152,219,0.12)",  text: "#2980b9", border: "rgba(52,152,219,0.3)" },
  COMPLETED: { bg: "rgba(46,204,113,0.12)",  text: "#27ae60", border: "rgba(46,204,113,0.3)" },
  CANCELLED: { bg: "rgba(149,165,166,0.12)", text: "#7f8c8d", border: "rgba(149,165,166,0.3)" },
};

export default function MyOrdersPage() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace("/login?redirect=/my-orders");
      return;
    }
    fetchOrders(page);
  }, [isAuthReady, user, page]);

  const fetchOrders = async (p: number) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/orders/my", { params: { page: p, limit: 10 } });
      const d = res.data?.data;
      if (d && d.items) {
        setOrders(d.items);
        setTotal(d.total);
        setTotalPages(d.totalPages ?? 1);
      } else if (Array.isArray(res.data?.data)) {
        setOrders(res.data.data);
        setTotal(res.data.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch my orders", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthReady || (!user && !loading)) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base, #0A0E14)", paddingTop: "6rem" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">

        {/* Page Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors hover:border-[var(--primary)]"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Lịch sử đơn hàng</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {total > 0 ? `${total} đơn hàng của bạn` : "Lịch sử các món bạn đã gọi"}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <svg className="w-10 h-10" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Chưa có đơn hàng nào</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Quét mã QR tại bàn để gọi món và đơn hàng sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const status = order.statusValue;
              const statusStyle = STATUS_COLORS[status?.code || ""] || STATUS_COLORS.PENDING;
              const dateStr = new Date(order.createdAt).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              });

              return (
                <div key={order.id} className="rounded-2xl border overflow-hidden transition-all"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}>

                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Restaurant + Table */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.restaurant?.logoUrl && (
                          <img src={order.restaurant.logoUrl} alt={order.restaurant.name}
                            className="w-5 h-5 rounded object-cover" />
                        )}
                        <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                          {order.restaurant?.name || "Nhà hàng"}
                        </span>
                        {order.table && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                            {order.table.name || order.table.code}
                          </span>
                        )}
                      </div>

                      {/* Date + items count */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{dateStr}</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {order.orderDetails.length} món
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {/* Status badge */}
                      {status && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                          {status.name}
                        </span>
                      )}
                      {/* Total */}
                      <span className="font-bold text-sm" style={{ color: "var(--primary)" }}>
                        {formatVND(order.totalAmount || order.subTotal)}
                      </span>
                      {/* Chevron */}
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expandable dish list */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: "var(--border)" }}>
                      <div className="px-5 py-3 space-y-3">
                        {order.orderDetails.map((detail) => {
                          const dStatus = detail.statusValue;
                          const dStyle = STATUS_COLORS[dStatus?.code || ""] || STATUS_COLORS.PENDING;
                          return (
                            <div key={detail.id} className="flex items-center gap-3">
                              {/* Dish image */}
                              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                                style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                                {detail.dish.imageUrl ? (
                                  <img src={detail.dish.imageUrl} alt={detail.dish.name}
                                    className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-xl">🍽️</span>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                                  {detail.dish.name}
                                </p>
                                {detail.note && (
                                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                    Ghi chú: {detail.note}
                                  </p>
                                )}
                              </div>

                              {/* Qty + Price */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                  x{detail.quantity}
                                </p>
                                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                                  {formatVND(detail.unitPrice * detail.quantity)}
                                </p>
                              </div>

                              {/* Dish status */}
                              {dStatus && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: dStyle.bg, color: dStyle.text, border: `1px solid ${dStyle.border}` }}>
                                  {dStatus.name}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-3 flex items-center justify-between border-t"
                        style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}>
                        <span className="text-xs" style={{ color: order.isPaid ? "#27ae60" : "var(--text-muted)" }}>
                          {order.isPaid ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
                        </span>
                        <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                          Tổng: {formatVND(order.totalAmount || order.subTotal)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}
            >
              ← Trước
            </button>
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
