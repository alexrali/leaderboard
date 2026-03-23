"use client"

import { Area, AreaChart, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, ReferenceDot } from "recharts"

const chartData = [
  { date: "Jan 1", revenue: 0 },
  { date: "Jan 8", revenue: 45000 },
  { date: "Jan 15", revenue: 82000 },
  { date: "Jan 22", revenue: 145000 },
  { date: "Jan 29", revenue: 198000 },
  { date: "Feb 5", revenue: 267000 },
  { date: "Feb 12", revenue: 342000 },
  { date: "Feb 19", revenue: 425000 },
  { date: "Feb 26", revenue: 498000 },
  { date: "Mar 5", revenue: 589000 },
  { date: "Mar 12", revenue: 692000 },
  { date: "Mar 19", revenue: 778000 },
  { date: "Mar 23", revenue: 847392 },
]

export function SalesChart() {
  return (
    <div className="animate-in fade-in duration-1000 delay-500">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Revenue Curve — Cumulative
        </p>
      </div>

      {/* Chart - larger height for proper proportions */}
      <div className="h-[280px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 70, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.04} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickMargin={12}
              interval="preserveStartEnd"
            />
            <YAxis
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              domain={[-100000, 900000]}
              ticks={[0, 200000, 400000, 600000, 800000]}
            />
            <ReferenceLine
              y={847392}
              stroke="hsl(var(--foreground))"
              strokeDasharray="2 4"
              strokeOpacity={0.12}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--foreground))"
              strokeOpacity={0.08}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border border-border/50 px-3 py-2 shadow-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">{payload[0].payload.date}</p>
                      <p className="font-mono text-sm font-semibold">
                        ${Number(payload[0].value).toLocaleString()}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
              fill="url(#fillRevenue)"
              animationDuration={2000}
              animationBegin={800}
            />
            <ReferenceDot
              x="Mar 23"
              y={847392}
              r={4}
              fill="hsl(var(--foreground))"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Current Value Marker */}
        <div className="absolute right-0 top-[15%] flex items-center gap-2 animate-in fade-in duration-1000 delay-1500">
          <div className="h-px w-6 bg-foreground/20" />
          <div className="bg-foreground text-background text-[10px] font-mono px-2 py-1">
            $847,392
          </div>
        </div>

        {/* Bottom reference */}
        <div className="absolute right-0 bottom-[12%] flex items-center gap-2">
          <div className="h-px w-6 bg-foreground/10" />
          <div className="text-[9px] font-mono text-muted-foreground/40 tabular-nums">
            $-100K
          </div>
        </div>
      </div>
    </div>
  )
}
