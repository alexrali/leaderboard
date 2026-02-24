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
      <div className="border-border bg-card rounded-xl border px-4 py-3 shadow-lg">
        <p className="text-card-foreground mb-1.5 text-xs font-semibold">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-muted-foreground text-xs">
            Rutas:{" "}
            <span className="text-card-foreground font-mono font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DayProgressSection({ data }: DayProgressProps) {
  const hourlyBreakdown = data

  const midpoint = Math.ceil(hourlyBreakdown.length / 2)
  const morning = hourlyBreakdown.slice(0, midpoint)
  const afternoon = hourlyBreakdown.slice(midpoint)
  const sumCompleted = (rows: typeof hourlyBreakdown) => rows.reduce((s, r) => s + r.completed, 0)

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

  const avgTasksPerHour =
    data.length > 0 ? (data.reduce((s, r) => s + r.completed, 0) / data.length).toFixed(1) : "—"
  const peakHour =
    data.length > 0
      ? data.reduce((best, r) => (r.completed > best.completed ? r : best), data[0]).hour
      : "—"
  const totalCompleted = data.reduce((s, r) => s + r.completed, 0)
  const totalUE = data.reduce((s, r) => s + (r.teamUE ?? 0), 0)

  return (
    <section className="flex flex-col gap-6" aria-labelledby="day-progress-heading">
      <div className="flex items-center gap-2.5">
        <Clock className="text-primary size-4" />
        <h2 id="day-progress-heading" className="text-foreground text-base font-semibold">
          Progreso del Día
        </h2>
      </div>

      {/* Day Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">
              Rutas Hoy
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <CardTitle className="text-3xl font-bold">{totalCompleted.toLocaleString("es-MX")}</CardTitle>
            <div className="mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="text-success size-3.5" />
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
            <CardTitle className="text-3xl font-bold">
              {totalUE.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            </CardTitle>
            <div className="mt-2 flex items-center gap-1.5">
              <BarChart3 className="text-primary size-3.5" />
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
            <CardTitle className="text-3xl font-bold">{avgTasksPerHour}</CardTitle>
            <div className="mt-2 flex items-center gap-1.5">
              <Target className="text-info size-3.5" />
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
            <CardTitle className="text-3xl font-bold">{peakHour}</CardTitle>
            <div className="mt-2">
              <span className="text-muted-foreground text-xs">Mayor actividad</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Card className="rounded-2xl lg:col-span-2">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardDescription className="text-xs tracking-wide uppercase">
                  Completadas vs. Meta (por hora)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pt-0 pb-5">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        strokeOpacity={0.6}
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
                      <RechartsTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="var(--color-primary)"
                        strokeWidth={2.5}
                        fill="url(#completedGrad)"
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

            {/* Time Block Breakdown */}
            <Card className="rounded-2xl">
              <CardHeader className="px-5 pt-5 pb-3">
                <CardDescription className="text-xs tracking-wide uppercase">
                  Resumen por Turno
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 px-5 pt-0 pb-5">
                {timeBlocks.map((block) => {
                  const pct =
                    totalCompleted > 0 ? Math.round((block.completed / totalCompleted) * 100) : 0
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
                            <Progress value={pct} className="h-2 flex-1 rounded-full" />
                            <span className="text-foreground font-mono text-xs font-bold">
                              {block.completed.toLocaleString("es-MX")}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{pct}% del total del día</span>
                        </TooltipContent>
                      </Tooltip>
                      <Badge variant="outline" className="border-border text-muted-foreground w-fit rounded-full">
                        {pct}% del día
                      </Badge>
                    </div>
                  )
                })}

                {/* Quick Stats */}
                <div className="border-border bg-muted/30 mt-1 rounded-xl border p-4">
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Rutas / hora prom.</span>
                    <span className="text-foreground font-mono text-sm font-bold">
                      {avgTasksPerHour}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Hora pico</span>
                    <span className="text-foreground font-mono text-sm font-bold">{peakHour}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-sm font-semibold">Detalle por Hora</CardTitle>
              <CardDescription className="text-xs">
                Rutas completadas vs. meta por hora
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-muted-foreground pl-5 text-xs font-medium tracking-wide uppercase">
                      Hora
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-xs font-medium tracking-wide uppercase">
                      Rutas
                    </TableHead>
                    <TableHead className="text-muted-foreground pr-5 text-right text-xs font-medium tracking-wide uppercase">
                      % del día
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hourlyBreakdown.map((row) => {
                    const pct =
                      totalCompleted > 0
                        ? Math.round((row.completed / totalCompleted) * 100)
                        : 0
                    return (
                      <TableRow key={row.hour}>
                        <TableCell className="pl-5 font-mono text-sm font-medium">
                          {row.hour}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {row.completed.toLocaleString("es-MX")}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress
                              value={pct}
                              className="h-1.5 w-14 rounded-full"
                            />
                            <span className="text-muted-foreground font-mono text-xs w-8 text-right">{pct}%</span>
                          </div>
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
