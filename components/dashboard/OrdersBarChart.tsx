"use client";

interface OrderTrendPoint {
  date: string;
  total: number;
  label: string;
}

interface OrdersBarChartProps {
  data?: OrderTrendPoint[];
  totalOrders?: number;
  subtitle?: string;
  title?: string;
}

export default function OrdersBarChart({
  data = [],
  totalOrders = 0,
  subtitle,
  title = "Đơn hàng",
}: OrdersBarChartProps) {
  const ordersData = data.length > 0 ? data : [{ label: "-", total: 0, date: "" }];
  const maxOrders = Math.max(1, ...ordersData.map((d) => d.total));
  const maxLabelLength = Math.max(...ordersData.map((d) => d.label.length));
  const labelFontSize = maxLabelLength > 8 ? "10px" : "12px";
  const barMaxHeightPercent = 102;
  const labelGapPx = 8;

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-bold mb-0.5" style={{ color: "var(--text)" }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle ?? "Số lượng đơn theo kỳ"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {totalOrders.toLocaleString("vi-VN")}
          </p>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
            TỔNG ĐƠN
          </p>
        </div>
      </div>

      <div className="relative h-52">
        <div
          className="grid h-full items-end gap-2 px-1"
          style={{ gridTemplateColumns: `repeat(${ordersData.length}, minmax(0, 1fr))` }}
        >
          {ordersData.map((item, index) => {
            const rawHeight = (item.total / maxOrders) * barMaxHeightPercent;
            const height = item.total > 0 ? Math.max(3, rawHeight) : 0;
            const valueBottom = height;
            return (
              <div key={index} className="min-w-0 flex flex-col items-center">
                <div className="relative w-full h-40 flex items-end justify-center">
                  <div
                    className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
                    style={{
                      bottom: `calc(${valueBottom}% + ${labelGapPx}px)`,
                      zIndex: 20,
                      background: "var(--card)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    {item.total}
                  </div>
                  <div
                    className="w-full rounded-lg transition-all duration-500 group relative hover:opacity-80"
                    style={{
                      zIndex: 10,
                      background: "linear-gradient(to top, var(--primary), #FB923C)",
                      height: `${height}%`,
                      maxWidth: "34px",
                      minWidth: "10px",
                      width: "68%",
                    }}
                  />
                </div>
                <div
                  className="mt-2 text-xs font-medium whitespace-nowrap text-center w-full"
                  style={{ color: "var(--text-muted)", fontSize: labelFontSize }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
