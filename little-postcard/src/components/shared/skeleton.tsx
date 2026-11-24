import { cn } from "cn";

/** Quiet placeholder block; pulses only when motion is allowed. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("bg-surface-secondary motion-safe:animate-pulse", className)} />;
}

/** Placeholder matching VideoCard's proportions. */
export function VideoCardSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-[3/2]" />
      <Skeleton className="mt-5 h-3 w-32" />
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
    </div>
  );
}

export function VideoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
      {Array.from({ length: count }, (_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}
