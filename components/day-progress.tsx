"use client"

import { Clock, Target, CheckCircle2, Timer, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import type { DayProgress as DayProgressType } from "@/lib/leaderboard-data"

interface DayProgressProps {
  data: DayProgressType[]
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <p className="mb-1.5 text-xs font-semibold text-card-foreground">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-xs text-muted-foreground">
            {entry.dataKey === "completed" ? "Completed" : "Target"}:{" "}
            <span className="font-mono font-bold text-card-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DayProgressSection({ data }: DayProgressProps) {
  const hourlyBreakdown = data.map((row) => {
    const pct = row.target > 0 ? row.completed / row.target : 0
    const status: "ahead" | "behind" | "on-track" =
      pct > 1.05 ? "ahead" : pct < 0.95 ? "behind" : "on-track"
    return { ...row, status }
  })

  const midpoint = Math.ceil(hourlyBreakdown.length / 2)
  const morning = hourlyBreakdown.slice(0, midpoint)
  const afternoon = hourlyBreakdown.slice(midpoint)
  const sumCompleted = (rows: typeof hourlyBreakdown) => rows.reduce((s, r) => s + r.completed, 0)
  const sumTarget = (rows: typeof hourlyBreakdown) => rows.reduce((s, r) => s + r.target, 0)

  const timeBlocks = [
    { label: "Mañana", range: `${morning[0]?.hour ?? ''} - ${morning[morning.length - 1]?.hour ?? ''}`, completed: sumCompleted(morning), target: sumTarget(morning), icon: Clock },
    { label: "Tarde",  range: `${afternoon[0]?.hour ?? ''} - ${afternoon[afternoon.length - 1]?.hour ?? ''}`, completed: sumCompleted(afternoon), target: sumTarget(afternoon), icon: Timer },
  ]

  const avgTasksPerHour = data.length > 0
    ? (data.reduce((s, r) => s + r.completed, 0) / data.length).toFixed(1)
    : "—"
  const peakHour = data.length > 0
    ? data.reduce((best, r) => r.completed > best.completed ? r : best, data[0]).hour
    : "—"
  const latestCompleted = data[data.length - 1]?.completed ?? 0
  const latestTarget = data[data.length - 1]?.target ?? 0
  const completionRate = latestTarget > 0 ? Math.round((latestCompleted / latestTarget) * 100) : 0
  const aheadBehind = latestCompleted - latestTarget

  return (
    <section className="flex flex-col gap-6" aria-labelledby="day-progress-heading">
      <div className="flex items-center gap-2.5">
        <Clock className="size-4 text-primary" />
        <h2 id="day-progress-heading" className="text-base font-semibold text-foreground">
          Progreso del Día
        </h2>
      </div>

      {/* Day Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Completadas Hoy</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <CardTitle className="text-3xl font-bold">{latestCompleted}</CardTitle>
            <div className="mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              <span className="text-xs text-muted-foreground">
                {aheadBehind >= 0 ? `${aheadBehind} adelante` : `${Math.abs(aheadBehind)} atrás`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Meta</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <CardTitle className="text-3xl font-bold">{latestTarget}</CardTitle>
            <div className="mt-2 flex items-center gap-1.5">
              <Target className="size-3.5 text-info" />
              <span className="text-xs text-muted-foreground">Meta diaria</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Avance</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <CardTitle className="text-3xl font-bold">{completionRate}%</CardTitle>
            <Progress value={completionRate} className="mt-3 h-1.5 rounded-full" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Rutas / Hora Prom.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <CardTitle className="text-3xl font-bold">{avgTasksPerHour}</CardTitle>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Pico: {peakHour}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Chart & Detail View */}
      <Tabs defaultValue="chart">
        <TabsList className="rounded-full bg-secondary/80 p-1">
          <TabsTrigger value="chart" className="gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <BarChart3 className="size-3.5" />
            Gráfica
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Clock className="size-3.5" />
            Detalle por Hora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Area chart */}
            <Card className="rounded-2xl lg:col-span-2">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardDescription className="text-xs uppercase tracking-wide">
                  Completadas vs. Meta (por hora)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.6} />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={{ stroke: "var(--color-border)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip content={<ChartTooltipContent />} />
                      <ReferenceLine
                        y={30}
                        stroke="var(--color-info)"
                        strokeDasharray="6 4"
                        strokeOpacity={0.4}
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stroke="var(--color-muted-foreground)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="var(--color-primary)"
                        strokeWidth={2.5}
                        fill="url(#completedGrad)"
                        dot={{ r: 3, fill: "var(--color-primary)", stroke: "white", strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: "var(--color-primary)", stroke: "white", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Time Block Breakdown */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardDescription className="text-xs uppercase tracking-wide">Resumen por Turno</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 px-5 pb-5 pt-0">
                {timeBlocks.map((block) => {
                  const pct = block.target > 0 ? Math.round((block.completed / block.target) * 100) : 0
                  return (
                    <div
                      key={block.label}
                      className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/30 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <block.icon className="size-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">{block.label}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{block.range}</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-3">
                            <Progress value={pct} className="h-2 flex-1 rounded-full" />
                            <span className="font-mono text-xs font-bold text-foreground">
                              {block.completed}/{block.target}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{pct}% of target reached</span>
                        </TooltipContent>
                      </Tooltip>
                      <Badge
                        variant={pct >= 100 ? "default" : "outline"}
                        className={
                          pct >= 100
                            ? "w-fit rounded-full bg-success text-success-foreground"
                            : "w-fit rounded-full border-warning/30 bg-warning/10 text-warning-foreground"
                        }
                      >
                        {pct >= 100 ? "Meta cumplida" : `${100 - pct}% restante`}
                      </Badge>
                    </div>
                  )
                })}

              {/* Quick Stats */}
              <div className="mt-1 rounded-xl border border-border bg-muted/30 p-4">
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rutas / hora prom.</span>
                  <span className="font-mono text-sm font-bold text-foreground">{avgTasksPerHour}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Hora pico</span>
                  <span className="font-mono text-sm font-bold text-foreground">{peakHour}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="breakdown">
        <Card className="overflow-hidden rounded-2xl">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Detalle por Hora</CardTitle>
            <CardDescription className="text-xs">Rutas completadas vs. meta por hora</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Hora</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Completadas</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Meta</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Avance</TableHead>
                  <TableHead className="pr-5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourlyBreakdown.map((row) => {
                  const pct = row.target > 0 ? Math.round((row.completed / row.target) * 100) : 0
                  return (
                    <TableRow key={row.hour}>
                      <TableCell className="pl-5 font-mono text-sm font-medium">{row.hour}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {row.completed}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {row.target}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={Math.min(pct, 100)} className="h-1.5 w-14 rounded-full" />
                          <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Badge
                          variant="outline"
                          className={`rounded-full ${
                            row.status === "ahead"
                              ? "border-success/30 bg-success/10 text-success"
                              : row.status === "behind"
                                ? "border-warning/30 bg-warning/10 text-warning"
                                : "border-info/30 bg-info/10 text-info"
                          }`}
                        >
                          {row.status === "ahead" ? "Adelante" : row.status === "behind" ? "Atrás" : "En Meta"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </section>
  )
}
