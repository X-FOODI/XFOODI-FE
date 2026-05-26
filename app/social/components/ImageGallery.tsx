'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  altPrefix?: string;
}

export default function ImageGallery({ images, altPrefix = 'post' }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null));
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, images.length, close]);

  if (!images.length) return null;

  const gridClass =
    images.length === 1
      ? 'grid-cols-1'
      : images.length === 2
        ? 'grid-cols-2'
        : images.length === 3
          ? 'grid-cols-2 [&>*:first-child]:col-span-2'
          : 'grid-cols-2';

  return (
    <>
      <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl ${gridClass}`}>
        {images.map((src, idx) => (
          <button
            key={`${src}-${idx}`}
            type="button"
            className="group relative aspect-square overflow-hidden bg-[var(--surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            onClick={() => setLightboxIndex(idx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${altPrefix} ${idx + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            {images.length > 4 && idx === 3 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                +{images.length - 4}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4"
            onClick={close}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20"
              onClick={close}
            >
              ✕
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-2xl text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="absolute right-4 z-10 mr-12 rounded-full bg-white/10 p-3 text-2xl text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null));
                  }}
                >
                  ›
                </button>
              </>
            )}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="relative max-h-[90vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[lightboxIndex]}
                alt={`${altPrefix} fullscreen`}
                className="max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
