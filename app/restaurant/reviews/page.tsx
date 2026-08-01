"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { message, Input, Select, Modal, Tooltip } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
  StarFilled,
} from "@ant-design/icons";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import SentimentCard from "@/components/dashboard/SentimentCard";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import axiosInstance from "@/lib/services/axiosInstance";

const { Option } = Select;

interface FeedbackImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
  isCover: boolean;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  isAnonymous: boolean;
  isPublished: boolean;
  createdAt: string;
  order: { id: string; reference: string };
  customer: {
    id: string;
    user: { id: string; fullName: string | null; avatarUrl: string | null } | null;
  } | null;
  images: FeedbackImage[];
}

interface FeedbackListResult {
  items: FeedbackItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
  totalCount: number;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <StarFilled
          key={s}
          className={`${sizes[size]} ${s <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
        />
      ))}
    </div>
  );
}

function RatingBar({ count, total, star }: { count: number; total: number; star: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-slate-600 dark:text-slate-400 text-right font-bold">{star}</span>
      <StarFilled className="text-amber-400 text-xs" />
      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-slate-500 dark:text-slate-400 font-semibold">{count}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const { user, isAuthReady } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  const [data, setData] = useState<FeedbackListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [publishFilter, setPublishFilter] = useState<boolean | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Redirect if not authed ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.replace("/login-email?redirect=/restaurant/reviews");
  }, [isAuthReady, user, router]);

  // ─── Fetch feedbacks ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      if (ratingFilter !== undefined) {
        params.minRating = ratingFilter;
        params.maxRating = ratingFilter;
      }
      if (publishFilter !== undefined) params.isPublished = publishFilter;

      const res = await axiosInstance.get("/feedbacks", { params });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch {
      message.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, ratingFilter, publishFilter]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    fetchData();
  }, [fetchData, isAuthReady, user]);

  // ─── Toggle publish ───────────────────────────────────────────────────────
  const handleTogglePublish = async (item: FeedbackItem) => {
    setActionLoading(item.id + "-publish");
    try {
      await axiosInstance.patch(`/feedbacks/${item.id}/publish`, {
        isPublished: !item.isPublished,
      });
      message.success(item.isPublished ? "Đã ẩn đánh giá" : "Đã hiện đánh giá");
      fetchData();
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...selectedItem, isPublished: !item.isPublished });
      }
    } catch {
      message.error("Không thể thay đổi trạng thái hiển thị");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = (item: FeedbackItem) => {
    Modal.confirm({
      title: "Xóa đánh giá này?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        setActionLoading(item.id + "-delete");
        try {
          await axiosInstance.delete(`/feedbacks/${item.id}`);
          message.success("Đã xóa đánh giá");
          if (selectedItem?.id === item.id) setSelectedItem(null);
          fetchData();
        } catch {
          message.error("Không thể xóa đánh giá");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // ─── Computed stats ───────────────────────────────────────────────────────
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: data?.items.filter((i) => i.rating === star).length ?? 0,
  }));

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
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

        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 border-b pb-5"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                  Đánh giá khách hàng
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Xem và quản lý tất cả phản hồi từ khách hàng tại nhà hàng.
                </p>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                <ReloadOutlined />
                Làm mới
              </button>
            </div>

            {/* ── AI Sentiment ────────────────────────────────────────────── */}
            <SentimentCard />

            {/* ── Stats row ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Average rating card */}
              <div
                className="rounded-2xl p-6 border flex items-center gap-5 col-span-1 sm:col-span-1"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex-shrink-0">
                  <span className="text-3xl font-black text-amber-500">
                    {loading ? "–" : data?.averageRating.toFixed(1) ?? "–"}
                  </span>
                  <StarFilled className="text-amber-400 text-sm mt-0.5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Điểm trung bình
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {loading ? "…" : `${data?.totalCount ?? 0} đánh giá`}
                  </p>
                  {!loading && data && (
                    <div className="flex mt-1">
                      <StarRating rating={Math.round(data.averageRating)} size="sm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Rating breakdown */}
              <div
                className="rounded-2xl p-6 border col-span-1 sm:col-span-2"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Phân bổ số sao
                </p>
                <div className="space-y-1.5">
                  {ratingDist.map(({ star, count }) => (
                    <RatingBar
                      key={star}
                      star={star}
                      count={loading ? 0 : count}
                      total={loading ? 0 : (data?.total ?? 0)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Filters ─────────────────────────────────────────────────── */}
            <div
              className="flex flex-wrap items-center gap-3 p-4 rounded-xl border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Input
                  placeholder="Tìm kiếm đánh giá, tên KH..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="rounded-lg"
                  allowClear
                />
              </div>
              <Select
                placeholder="Lọc theo sao"
                value={ratingFilter}
                onChange={(v) => { setRatingFilter(v); setPage(1); }}
                allowClear
                style={{ minWidth: 140 }}
                className="rounded-lg"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <Option key={s} value={s}>
                    <div className="flex items-center gap-1.5">
                      <StarFilled className="text-amber-400 text-xs" />
                      <span>{s} sao</span>
                    </div>
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Trạng thái hiển thị"
                value={publishFilter}
                onChange={(v) => { setPublishFilter(v); setPage(1); }}
                allowClear
                style={{ minWidth: 160 }}
                className="rounded-lg"
              >
                <Option value={true}>Đang hiển thị</Option>
                <Option value={false}>Đã ẩn</Option>
              </Select>

              {/* summary counts */}
              <div className="ml-auto flex items-center gap-2 text-sm">
                {!loading && data && (
                  <>
                    <span className="px-3 py-1 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {data.total} kết quả
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── Review list + detail panel ────────────────────────────── */}
            <div className="flex gap-5 min-h-[400px]">

              {/* List */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border p-4 animate-pulse"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : data?.items.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-20 rounded-2xl border"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <StarFilled className="text-5xl text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
                      Chưa có đánh giá nào
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                      Các đánh giá từ khách hàng sẽ hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  <>
                    {data?.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                        className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedItem?.id === item.id
                            ? "ring-2 ring-primary/50"
                            : "hover:border-primary/30"
                        }`}
                        style={{
                          background: "var(--card)",
                          borderColor: selectedItem?.id === item.id ? "var(--primary)" : "var(--border)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {item.customer?.user?.avatarUrl ? (
                              <img
                                src={item.customer.user.avatarUrl}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm">
                                {item.isAnonymous
                                  ? "?"
                                  : (item.customer?.user?.fullName?.[0] ?? "K")}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                  {item.isAnonymous
                                    ? "Khách ẩn danh"
                                    : (item.customer?.user?.fullName ?? "Khách hàng")}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <StarRating rating={item.rating} size="sm" />
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    Đơn #{item.order?.reference}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                              </div>

                              {/* Badges + actions */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {item.isPublished ? (
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                    Hiển thị
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    Đã ẩn
                                  </span>
                                )}
                                <Tooltip title={item.isPublished ? "Ẩn đánh giá" : "Hiện đánh giá"}>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleTogglePublish(item); }}
                                    disabled={actionLoading === item.id + "-publish"}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                  >
                                    {item.isPublished ? (
                                      <EyeInvisibleOutlined className="text-sm" />
                                    ) : (
                                      <EyeOutlined className="text-sm" />
                                    )}
                                  </button>
                                </Tooltip>
                                <Tooltip title="Xóa đánh giá">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                    disabled={actionLoading === item.id + "-delete"}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-slate-500 hover:text-red-500"
                                  >
                                    <DeleteOutlined className="text-sm" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Comment */}
                            {item.comment && (
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                "{item.comment}"
                              </p>
                            )}

                            {/* Images preview */}
                            {item.images.length > 0 && (
                              <div className="mt-2 flex gap-1.5">
                                {item.images.slice(0, 3).map((img) => (
                                  <img
                                    key={img.id}
                                    src={img.imageUrl}
                                    alt="review-img"
                                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                          className="px-4 py-2 text-sm font-semibold rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: "var(--card)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          ← Trước
                        </button>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 px-3">
                          Trang {page}/{data.totalPages}
                        </span>
                        <button
                          disabled={page >= data.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          className="px-4 py-2 text-sm font-semibold rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: "var(--card)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          Sau →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Detail panel ────────────────────────────────────────── */}
              {selectedItem && (
                <div
                  className="w-full max-w-[360px] rounded-2xl border flex-shrink-0 flex flex-col overflow-hidden sticky top-0 self-start"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  {/* Panel header */}
                  <div
                    className="p-5 border-b flex items-center justify-between"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <h3 className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Chi tiết đánh giá
                    </h3>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {/* Panel body */}
                  <div className="p-5 space-y-5 overflow-y-auto flex-1">
                    {/* Customer info */}
                    <div className="flex items-center gap-3">
                      {selectedItem.customer?.user?.avatarUrl ? (
                        <img
                          src={selectedItem.customer.user.avatarUrl}
                          alt="avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-lg">
                          {selectedItem.isAnonymous
                            ? "?"
                            : (selectedItem.customer?.user?.fullName?.[0] ?? "K")}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedItem.isAnonymous
                            ? "Khách ẩn danh"
                            : (selectedItem.customer?.user?.fullName ?? "Khách hàng")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Đơn #{selectedItem.order?.reference}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div
                      className="p-4 rounded-xl border text-center"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      <div className="flex justify-center mb-1">
                        <StarRating rating={selectedItem.rating} size="lg" />
                      </div>
                      <p className="text-3xl font-black text-amber-500">{selectedItem.rating}/5</p>
                    </div>

                    {/* Comment */}
                    {selectedItem.comment && (
                      <div
                        className="p-4 rounded-xl border"
                        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                          Nội dung
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "{selectedItem.comment}"
                        </p>
                      </div>
                    )}

                    {/* Images */}
                    {selectedItem.images.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                          Hình ảnh ({selectedItem.images.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedItem.images.map((img) => (
                            <a
                              key={img.id}
                              href={img.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={img.imageUrl}
                                alt="review"
                                className="w-full aspect-square rounded-lg object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Ngày đánh giá:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(selectedItem.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ẩn danh:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {selectedItem.isAnonymous ? "Có" : "Không"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trạng thái:</span>
                        {selectedItem.isPublished ? (
                          <span className="font-black text-emerald-500">Đang hiển thị</span>
                        ) : (
                          <span className="font-black text-slate-400">Đã ẩn</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel footer - actions */}
                  <div
                    className="p-4 border-t flex gap-2"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={() => handleTogglePublish(selectedItem)}
                      disabled={actionLoading === selectedItem.id + "-publish"}
                      className={`flex-1 py-2.5 text-xs font-black rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        selectedItem.isPublished
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                          : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                      }`}
                    >
                      {selectedItem.isPublished ? (
                        <><EyeInvisibleOutlined /> Ẩn đi</>
                      ) : (
                        <><EyeOutlined /> Hiện lên</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedItem)}
                      disabled={actionLoading === selectedItem.id + "-delete"}
                      className="flex-1 py-2.5 text-xs font-black rounded-lg border bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <DeleteOutlined /> Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
