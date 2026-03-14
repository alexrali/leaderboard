"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SparklineData {
  value: number
}

interface SparklineProps {
  data: SparklineData[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({
  data,
  color = "var(--primary)",
  width = 60,
  height = 24
}: SparklineProps) {
  if (data.length < 2) return null

  const first = data[0].value
  const last = data[data.length - 1].value
  const isPositive = last >= first
  const sparkColor = isPositive ? "var(--status-success)" : "var(--status-critical)"

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={sparkColor}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
