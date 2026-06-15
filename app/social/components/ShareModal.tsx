'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface ShareModalProps {
  open: boolean;
  postUrl: string;
  onClose: () => void;
  onShare?: () => void;
}

export default function ShareModal({ open, postUrl, onClose, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      onShare?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-[var(--modal-overlay)] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-[var(--text)]">Chia sẻ bài viết</h3>
            <div className="mb-4 flex gap-2">
              <input
                readOnly
                value={postUrl}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <button
                type="button"
                onClick={copyLink}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)]"
              >
                {copied ? 'Đã copy!' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)]"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
