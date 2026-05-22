"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import restaurantApplicationService, {
  ApplicationStatus,
  RestaurantApplication,
} from "@/lib/services/restaurantApplicationService";

const STATUS_BADGE: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Đang chờ", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  APPROVED: { label: "Đã duyệt", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  REJECTED: { label: "Từ chối", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

type FilterStatus = ApplicationStatus | "ALL";

export default function AdminApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [user, filter, page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await restaurantApplicationService.list({
        status: filter === "ALL" ? undefined : filter,
        page,
        limit: 15,
      });
      setApplications(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "Tất cả", value: "ALL" },
    { label: "Đang chờ", value: "PENDING" },
    { label: "Đã duyệt", value: "APPROVED" },
    { label: "Từ chối", value: "REJECTED" },
  ];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              Xét duyệt đơn đăng ký nhà hàng
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {total} đơn tổng cộng
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === f.value ? "var(--primary)" : "var(--card)",
                color: filter === f.value ? "#fff" : "var(--text)",
                border: filter === f.value ? "1px solid var(--primary)" : "1px solid var(--border)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <svg className="w-10 h-10" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Không có đơn nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Người nộp", "Tên nhà hàng", "Slug", "Ngày nộp", "Trạng thái", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const badge = STATUS_BADGE[app.status as ApplicationStatus];
                  return (
                    <tr key={app.id} className="transition-colors hover:bg-[var(--bg-base)]"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: "var(--primary)" }}>
                            {app.user?.fullName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{app.user?.fullName}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{app.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text)" }}>{app.restaurantName}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--text-muted)" }}>{app.slug}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/applications/${app.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                          style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid var(--primary)" }}>
                          Xem xét
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}>
              ←
            </button>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Trang {page} / {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--card)" }}>
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
