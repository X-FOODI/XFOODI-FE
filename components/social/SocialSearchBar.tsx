'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface SocialSearchBarProps {
  className?: string;
  compact?: boolean;
}

export default function SocialSearchBar({ className = '', compact }: SocialSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/social/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={compact ? 'Tìm kiếm...' : 'Tìm người dùng, bài viết, hashtag...'}
        className={`w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] ${
          compact ? 'max-w-[140px] sm:max-w-[200px]' : 'max-w-md'
        }`}
      />
    </form>
  );
}
