import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <Skeleton className="h-6 w-36" />
      <div className="brass-line" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-md border border-border/40 bg-card p-5">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-2 h-7 w-28" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-9 w-full rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md" />
      ))}
    </div>
  );
}
