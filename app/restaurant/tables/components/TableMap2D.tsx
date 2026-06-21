"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Tooltip } from "antd";
import { DraggableTable, TableData } from "./DraggableTable";
import { useTranslation } from "react-i18next";
import { UploadCloud, ArrowRight } from "lucide-react";

export interface Floor {
  id: string;
  name: string;
  backgroundImage?: string;
  width: number;
  height: number;
  tables: TableData[];
}

export interface Layout {
  id: string;
  name: string;
  floors: Floor[];
  activeFloorId: string;
}

interface TableMap2DProps {
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
  onTableClick: (table: TableData) => void;
  onTablePositionChange: (
    tableId: string,
    position: { x: number; y: number; zoneId?: string },
  ) => void;
  onTableMerge?: (sourceTableId: string, targetTableId: string) => void;
  onTableResize?: (tableId: string, size: { width: number; height: number }) => void;
  onBackgroundImageUpload?: (floorId: string, file: File) => void;
  renderTableContent?: (table: TableData) => React.ReactNode;
  readOnly?: boolean;
  selectedTableIds?: string[];
  hideControls?: boolean;
  focusOnSelected?: boolean;
  onComponentDrop?: (item: any, position: { x: number; y: number }) => void;
  flashTableId?: string | null;
}

const WOOD_FLOOR_PATTERN = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0dGVybiBpZD0iaGVycmluZ2JvbmUiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+CiAgICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iODAiIGZpbGw9IiNiODlkODIiIHN0cm9rZT0iIzhjNzM1YSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KICAgIDxyZWN0IHg9IjIwIiB5PSI0MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjYTQ4YTcwIiBzdHJva2U9IiM4YzczNWEiIHN0cm9rZS13aWR0aD0iMC41Ii8+CiAgICA8cmVjdCB4PSI0MCIgeT0iMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjYzhhZDkzIiBzdHJva2U9IiM4YzczNWEiIHN0cm9rZS13aWR0aD0iMC41Ii8+CiAgICA8cmVjdCB4PSI2MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI4MCIgZmlsbD0iI2IwOTU3YiIgc3Ryb2tlPSIjOGM3MzVhIiBzdHJva2Utd2lkdGg9IjAuNSIvPgogIDwvcGF0dGVybj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2hlcnJpbmdib25lKSIvPgo8L3N2Zz4=";

/* ══════════════════════════════════════════════
   Main TableMap2D Component
   ══════════════════════════════════════════════ */
export const TableMap2D: React.FC<TableMap2DProps> = ({
  layout,
  onLayoutChange,
  onTableClick,
  onTablePositionChange,
  onTableMerge,
  onTableResize,
  onBackgroundImageUpload,
  renderTableContent,
  readOnly = false,
  selectedTableIds = [],
  hideControls = false,
  focusOnSelected = false,
  onComponentDrop,
  flashTableId = null,
}) => {
  const MIN_ZOOM_SCALE = 0.8;
  const MAX_ZOOM_SCALE = 2.8;
  const [showGrid, setShowGrid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const floorRef = useRef<HTMLDivElement>(null);
  const scaleWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const isManualZoomRef = useRef(false);
  const fitScaleRef = useRef(1);
  const zoomScaleRef = useRef(1);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);
  const isPinchingRef = useRef(false);
  const pinchFrameRef = useRef<number | null>(null);
  const pinchSampleRef = useRef<{ distance: number } | null>(null);
  const pinchAnchorRef = useRef<{ anchorX: number; anchorY: number; worldX: number; worldY: number } | null>(null);
  const pinchGestureRef = useRef(false);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastDoubleTapZoomRef = useRef<{ from: number; to: number } | null>(null);
  const panStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const panStartScrollRef = useRef<{ left: number; top: number } | null>(null);
  const pointerLastSampleRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const panVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const inertiaFrameRef = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const isIOSLikeRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const touchPanStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const touchPanStartScrollRef = useRef<{ left: number; top: number } | null>(null);
  const touchLastSampleRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMovedRef = useRef(false);
  const [isGestureZooming, setIsGestureZooming] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);

    if (!onComponentDrop || !floorRef.current) return;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);

      const rect = floorRef.current.getBoundingClientRect();
      const currentScale = fitScaleRef.current * zoomScaleRef.current;
      const clickX = (e.clientX - rect.left) / currentScale;
      const clickY = (e.clientY - rect.top) / currentScale;

      // Snap to 40px grid (to align with tables & canvas sizing)
      const snapX = Math.max(0, Math.round(clickX / 40) * 40);
      const snapY = Math.max(0, Math.round(clickY / 40) * 40);

      onComponentDrop(item, { x: snapX, y: snapY });
    } catch (err) {
      console.error("Drop parsing failed", err);
    }
  };

  const activeFloor = layout.floors.find((f) => f.id === layout.activeFloorId);
  const selectedSet = React.useMemo(() => new Set(selectedTableIds), [selectedTableIds]);
  const [hasFocused, setHasFocused] = useState(false);
  const canDragPan = readOnly;
  const scale = fitScale * zoomScale;

  useEffect(() => {
    fitScaleRef.current = fitScale;
  }, [fitScale]);

  useEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);

  const applyVisualScale = useCallback((zoom: number) => {
    const nextScale = fitScaleRef.current * zoom;

    if (scaleWrapperRef.current && activeFloor) {
      scaleWrapperRef.current.style.width = `${activeFloor.width * nextScale}px`;
      scaleWrapperRef.current.style.height = `${activeFloor.height * nextScale}px`;
    }

    if (floorRef.current) {
      floorRef.current.style.transform = `translateZ(0) scale(${nextScale})`;
    }
  }, [activeFloor]);

  const clampZoomScale = useCallback((next: number) => {
    return Math.min(MAX_ZOOM_SCALE, Math.max(MIN_ZOOM_SCALE, next));
  }, [MAX_ZOOM_SCALE, MIN_ZOOM_SCALE]);

  const stopInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  const applyZoomAtClientPoint = useCallback((nextZoom: number, clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const anchorX = clientX - rect.left - container.clientLeft;
    const anchorY = clientY - rect.top - container.clientTop;

    const currentFitScale = fitScaleRef.current;
    const prevScale = currentFitScale * zoomScaleRef.current;
    const nextScale = currentFitScale * nextZoom;

    if (prevScale <= 0 || nextScale <= 0) {
      setZoomScale(nextZoom);
      return;
    }

    const worldX = (container.scrollLeft + anchorX) / prevScale;
    const worldY = (container.scrollTop + anchorY) / prevScale;

    zoomScaleRef.current = nextZoom;
    setZoomScale(nextZoom);

    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const targetLeft = worldX * nextScale - anchorX;
      const targetTop = worldY * nextScale - anchorY;
      containerRef.current.scrollLeft = targetLeft;
      containerRef.current.scrollTop = targetTop;
    });
  }, []);

  const startInertia = useCallback(() => {
    if (!containerRef.current) return;
    if (prefersReducedMotionRef.current) return;

    const isIOSLike = isIOSLikeRef.current;
    const friction = isIOSLike ? 0.85 : 0.92;
    const stopThreshold = isIOSLike ? 0.22 : 0.1;
    const maxFrameVelocity = isIOSLike ? 14 : 22;

    panVelocityRef.current = {
      x: Math.max(-maxFrameVelocity, Math.min(maxFrameVelocity, panVelocityRef.current.x)),
      y: Math.max(-maxFrameVelocity, Math.min(maxFrameVelocity, panVelocityRef.current.y)),
    };

    const tick = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;

      container.scrollLeft -= panVelocityRef.current.x;
      container.scrollTop -= panVelocityRef.current.y;

      panVelocityRef.current.x *= friction;
      panVelocityRef.current.y *= friction;

      if (
        Math.abs(panVelocityRef.current.x) < stopThreshold &&
        Math.abs(panVelocityRef.current.y) < stopThreshold
      ) {
        stopInertia();
        return;
      }

      inertiaFrameRef.current = window.requestAnimationFrame(tick);
    };

    stopInertia();
    inertiaFrameRef.current = window.requestAnimationFrame(tick);
  }, [stopInertia]);

  useEffect(() => {
    setHasFocused(false);
  }, [activeFloor?.id, selectedTableIds.join(',')]);

  useEffect(() => {
    isManualZoomRef.current = false;
    setZoomScale(1);
  }, [activeFloor?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent || "";
    const platform = window.navigator.platform || "";
    const maxTouchPoints = window.navigator.maxTouchPoints || 0;

    isIOSLikeRef.current =
      /iPhone|iPad|iPod/i.test(ua) ||
      (platform === "MacIntel" && maxTouchPoints > 1);

    prefersReducedMotionRef.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // ── Auto-fit: scale canvas to fit container ──
  useEffect(() => {
    if (!containerRef.current || !activeFloor) return;

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      // Avoid auto-fit recalculation while user is actively zooming.
      // Recomputing fitScale during gesture causes center drift/flicker.
      if (isGestureZooming || isManualZoomRef.current || zoomScaleRef.current !== 1) {
        return;
      }

      const computedStyle = window.getComputedStyle(container);
      const horizontalPadding =
        (parseFloat(computedStyle.paddingLeft || '0') || 0) +
        (parseFloat(computedStyle.paddingRight || '0') || 0);
      const verticalPadding =
        (parseFloat(computedStyle.paddingTop || '0') || 0) +
        (parseFloat(computedStyle.paddingBottom || '0') || 0);
      const availW = container.clientWidth - horizontalPadding;
      const availH = container.clientHeight - verticalPadding;
      if (availW <= 0 || availH <= 0) return;
      const scaleX = availW / activeFloor.width;
      const scaleY = availH / activeFloor.height;
      // Fit within container; allow upscaling but limit to 4.0.
      let finalScale = Math.min(scaleX, scaleY, 4.0);

      if (focusOnSelected && selectedSet.size > 0) {
        const selectedTables = activeFloor.tables.filter(t => selectedSet.has(t.id));
        if (selectedTables.length > 0) {
          const minX = Math.min(...selectedTables.map(t => t.position.x));
          const maxX = Math.max(...selectedTables.map(t => t.position.x + (t.width || 80)));
          const minY = Math.min(...selectedTables.map(t => t.position.y));
          const maxY = Math.max(...selectedTables.map(t => t.position.y + (t.height || 80)));

          const boxW = maxX - minX;
          const boxH = maxY - minY;
          // Add tight padding (e.g. 75px on each side)
          const paddedW = boxW + 150;
          const paddedH = boxH + 150;

          finalScale = Math.min(availW / paddedW, availH / paddedH, 3.0);
          setFitScale(finalScale);

          // Scroll to center the bounding box exactly once
          if (!hasFocused) {
            setHasFocused(true);
            setTimeout(() => {
              if (containerRef.current) {
                const cx = ((minX + maxX) / 2) * finalScale;
                const cy = ((minY + maxY) / 2) * finalScale;
                containerRef.current.scrollTo({
                  left: Math.max(0, cx - availW / 2),
                  top: Math.max(0, cy - availH / 2),
                  behavior: 'smooth'
                });
              }
            }, 100);
          }
          return;
        }
      }

      const roundedScale = Math.round(finalScale * 10000) / 10000;
      setFitScale((prev) => (Math.abs(prev - roundedScale) > 0.0005 ? roundedScale : prev));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeFloor?.width, activeFloor?.height, activeFloor?.id, focusOnSelected, selectedSet, hasFocused, isGestureZooming]);

  const handleZoomIn = () => {
    if (!containerRef.current) return;
    isManualZoomRef.current = true;
    lastDoubleTapZoomRef.current = null;
    const rect = containerRef.current.getBoundingClientRect();
    const next = clampZoomScale(zoomScale + 0.2);
    applyZoomAtClientPoint(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    isManualZoomRef.current = true;
    lastDoubleTapZoomRef.current = null;
    const rect = containerRef.current.getBoundingClientRect();
    const next = clampZoomScale(zoomScale - 0.2);
    applyZoomAtClientPoint(next, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleZoomReset = () => {
    isManualZoomRef.current = false;
    lastDoubleTapZoomRef.current = null;
    setZoomScale(1);
  };

  const handleCanvasWheel = useCallback((event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    lastDoubleTapZoomRef.current = null;
    const next = zoomScale + (event.deltaY < 0 ? 0.08 : -0.08);
    applyZoomAtClientPoint(clampZoomScale(next), event.clientX, event.clientY);
  }, [zoomScale, applyZoomAtClientPoint, clampZoomScale]);

  const getTouchDistance = (touches: React.TouchList) => {
    const [first, second] = [touches[0], touches[1]];
    if (!first || !second) return null;
    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canDragPan || !containerRef.current) return;

    if (event.touches.length === 2) {
      isManualZoomRef.current = true;
      lastDoubleTapZoomRef.current = null;
      const distance = getTouchDistance(event.touches);
      if (!distance) return;
      pinchGestureRef.current = true;
      isPinchingRef.current = true;
      setIsPanning(false);
      stopInertia();
      pinchStartDistanceRef.current = distance;
      pinchStartZoomRef.current = zoomScaleRef.current;
      setIsGestureZooming(true);

      const [first, second] = [event.touches[0], event.touches[1]];
      if (first && second) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = (first.clientX + second.clientX) / 2;
        const centerY = (first.clientY + second.clientY) / 2;
        const anchorX = centerX - rect.left - containerRef.current.clientLeft;
        const anchorY = centerY - rect.top - containerRef.current.clientTop;
        const currentScale = fitScaleRef.current * zoomScaleRef.current;

        if (currentScale > 0) {
          pinchAnchorRef.current = {
            anchorX,
            anchorY,
            worldX: (containerRef.current.scrollLeft + anchorX) / currentScale,
            worldY: (containerRef.current.scrollTop + anchorY) / currentScale,
          };
        }
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      touchPanStartPointRef.current = null;
      touchPanStartScrollRef.current = null;
      touchLastSampleRef.current = null;
      touchMovedRef.current = false;
      return;
    }

    if (event.touches.length === 1 && !isPinchingRef.current) {
      const touch = event.touches[0];
      touchPanStartPointRef.current = { x: touch.clientX, y: touch.clientY };
      touchLastSampleRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now(),
      };
      touchMovedRef.current = false;
    }
  };

  const flushPinchZoom = useCallback(() => {
    pinchFrameRef.current = null;
    if (!canDragPan || !isPinchingRef.current || !pinchStartDistanceRef.current || !containerRef.current) return;

    const sample = pinchSampleRef.current;
    const anchor = pinchAnchorRef.current;
    if (!sample || !anchor) return;

    const ratio = sample.distance / pinchStartDistanceRef.current;
    const nextZoom = clampZoomScale(pinchStartZoomRef.current * ratio);
    // Keep a tiny epsilon only to avoid noisy no-op frames.
    // Too large a threshold makes zoom-out feel sticky near fit.
    if (Math.abs(nextZoom - zoomScaleRef.current) < 0.0015) {
      return;
    }
    const nextScale = fitScaleRef.current * nextZoom;

    zoomScaleRef.current = nextZoom;
    applyVisualScale(nextZoom);

    const targetLeft = anchor.worldX * nextScale - anchor.anchorX;
    const targetTop = anchor.worldY * nextScale - anchor.anchorY;
    containerRef.current.scrollLeft = targetLeft;
    containerRef.current.scrollTop = targetTop;
  }, [canDragPan, clampZoomScale, applyVisualScale]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!canDragPan || !containerRef.current) return;

    if (event.touches.length === 2 && pinchStartDistanceRef.current) {
      const first = event.touches[0];
      const second = event.touches[1];
      if (!first || !second) return;
      const dx = first.clientX - second.clientX;
      const dy = first.clientY - second.clientY;
      const nextDistance = Math.hypot(dx, dy);
      if (!nextDistance) return;
      if (event.cancelable) {
        event.preventDefault();
      }
      const previousDistance = pinchSampleRef.current?.distance;
      // Use light smoothing to damp sensor jitter without creating "pull-back" lag.
      const stabilizedDistance = previousDistance
        ? (previousDistance * 0.12) + (nextDistance * 0.88)
        : nextDistance;

      pinchSampleRef.current = {
        distance: stabilizedDistance,
      };

      if (pinchFrameRef.current === null) {
        pinchFrameRef.current = window.requestAnimationFrame(flushPinchZoom);
      }
      return;
    }

    if (event.touches.length === 1 && touchPanStartPointRef.current && !isPinchingRef.current) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchPanStartPointRef.current.x;
      const deltaY = touch.clientY - touchPanStartPointRef.current.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        touchMovedRef.current = true;
      }

      touchLastSampleRef.current = { x: touch.clientX, y: touch.clientY, time: performance.now() };
    }
  }, [canDragPan, flushPinchZoom]);

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canDragPan) return;

    const targetElement = event.target as HTMLElement | null;
    const endedOnTableNode = !!targetElement?.closest('[data-table-node="true"]');
    let didTouchPan = false;
    const wasPinchGesture = pinchGestureRef.current || isPinchingRef.current || !!pinchStartDistanceRef.current;

    if (event.touches.length < 2) {
      setZoomScale(zoomScaleRef.current);
      pinchStartDistanceRef.current = null;
      isPinchingRef.current = false;
      pinchSampleRef.current = null;
      pinchAnchorRef.current = null;
      if (pinchFrameRef.current !== null) {
        window.cancelAnimationFrame(pinchFrameRef.current);
        pinchFrameRef.current = null;
      }
      setIsGestureZooming(false);
    }

    if (event.touches.length === 0) {
      didTouchPan = touchMovedRef.current;

      touchPanStartPointRef.current = null;
      touchLastSampleRef.current = null;
      touchMovedRef.current = false;
      setIsPanning(false);

      if (wasPinchGesture) {
        // Ignore tap/double-tap detection after pinch to avoid post-gesture zoom drift.
        pinchGestureRef.current = false;
        lastTapRef.current = null;
        lastDoubleTapZoomRef.current = null;
        return;
      }

      if (endedOnTableNode) {
        lastTapRef.current = null;
        lastDoubleTapZoomRef.current = null;
        return;
      }
    }

    if (event.touches.length === 0 && event.changedTouches.length === 1 && !isPinchingRef.current) {
      if (didTouchPan) return;

      const touch = event.changedTouches[0];
      const now = Date.now();
      const lastTap = lastTapRef.current;

      if (lastTap) {
        const dt = now - lastTap.time;
        const distance = Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y);
        if (dt < 280 && distance < 28) {
          const previousZoomState = lastDoubleTapZoomRef.current;
          const shouldToggleBack =
            !!previousZoomState &&
            Math.abs(zoomScale - previousZoomState.to) < 0.06;

          if (shouldToggleBack && previousZoomState) {
            const backToZoom = clampZoomScale(previousZoomState.from);
            applyZoomAtClientPoint(backToZoom, touch.clientX, touch.clientY);
            lastDoubleTapZoomRef.current = null;
          } else {
            const next = clampZoomScale(zoomScale + 0.35);
            applyZoomAtClientPoint(next, touch.clientX, touch.clientY);
            lastDoubleTapZoomRef.current = { from: zoomScale, to: next };
          }

          lastTapRef.current = null;
          return;
        }
      }

      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchCancel = () => {
    setZoomScale(zoomScaleRef.current);
    pinchStartDistanceRef.current = null;
    isPinchingRef.current = false;
    pinchGestureRef.current = false;
    pinchSampleRef.current = null;
    pinchAnchorRef.current = null;
    if (pinchFrameRef.current !== null) {
      window.cancelAnimationFrame(pinchFrameRef.current);
      pinchFrameRef.current = null;
    }
    setIsGestureZooming(false);
    touchPanStartPointRef.current = null;
    touchLastSampleRef.current = null;
    touchMovedRef.current = false;
    setIsPanning(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragPan || !containerRef.current) return;
    if (event.pointerType === "touch") return;
    if (isPinchingRef.current) return;

    const targetElement = event.target as HTMLElement | null;
    if (targetElement?.closest('[data-table-node="true"]')) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopInertia();

    panStartPointRef.current = { x: event.clientX, y: event.clientY };
    panStartScrollRef.current = {
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    };
    pointerLastSampleRef.current = { x: event.clientX, y: event.clientY, time: performance.now() };
    panVelocityRef.current = { x: 0, y: 0 };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragPan || !isPanning || !containerRef.current) return;
    if (event.pointerType === "touch") return;
    if (!panStartPointRef.current || !panStartScrollRef.current) return;
    if (isPinchingRef.current) return;

    const deltaX = event.clientX - panStartPointRef.current.x;
    const deltaY = event.clientY - panStartPointRef.current.y;

    containerRef.current.scrollLeft = panStartScrollRef.current.left - deltaX;
    containerRef.current.scrollTop = panStartScrollRef.current.top - deltaY;

    const now = performance.now();
    const last = pointerLastSampleRef.current;
    if (last) {
      const dt = Math.max(1, now - last.time);
      panVelocityRef.current = {
        x: (event.clientX - last.x) / dt * 16,
        y: (event.clientY - last.y) / dt * 16,
      };
    }
    pointerLastSampleRef.current = { x: event.clientX, y: event.clientY, time: now };
    event.preventDefault();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragPan) return;
    if (event.pointerType === "touch") return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panStartPointRef.current = null;
    panStartScrollRef.current = null;
    pointerLastSampleRef.current = null;
    setIsPanning(false);

    if (!isPinchingRef.current) {
      const speed = Math.hypot(panVelocityRef.current.x, panVelocityRef.current.y);
      if (speed > 0.8) {
        startInertia();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopInertia();
      if (pinchFrameRef.current !== null) {
        window.cancelAnimationFrame(pinchFrameRef.current);
        pinchFrameRef.current = null;
      }
    };
  }, [stopInertia]);

  // Register wheel and touchmove with { passive: false } to allow preventDefault()
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleCanvasWheel, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleCanvasWheel);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleCanvasWheel, handleTouchMove]);

  if (!activeFloor) {
    return <div>No active floor selected</div>;
  }

  const handleFloorSwitch = (floorId: string) => {
    onLayoutChange({
      ...layout,
      activeFloorId: floorId,
    });
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeFloor) {
      // Notify parent about the file for BE upload
      if (onBackgroundImageUpload) {
        onBackgroundImageUpload(activeFloor.id, file);
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const img = new window.Image();
        img.onload = () => {
          const updatedFloors = layout.floors.map(f => {
            if (f.id === activeFloor.id) {
              return {
                ...f,
                backgroundImage: base64Url,
                width: Math.max(f.width, img.width),
                height: Math.max(f.height, img.height)
              };
            }
            return f;
          });
          onLayoutChange({ ...layout, floors: updatedFloors });
        };
        img.src = base64Url;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTableDragEnd = (
    tableId: string,
    newPosition: { x: number; y: number },
  ) => {
    const table = activeFloor.tables.find(t => t.id === tableId);
    if (!table) return;

    const tableW = table.width || 80;
    const tableH = table.height || 80;

    let x = Math.max(0, newPosition.x);
    let y = Math.max(0, newPosition.y);

    let newWidth = activeFloor.width;
    let newHeight = activeFloor.height;
    let layoutChanged = false;

    if (x + tableW > activeFloor.width) {
      newWidth = x + tableW + 50;
      layoutChanged = true;
    }
    if (y + tableH > activeFloor.height) {
      newHeight = y + tableH + 50;
      layoutChanged = true;
    }

    if (layoutChanged) {
      const updatedFloors = layout.floors.map(f => {
        if (f.id === activeFloor.id) {
          return { ...f, width: newWidth, height: newHeight };
        }
        return f;
      });
      onLayoutChange({ ...layout, floors: updatedFloors });
    }

    // Collision detection (merge check) - skip if source or target is decoration
    let merged = false;
    const isSourceDeco = table.name.startsWith("DECO_");

    if (!isSourceDeco && onTableMerge) {
      const sourceCenterX = x + tableW / 2;
      const sourceCenterY = y + tableH / 2;

      for (const targetTable of activeFloor.tables) {
        if (targetTable.id === tableId) continue;
        if (targetTable.name.startsWith("DECO_")) continue;

        const targetW = targetTable.width || 80;
        const targetH = targetTable.height || 80;
        const targetCenterX = targetTable.position.x + targetW / 2;
        const targetCenterY = targetTable.position.y + targetH / 2;

        const dx = sourceCenterX - targetCenterX;
        const dy = sourceCenterY - targetCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threshold = (Math.min(tableW, tableH) + Math.min(targetW, targetH)) / 5;

        if (distance < threshold) {
          onTableMerge(tableId, targetTable.id);
          merged = true;
          break;
        }
      }
    }

    if (!merged) {
      onTablePositionChange(tableId, {
        x,
        y,
      });
    }
  };

  const handleFloorResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly || !activeFloor) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = activeFloor.width;
    const startHeight = activeFloor.height;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const currentScale = fitScaleRef.current * zoomScaleRef.current;
      const newWidth = Math.max(400, Math.min(5000, startWidth + dx / currentScale));
      const newHeight = Math.max(400, Math.min(5000, startHeight + dy / currentScale));

      // Grid snap (40px)
      const snapWidth = Math.round(newWidth / 40) * 40;
      const snapHeight = Math.round(newHeight / 40) * 40;

      const updatedFloors = layout.floors.map(f => {
        if (f.id === activeFloor.id) {
          return {
            ...f,
            width: snapWidth,
            height: snapHeight
          };
        }
        return f;
      });

      onLayoutChange({
        ...layout,
        floors: updatedFloors
      });
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Floor Switcher & Toolbar */}
      {!hideControls && (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {layout.floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => handleFloorSwitch(floor.id)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm ${layout.activeFloorId === floor.id
                  ? "bg-[var(--primary)] text-white shadow-md"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-base)] hover:text-[var(--text)]"
                  }`}
              >
                {floor.name}
              </button>
            ))}
          </div>

          {readOnly && (
            <p className="px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] md:hidden">
              {t("landing.booking.table_map.zoom_hint")}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
            <div className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label={t("dashboard.tables.map.zoom_out", { defaultValue: "Zoom out" })}
              >
                -
              </button>
              <span className="min-w-[56px] px-1 text-center text-xs tabular-nums text-[var(--text-muted)]">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label={t("dashboard.tables.map.zoom_in", { defaultValue: "Zoom in" })}
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-1 text-xs font-semibold text-[var(--primary)]"
                aria-label={t("dashboard.tables.map.zoom_reset", { defaultValue: "Reset zoom" })}
              >
                {t("dashboard.tables.map.zoom_fit", { defaultValue: "Fit" })}
              </button>
            </div>

            {/* Upload Button */}
            {!readOnly && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg"
                  onChange={handleBackgroundImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-1 text-sm text-[var(--primary)] hover:underline"
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  {t("dashboard.tables.map.upload_floorplan")}
                </button>
              </>
            )}
            {/* Grid Toggle */}
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap px-1">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-muted)]">{t("dashboard.tables.map.show_grid")}</span>
            </label>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className={`relative block flex-1 overflow-auto overscroll-contain rounded-xl border p-2 sm:p-4 transition-colors ${
          isDragOver 
            ? "border-[var(--primary)] bg-orange-50/10 dark:bg-orange-950/10 border-dashed border-2" 
            : "border-[var(--border)] bg-[var(--bg-base)]"
        }`}
        style={{
          touchAction: canDragPan ? (isGestureZooming ? "none" : "pan-x pan-y") : "pan-x pan-y",
          cursor: canDragPan ? (isPanning ? "grabbing" : "grab") : "default",
          userSelect: canDragPan && isPanning ? "none" : "auto",
          WebkitOverflowScrolling: canDragPan ? "auto" : "touch",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Scaled wrapper — preserves canvas coordinate system */}
        <div
          ref={scaleWrapperRef}
          style={{
            width: activeFloor.width * scale,
            height: activeFloor.height * scale,
            flexShrink: 0,
          }}
        >
          {/* The Floor Canvas — always renders at native resolution via transform */}
          <div
            ref={floorRef}
            className="relative"
            style={{
              width: activeFloor.width,
              height: activeFloor.height,
              transform: `translateZ(0) scale(${scale})`,
              transformOrigin: "top left",
              willChange: isGestureZooming ? "transform" : "auto",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              backgroundColor: activeFloor.backgroundImage ? "transparent" : "#c4a882",
              backgroundImage: activeFloor.backgroundImage
                ? `url(${activeFloor.backgroundImage})`
                : `url("${WOOD_FLOOR_PATTERN}")`,
              backgroundSize: activeFloor.backgroundImage ? "100% 100%" : "auto",
              backgroundRepeat: activeFloor.backgroundImage ? "no-repeat" : "repeat",
              backgroundPosition: "top left",
              borderRadius: 8,
              boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
            }}
          >
            {/* Resize handle for the floor canvas */}
            {!readOnly && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 24,
                  height: 24,
                  cursor: "se-resize",
                  zIndex: 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: "8px 0 8px 0",
                  boxShadow: "-2px -2px 6px rgba(0,0,0,0.15)",
                }}
                onPointerDown={handleFloorResizeStart}
              >
                <ArrowRight className="w-3.5 h-3.5 font-bold" style={{ transform: "rotate(45deg)" }} />
              </div>
            )}
            {/* Floor Name Watermark */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "45%",
                transform: "translate(-50%, -50%)",
                fontSize: "3rem",
                fontWeight: 900,
                color: "rgba(255, 255, 255, 0.18)",
                fontFamily: "var(--font-sans), sans-serif",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 0,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                textShadow: "0 2px 4px rgba(0,0,0,0.12)",
                textAlign: "center",
                width: "100%",
                padding: "0 20px",
                boxSizing: "border-box",
              }}
            >
              {activeFloor.name}
            </div>
            {/* Floor Tile Grid (grout lines look) */}
            {showGrid && !isGestureZooming && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundSize: "40px 40px",
                  backgroundImage: `
                    linear-gradient(to right, rgba(90,55,25,0.14) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(90,55,25,0.14) 1px, transparent 1px)
                  `,
                  zIndex: 0
                }}
              />
            )}
            {/* Room Vignette — subtle radial darkening at edges for depth */}
            {!activeFloor.backgroundImage && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.18) 100%)",
                  zIndex: 0,
                  borderRadius: 8,
                }}
              />
            )}

            {/* Tables */}
            {activeFloor.tables.map((table) => (
              <DraggableTable
                key={table.id}
                table={{ ...table, status: selectedSet.has(table.id) ? "SELECTED" : table.status }}
                onDragEnd={handleTableDragEnd}
                onClick={onTableClick}
                onResize={!readOnly ? onTableResize : undefined}
                draggable={!readOnly}
                renderContent={renderTableContent}
                scale={scale}
                reduceEffects={isGestureZooming}
                isFlashing={flashTableId === table.id}
              />
            ))}

            {/* Perimeter wall overlay — rendered above tables so it always frames the room.
                pointer-events: none ensures it never blocks table drag/click. */}
            {!activeFloor.backgroundImage && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: 50,
                  borderRadius: 8,
                  border: "14px solid rgba(42, 18, 4, 0.86)",
                  boxShadow: "inset 0 0 16px rgba(0,0,0,0.35)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floor Info Footer */}
      {!hideControls && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text)]">
              {Math.round(activeFloor.width / 50)}m × {Math.round(activeFloor.height / 50)}m
            </span>
            <span className="opacity-50">({Math.round((activeFloor.width / 50) * (activeFloor.height / 50))}m²)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              {activeFloor.tables.filter(t => !t.name.startsWith("DECO_")).length} bàn ăn
            </span>
            <span className="opacity-40">·</span>
            <Tooltip title="Ước tính 2.5m² mỗi bàn 4 chỗ (bao gồm lối đi)">
              <span className="cursor-help underline decoration-dashed">
                Gợi ý tối đa ~{Math.floor((activeFloor.width / 50) * (activeFloor.height / 50) / 2.5)} bàn
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};
