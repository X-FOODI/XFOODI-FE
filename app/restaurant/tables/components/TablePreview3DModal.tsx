"use client";

/**
 * TablePreview3DModal — XFoodi 360° panorama viewer for table selection.
 * Flow: Map 2D (readOnly) -> click bàn -> fullscreen 360 viewer -> đặt bàn.
 */

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { useTranslation } from "react-i18next";
import { Map as MapIcon, CalendarCheck } from "lucide-react";
import type { Reservation } from "@/lib/services/reservationService";
import type { TableData } from "@/app/restaurant/tables/components/DraggableTable";

interface TablePreview3DModalProps {
  open: boolean;
  table: TableData | null;
  tableImageUrl?: string;
  cubeUrls?: string[];
  onClose: () => void;
  onBookNow: () => void;
  onBackToMap?: () => void;
  onSuccess?: (result: Reservation) => void;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function Table360Viewer({
  open,
  imageUrl,
  cubeUrls,
  onReady,
  onError,
}: {
  open: boolean;
  imageUrl?: string;
  cubeUrls?: string[];
  onReady: () => void;
  onError?: (reason: "missing" | "load") => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cleanup: () => void;
  } | null>(null);

  useEffect(() => {
    if (!open || !mountRef.current) return;

    const wrap = mountRef.current;
    const width = wrap.clientWidth || window.innerWidth;
    const height = wrap.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";

    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };
    let lon = 0;
    let lat = 0;
    let animId = 0;
    let disposed = false;

    const updateCamera = () => {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta),
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      isDragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (!isDragging) return;
      lon -= (event.clientX - lastPointer.x) * 0.15;
      lat += (event.clientY - lastPointer.y) * 0.15;
      lat = clamp(lat, -85, 85);
      lastPointer = { x: event.clientX, y: event.clientY };
    };

    const activeTouches = new Map<number, { x: number; y: number }>();
    let startPinchDistance: number | null = null;
    let startFov = camera.fov;
    let isTouchDragging = false;
    let lastTouch = { x: 0, y: 0 };

    const getTouchDistance = () => {
      const points = Array.from(activeTouches.values());
      if (points.length < 2) return null;
      const [a, b] = points;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        isTouchDragging = true;
        lastTouch = { x: touch.clientX, y: touch.clientY };
        return;
      }

      if (event.touches.length < 2) return;
      isTouchDragging = false;
      activeTouches.clear();
      for (const touch of Array.from(event.touches)) {
        activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
      startPinchDistance = getTouchDistance();
      startFov = camera.fov;
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1 && isTouchDragging) {
        const touch = event.touches[0];
        lon -= (touch.clientX - lastTouch.x) * 0.15;
        lat += (touch.clientY - lastTouch.y) * 0.15;
        lat = clamp(lat, -85, 85);
        lastTouch = { x: touch.clientX, y: touch.clientY };
        if (event.cancelable) {
          event.preventDefault();
        }
        return;
      }

      if (event.touches.length < 2 || startPinchDistance === null) return;
      for (const touch of Array.from(event.touches)) {
        activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
      const nextDistance = getTouchDistance();
      if (!nextDistance) return;
      const ratio = startPinchDistance / nextDistance;
      camera.fov = clamp(startFov * ratio, 30, 100);
      camera.updateProjectionMatrix();
      event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches)) {
        activeTouches.delete(touch.identifier);
      }
      if (event.touches.length === 0) {
        isTouchDragging = false;
      }
      if (activeTouches.size < 2) {
        startPinchDistance = null;
        startFov = camera.fov;
      }
    };

    const onWheel = (event: WheelEvent) => {
      const nextFov = camera.fov + event.deltaY * 0.03;
      camera.fov = clamp(nextFov, 30, 100);
      camera.updateProjectionMatrix();
    };

    const onResize = () => {
      if (!wrap) return;
      const nextWidth = wrap.clientWidth || window.innerWidth;
      const nextHeight = wrap.clientHeight || window.innerHeight;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    type PanoLayout = "equirectangular" | "cubemap_cross_h" | "cubemap_cross_v";

    function detectPanoLayout(w: number, h: number): PanoLayout {
      const hFaceW = w / 4;
      const hFaceH = h / 3;
      if (Math.abs(hFaceW - hFaceH) / Math.max(hFaceW, hFaceH) < 0.08) {
        return "cubemap_cross_h";
      }
      const vFaceW = w / 3;
      const vFaceH = h / 4;
      if (Math.abs(vFaceW - vFaceH) / Math.max(vFaceW, vFaceH) < 0.08) {
        return "cubemap_cross_v";
      }
      return "equirectangular";
    }

    function extractFace(
      img: HTMLImageElement,
      faceSize: number,
      col: number,
      row: number,
    ): HTMLCanvasElement {
      const c = document.createElement("canvas");
      c.width = faceSize;
      c.height = faceSize;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(
        img,
        col * faceSize,
        row * faceSize,
        faceSize,
        faceSize,
        0,
        0,
        faceSize,
        faceSize,
      );
      return c;
    }

    function cubeTextureFromHCross(img: HTMLImageElement): THREE.CubeTexture {
      const s = Math.round(img.width / 4);
      const tex = new THREE.CubeTexture([
        extractFace(img, s, 2, 1),
        extractFace(img, s, 0, 1),
        extractFace(img, s, 1, 0),
        extractFace(img, s, 1, 2),
        extractFace(img, s, 1, 1),
        extractFace(img, s, 3, 1),
      ]);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    }

    function cubeTextureFromVCross(img: HTMLImageElement): THREE.CubeTexture {
      const s = Math.round(img.width / 3);
      const tex = new THREE.CubeTexture([
        extractFace(img, s, 2, 1),
        extractFace(img, s, 0, 1),
        extractFace(img, s, 1, 0),
        extractFace(img, s, 1, 2),
        extractFace(img, s, 1, 1),
        extractFace(img, s, 1, 3),
      ]);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    }

    if (cubeUrls && cubeUrls.length === 6 && cubeUrls.every(Boolean)) {
      const cubeLoader = new THREE.CubeTextureLoader();
      cubeLoader.setCrossOrigin("anonymous");
      cubeLoader.load(
        cubeUrls,
        (cubeTexture) => {
          if (disposed) return;
          cubeTexture.colorSpace = THREE.SRGBColorSpace;
          scene.background = cubeTexture;
          onReady();
        },
        undefined,
        () => {
          onError?.("load");
          onReady();
        }
      );
    } else {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      if (!imageUrl) {
        onError?.("missing");
        onReady();
        return () => {
          viewerRef.current?.cleanup();
          viewerRef.current = null;
        };
      }

      loader.load(
        imageUrl,
        (texture) => {
          if (disposed) return;

          const img = texture.image as HTMLImageElement;
          const layout = detectPanoLayout(img.width, img.height);

          if (layout === "cubemap_cross_h" || layout === "cubemap_cross_v") {
            const cubeTexture =
              layout === "cubemap_cross_h"
                ? cubeTextureFromHCross(img)
                : cubeTextureFromVCross(img);
            scene.background = cubeTexture;
          } else {
            texture.colorSpace = THREE.SRGBColorSpace;
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
          }

          onReady();
        },
        undefined,
        () => {
          onError?.("load");
          onReady();
        },
      );
    }

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: true });
    renderer.domElement.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      updateCamera();
      renderer.render(scene, camera);
    };
    animate();

    viewerRef.current = {
      renderer,
      scene,
      camera,
      cleanup: () => {
        disposed = true;
        cancelAnimationFrame(animId);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("wheel", onWheel);
        renderer.domElement.removeEventListener("touchstart", onTouchStart);
        renderer.domElement.removeEventListener("touchmove", onTouchMove);
        renderer.domElement.removeEventListener("touchend", onTouchEnd);
        renderer.domElement.removeEventListener("touchcancel", onTouchEnd);
        window.removeEventListener("resize", onResize);
        if (scene.background && scene.background instanceof THREE.CubeTexture) {
          scene.background.dispose();
          scene.background = null;
        }
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            const mat = obj.material;
            if (Array.isArray(mat)) {
              mat.forEach((m) => { m.map?.dispose(); m.dispose(); });
            } else {
              mat.map?.dispose();
              mat.dispose();
            }
          }
        });
        renderer.dispose();
        if (wrap.contains(renderer.domElement)) wrap.removeChild(renderer.domElement);
      },
    };

    return () => {
      viewerRef.current?.cleanup();
      viewerRef.current = null;
    };
  }, [open, imageUrl, cubeUrls, onReady]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

export default function TablePreview3DModal({
  open,
  table,
  tableImageUrl,
  cubeUrls,
  onClose,
  onBookNow,
  onBackToMap,
}: TablePreview3DModalProps) {
  const { t } = useTranslation();
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState<"missing" | "load" | null>(null);

  useEffect(() => {
    if (!open) {
      setViewerReady(false);
      setViewerError(null);
    }
  }, [open]);

  if (!open || !table || typeof document === "undefined") return null;

  const canBook = table.status === "AVAILABLE";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="table-360-modal-overlay"
        >
          <div className="table-360-viewer-container">
            <Table360Viewer
              open={open}
              imageUrl={tableImageUrl}
              cubeUrls={cubeUrls}
              onReady={() => setViewerReady(true)}
              onError={(reason) => setViewerError(reason)}
            />
          </div>

          {!viewerReady && (
            <div className="table-360-loading">
              <div className="table-360-spinner" />
              <div className="table-360-loading-text">
                {t('landing.booking.panorama.loading')}
              </div>
            </div>
          )}

          {viewerReady && viewerError && (
            <div className="table-360-error">
              <div className="table-360-error-title">
                {t('landing.booking.panorama.not_ready')}
              </div>
              <div className="table-360-error-desc">
                {viewerError === "missing"
                  ? t('landing.booking.panorama.no_image')
                  : t('landing.booking.panorama.load_failed')}
              </div>
            </div>
          )}

          <div className="table-360-header">
            <button
              type="button"
              onClick={onClose}
              className="table-360-back-btn"
              aria-label={t('landing.booking.panorama.back_to_map')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div className="table-360-header-meta">
              <div className="table-360-header-title">
                {t('landing.booking.panorama.table_label', { name: table.name })}
              </div>
              <div className="table-360-header-subtitle">
                {table.seats} {t('landing.booking.table_map.guests')} · {table.shape} · {
                  table.status === 'AVAILABLE'
                    ? t('landing.booking.panorama.status_available')
                    : table.status === 'OCCUPIED'
                      ? t('landing.booking.panorama.status_occupied')
                      : table.status
                }
              </div>
            </div>
            <div className="table-360-badge">
              360°
            </div>
          </div>

          <div
            className="table-360-hint"
            style={{ opacity: viewerReady ? 1 : 0 }}
          >
            {t('landing.booking.panorama.drag_hint')}
          </div>

          <div className="table-360-action-bar">
            {onBackToMap && (
              <button
                type="button"
                onClick={onBackToMap}
                className="table-360-action-secondary"
              >
                <MapIcon className="w-[18px] h-[18px] shrink-0" />
                {t('landing.booking.panorama.back_to_map')}
              </button>
            )}
            {canBook && (
              <button
                type="button"
                onClick={onBookNow}
                className="table-360-action-primary"
              >
                <CalendarCheck className="w-[18px] h-[18px] shrink-0" />
                {t('landing.booking.panorama.book_now')}
              </button>
            )}
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
