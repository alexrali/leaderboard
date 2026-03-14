"use client"

import type { ColumnDef, Column } from "@tanstack/react-table"
import type { MemberRangeSummary, MemberWeeklyTrendPoint } from "@/lib/supabase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SparklineCell } from "./sparkline-cell"

function SortHeader({ label, column }: { label: string; column: Column<MemberRangeSummary, unknown> }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  )
}

export function buildColumns(
  trendData: MemberWeeklyTrendPoint[],
  onRowClick: (member: MemberRangeSummary) => void
): ColumnDef<MemberRangeSummary>[] {
  return [
    {
      accessorKey: "worker_name",
      enableHiding: false,
      header: ({ column }) => <SortHeader label="Miembro" column={column} />,
      cell: ({ row }) => {
        const initials =
          row.original.avatar_initials ??
          row.original.worker_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        return (
          <button
            className="flex items-center gap-2 text-left hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none rounded min-w-0"
            onClick={() => onRowClick(row.original)}
          >
            <Avatar className="h-7 w-7 shrink-0" aria-label={`Avatar for ${row.original.worker_name}`}>
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm truncate">{row.original.worker_name}</span>
          </button>
        )
      },
    },
    {
      accessorKey: "total_ue",
      header: ({ column }) => <SortHeader label="UE Total" column={column} />,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{Number(getValue()).toFixed(1)}</span>
      ),
    },
    {
      accessorKey: "avg_ue_per_hour",
      header: ({ column }) => <SortHeader label="UE/hr" column={column} />,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{Number(getValue()).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "total_routes",
      header: ({ column }) => <SortHeader label="Rutas" column={column} />,
      cell: ({ getValue }) => <span className="text-sm">{Number(getValue())}</span>,
    },
    {
      accessorKey: "days_worked",
      header: ({ column }) => <SortHeader label="Días" column={column} />,
      cell: ({ getValue }) => <span className="text-sm">{Number(getValue())}</span>,
    },
    {
      accessorKey: "hit_target_pct",
      header: ({ column }) => <SortHeader label="Objetivo %" column={column} />,
      cell: ({ getValue }) => {
        const pct = Number(getValue())
        return (
          <Badge
            variant={pct >= 70 ? "default" : pct >= 50 ? "secondary" : "outline"}
            className={pct < 50 ? "border-warning text-warning-foreground" : ""}
          >
            {pct}%
          </Badge>
        )
      },
    },
    {
      accessorKey: "current_streak",
      header: ({ column }) => <SortHeader label="Racha" column={column} />,
      cell: ({ getValue }) => {
        const streak = Number(getValue())
        return <span className="text-sm">{streak > 0 ? `🔥 ${streak}d` : "—"}</span>
      },
    },
    {
      id: "trend",
      header: "Tendencia",
      cell: ({ row }) => (
        <SparklineCell workerKey={row.original.worker_key} trendData={trendData} />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "avg_weekly_rank",
      header: ({ column }) => <SortHeader label="Rank avg" column={column} />,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">#{Number(getValue()).toFixed(1)}</span>
      ),
    },
  ]
}
