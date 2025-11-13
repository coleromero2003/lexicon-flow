import { Skeleton } from "@/components/ui/skeleton";

interface PageLoadingSkeletonProps {
  showStats?: boolean;
  statsCount?: number;
}

/**
 * Standard loading skeleton for dashboard pages
 * Provides consistent loading UI across all pages
 */
export function PageLoadingSkeleton({
  showStats = true,
  statsCount = 4
}: PageLoadingSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-md" />
        {showStats && (
          <div className={`grid grid-cols-1 gap-4 md:grid-cols-${statsCount}`}>
            {Array.from({ length: statsCount }).map((_, index) => (
              <Skeleton key={index} className="h-24 h-28" />
            ))}
          </div>
        )}
        <Skeleton className="h-64" />
      </main>
    </div>
  );
}
