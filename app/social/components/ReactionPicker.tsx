'use client';

import { motion } from 'framer-motion';
import type { ReactionType } from '@/lib/types/social';
import { REACTION_EMOJI } from '../utils/socialHelpers';

const REACTIONS: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad'];

interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  disabled?: boolean;
  onReact: (reaction: ReactionType) => void;
  onClear?: () => void;
}

export default function ReactionPicker({
  currentReaction,
  disabled,
  onReact,
  onClear,
}: ReactionPickerProps) {
  return (
    <div className="relative flex items-center gap-1">
      <div className="group relative">
        <button
          type="button"
          disabled={disabled}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            currentReaction
              ? 'text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
          }`}
          onClick={() => {
            if (disabled) return;
            if (currentReaction && onClear) onClear();
            else if (!currentReaction) onReact('like');
          }}
        >
          <span>{currentReaction ? REACTION_EMOJI[currentReaction] : '👍'}</span>
          <span>{currentReaction ? 'Đã thích' : 'Thích'}</span>
        </button>
        {!disabled && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            whileHover={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 shadow-lg opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100"
          >
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                className="text-2xl transition hover:scale-125"
                title={r}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(r);
                }}
              >
                {REACTION_EMOJI[r]}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
