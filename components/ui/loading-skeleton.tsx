import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Placeholder skeleton for KPI metric cards.
 * Matches the layout used in provider-performance/metric-cards.tsx.
 */
function CardSkeleton({
  className,
  cards = 4,
  ...props
}: React.ComponentProps<"div"> & { cards?: number }) {
  return (
    <div
      data-slot="loading-card-skeleton"
      className={cn("flex flex-wrap items-start gap-x-6 gap-y-6 sm:gap-x-10 lg:gap-x-14", className)}
      {...props}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-3 w-16 mx-auto mb-2 rounded" />
          <Skeleton className="h-7 w-12 mx-auto mb-1 rounded" />
          <Skeleton className="h-3 w-20 mx-auto rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * Placeholder skeleton for chart areas (area charts, bar charts, etc.).
 * Matches the layout used in provider-performance/sales-chart.tsx.
 */
function ChartSkeleton({
  className,
  showLabel = true,
  ...props
}: React.ComponentProps<"div"> & { showLabel?: boolean }) {
  return (
    <div
      data-slot="loading-chart-skeleton"
      className={cn("space-y-4", className)}
      {...props}
    >
      {showLabel && <Skeleton className="h-3 w-40 rounded" />}
      <Skeleton className="h-[280px] w-full rounded" />
    </div>
  )
}

/**
 * Placeholder skeleton for data tables.
 * Matches the grid layout and row styling used in provider-performance/sales-log.tsx.
 */
function TableSkeleton({
  className,
  rows = 5,
  columns = 4,
  ...props
}: React.ComponentProps<"div"> & { rows?: number; columns?: number }) {
  const columnWidths = ["w-16", "flex-1", "w-14", "w-20"]

  return (
    <div
      data-slot="loading-table-skeleton"
      className={cn("font-mono", className)}
      {...props}
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
        <div className="flex gap-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className={cn("h-3", columnWidths[i % columnWidths.length])}
            />
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className={cn(
            "flex gap-3 px-4 py-2.5 border-b border-border last:border-b-0",
            rowIdx % 2 === 0 ? "bg-muted/30" : "bg-background"
          )}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              className={cn("h-4", columnWidths[colIdx % columnWidths.length])}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Placeholder skeleton for contribution heatmaps (day-by-day grid).
 * Renders a grid of small square cells with alternating pulse delays
 * for a shimmer wave effect.
 */
function HeatmapSkeleton({
  className,
  weeks = 12,
  ...props
}: React.ComponentProps<"div"> & { weeks?: number }) {
  return (
    <div
      data-slot="loading-heatmap-skeleton"
      className={cn("space-y-3", className)}
      {...props}
    >
      {/* Month labels */}
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`month-${i}`} className="h-3 w-10 rounded" />
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1">
        {Array.from({ length: weeks }).map((_, weekIdx) => (
          <div key={`week-${weekIdx}`} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <Skeleton
                key={`day-${weekIdx}-${dayIdx}`}
                className="size-[10px] rounded-[2px]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { CardSkeleton, ChartSkeleton, TableSkeleton, HeatmapSkeleton }
