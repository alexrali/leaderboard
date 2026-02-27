"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { MemberRangeSummary } from "@/lib/supabase"

interface EquityKpiStripProps {
  members: MemberRangeSummary[]
}

export function EquityKpiStrip({ members }: EquityKpiStripProps) {
  if (members.length === 0) return null

  const values = members.map((m) => m.avg_ue_per_hour)
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const best = Math.max(...values)
  const worst = Math.min(...values)
  const gap = best - worst

  const stats = [
    { label: "Promedio UE/hr", value: avg.toFixed(2), sub: "equipo" },
    {
      label: "Mejor UE/hr",
      value: best.toFixed(2),
      sub: members.find((m) => m.avg_ue_per_hour === best)?.worker_name.split(" ")[0],
    },
    {
      label: "Menor UE/hr",
      value: worst.toFixed(2),
      sub: members.find((m) => m.avg_ue_per_hour === worst)?.worker_name.split(" ")[0],
    },
    { label: "Brecha", value: gap.toFixed(2), sub: "UE/hr max−min", highlight: true },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className={s.highlight ? "border-warning/40 bg-warning/5" : ""}>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p
              className={`mt-1 font-mono text-2xl font-bold ${
                s.highlight ? "text-warning-foreground" : ""
              }`}
            >
              {s.value}
            </p>
            {s.sub && (
              <p className="text-muted-foreground mt-0.5 text-xs truncate">{s.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
