"use client"

import type { Table } from "@tanstack/react-table"
import type { MemberRangeSummary } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SlidersHorizontal } from "lucide-react"

interface MemberTableToolbarProps {
  table: Table<MemberRangeSummary>
}

const COLUMN_LABELS: Record<string, string> = {
  worker_name: "Miembro",
  total_ue: "UE Total",
  avg_ue_per_hour: "UE/hr",
  total_routes: "Rutas",
  days_worked: "Días",
  hit_target_pct: "Objetivo %",
  current_streak: "Racha",
  trend: "Tendencia",
  avg_weekly_rank: "Rank avg",
}

export function MemberTableToolbar({ table }: MemberTableToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        placeholder="Buscar miembro..."
        value={(table.getColumn("worker_name")?.getFilterValue() as string) ?? ""}
        onChange={(e) =>
          table.getColumn("worker_name")?.setFilterValue(e.target.value)
        }
        className="h-8 w-48 text-sm"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Columnas
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
              >
                {COLUMN_LABELS[col.id] ?? col.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
