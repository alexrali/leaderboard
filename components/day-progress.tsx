"use client"

import { useId, useMemo } from "react"
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
  ReferenceArea,
} from "recharts"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"
import { cn } from "@/lib/utils"
import type { DayProgress as DayProgressType } from "@/lib/leaderboard-data"

interface DayProgressProps {
  data: DayProgressType[]
}

// ── Enriched chart tooltip ────────────────────────────────────────────────

function ChartTooltipContent({
  active,
  payload,
  label,
  totalCompleted,
  totalUE,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; payload?: DayProgressType }>
  label?: string
  totalCompleted: number
  totalUE: number
}) {
  if (active && payload && payload.length) {
    const row = payload[0].payload
    const pct =
      totalCompleted > 0
        ? ((payload[0].value / totalCompleted) * 100).toFixed(1)
        : "0"
    const ue = row?.teamUE ?? 0
    return (
      <div className="border-border bg-card rounded-xl border px-4 py-3 shadow-lg">
        <p className="text-card-foreground mb-1.5 text-xs font-semibold">{label}</p>
        <p className="text-muted-foreground text-xs">
          Rutas:{" "}
          <span className="text-card-foreground font-mono font-semibold">
            {payload[0].value}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">
          UE:{" "}
          <span className="text-card-foreground font-mono font-semibold">{ue}</span>
        </p>
        <p className="text-muted-foreground text-xs">
          del día:{" "}
          <span className="text-card-foreground font-mono font-semibold">
            {pct}%
          </span>
        </p>
      </div>
    )
  }
  return null
}

// ── Animated progress bar ─────────────────────────────────────────────────

function AnimatedProgressBar({ value, delay }: { value: number; delay: number }) {
  return (
    <div
      className="h-1.5 w-14 rounded-full bg-secondary overflow-hidden"
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
        style={{
          width: `${value}%`,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  )
}

// ── Hourly velocity grid ──────────────────────────────────────────────────

function VelocityGrid({ data }: { data: DayProgressType[] }) {
  const { avg, entries } = useMemo(() => {
    if (data.length === 0) return { avg: 0, entries: [] }
    const sum = data.reduce((s, r) => s + r.completed, 0)
    const avg = sum / data.length
    const entries = data.map((r) => ({
      hour: r.hour,
      completed: r.completed,
      ratio: avg > 0 ? r.completed / avg : 1,
    }))
    entries.sort((a, b) => b.ratio - a.ratio)
    return { avg, entries }
  }, [data])

  if (data.length === 0) return null

  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardDescription className="text-xs tracking-wide uppercase">
          Velocidad por Hora
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pt-0 pb-5">
        <p className="text-muted-foreground text-[10px] font-mono mb-3">
          Prom: {avg.toFixed(1)} rutas/hora
        </p>
        <div
          className="grid grid-cols-3 gap-1.5 sm:grid-cols-4"
          role="list"
          aria-label="Velocidad por hora relativa al promedio"
        >
          {entries.map((e) => {
            const isFast = e.ratio >= 1.2
            const isSlow = e.ratio <= 0.7
            return (
              <div
                key={e.hour}
                role="listitem"
                aria-label={`${e.hour}: ${e.completed} rutas`}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg px-2 py-2 transition-colors",
                  isFast
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : isSlow
                      ? "bg-red-500/10 text-red-700 dark:text-red-400"
                      : "bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="font-mono text-[11px] font-semibold">{e.hour}</span>
                <span className="font-mono text-[10px] opacity-70">{e.completed}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[9px] text-muted-foreground font-mono" aria-hidden="true">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm bg-emerald-500/20" />
            Rapido
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm bg-red-500/20" />
            Lento
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm bg-muted/50" />
            Normal
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Shift separator row ───────────────────────────────────────────────────

function ShiftSeparatorRow({ label }: { label: string }) {
  return (
    <TableRow className="bg-muted/40 hover:bg-muted/40">
      <TableCell
        colSpan={3}
        className="px-5 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  )
}

// ── Main section ──────────────────────────────────────────────────────────

export function DayProgressSection({ data }: DayProgressProps) {
  const uid = useId().replace(/:/g, "")
  const hourlyBreakdown = data

  // Loading state
  const isLoading = hourlyBreakdown.length === 0

  const midpoint = Math.ceil(hourlyBreakdown.length / 2)
  const morning = hourlyBreakdown.slice(0, midpoint)
  const afternoon = hourlyBreakdown.slice(midpoint)
  const sumCompleted = (rows: typeof hourlyBreakdown) =>
    rows.reduce((s, r) => s + r.completed, 0)

  const timeBlocks = [
    {
      label: "Mañana",
      range: `${morning[0]?.hour ?? ""} - ${morning[morning.length - 1]?.hour ?? ""}`,
      completed: sumCompleted(morning),
      icon: Clock,
    },
    {
      label: "Tarde",
      range: `${afternoon[0]?.hour ?? ""} - ${afternoon[afternoon.length - 1]?.hour ?? ""}`,
      completed: sumCompleted(afternoon),
      icon: Timer,
    },
  ]

  const totalCompleted = data.reduce((s, r) => s + r.completed, 0)
  const totalUE = data.reduce((s, r) => s + (r.teamUE ?? 0), 0)
  const avgTasksPerHour =
    data.length > 0
      ? Number((data.reduce((s, r) => s + r.completed, 0) / data.length).toFixed(1))
      : 0
  const peakHour =
    data.length > 0
      ? data.reduce((best, r) => (r.completed > best.completed ? r : best), data[0]).hour
      : "—"

  // Animated counters (3 numeric cards, skip Hora Pico)
  const animatedTotal = useAnimatedCounter(totalCompleted, { duration: 1500, delay: 0 })
  const animatedUE = useAnimatedCounter(totalUE, { duration: 1500, delay: 100 })
  const animatedAvg = useAnimatedCounter(avgTasksPerHour, { duration: 1500, delay: 200, decimals: 1 })

  return (
    <section className="flex flex-col gap-6" aria-labelledby="day-progress-heading">
      <div className="flex items-center gap-2.5">
        <Clock className="text-primary size-4" />
        <h2 id="day-progress-heading" className="text-foreground text-base font-semibold">
          Progreso del Día
        </h2>
      </div>

      {/* Day Summary Cards */}
      {isLoading ? (
        <CardSkeleton cards={4} className="grid grid-cols-2 gap-4 lg:grid-cols-4" />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="rounded-2xl">
            <CardHeader className="px-5 pt-5 pb-1">
              <CardDescription className="text-xs tracking-wide uppercase">
                Rutas Hoy
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pt-0 pb-5">
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {animatedTotal.toLocaleString("es-MX")}
              </CardTitle>
              <div className="mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="text-success size-3.5" aria-hidden="true" />
                <span className="text-muted-foreground text-xs">Total del día</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="px-5 pt-5 pb-1">
              <CardDescription className="text-xs tracking-wide uppercase">
                UE Total
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pt-0 pb-5">
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {animatedUE.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
              </CardTitle>
              <div className="mt-2 flex items-center gap-1.5">
                <BarChart3 className="text-primary size-3.5" aria-hidden="true" />
                <span className="text-muted-foreground text-xs">Acumulado del día</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="px-5 pt-5 pb-1">
              <CardDescription className="text-xs tracking-wide uppercase">
                Rutas / Hora Prom.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pt-0 pb-5">
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {animatedAvg}
              </CardTitle>
              <div className="mt-2 flex items-center gap-1.5">
                <Target className="text-info size-3.5" aria-hidden="true" />
                <span className="text-muted-foreground text-xs">Promedio por hora</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="px-5 pt-5 pb-1">
              <CardDescription className="text-xs tracking-wide uppercase">
                Hora Pico
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pt-0 pb-5">
              <CardTitle className="text-3xl font-semibold">{peakHour}</CardTitle>
              <div className="mt-2">
                <span className="text-muted-foreground text-xs">Mayor actividad</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Chart & Detail View */}
      <Tabs defaultValue="chart">
        <TabsList className="bg-secondary/80 rounded-full p-1">
          <TabsTrigger
            value="chart"
            className="data-[state=active]:bg-card gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-sm"
          >
            <BarChart3 className="size-3.5" />
            Gráfica
          </TabsTrigger>
          <TabsTrigger
            value="breakdown"
            className="data-[state=active]:bg-card gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-sm"
          >
            <Clock className="size-3.5" />
            Detalle por Hora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Area chart */}
            {isLoading ? (
              <Card className="rounded-2xl lg:col-span-2">
                <CardContent className="p-5">
                  <ChartSkeleton />
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl lg:col-span-2">
                <CardHeader className="px-5 pt-5 pb-2">
                  <CardDescription className="text-xs tracking-wide uppercase">
                    Completadas vs. Meta (por hora)
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 pt-0 pb-5">
                  <div className="h-60 w-full animate-in fade-in duration-700">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient
                            id={`completedGrad-${uid}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-primary)"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-primary)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          strokeOpacity={0.6}
                        />
                        {/* Shift overlay: morning hours */}
                        <ReferenceArea
                          x1={morning[0]?.hour}
                          x2={morning[morning.length - 1]?.hour}
                          fill="var(--color-primary)"
                          fillOpacity={0.02}
                        />
                        {/* Shift overlay: afternoon hours */}
                        <ReferenceArea
                          x1={afternoon[0]?.hour}
                          x2={afternoon[afternoon.length - 1]?.hour}
                          fill="var(--color-amber-500)"
                          fillOpacity={0.02}
                        />
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
                        <RechartsTooltip
                          content={
                            <ChartTooltipContent
                              totalCompleted={totalCompleted}
                              totalUE={totalUE}
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="var(--color-primary)"
                          strokeWidth={2.5}
                          fill={`url(#completedGrad-${uid})`}
                          animationDuration={1500}
                          animationBegin={300}
                          dot={{
                            r: 3,
                            fill: "var(--color-primary)",
                            stroke: "white",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 5,
                            fill: "var(--color-primary)",
                            stroke: "white",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Time Block Breakdown */}
            <Card className="rounded-2xl">
              <CardHeader className="px-5 pt-5 pb-3">
                <CardDescription className="text-xs tracking-wide uppercase">
                  Resumen por Turno
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 px-5 pt-0 pb-5">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-border bg-muted/30 flex flex-col gap-2.5 rounded-xl border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  timeBlocks.map((block) => {
                    const pct =
                      totalCompleted > 0
                        ? Math.round((block.completed / totalCompleted) * 100)
                        : 0
                    return (
                      <div
                        key={block.label}
                        className="border-border bg-muted/30 flex flex-col gap-2.5 rounded-xl border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <block.icon className="text-muted-foreground size-3.5" />
                            <span className="text-foreground text-sm font-semibold">
                              {block.label}
                            </span>
                          </div>
                          <span className="text-muted-foreground font-mono text-xs">
                            {block.range}
                          </span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-3">
                              <Progress
                                value={pct}
                                className="h-2 flex-1 rounded-full"
                              />
                              <span className="text-foreground font-mono text-xs font-semibold">
                                {block.completed.toLocaleString("es-MX")}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{pct}% del total del día</span>
                          </TooltipContent>
                        </Tooltip>
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground w-fit rounded-full"
                        >
                          {pct}% del día
                        </Badge>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hourly velocity indicators */}
          <ErrorBoundary title="Velocidad por Hora">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
              <VelocityGrid data={data} />
            </div>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="breakdown">
          {isLoading ? (
            <Card className="overflow-hidden rounded-2xl">
              <CardContent className="p-5">
                <TableSkeleton rows={midpoint * 2} columns={3} />
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-2xl">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-sm font-semibold">
                  Detalle por Hora
                </CardTitle>
                <CardDescription className="text-xs">
                  Rutas completadas vs. meta por hora
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table aria-label="Progreso por hora - rutas completadas y porcentaje del día">
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead
                        className="text-muted-foreground pl-5 text-xs font-medium tracking-wide uppercase"
                        scope="col"
                      >
                        Hora
                      </TableHead>
                      <TableHead
                        className="text-muted-foreground text-right text-xs font-medium tracking-wide uppercase"
                        scope="col"
                      >
                        Rutas
                      </TableHead>
                      <TableHead
                        className="text-muted-foreground pr-5 text-right text-xs font-medium tracking-wide uppercase"
                        scope="col"
                      >
                        % del día
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <ShiftSeparatorRow label="Mañana" />
                    {morning.map((row, idx) => {
                      const pct =
                        totalCompleted > 0
                          ? Math.round((row.completed / totalCompleted) * 100)
                          : 0
                      return (
                        <TableRow key={row.hour} className={idx % 2 === 1 ? "bg-muted/20" : ""}>
                          <TableCell className="pl-5 font-mono text-sm font-medium">
                            {row.hour}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {row.completed.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <AnimatedProgressBar value={pct} delay={idx * 60} />
                              <span className="text-muted-foreground font-mono text-xs w-8 text-right">
                                {pct}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <ShiftSeparatorRow label="Tarde" />
                    {afternoon.map((row, idx) => {
                      const pct =
                        totalCompleted > 0
                          ? Math.round((row.completed / totalCompleted) * 100)
                          : 0
                      return (
                        <TableRow key={row.hour} className={idx % 2 === 1 ? "bg-muted/20" : ""}>
                          <TableCell className="pl-5 font-mono text-sm font-medium">
                            {row.hour}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {row.completed.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <AnimatedProgressBar
                                value={pct}
                                delay={(morning.length + idx) * 60}
                              />
                              <span className="text-muted-foreground font-mono text-xs w-8 text-right">
                                {pct}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </section>
  )
}
