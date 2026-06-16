import React, { useEffect, useCallback, useRef } from "react";

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
}

const STATUS_CONFIG = {
  AVAILABLE: {
    stroke: "#52c41a",
    fill: "#f6ffed",
    text: "#52c41a",
  },
  OCCUPIED: {
    stroke: "#ff4d4f",
    fill: "#fff1f0",
    text: "#ff4d4f",
  },
  DISABLED: {
    stroke: "#d9d9d9",
    fill: "#f5f5f5",
    text: "#8c8c8c",
  },
  RESERVED: {
    stroke: "#faad14",
    fill: "#fffbe6",
    text: "#faad14",
  },
  SELECTED: {
    stroke: "var(--primary)",
    fill: "var(--primary-soft)",
    text: "var(--primary)",
  },
};

const Chair: React.FC<{ style: React.CSSProperties; stroke: string; fill: string }> = ({ style, stroke, fill }) => {
  return (
    <div
      style={{
        position: "absolute",
        width: 14,
        height: 12,
        borderRadius: "3px 3px 1px 1px",
        backgroundColor: fill,
        border: `1.5px solid ${stroke}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        ...style
      }}
    />
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

  // ── Render SVG for decorations ──
  const renderDecoration = () => {
    const isPlant = table.name.startsWith("DECO_PLANT") || table.name.toLowerCase().includes("plant") || table.name.toLowerCase().includes("cây");
    const isWall = table.name.startsWith("DECO_WALL") || table.name.toLowerCase().includes("wall") || table.name.toLowerCase().includes("tường");
    const isReception = table.name.startsWith("DECO_RECEPTION") || table.name.toLowerCase().includes("reception") || table.name.toLowerCase().includes("lễ tân");

    const borderStyle = table.status === "SELECTED" ? "2px solid var(--primary)" : "none";
    const borderRadius = isPlant ? "50%" : "4px";

    if (isPlant) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, borderRadius, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 100 100" width="90%" height="90%">
            {/* Potted Plant SVG */}
            <ellipse cx="50" cy="72" rx="18" ry="9" fill="#8d5b4c" />
            <path d="M35 72 L38 90 L62 90 L65 72 Z" fill="#704335" />
            <circle cx="50" cy="42" r="20" fill="#2d6a4f" opacity="0.95" />
            <circle cx="36" cy="46" r="16" fill="#40916c" opacity="0.9" />
            <circle cx="64" cy="46" r="16" fill="#1b4332" opacity="0.9" />
            <circle cx="50" cy="28" r="14" fill="#52b788" opacity="0.95" />
            <circle cx="44" cy="38" r="10" fill="#74c69d" opacity="0.8" />
          </svg>
        </div>
      );
    }

    if (isWall) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
            <rect x="0" y="35" width="100" height="30" rx="2" fill="var(--border)" stroke="#64748b" strokeWidth="1.5" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
          </svg>
        </div>
      );
    }

    if (isReception) {
      return (
        <div style={{ width: "100%", height: "100%", border: borderStyle, borderRadius, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 120 80" width="95%" height="95%">
            {/* Reception counter desk */}
            <rect x="10" y="15" width="100" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            {/* Glass Counter top */}
            <rect x="15" y="15" width="90" height="15" rx="3" fill="rgba(255, 255, 255, 0.1)" stroke="#475569" strokeWidth="1.5" />
            {/* Computer monitor */}
            <rect x="42" y="42" width="36" height="4" fill="#0f172a" />
            <rect x="46" y="38" width="28" height="4" fill="#cbd5e1" />
            <rect x="40" y="34" width="40" height="4" rx="1.5" fill="#475569" />
            {/* Keyboard */}
            <rect x="52" y="49" width="16" height="5" rx="1" fill="#64748b" />
            {/* Vase */}
            <circle cx="95" cy="40" r="4.5" fill="#e2e8f0" />
            <path d="M93 35 Q95 28 93 24 Q95 32 95 35 Z" fill="#10b981" />
            <path d="M97 35 Q95 28 97 24 Q95 32 95 35 Z" fill="#059669" />
            <text x="50%" y="74" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">RECEPTION</text>
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
        const rx = displayW / 2 + 6;
        const ry = displayH / 2 + 6;
        const cx = displayW / 2 + Math.cos(angle) * rx - 7;
        const cy = displayH / 2 + Math.sin(angle) * ry - 6;

        chairs.push(
          <Chair
            key={i}
            stroke={statusStyle.stroke}
            fill={statusStyle.fill}
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
          <Chair key={0} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ left: -11, top: displayH / 2 - 6, transform: "rotate(-90deg)" }} />,
          <Chair key={1} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ right: -11, top: displayH / 2 - 6, transform: "rotate(90deg)" }} />
        );
      } else if (N <= 4) {
        // One on each of 4 sides
        chairs.push(
          <Chair key={0} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ top: -11, left: displayW / 2 - 7, transform: "rotate(0deg)" }} />,
          <Chair key={1} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ bottom: -11, left: displayW / 2 - 7, transform: "rotate(180deg)" }} />,
          <Chair key={2} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ left: -11, top: displayH / 2 - 6, transform: "rotate(-90deg)" }} />,
          <Chair key={3} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ right: -11, top: displayH / 2 - 6, transform: "rotate(90deg)" }} />
        );
      } else if (N <= 6) {
        // 2 on top, 2 on bottom, 1 on left, 1 on right
        chairs.push(
          <Chair key={0} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ top: -11, left: displayW * 0.3 - 7, transform: "rotate(0deg)" }} />,
          <Chair key={1} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ top: -11, left: displayW * 0.7 - 7, transform: "rotate(0deg)" }} />,
          <Chair key={2} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ bottom: -11, left: displayW * 0.3 - 7, transform: "rotate(180deg)" }} />,
          <Chair key={3} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ bottom: -11, left: displayW * 0.7 - 7, transform: "rotate(180deg)" }} />,
          <Chair key={4} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ left: -11, top: displayH / 2 - 6, transform: "rotate(-90deg)" }} />,
          <Chair key={5} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ right: -11, top: displayH / 2 - 6, transform: "rotate(90deg)" }} />
        );
      } else {
        // 2 on all four sides
        chairs.push(
          <Chair key={0} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ top: -11, left: displayW * 0.3 - 7, transform: "rotate(0deg)" }} />,
          <Chair key={1} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ top: -11, left: displayW * 0.7 - 7, transform: "rotate(0deg)" }} />,
          <Chair key={2} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ bottom: -11, left: displayW * 0.3 - 7, transform: "rotate(180deg)" }} />,
          <Chair key={3} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ bottom: -11, left: displayW * 0.7 - 7, transform: "rotate(180deg)" }} />,
          <Chair key={4} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ left: -11, top: displayH * 0.3 - 6, transform: "rotate(-90deg)" }} />,
          <Chair key={5} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ left: -11, top: displayH * 0.7 - 6, transform: "rotate(-90deg)" }} />,
          <Chair key={6} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ right: -11, top: displayH * 0.3 - 6, transform: "rotate(90deg)" }} />,
          <Chair key={7} stroke={statusStyle.stroke} fill={statusStyle.fill} style={{ right: -11, top: displayH * 0.7 - 6, transform: "rotate(90deg)" }} />
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
  );
};
