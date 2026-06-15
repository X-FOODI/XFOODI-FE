'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export default function ImageLightbox({
  images,
  index,
  open,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  if (!images.length) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4"
          onClick={onClose}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-white"
            onClick={onClose}
          >
            ✕
          </button>
          {images.length > 1 && index > 0 && (
            <button
              type="button"
              className="absolute left-4 z-10 rounded-full bg-white/10 px-3 py-2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index - 1);
              }}
            >
              ‹
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && index < images.length - 1 && (
            <button
              type="button"
              className="absolute right-4 z-10 rounded-full bg-white/10 px-3 py-2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index + 1);
              }}
            >
              ›
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
