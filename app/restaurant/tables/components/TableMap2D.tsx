"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DraggableTable, DraggableTableData } from "./DraggableTable";

interface FloorInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  imageUrl: string | null;
}

interface TableMap2DProps {
  floor: FloorInfo;
  tables: DraggableTableData[];
  selectedTableId: string | null;
  readOnly: boolean;
  onTableClick: (tableId: string) => void;
  onTablePositionChange: (tableId: string, position: { x: number; y: number }) => void;
  onTableResize: (tableId: string, size: { width: number; height: number }) => void;
  onBackgroundImageUpload?: (floorId: string, file: File) => void;
}

const MIN_ZOOM_SCALE = 0.5;
const MAX_ZOOM_SCALE = 2.5;

export const TableMap2D: React.FC<TableMap2DProps> = ({
  floor,
  tables,
  selectedTableId,
  readOnly,
  onTableClick,
  onTablePositionChange,
  onTableResize,
  onBackgroundImageUpload,
}) => {
  const { t } = useTranslation();
  const [showGrid, setShowGrid] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const panStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const panStartScrollRef = useRef<{ left: number; top: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Pan the canvas only when not editing (so edit mode drag doesn't fight with pan)
  const canPan = readOnly;

  useEffect(() => {
    setZoomScale(1);
  }, [floor.id]);

  const clampZoom = useCallback((next: number) => Math.min(MAX_ZOOM_SCALE, Math.max(MIN_ZOOM_SCALE, next)), []);

  const handleZoomIn = () => setZoomScale((z) => clampZoom(z + 0.2));
  const handleZoomOut = () => setZoomScale((z) => clampZoom(z - 0.2));
  const handleZoomReset = () => setZoomScale(1);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoomScale((z) => clampZoom(z + (event.deltaY < 0 ? 0.08 : -0.08)));
    },
    [clampZoom]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan || !containerRef.current) return;
    const targetElement = e.target as HTMLElement | null;
    if (targetElement?.closest('[data-table-node="true"]')) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    panStartPointRef.current = { x: e.clientX, y: e.clientY };
    panStartScrollRef.current = { left: containerRef.current.scrollLeft, top: containerRef.current.scrollTop };
    setIsPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan || !isPanning || !containerRef.current) return;
    if (!panStartPointRef.current || !panStartScrollRef.current) return;

    const deltaX = e.clientX - panStartPointRef.current.x;
    const deltaY = e.clientY - panStartPointRef.current.y;
    containerRef.current.scrollLeft = panStartScrollRef.current.left - deltaX;
    containerRef.current.scrollTop = panStartScrollRef.current.top - deltaY;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    panStartPointRef.current = null;
    panStartScrollRef.current = null;
    setIsPanning(false);
  };

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onBackgroundImageUpload) {
      onBackgroundImageUpload(floor.id, file);
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3 flex-1 w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1 rounded-md border p-1" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={handleZoomOut} className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white" aria-label={t("staff.tables.map_controls.zoom_out", { defaultValue: "Zoom out" })}>
            -
          </button>
          <span className="min-w-[48px] px-1 text-center text-xs tabular-nums text-gray-500">{Math.round(zoomScale * 100)}%</span>
          <button type="button" onClick={handleZoomIn} className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white" aria-label={t("staff.tables.map_controls.zoom_in", { defaultValue: "Zoom in" })}>
            +
          </button>
          <button type="button" onClick={handleZoomReset} className="px-2 py-1 text-xs font-semibold text-[#FF5A2C]">
            {t("staff.tables.map_controls.zoom_fit", { defaultValue: "Fit" })}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {!readOnly && onBackgroundImageUpload && (
            <>
              <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/webp" onChange={handleBackgroundImageChange} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold text-[#FF5A2C] hover:underline">
                {t("staff.tables.map_controls.upload_floorplan", { defaultValue: "Upload floor plan" })}
              </button>
            </>
          )}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-[#FF5A2C]" />
            {t("staff.tables.map_controls.show_grid", { defaultValue: "Show grid" })}
          </label>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-auto bg-gray-50 dark:bg-[#0E131F] rounded-2xl border p-4"
        style={{
          borderColor: "var(--border)",
          minHeight: "500px",
          cursor: canPan ? (isPanning ? "grabbing" : "grab") : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        <div
          className="relative bg-white dark:bg-[#181F2E] rounded-xl shadow-md border overflow-hidden mx-auto"
          style={{
            width: `${floor.width * zoomScale}px`,
            height: `${floor.height * zoomScale}px`,
            borderColor: "var(--border)",
            transform: "translateZ(0)",
          }}
        >
          <div
            className="absolute top-0 left-0"
            style={{
              width: floor.width,
              height: floor.height,
              transform: `scale(${zoomScale})`,
              transformOrigin: "top left",
              backgroundImage: floor.imageUrl
                ? `url(${floor.imageUrl})`
                : showGrid
                ? "radial-gradient(var(--border) 1px, transparent 1px)"
                : undefined,
              backgroundSize: floor.imageUrl ? "contain" : "20px 20px",
              backgroundRepeat: floor.imageUrl ? "no-repeat" : undefined,
              backgroundPosition: "center",
            }}
          >
            <div className="absolute top-3 left-3 bg-black/5 dark:bg-white/5 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-gray-500 pointer-events-none">
              {floor.name} ({floor.width}px x {floor.height}px)
            </div>

            {tables.map((tableItem) => (
              <DraggableTable
                key={tableItem.id}
                table={tableItem}
                isSelected={selectedTableId === tableItem.id}
                draggable={!readOnly}
                scale={zoomScale}
                onDragEnd={onTablePositionChange}
                onResize={onTableResize}
                onClick={onTableClick}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <div>
          {t("staff.tables.map_controls.floor_dimensions", { defaultValue: "Floor size" })}: {floor.width}px × {floor.height}px
        </div>
        <div>
          {tables.length} {t("staff.tables.map_controls.tables_on_floor", { defaultValue: "tables" })}
        </div>
      </div>
    </div>
  );
};
