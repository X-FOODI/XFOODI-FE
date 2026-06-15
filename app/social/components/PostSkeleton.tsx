'use client';

export default function PostSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-[var(--surface)]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-[var(--surface)]" />
          <div className="h-2 w-20 rounded bg-[var(--surface)]" />
        </div>
      </div>
      <div className="mb-3 space-y-2">
        <div className="h-3 w-full rounded bg-[var(--surface)]" />
        <div className="h-3 w-4/5 rounded bg-[var(--surface)]" />
      </div>
      <div className="mb-4 h-48 rounded-xl bg-[var(--surface)]" />
      <div className="flex gap-4">
        <div className="h-8 w-16 rounded-lg bg-[var(--surface)]" />
        <div className="h-8 w-16 rounded-lg bg-[var(--surface)]" />
        <div className="h-8 w-16 rounded-lg bg-[var(--surface)]" />
      </div>
    </div>
  );
}
