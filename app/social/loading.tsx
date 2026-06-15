import PostSkeleton from './components/PostSkeleton';

export default function SocialLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 pt-28">
      <div className="mx-auto max-w-2xl space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}
