'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SocialError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Social]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-base)] px-4 text-center">
      <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg">
        <span className="mb-4 block text-5xl">⚠️</span>
        <h2 className="mb-2 text-xl font-semibold text-[var(--text)]">Không tải được Mạng xã hội</h2>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          {error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--on-primary)]"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--text)]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
