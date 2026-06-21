import React, { useEffect, useCallback, useRef } from "react";
import { Tooltip } from "antd";

type TableStatus = "AVAILABLE" | "OCCUPIED" | "DISABLED" | "SELECTED" | "RESERVED";

export interface TableData {
  id: string;
  tenantId: string;
  name: string;
  seats: number;
  status: TableStatus;
  area: string;
  position: { x: number; y: number };
  shape: "Circle" | "Rectangle" | "Square" | "Oval";
  width: number;
  height: number;
  rotation: number;
  zoneId?: string;
}

interface DraggableTableProps {
  table: TableData;
  onDragEnd: (tableId: string, newPosition: { x: number; y: number }) => void;
  onClick: (table: TableData) => void;
  onResize?: (tableId: string, size: { width: number; height: number }) => void;
  draggable?: boolean;
  renderContent?: (table: TableData) => React.ReactNode;
  scale?: number;
  reduceEffects?: boolean;
  isFlashing?: boolean;
}

const STATUS_CONFIG = {
  AVAILABLE: {
    stroke: "#52c41a",
    fill: "rgba(82, 196, 26, 0.13)",
    text: "#52c41a",
  },
  OCCUPIED: {
    stroke: "#ff4d4f",
    fill: "rgba(255, 77, 79, 0.14)",
    text: "#ff4d4f",
  },
  DISABLED: {
    stroke: "#bfbfbf",
    fill: "rgba(150, 150, 150, 0.08)",
    text: "#8c8c8c",
  },
  RESERVED: {
    stroke: "#faad14",
    fill: "rgba(250, 173, 20, 0.13)",
    text: "#d48806",
  },
  SELECTED: {
    stroke: "var(--primary)",
    fill: "var(--primary-soft, rgba(255, 90, 44, 0.10))",
    text: "var(--primary)",
  },
};

const Chair: React.FC<{ style: React.CSSProperties }> = ({ style }) => {
  return (
    <div
      style={{
        position: "absolute",
        width: 18,
        height: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.12))",
        zIndex: 2,
        ...style
      }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cushion / Seat */}
        <rect x="2" y="5" width="16" height="13" rx="3.5" fill="#dfdbd6" stroke="#8c8c8c" strokeWidth="1.5" />
        {/* Backrest - curved bar at the top */}
        <path d="M 2 6 C 2 3, 18 3, 18 6" stroke="#737373" strokeWidth="2.5" strokeLinecap="round" />
        {/* Little space line between seat and backrest */}
        <line x1="4" y1="7" x2="16" y2="7" stroke="#b5b0aa" strokeWidth="1" />
      </svg>
    </div>
  );
};

export const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  onDragEnd,
  onClick,
  onResize,
  draggable = true,
  renderContent,
  scale = 1,
  reduceEffects = false,
  isFlashing = false,
}) => {
  const isDeco = table.name.startsWith("DECO_");
  const statusStyle = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const didDragRef = useRef(false);

  // STRICT DEFAULTS
  const width = table.width ?? 100;
  const height = table.height ?? 100;
  const shape = table.shape;
  const rotation = table.rotation ?? 0;

  // ── Live drag position (for smooth dragging without re-render) ──
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, tableX: 0, tableY: 0 });

  // ── Resize: local size state for live preview during resize ──
  const [localSize, setLocalSize] = React.useState({ width, height });
  useEffect(() => {
    setLocalSize({ width, height });
  }, [width, height]);

  // ── DRAG via pointer events ──
  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (!draggable || isResizing) return;
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      tableX: table.position.x,
      tableY: table.position.y,
    };

    const s = scale || 1;
    const handleMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - dragStartRef.current.mouseX) / s;
      const dy = (ev.clientY - dragStartRef.current.mouseY) / s;

      if (!didDragRef.current && (Math.abs(ev.clientX - dragStartRef.current.mouseX) + Math.abs(ev.clientY - dragStartRef.current.mouseY)) > 3) {
        didDragRef.current = true;
        setIsDragging(true);
      }

      if (didDragRef.current) {
        setDragOffset({ x: dx, y: dy });
      }
    };

    const handleUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setIsDragging(false);

      if (didDragRef.current) {
        const s = scale || 1;
        const dx = (ev.clientX - dragStartRef.current.mouseX) / s;
        const dy = (ev.clientY - dragStartRef.current.mouseY) / s;
        const newX = Math.max(0, Math.round(dragStartRef.current.tableX + dx));
        const newY = Math.max(0, Math.round(dragStartRef.current.tableY + dy));
        onDragEnd(table.id, { x: newX, y: newY });
      }

      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [draggable, isResizing, table.position.x, table.position.y, table.id, onDragEnd, scale]);

  // ── RESIZE via pointer events ──
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!draggable || !onResize) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = width;
    const startH = height;

    const s = scale || 1;
    const handleMove = (ev: PointerEvent) => {
      const newW = Math.max(40, Math.round(startW + (ev.clientX - startX) / s));
      const newH = Math.max(40, Math.round(startH + (ev.clientY - startY) / s));
      setLocalSize({ width: newW, height: newH });
    };

    const handleUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setIsResizing(false);
      const finalW = Math.max(40, Math.round(startW + (ev.clientX - startX) / s));
      const finalH = Math.max(40, Math.round(startH + (ev.clientY - startY) / s));
      onResize!(table.id, { width: finalW, height: finalH });
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [draggable, onResize, width, height, table.id, scale]);

  const displayW = isResizing ? localSize.width : width;
  const displayH = isResizing ? localSize.height : height;
  const displayX = table.position.x + (isDragging ? dragOffset.x : 0);
  const displayY = table.position.y + (isDragging ? dragOffset.y : 0);

  const handleClick = useCallback(() => {
    if (!didDragRef.current && !isResizing) {
      onClick(table);
    }
  }, [onClick, table, isResizing]);

  const STATUS_LABEL: Record<string, string> = {
    AVAILABLE: "Trống",
    OCCUPIED: "Đang phục vụ",
    RESERVED: "Đặt trước",
    DISABLED: "Không sử dụng",
    SELECTED: "Đã chọn",
  };

  const tooltipTitle = !draggable && !isDeco ? (
    <div style={{ fontSize: 12, lineHeight: 1.7 }}>
      <div><strong>Bàn {table.name}</strong></div>
      <div style={{ color: "rgba(255,255,255,0.75)" }}>{table.seats} chỗ ngồi</div>
      <div style={{ color: statusStyle.stroke }}>● {STATUS_LABEL[table.status] ?? table.status}</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 }}>Click để xem chi tiết</div>
    </div>
  ) : undefined;

  // ── Render SVG for decorations ──
  const renderDecoration = () => {
    const isPlant = table.name.startsWith("DECO_PLANT") || table.name.toLowerCase().includes("plant") || table.name.toLowerCase().includes("cây");
    const isWall = table.name.startsWith("DECO_WALL") || table.name.toLowerCase().includes("wall") || table.name.toLowerCase().includes("tường");
    const isReception = table.name.startsWith("DECO_RECEPTION") || table.name.toLowerCase().includes("reception") || table.name.toLowerCase().includes("lễ tân");
    const isWindow = table.name.startsWith("DECO_WINDOW") || table.name.toLowerCase().includes("window") || table.name.toLowerCase().includes("cửa sổ");
    const isDoor = table.name.startsWith("DECO_DOOR") || table.name.toLowerCase().includes("door") || table.name.toLowerCase().includes("cửa ra vào");
    const isBar = table.name.startsWith("DECO_BAR") || table.name.toLowerCase().includes("_bar") || table.name.toLowerCase().includes("quầy bar");
    const isStairs = table.name.startsWith("DECO_STAIRS") || table.name.toLowerCase().includes("stairs") || table.name.toLowerCase().includes("cầu thang");

    const borderStyle = table.status === "SELECTED" ? "2px solid var(--primary)" : "none";
    const borderRadius = isPlant ? "50%" : "4px";

    if (isPlant) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, borderRadius, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="leafGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#1b4332" />
                <stop offset="50%" stopColor="#2d6a4f" />
                <stop offset="100%" stopColor="#40916c" />
              </linearGradient>
              <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#2d6a4f" />
                <stop offset="70%" stopColor="#52b788" />
                <stop offset="100%" stopColor="#74c69d" />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.25"/>
              </filter>
            </defs>

            {/* Outer Pot Shadow / Rim */}
            <circle cx="50" cy="50" r="16" fill="#78350f" opacity="0.15" />

            {/* Background leaves (darker/longer) radiating outwards */}
            <g filter="url(#shadow)">
              <g transform="rotate(0 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
              <g transform="rotate(45 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
              <g transform="rotate(90 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
              <g transform="rotate(135 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
              <g transform="rotate(180 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
              <g transform="rotate(225 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
              <g transform="rotate(270 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
              <g transform="rotate(315 50 50)">
                <path d="M 50 50 C 40 35 44 12 50 5 C 56 12 60 35 50 50" fill="url(#leafGrad1)" />
              </g>
            </g>

            {/* Foreground leaves (lighter/shorter/slightly offset angles to fill gaps) */}
            <g filter="url(#shadow)">
              <g transform="rotate(22.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
              <g transform="rotate(67.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
              <g transform="rotate(112.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
              <g transform="rotate(157.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
              <g transform="rotate(202.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
              <g transform="rotate(247.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
              <g transform="rotate(292.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
              <g transform="rotate(337.5 50 50)">
                <path d="M 50 50 C 42 38 45 20 50 12 C 55 20 58 38 50 50" fill="url(#leafGrad2)" />
              </g>
            </g>

            {/* Pot in the center */}
            <circle cx="50" cy="50" r="18" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="15" fill="#a16207" />
            <circle cx="50" cy="50" r="13" fill="#451a03" />

            {/* Center sprout / new leaf buds */}
            <circle cx="50" cy="50" r="4.5" fill="#a7f3d0" />
          </svg>
        </div>
      );
    }

    if (isWall) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <linearGradient id="woodFrameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <linearGradient id="glassPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.25)" />
                <stop offset="100%" stopColor="rgba(147, 197, 253, 0.15)" />
              </linearGradient>
            </defs>
            {/* Base Glass Background (glassmorphic screen) */}
            <rect x="5" y="15" width="90" height="70" fill="url(#glassPanelGrad)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
            
            {/* Wooden posts / vertical slats */}
            <rect x="15" y="10" width="6" height="80" fill="url(#woodFrameGrad)" rx="1" />
            <rect x="35" y="10" width="6" height="80" fill="url(#woodFrameGrad)" rx="1" />
            <rect x="55" y="10" width="6" height="80" fill="url(#woodFrameGrad)" rx="1" />
            <rect x="75" y="10" width="6" height="80" fill="url(#woodFrameGrad)" rx="1" />

            {/* Horizontal wood top/bottom tracks */}
            <rect x="0" y="5" width="100" height="10" fill="url(#woodFrameGrad)" rx="1" />
            <rect x="0" y="85" width="100" height="10" fill="url(#woodFrameGrad)" rx="1" />
            
            {/* Heavy end-cap pillars */}
            <rect x="0" y="0" width="10" height="100" fill="#451a03" rx="1.5" />
            <rect x="90" y="0" width="10" height="100" fill="#451a03" rx="1.5" />
          </svg>
        </div>
      );
    }

    if (isReception) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, borderRadius, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 120 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Marble counter top texture gradient */}
              <linearGradient id="marbleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#f1f5f9" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#f8fafc" />
              </linearGradient>
              <linearGradient id="woodFrontGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
            
            {/* 1. Receptionist Chair (behind the desk) */}
            <path d="M 60 15 C 48 15, 48 0, 60 0 C 72 0, 72 15, 60 15" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="52" y="10" width="16" height="12" rx="3" fill="#475569" stroke="#1e293b" strokeWidth="1" />
            
            {/* 2. Main Desk body */}
            <rect x="10" y="25" width="100" height="48" rx="6" fill="url(#woodFrontGrad)" stroke="#451a03" strokeWidth="2.5" />
            
            {/* 3. Counter Ledge (client side) */}
            <rect x="5" y="60" width="110" height="18" rx="4" fill="url(#marbleGrad)" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* 4. Desktop Items */}
            {/* Leather desk pad */}
            <rect x="35" y="28" width="50" height="26" rx="2" fill="#1e293b" opacity="0.8" />
            
            {/* Keyboard */}
            <rect x="50" y="46" width="20" height="6" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
            
            {/* Monitor screen */}
            <rect x="48" y="36" width="24" height="3" fill="#0f172a" />
            <rect x="42" y="32" width="36" height="4" rx="1" fill="#475569" />
            
            {/* Guest sign-in book */}
            <rect x="20" y="32" width="10" height="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="25" y1="32" x2="25" y2="44" stroke="#94a3b8" strokeWidth="0.5" />
            
            {/* Gold service bell */}
            <circle cx="95" cy="38" r="3.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="95" cy="38" r="1" fill="#fef08a" />
            
            {/* Text label */}
            <text x="50%" y="87" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">RECEPTION</text>
          </svg>
        </div>
      );
    }

    if (isWindow) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 120 40" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {/* Wall section */}
            <rect width="120" height="40" fill="#3d2010" />
            {/* Window opening */}
            <rect x="6" y="4" width="108" height="32" fill="url(#glassGrad)" stroke="#5c3318" strokeWidth="2" rx="1" />
            {/* Mullion cross */}
            <line x1="60" y1="4" x2="60" y2="36" stroke="#5c3318" strokeWidth="3" />
            <line x1="6" y1="20" x2="114" y2="20" stroke="#5c3318" strokeWidth="3" />
            {/* Glass highlights */}
            <rect x="9" y="7" width="48" height="10" fill="rgba(255,255,255,0.3)" rx="1" />
            <rect x="63" y="7" width="48" height="10" fill="rgba(255,255,255,0.3)" rx="1" />
            {/* Sill */}
            <rect x="2" y="35" width="116" height="5" fill="#6b3a1f" rx="1" />
          </svg>
        </div>
      );
    }

    if (isDoor) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 80 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="doorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
            {/* Door frame (wall segment) */}
            <rect x="0" y="0" width="80" height="14" fill="#3d2010" />
            {/* Swing arc (dashed quarter circle) */}
            <path d="M 48 14 A 40 40 0 0 1 8 54" fill="rgba(147,197,253,0.15)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5 3" />
            {/* Door panel */}
            <rect x="8" y="14" width="40" height="64" fill="url(#doorGrad)" stroke="#451a03" strokeWidth="2" rx="1" />
            {/* Panel recesses */}
            <rect x="12" y="18" width="32" height="26" fill="rgba(0,0,0,0.15)" rx="2" />
            <rect x="12" y="48" width="32" height="24" fill="rgba(0,0,0,0.15)" rx="2" />
            {/* Door handle */}
            <circle cx="44" cy="46" r="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            <line x1="44" y1="46" x2="48" y2="46" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    if (isBar) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 130 85" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="barTopGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1c1917" />
                <stop offset="50%" stopColor="#292524" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
              <linearGradient id="barFrontGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
            {/* Backwall / shelving */}
            <rect x="10" y="0" width="110" height="16" fill="#1c1917" rx="1" />
            {/* Bottles on shelf */}
            {[16, 26, 35, 44, 53, 62, 71, 80, 89, 98, 107].map((x, i) => (
              <rect key={i} x={x} y={2} width={5} height={12} rx="1.5"
                fill={["#7c3aed","#0369a1","#065f46","#c2410c","#92400e","#1d4ed8","#047857","#7e1d1d","#1e3a5f","#78350f","#3b0764"][i]}
                opacity="0.85" />
            ))}
            {/* Bar counter body */}
            <rect x="8" y="22" width="114" height="38" rx="3" fill="url(#barFrontGrad)" stroke="#451a03" strokeWidth="2" />
            {/* Counter top (granite/dark marble) */}
            <rect x="5" y="17" width="120" height="12" rx="3" fill="url(#barTopGrad)" stroke="#0c0a09" strokeWidth="1.5" />
            {/* Counter edge highlight */}
            <rect x="6" y="17" width="118" height="2" rx="1" fill="rgba(255,255,255,0.08)" />
            {/* BAR label on counter */}
            <text x="65" y="44" textAnchor="middle" fill="#f5f5f4" fontSize="9" fontWeight="800" fontFamily="sans-serif" letterSpacing="2">BAR</text>
            {/* Bar stools */}
            {[18, 38, 58, 78, 98, 118].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={74} r={7} fill="#44403c" stroke="#292524" strokeWidth="1.5" />
                <line x1={x} y1={67} x2={x} y2={61} stroke="#292524" strokeWidth="2.5" />
              </g>
            ))}
          </svg>
        </div>
      );
    }

    if (isStairs) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 80 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="stepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4b896" />
                <stop offset="100%" stopColor="#b89d82" />
              </linearGradient>
            </defs>
            {/* Base area */}
            <rect x="4" y="4" width="72" height="72" fill="#c4a882" stroke="#8c735a" strokeWidth="1.5" rx="2" />
            {/* Stair steps — each step is slightly inset */}
            <rect x="4" y="4"  width="72" height="8" fill="#a08060" stroke="#8c735a" strokeWidth="0.8" />
            <rect x="4" y="12" width="63" height="8" fill="url(#stepGrad)" stroke="#8c735a" strokeWidth="0.8" />
            <rect x="4" y="20" width="54" height="8" fill="#a08060" stroke="#8c735a" strokeWidth="0.8" />
            <rect x="4" y="28" width="45" height="8" fill="url(#stepGrad)" stroke="#8c735a" strokeWidth="0.8" />
            <rect x="4" y="36" width="36" height="8" fill="#a08060" stroke="#8c735a" strokeWidth="0.8" />
            <rect x="4" y="44" width="27" height="8" fill="url(#stepGrad)" stroke="#8c735a" strokeWidth="0.8" />
            <rect x="4" y="52" width="18" height="8" fill="#a08060" stroke="#8c735a" strokeWidth="0.8" />
            <rect x="4" y="60" width="9"  height="8" fill="url(#stepGrad)" stroke="#8c735a" strokeWidth="0.8" />
            {/* Direction arrow */}
            <path d="M 52 36 L 70 44 L 52 52" fill="none" stroke="#3d2010" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* UP label */}
            <text x="56" y="74" textAnchor="middle" fill="#3d2010" fontSize="7" fontWeight="700" fontFamily="sans-serif">UP</text>
          </svg>
        </div>
      );
    }

    // Generic decoration
    return (
      <div style={{ width: "100%", height: "100%", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 10 }}>
        {table.name.replace("DECO_", "")}
      </div>
    );
  };

  // ── Render chairs dynamically around tables ──
  const renderChairs = () => {
    if (isDeco) return null;
    const chairs = [];
    const N = table.seats;

    if (shape === "Circle" || shape === "Oval") {
      // Radial distribution
      for (let i = 0; i < N; i++) {
        const angle = (2 * Math.PI / N) * i - Math.PI / 2;
        const angleDeg = (angle * 180 / Math.PI) + 90;
        const rx = displayW / 2 + 7;
        const ry = displayH / 2 + 7;
        const cx = displayW / 2 + Math.cos(angle) * rx - 9;
        const cy = displayH / 2 + Math.sin(angle) * ry - 9;

        chairs.push(
          <Chair
            key={i}
            style={{
              left: cx,
              top: cy,
              transform: `rotate(${angleDeg}deg)`,
            }}
          />
        );
      }
    } else {
      // Square / Rectangle edge distribution
      if (N <= 2) {
        // Left & Right
        chairs.push(
          <Chair key={0} style={{ left: -15, top: displayH / 2 - 9, transform: "rotate(-90deg)" }} />,
          <Chair key={1} style={{ right: -15, top: displayH / 2 - 9, transform: "rotate(90deg)" }} />
        );
      } else if (N <= 4) {
        // One on each of 4 sides
        chairs.push(
          <Chair key={0} style={{ top: -15, left: displayW / 2 - 9, transform: "rotate(0deg)" }} />,
          <Chair key={1} style={{ bottom: -15, left: displayW / 2 - 9, transform: "rotate(180deg)" }} />,
          <Chair key={2} style={{ left: -15, top: displayH / 2 - 9, transform: "rotate(-90deg)" }} />,
          <Chair key={3} style={{ right: -15, top: displayH / 2 - 9, transform: "rotate(90deg)" }} />
        );
      } else if (N <= 6) {
        // 2 on top, 2 on bottom, 1 on left, 1 on right
        chairs.push(
          <Chair key={0} style={{ top: -15, left: displayW * 0.3 - 9, transform: "rotate(0deg)" }} />,
          <Chair key={1} style={{ top: -15, left: displayW * 0.7 - 9, transform: "rotate(0deg)" }} />,
          <Chair key={2} style={{ bottom: -15, left: displayW * 0.3 - 9, transform: "rotate(180deg)" }} />,
          <Chair key={3} style={{ bottom: -15, left: displayW * 0.7 - 9, transform: "rotate(180deg)" }} />,
          <Chair key={4} style={{ left: -15, top: displayH / 2 - 9, transform: "rotate(-90deg)" }} />,
          <Chair key={5} style={{ right: -15, top: displayH / 2 - 9, transform: "rotate(90deg)" }} />
        );
      } else {
        // 2 on all four sides
        chairs.push(
          <Chair key={0} style={{ top: -15, left: displayW * 0.3 - 9, transform: "rotate(0deg)" }} />,
          <Chair key={1} style={{ top: -15, left: displayW * 0.7 - 9, transform: "rotate(0deg)" }} />,
          <Chair key={2} style={{ bottom: -15, left: displayW * 0.3 - 9, transform: "rotate(180deg)" }} />,
          <Chair key={3} style={{ bottom: -15, left: displayW * 0.7 - 9, transform: "rotate(180deg)" }} />,
          <Chair key={4} style={{ left: -15, top: displayH * 0.3 - 9, transform: "rotate(-90deg)" }} />,
          <Chair key={5} style={{ left: -15, top: displayH * 0.7 - 9, transform: "rotate(-90deg)" }} />,
          <Chair key={6} style={{ right: -15, top: displayH * 0.3 - 9, transform: "rotate(90deg)" }} />,
          <Chair key={7} style={{ right: -15, top: displayH * 0.7 - 9, transform: "rotate(90deg)" }} />
        );
      }
    }

    return chairs;
  };

  const getShapeStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "100%",
      height: "100%",
      border: `2.5px solid ${statusStyle.stroke}`,
      backgroundColor: statusStyle.fill,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      boxShadow: reduceEffects
        ? "none"
        : (isDragging ? "0 8px 16px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.05)"),
      transition: reduceEffects || isDragging ? "none" : "box-shadow 0.2s",
    };

    if (shape === "Circle") base.borderRadius = "50%";
    else if (shape === "Oval") base.borderRadius = "50%";
    else if (shape === "Square") base.borderRadius = "6px";
    else if (shape === "Rectangle") base.borderRadius = "6px";
    else base.borderRadius = "6px";

    return base;
  };

  return (
    <Tooltip title={tooltipTitle} placement="top" mouseEnterDelay={0.4} destroyOnHidden>
    <div
      data-table-node="true"
      data-table-id={table.id}
      onPointerDown={handleDragPointerDown}
      onClick={handleClick}
      style={{
        position: "absolute",
        left: displayX,
        top: displayY,
        width: displayW,
        height: displayH,
        transform: `rotate(${rotation}deg)`,
        zIndex: isDragging || isResizing ? 10 : 1,
        cursor: draggable
          ? isDragging ? "grabbing" : "grab"
          : "pointer",
        userSelect: "none",
        transition: isDragging ? "none" : "left 0.15s ease, top 0.15s ease",
        opacity: isDragging ? 0.9 : 1,
        touchAction: draggable ? "none" : "auto",
      }}
    >
      {/* Flash glow overlay for newly added tables/items (3 pulses) */}
      {isFlashing && (
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 20,
            animation: "tableFlashGlow 0.6s ease-in-out 3",
            border: "3px solid rgba(255, 210, 50, 0.9)",
            boxShadow: "0 0 0 4px rgba(255, 200, 50, 0.6), 0 0 24px 10px rgba(255, 200, 50, 0.4)",
          }}
        />
      )}
      {isDeco ? (
        renderDecoration()
      ) : (
        <>
          {renderChairs()}
          <div style={getShapeStyle()}>
            {/* Table Label */}
            <div
              style={{
                fontSize: Math.min(displayW, displayH) / 3.8,
                fontWeight: 800,
                color: statusStyle.text,
                textAlign: "center",
                lineHeight: 1.1,
              }}>
              {table.name}
            </div>

            {/* Seats Count Small */}
            <div style={{ fontSize: 9, fontWeight: 600, color: statusStyle.text, marginTop: 2, opacity: 0.85 }}>
              {table.seats} seats
            </div>

            {/* Size indicator during resize */}
            {isResizing && (
              <div style={{ fontSize: 8, color: statusStyle.text, marginTop: 2, opacity: 0.6 }}>
                {displayW}×{displayH}
              </div>
            )}

            {renderContent?.(table)}
          </div>
        </>
      )}

      {/* ─── Resize Handle ─── */}
      {draggable && onResize && (
        <div
          onPointerDown={handleResizePointerDown}
          style={{
            position: "absolute",
            right: -4,
            bottom: -4,
            width: 12,
            height: 12,
            cursor: "nwse-resize",
            background: statusStyle.stroke,
            borderRadius: 3,
            border: "1.5px solid white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            zIndex: 10,
            touchAction: "none",
            opacity: 0.9,
          }}
        />
      )}
    </div>
    </Tooltip>
  );
};
