"use client";

interface FeedbackItem {
  id: string;
  customerName?: string;
  isAnonymous: boolean;
  avatarUrl?: string;
  rating: number;
  comment?: string;
  createdDate: string;
}

interface LatestFeedbacksCardProps {
  items?: FeedbackItem[];
  averageRating?: number;
  totalCount?: number;
  loading?: boolean;
  viewAllHref?: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={i < rating ? "#faad14" : "none"}
          stroke={i < rating ? "#faad14" : "var(--border)"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function LatestFeedbacksCard({
  items = [],
  averageRating,
  totalCount = 0,
  loading = false,
  viewAllHref,
}: LatestFeedbacksCardProps) {
  if (loading) {
    return (
      <div className="dashboard-data-card">
        <div className="dashboard-data-card-header">
          <h3 className="dashboard-data-card-title">Đánh giá gần đây</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-data-card-item">
              <div className="flex items-center gap-3">
                <div className="dashboard-skeleton" style={{ width: "2rem", height: "2rem", borderRadius: "50%" }} />
                <div className="flex-1 space-y-2">
                  <div className="dashboard-skeleton" style={{ height: "0.875rem", width: "50%" }} />
                  <div className="dashboard-skeleton" style={{ height: "0.625rem", width: "80%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="dashboard-data-card">
        <div className="dashboard-data-card-header">
          <h3 className="dashboard-data-card-title">Đánh giá gần đây</h3>
        </div>
        <div className="text-center py-8 rounded-lg" style={{ background: "var(--surface)" }}>
          <svg className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.4 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có đánh giá nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-data-card">
      <div className="dashboard-data-card-header">
        <h3 className="dashboard-data-card-title">Đánh giá gần đây</h3>
        <div className="flex items-center gap-2">
          {averageRating !== undefined && (
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#faad14" stroke="#faad14" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: "#faad14" }}>
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}
          <span className="dashboard-data-card-badge">{totalCount}</span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const displayName = item.isAnonymous
            ? "Ẩn danh"
            : (item.customerName ?? "Không rõ");
          const initials = item.isAnonymous
            ? "?"
            : (item.customerName?.split(" ").filter(Boolean).slice(-1)[0]?.[0]?.toUpperCase() ?? "?");

          const now = new Date();
          const created = new Date(item.createdDate);
          const diffMs = now.getTime() - created.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          const timeAgo =
            diffMins < 60
              ? `${diffMins} phút trước`
              : diffHours < 24
              ? `${diffHours} giờ trước`
              : `${diffDays} ngày trước`;

          return (
            <div key={item.id} className="dashboard-data-card-item">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold overflow-hidden"
                  style={{
                    background: item.isAnonymous ? "var(--surface)" : "var(--primary-soft)",
                    color: item.isAnonymous ? "var(--text-muted)" : "var(--primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {!item.isAnonymous && item.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                      {displayName}
                    </p>
                    <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {timeAgo}
                    </span>
                  </div>
                  <div className="mb-1.5">
                    <StarRow rating={item.rating} />
                  </div>
                  {item.comment && (
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      &ldquo;{item.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {viewAllHref && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <a
            href={viewAllHref}
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Xem tất cả đánh giá →
          </a>
        </div>
      )}
    </div>
  );
}
