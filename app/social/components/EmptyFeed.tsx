'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Utensils } from 'lucide-react';

interface EmptyFeedProps {
  title?: string;
  description?: string;
  showLoginCta?: boolean;
}

export default function EmptyFeed({
  title = 'Chưa có bài viết nào',
  description = 'Hãy là người đầu tiên chia sẻ câu chuyện ẩm thực của bạn với cộng đồng XFoodi!',
  showLoginCta = false,
}: EmptyFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/80 px-8 py-16 text-center backdrop-blur-md"
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Utensils className="h-10 w-10" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      {showLoginCta && (
        <Link
          href="/login?redirect=/social"
          className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--on-primary)] transition hover:bg-[var(--primary-hover)]"
        >
          Đăng nhập để tham gia
        </Link>
      )}
    </motion.div>
  );
}
