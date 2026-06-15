'use client';

import PostSkeleton from '@/app/social/components/PostSkeleton';
import { getAvatarUrl, getDisplayName } from '@/app/social/utils/socialHelpers';
import searchService from '@/lib/services/social/searchService';
import type { SearchResults } from '@/lib/types/social';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function SocialSearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await searchService.search(trimmed);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(q);
    if (q) runSearch(q);
  }, [q, runSearch]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Tìm kiếm</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
          window.history.replaceState(null, '', `/social/search?q=${encodeURIComponent(query)}`);
        }}
        className="relative"
      >
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm người dùng, bài viết, hashtag..."
          className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-4 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
        />
      </form>

      {loading && (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}

      {!loading && results && (
        <div className="space-y-8">
          {results.users.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Người dùng
              </h2>
              <ul className="space-y-2">
                {results.users.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/social/profile/${u.id}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition hover:border-[var(--primary)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarUrl(u)}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-[var(--text)]">{getDisplayName(u)}</p>
                        <p className="text-sm text-[var(--text-muted)]">@{u.username}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.hashtags.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Hashtag
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.hashtags.map((h) => (
                  <Link
                    key={h.tag}
                    href={`/social/hashtag/${h.tag}`}
                    className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-[var(--primary)]"
                  >
                    #{h.tag} · {h.count}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.posts.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Bài viết
              </h2>
              <ul className="mt-3 space-y-3">
                {results.posts.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <p className="text-sm text-[var(--text-muted)]">
                      {getDisplayName(p.author)} · {p.content.slice(0, 120)}
                      {p.content.length > 120 ? '…' : ''}
                    </p>
                    <Link href="/social" className="mt-2 inline-block text-sm text-[var(--primary)]">
                      Xem trên bảng tin →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.users.length === 0 &&
            results.posts.length === 0 &&
            results.hashtags.length === 0 && (
              <p className="text-center text-[var(--text-muted)]">Không tìm thấy kết quả.</p>
            )}
        </div>
      )}
    </div>
  );
}

export default function SocialSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      }
    >
      <SocialSearchContent />
    </Suspense>
  );
}
