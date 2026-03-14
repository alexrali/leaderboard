"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface PieChartData {
  name: string
  value: number
  color: string
}

interface ClientHealthPieChartProps {
  data: PieChartData[]
}

const COLORS = {
  success: "var(--status-success)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

export function ClientHealthPieChart({ data }: ClientHealthPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              strokeWidth={0}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--neutral-900)",
            border: "none",
            borderRadius: "6px",
            color: "var(--neutral-50)",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          formatter={(value: number) => [`${value.toFixed(0)}%`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
