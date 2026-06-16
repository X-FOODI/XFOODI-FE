"use client";

import React, { useEffect, useCallback, useRef } from "react";

export interface DraggableTableData {
  id: string;
  code: string;
  seatingCapacity: number;
  type: string; // 'Normal' | 'VIP'
  shape: string; // 'Square' | 'Round' | 'Rectangle'
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  status: string; // 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

interface DraggableTableProps {
  table: DraggableTableData;
  isSelected: boolean;
  draggable: boolean;
  scale: number;
  onDragEnd: (tableId: string, position: { x: number; y: number }) => void;
  onResize: (tableId: string, size: { width: number; height: number }) => void;
  onClick: (tableId: string) => void;
}

export const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  isSelected,
  draggable,
  scale,
  onDragEnd,
  onResize,
  onClick,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const didDragRef = useRef(false);

  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, tableX: 0, tableY: 0 });

  const [localSize, setLocalSize] = React.useState({ width: table.width, height: table.height });
  useEffect(() => {
    setLocalSize({ width: table.width, height: table.height });
  }, [table.width, table.height]);

  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!draggable || isResizing) return;
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();
      didDragRef.current = false;

      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        tableX: table.positionX,
        tableY: table.positionY,
      };

      const s = scale || 1;
      const handleMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - dragStartRef.current.mouseX) / s;
        const dy = (ev.clientY - dragStartRef.current.mouseY) / s;

        if (
          !didDragRef.current &&
          Math.abs(ev.clientX - dragStartRef.current.mouseX) + Math.abs(ev.clientY - dragStartRef.current.mouseY) > 3
        ) {
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
    },
    [draggable, isResizing, table.positionX, table.positionY, table.id, onDragEnd, scale]
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!draggable) return;
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = table.width;
      const startH = table.height;
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
        onResize(table.id, { width: finalW, height: finalH });
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [draggable, onResize, table.width, table.height, table.id, scale]
  );

  const handleClick = useCallback(() => {
    if (!didDragRef.current && !isResizing) {
      onClick(table.id);
    }
  }, [onClick, table.id, isResizing]);

  const displayW = isResizing ? localSize.width : table.width;
  const displayH = isResizing ? localSize.height : table.height;
  const displayX = table.positionX + (isDragging ? dragOffset.x : 0);
  const displayY = table.positionY + (isDragging ? dragOffset.y : 0);

  const isOccupied = table.status === "OCCUPIED";
  const isReserved = table.status === "RESERVED";
  const isVip = table.type === "VIP";

  let statusBg = "rgba(34, 197, 94, 0.1)";
  let statusBorder = "#22c55e";
  let glowShadow = "rgba(34, 197, 94, 0.2) 0px 0px 15px";

  if (isOccupied) {
    statusBg = "rgba(239, 68, 68, 0.1)";
    statusBorder = "#ef4444";
    glowShadow = "rgba(239, 68, 68, 0.3) 0px 0px 15px";
  } else if (isReserved) {
    statusBg = "rgba(245, 158, 11, 0.1)";
    statusBorder = "#f59e0b";
    glowShadow = "rgba(245, 158, 11, 0.3) 0px 0px 15px";
  }

  if (isSelected) {
    statusBorder = "#FF5A2C";
    glowShadow = "rgba(255, 90, 44, 0.6) 0px 0px 20px";
  }

  const shapeStyle: React.CSSProperties =
    table.shape === "Round" ? { borderRadius: "9999px" } : { borderRadius: "8px" };

  return (
    <div
      data-table-node="true"
      data-table-id={table.id}
      onPointerDown={handleDragPointerDown}
      onClick={handleClick}
      className={`absolute select-none flex flex-col items-center justify-center p-1 border-2 ${
        isSelected ? "z-20 scale-105" : "z-10"
      }`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${displayW}px`,
        height: `${displayH}px`,
        transform: `rotate(${table.rotation}deg)`,
        background: statusBg,
        borderColor: statusBorder,
        boxShadow: glowShadow,
        cursor: draggable ? (isDragging ? "grabbing" : "grab") : "pointer",
        transition: isDragging || isResizing ? "none" : "left 0.15s ease, top 0.15s ease",
        opacity: isDragging ? 0.9 : 1,
        touchAction: draggable ? "none" : "auto",
        ...shapeStyle,
      }}
    >
      {isVip && (
        <div className="absolute -top-3 text-[10px] bg-yellow-500 text-white font-black px-1 py-0.5 rounded leading-none">
          VIP
        </div>
      )}
      <span className="text-xs font-black text-gray-900 dark:text-white">{table.code}</span>
      <span className="text-[10px] text-gray-500 dark:text-gray-400">{table.seatingCapacity} chỗ</span>

      <span className="relative flex h-2 w-2 mt-1">
        {isOccupied && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isOccupied ? "bg-red-500" : isReserved ? "bg-yellow-500" : "bg-green-500"
          }`}
        ></span>
      </span>

      {isResizing && (
        <div className="absolute -bottom-5 text-[9px] text-gray-500 dark:text-gray-400">
          {displayW}×{displayH}
        </div>
      )}

      {draggable && (
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute"
          style={{
            right: -5,
            bottom: -5,
            width: 14,
            height: 14,
            cursor: "nwse-resize",
            background: statusBorder,
            borderRadius: 3,
            border: "2px solid white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            zIndex: 10,
            touchAction: "none",
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
};
