import { cn } from '../../lib/cn';

interface ProductSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * ProductSkeleton renders skeleton loading cards in the same grid layout
 * as the real product grid. This reserves layout space while products load,
 * preventing the body height collapse/expansion that causes CLS.
 * 
 * Heights are sized to closely match the real product cards including:
 * - Image aspect ratio (4:3)
 * - Full content area with category, title, description, price, buttons, and custom box
 */
export function ProductSkeleton({ count = 12, className }: ProductSkeletonProps) {
  return (
    <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)} aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-[1.5rem] border border-bark/10 bg-white shadow-card"
          aria-hidden="true"
        >
          {/* Image skeleton with 4:3 aspect ratio (fixed height) */}
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface-strong animate-pulse" />

          {/* Content skeleton - sized to match real card content */}
          <div className="flex flex-col gap-4 p-6 sm:p-7 flex-1">
            {/* Category label skeleton */}
            <div className="h-3 w-16 rounded-full bg-oak-100 animate-pulse" />

            {/* Title skeleton (2 lines - matches 3xl font) */}
            <div className="space-y-2">
              <div className="h-8 w-3/4 rounded bg-bark/10 animate-pulse" />
              <div className="h-8 w-1/2 rounded bg-bark/10 animate-pulse" />
            </div>

            {/* Description skeleton (3 lines) */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-bark/5 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-bark/5 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-bark/5 animate-pulse" />
            </div>

            {/* Material and price row */}
            <div className="flex items-center justify-between border-t border-bark/10 pt-4 mt-2">
              <div className="h-4 w-20 rounded bg-bark/10 animate-pulse" />
              <div className="h-4 w-28 rounded bg-bark/10 animate-pulse" />
            </div>

            {/* Buttons skeleton */}
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-24 rounded-full bg-bark/10 animate-pulse" />
              <div className="h-8 w-32 rounded-full bg-bark/10 animate-pulse" />
            </div>

            {/* Custom version box skeleton - takes up more space like the real one */}
            <div className="space-y-3 rounded-[1.75rem] border border-oak-200 bg-oak-50 p-4 mt-3">
              <div className="h-3 w-32 rounded bg-oak-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-oak-100 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-oak-100 animate-pulse" />
              </div>
              <div className="h-8 w-40 rounded-full bg-oak-100 animate-pulse mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
