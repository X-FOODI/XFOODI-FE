"use client";

import { useEffect, useRef, useState } from "react";
import { formatVND } from "@/lib/utils/currency";

interface RevenueTrendPoint {
  date: string;
  value: number;
  label: string;
}

interface RevenueChartProps {
  data?: RevenueTrendPoint[];
  totalRevenue?: number;
  subtitle?: string;
  title?: string;
}

export default function RevenueChart({
  data = [],
  totalRevenue = 0,
  subtitle,
  title = "Doanh thu",
}: RevenueChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const element = chartRef.current;
    const updateWidth = () => {
      const width = Math.floor(element.getBoundingClientRect().width);
      if (width > 0) setChartWidth(width);
    };
    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const hasData = data.length > 0 && data.some((d) => d.value > 0);
  const revenueData = data.length > 0 ? data : [{ label: "-", value: 0, date: "" }];
  const rawMax = Math.max(0, ...revenueData.map((d) => d.value));

  const getNiceMax = (value: number): number => {
    if (value <= 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    let niceNorm: number;
    if (normalized <= 1) niceNorm = 1;
    else if (normalized <= 2) niceNorm = 2;
    else if (normalized <= 5) niceNorm = 5;
    else niceNorm = 10;
    return niceNorm * magnitude;
  };

  const niceMax = getNiceMax(rawMax);
  const maxValue = niceMax;
  const measuredWidth = Math.max(chartWidth, 320);
  const maxLabelLength = Math.max(...revenueData.map((d) => d.label.length));
  const xAxisFontSize = maxLabelLength > 8 ? 10 : 12;
  const edgeLabelPadding = Math.min(measuredWidth * 0.18, Math.max(34, maxLabelLength * 3.2));
  const leftPadding = Math.max(60, edgeLabelPadding);
  const rightPadding = Math.max(28, edgeLabelPadding);
  const topPadding = 30;
  const chartHeight = 180;
  const svgHeight = 250;
  const bottomY = topPadding + chartHeight;
  const steps = Math.max(revenueData.length - 1, 1);
  const viewWidth = measuredWidth;
  const plotWidth = Math.max(1, viewWidth - leftPadding - rightPadding);
  const minLabelGap = maxLabelLength > 8 ? 88 : 64;
  const maxLabelCount = Math.max(1, Math.floor(plotWidth / minLabelGap));
  const showLabelEvery = Math.max(1, Math.ceil(revenueData.length / maxLabelCount));
  const gridSteps = 4;
  const yStepValue = maxValue / gridSteps;

  const getX = (index: number) => leftPadding + (index / steps) * plotWidth;
  const getY = (value: number) => bottomY - (value / maxValue) * chartHeight;

  const formatShort = (amount: number) => {
    if (amount >= 1_000_000_000)
      return (amount / 1_000_000_000).toFixed(amount % 1_000_000_000 === 0 ? 0 : 1) + "t";
    if (amount >= 1_000_000)
      return (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1) + "tr";
    if (amount >= 1_000)
      return (amount / 1_000).toFixed(0) + "k";
    return Math.round(amount).toString();
  };

  const formatPointValue = (amount: number) => {
    if (amount >= 1_000_000) {
      const v = amount / 1_000_000;
      return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}tr`;
    }
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
    return amount.toLocaleString("vi-VN");
  };

  const buildLinePath = () => {
    if (revenueData.length < 2) {
      const x = getX(0);
      const y = getY(revenueData[0]?.value ?? 0);
      return `M ${x} ${y}`;
    }
    const points = revenueData.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const buildAreaPath = () => {
    const linePath = buildLinePath();
    const lastX = getX(revenueData.length - 1);
    const firstX = getX(0);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const linePath = buildLinePath();
  const areaPath = buildAreaPath();

  return (
    <div className="rc-container">
      <div className="rc-header">
        <div>
          <h3 className="rc-title">{title}</h3>
          <p className="rc-subtitle">{subtitle ?? "Xu hướng doanh thu"}</p>
        </div>
        <div className="rc-total">
          <p className="rc-total-value">{formatVND(totalRevenue)}</p>
          <p className="rc-total-label">TỔNG KỲ</p>
        </div>
      </div>

      <div ref={chartRef} className="rc-chart-area">
        {!hasData && (
          <div className="rc-empty-overlay">
            <div className="rc-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path
                  d="M6 36L18 24L26 32L42 12"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                />
                <circle cx="42" cy="12" r="3" fill="var(--primary)" opacity="0.3" />
              </svg>
            </div>
            <p className="rc-empty-text">Chưa có dữ liệu doanh thu</p>
          </div>
        )}

        <svg className="rc-svg" viewBox={`0 0 ${viewWidth} ${svgHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="rcGradientFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.20" />
              <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rcGradientStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="#FF5633" />
            </linearGradient>
            <filter id="rcGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {Array.from({ length: gridSteps + 1 }).map((_, i) => {
            const y = topPadding + (i / gridSteps) * chartHeight;
            return (
              <line key={i} x1={leftPadding} y1={y} x2={viewWidth - rightPadding} y2={y}
                stroke="var(--text-muted)" strokeWidth="0.5" strokeDasharray="6 4" opacity="0.15" />
            );
          })}

          {Array.from({ length: gridSteps + 1 }).map((_, i) => {
            const y = topPadding + (i / gridSteps) * chartHeight;
            const value = maxValue - i * yStepValue;
            return (
              <text key={i} x={leftPadding - 10} y={y + 4} fill="var(--text-muted)"
                fontSize="10" textAnchor="end" fontFamily="Inter, sans-serif">
                {formatShort(Math.round(value))}
              </text>
            );
          })}

          <path d={areaPath} fill="url(#rcGradientFill)" />
          <path d={linePath} fill="none" stroke="url(#rcGradientStroke)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" filter={hasData ? "url(#rcGlow)" : undefined} />

          {revenueData.map((_, i) => {
            const x = getX(i);
            const colWidth = plotWidth / Math.max(revenueData.length, 1);
            return (
              <rect key={`hover-${i}`} x={x - colWidth / 2} y={topPadding} width={colWidth}
                height={chartHeight} fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "crosshair" }} />
            );
          })}

          {revenueData.map((d, i) => {
            const x = getX(i);
            const y = getY(d.value);
            const isHovered = hoveredIndex === i;
            const showLabel = isHovered || revenueData.length <= 7;
            return (
              <g key={i}>
                {isHovered && (
                  <line x1={x} y1={topPadding} x2={x} y2={bottomY}
                    stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
                )}
                {showLabel && d.value > 0 && (
                  <text x={x} y={Math.max(16, y - 14)}
                    fill={isHovered ? "var(--primary)" : "var(--text-muted)"}
                    fontSize={isHovered ? "12" : "10"} textAnchor="middle"
                    fontWeight="700" fontFamily="Inter, sans-serif">
                    {formatPointValue(d.value)}
                  </text>
                )}
                <circle cx={x} cy={y} r={isHovered ? 8 : 5} fill="var(--primary)" opacity={isHovered ? 0.15 : 0.08} />
                <circle cx={x} cy={y} r={isHovered ? 5 : 3.5} fill="var(--primary)" stroke="var(--bg-base)" strokeWidth="2" />
                <circle cx={x} cy={y} r={isHovered ? 2 : 1.5} fill="#fff" />
              </g>
            );
          })}

          {revenueData.map((d, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <text key={i} x={getX(i)} y={svgHeight - 8}
                fill={isHovered ? "var(--primary)" : "var(--text-muted)"}
                fontSize={xAxisFontSize}
                textAnchor={i === 0 ? "start" : i === revenueData.length - 1 ? "end" : "middle"}
                fontWeight={isHovered ? "700" : "500"} fontFamily="Inter, sans-serif">
                {i % showLabelEvery === 0 || i === revenueData.length - 1 ? d.label : ""}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
