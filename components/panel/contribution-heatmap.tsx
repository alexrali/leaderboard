"use client"

import { subDays, startOfWeek, addDays, format, parseISO, isAfter } from "date-fns"
import { es } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { TeamDayCell } from "@/lib/leaderboard-queries"

interface ContributionHeatmapProps {
  data: TeamDayCell[]
  onDayClick: (date: string) => void
  selectedDate: string | null
}

function getQuantileThresholds(data: TeamDayCell[]): [number, number, number] {
  const values = data
    .map((d) => d.teamUE)
    .filter((v) => v > 0)
    .sort((a, b) => a - b)
  if (values.length === 0) return [0, 0, 0]
  const at = (p: number) => values[Math.floor(p * (values.length - 1))]
  return [at(0.25), at(0.5), at(0.75)]
}

function getCellColor(cell: TeamDayCell, thresholds: [number, number, number]): string {
  if (cell.teamUE === 0) return "bg-muted"
  const [q1, q2, q3] = thresholds
  if (cell.teamUE >= q3) return "bg-[#39d353]"
  if (cell.teamUE >= q2) return "bg-[#26a641]"
  if (cell.teamUE >= q1) return "bg-[#006d32]"
  return "bg-[#0e4429]"
}

// Build an array of date strings covering last `days` days, aligned to Monday
function buildGrid(data: TeamDayCell[], days: number): Array<TeamDayCell | null> {
  const map = new Map(data.map((d) => [d.date, d]))

  const today = new Date()
  const earliest = subDays(today, days - 1)
  // Align to the Monday on or before `earliest`
  const gridStart = startOfWeek(earliest, { weekStartsOn: 1 })

  const cells: Array<TeamDayCell | null> = []
  let cursor = gridStart
  while (!isAfter(cursor, today)) {
    const key = format(cursor, "yyyy-MM-dd")
    cells.push(map.get(key) ?? null)
    cursor = addDays(cursor, 1)
  }
  return cells
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function ContributionHeatmap({ data, onDayClick, selectedDate }: ContributionHeatmapProps) {
  const thresholds = getQuantileThresholds(data)
  const cells = buildGrid(data, 60)
  const totalCols = Math.ceil(cells.length / 7)

  // Build month label positions
  const monthLabels: Array<{ col: number; label: string }> = []
  let lastMonth = -1
  cells.forEach((cell, i) => {
    if (!cell) return
    const d = parseISO(cell.date)
    const month = d.getMonth()
    if (month !== lastMonth) {
      lastMonth = month
      monthLabels.push({
        col: Math.floor(i / 7),
        label: format(d, "MMM", { locale: es }),
      })
    }
  })

  return (
    <div className="space-y-3">
      <ScrollArea className="w-full">
        <div className="inline-block pb-2">
          {/* Month labels */}
          <div
            className="mb-1 grid text-[10px] text-muted-foreground"
            style={{ gridTemplateColumns: `28px repeat(${totalCols}, 14px)`, gap: "2px" }}
          >
            <div />
            {Array.from({ length: totalCols }, (_, col) => {
              const label = monthLabels.find((m) => m.col === col)
              return <div key={col}>{label?.label ?? ""}</div>
            })}
          </div>

          {/* Day rows (Mon=0 … Sun=6) */}
          {DAY_LABELS.map((dayLabel, row) => (
            <div
              key={dayLabel}
              className="grid items-center"
              style={{ gridTemplateColumns: `28px repeat(${totalCols}, 14px)`, gap: "2px", marginBottom: "2px" }}
            >
              <span className="text-[10px] text-muted-foreground leading-none">{dayLabel}</span>
              {Array.from({ length: totalCols }, (_, col) => {
                const cell = cells[col * 7 + row]
                if (!cell) return <div key={col} className="size-[14px] rounded-sm" />

                const isSelected = cell.date === selectedDate
                const label = format(parseISO(cell.date), "EEE d MMM", { locale: es })

                return (
                  <div key={col} className="relative size-[14px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onDayClick(cell.date)}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[44px] rounded-sm transition-all hover:ring-2 hover:ring-white/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                          aria-label={`${label}: ${cell.teamUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE`}
                        >
                          {/* Visual cell - 14x14px */}
                          <span
                            className={`block size-[14px] rounded-sm ${getCellColor(cell, thresholds)} ${isSelected ? "ring-2 ring-white/60" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold capitalize">{label}</p>
                        <p className="text-muted-foreground">
                          {cell.teamUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE ·{" "}
                          {cell.activeWorkers} trabajadores
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Menos</span>
        <div className="size-[10px] rounded-sm bg-muted" />
        <div className="size-[10px] rounded-sm bg-[#0e4429]" />
        <div className="size-[10px] rounded-sm bg-[#006d32]" />
        <div className="size-[10px] rounded-sm bg-[#26a641]" />
        <div className="size-[10px] rounded-sm bg-[#39d353]" />
        <span className="text-[10px] text-muted-foreground">Más</span>
      </div>
    </div>
  )
}
