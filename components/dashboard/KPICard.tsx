"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBg?: string;
  iconColor?: string;
  accentClass?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconBg = "rgba(59, 130, 246, 0.1)",
  iconColor = "#3b82f6",
  accentClass = "dashboard-kpi-card-primary",
}: KPICardProps) {
  return (
    <div
      className={`dashboard-kpi-card ${accentClass}`}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flex: 1,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}
        >
          <p className="dashboard-kpi-card-title">{title}</p>
          <p className="dashboard-kpi-card-value">{value}</p>
          <p className="dashboard-kpi-card-subtitle" style={{ minHeight: "1rem" }}>
            {subtitle || "\u00A0"}
          </p>
        </div>
        <div
          className="dashboard-kpi-card-icon"
          style={{ background: iconBg, color: iconColor, flexShrink: 0 }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          minHeight: "1.5rem",
          display: "flex",
          alignItems: "center",
          marginTop: "0.25rem",
        }}
      >
        {trend ? (
          <span
            className={`dashboard-kpi-card-trend ${
              trend.isPositive
                ? "dashboard-kpi-card-trend-up"
                : "dashboard-kpi-card-trend-down"
            }`}
          >
            <ArrowUp
              className={`w-3 h-3 transition-transform ${trend.isPositive ? "" : "rotate-180"}`}
              strokeWidth={2.5}
            />
            {Math.abs(trend.value)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
