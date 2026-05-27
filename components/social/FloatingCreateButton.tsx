'use client';

import { useSocialStoreOptional } from '@/store/social';

export default function FloatingCreateButton() {
  const store = useSocialStoreOptional();
  if (!store) return null;

  return (
    <button
      type="button"
      onClick={() => store.setCreatePostOpen(true)}
      className="fixed bottom-20 right-4 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-2xl text-white shadow-lg transition hover:scale-105 md:hidden"
      aria-label="Tạo bài viết"
    >
      ✏️
    </button>
  );
}
