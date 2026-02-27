"use client"

import { useMemo } from "react"
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"
import type { MemberWeeklyTrendPoint } from "@/lib/supabase"

interface SparklineCellProps {
  workerKey: string
  trendData: MemberWeeklyTrendPoint[]
}

export function SparklineCell({ workerKey, trendData }: SparklineCellProps) {
  const points = useMemo(
    () =>
      trendData
        .filter((d) => d.worker_key === workerKey)
        .map((d) => ({ ue: d.total_ue, label: `Sem ${d.week_number}` })),
    [trendData, workerKey]
  )

  if (points.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="ue"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-popover border-border rounded border px-2 py-1 text-xs shadow">
                  {payload[0].payload.label}: {Number(payload[0].value).toFixed(0)} UE
                </div>
              )
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
