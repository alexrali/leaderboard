"use client"

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Weight,
  BarChart3,
  Users,
  FileText,
  Layers,
  Flame,
  Trophy,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import type { TeamMember } from "@/lib/leaderboard-data"
import type { WeeklyTeamSummary, DailyTrend } from "@/lib/leaderboard-queries"

// ─── Delta badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span className="text-muted-foreground text-xs">—</span>
  const pct = ((current - previous) / previous) * 100
  const abs = Math.abs(pct).toFixed(1)
  if (pct > 0.5)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <TrendingUp className="size-3" />+{abs}%
      </span>
    )
  if (pct < -0.5)
    return (
      <span className="text-destructive inline-flex items-center gap-0.5 text-xs font-medium">
        <TrendingDown className="size-3" />-{abs}%
      </span>
    )
  return (
    <span className="text-muted-foreground inline-flex items-center gap-0.5 text-xs font-medium">
      <Minus className="size-3" />
      {abs}%
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  current,
  previous,
}: {
  label: string
  value: string
  unit?: string
  icon: React.ElementType
  current?: number
  previous?: number
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-5 pt-5 pb-1">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs tracking-wide uppercase">{label}</CardDescription>
          <div className="bg-primary/8 text-primary flex size-7 items-center justify-center rounded-lg">
            <Icon className="size-3.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-1 pb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-foreground text-2xl font-bold">{value}</span>
          {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
        </div>
        {current !== undefined && previous !== undefined && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <DeltaBadge current={current} previous={previous} />
            <span className="text-muted-foreground text-[10px]">vs sem. anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Podium card ──────────────────────────────────────────────────────────────

const podiumStyles: Record<number, { ring: string; badge: string; label: string }> = {
  1: {
    ring: "ring-2 ring-amber-400/60",
    badge: "bg-amber-100 text-amber-700 border-amber-300",
    label: "🥇",
  },
  2: {
    ring: "ring-2 ring-slate-300/80",
    badge: "bg-slate-100 text-slate-600 border-slate-300",
    label: "🥈",
  },
  3: {
    ring: "ring-2 ring-orange-300/60",
    badge: "bg-orange-100 text-orange-600 border-orange-300",
    label: "🥉",
  },
}

function PodiumCard({ member }: { member: TeamMember }) {
  const style = podiumStyles[member.rank] ?? {
    ring: "",
    badge: "bg-muted text-muted-foreground border-border",
    label: `#${member.rank}`,
  }
  return (
    <Card className={`rounded-2xl ${style.ring}`}>
      <CardContent className="flex flex-col items-center gap-3 px-5 py-5">
        <div className="relative">
          <Avatar className="border-muted size-14 border-2">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-bold">
              {member.avatar}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -right-1 -bottom-1 text-base leading-none">{style.label}</span>
        </div>
        <div className="text-center">
          <p className="text-foreground text-sm leading-tight font-semibold">{member.name}</p>
          <p className="text-muted-foreground text-[11px]">{member.role}</p>
        </div>
        <Separator className="opacity-20" />
        <div className="grid w-full grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-muted-foreground text-xs">UE</p>
            <p className="text-foreground font-mono text-sm font-bold">
              {member.score.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Efic.</p>
            <p className="text-foreground font-mono text-sm font-bold">{member.efficiency}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Folios</p>
            <p className="text-foreground font-mono text-sm font-bold">
              {(member.foliosCompleted ?? 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">SKUs</p>
            <p className="text-foreground font-mono text-sm font-bold">
              {(member.distinctSkus ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
        {member.streak > 0 && (
          <Badge variant="outline" className="border-border gap-1 rounded-full text-[10px]">
            <Flame className="text-primary size-2.5" />
            {member.streak}d racha
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Custom bar chart tooltip ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="border-border/60 bg-background rounded-xl border px-3 py-2 text-xs shadow-lg">
      <p className="text-foreground mb-1 font-semibold">{label}</p>
      <p className="text-muted-foreground">
        UE:{" "}
        <span className="text-foreground font-mono font-bold">
          {Number(payload[0]?.value ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
        </span>
      </p>
      {payload[1] && (
        <p className="text-muted-foreground">
          Surtidores:{" "}
          <span className="text-foreground font-mono font-bold">{payload[1].value}</span>
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WeeklyOverviewProps {
  members: TeamMember[]
  weeklySummary: WeeklyTeamSummary | null
  dailyTrend: DailyTrend[]
}

export function WeeklyOverview({ members, weeklySummary, dailyTrend }: WeeklyOverviewProps) {
  const top3 = members.slice(0, 3)
  const restMembers = members.slice(3)

  const maxUE = dailyTrend.length > 0 ? Math.max(...dailyTrend.map((d) => d.teamUE)) : 1

  if (!weeklySummary && members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="text-muted-foreground/40 mb-3 size-10" />
        <p className="text-muted-foreground text-sm">No hay datos semanales disponibles aún.</p>
        <p className="text-muted-foreground/60 mt-1 text-xs">
          Los datos aparecerán una vez que el ETL procese la semana actual.
        </p>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-8" aria-labelledby="weekly-overview-heading">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="text-primary size-4" />
          <h2 id="weekly-overview-heading" className="text-foreground text-base font-semibold">
            Resumen Semanal
          </h2>
          {weeklySummary && (
            <Badge variant="outline" className="rounded-full text-[10px] font-medium">
              Semana {weeklySummary.currentWeek} · {weeklySummary.currentYear}
            </Badge>
          )}
        </div>
        {weeklySummary && (
          <span className="text-muted-foreground text-xs">
            {weeklySummary.activeWorkers} surtidores activos
          </span>
        )}
      </div>

      {/* KPI Row */}
      {weeklySummary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="UE Total Equipo"
            value={weeklySummary.teamTotalUE.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            unit="UE"
            icon={Trophy}
            current={weeklySummary.teamTotalUE}
            previous={weeklySummary.prevTeamTotalUE}
          />
          <KpiCard
            label="Folios Completados"
            value={weeklySummary.totalFolios.toLocaleString("es-MX")}
            icon={FileText}
          />
          <KpiCard
            label="SKUs (Total)"
            value={weeklySummary.totalSkus.toLocaleString("es-MX")}
            icon={Layers}
          />
          <KpiCard
            label="Peso Total"
            value={weeklySummary.totalWeightKg.toLocaleString("es-MX", {
              maximumFractionDigits: 0,
            })}
            unit="kg"
            icon={Weight}
          />
          <KpiCard
            label="Volumen Total"
            value={weeklySummary.totalVolumeM3.toLocaleString("es-MX", {
              maximumFractionDigits: 1,
            })}
            unit="m³"
            icon={Package}
          />
        </div>
      )}

      {/* Daily Trend Chart + WoW Comparison */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Bar chart — takes 2/3 width on lg */}
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="px-5 pt-5 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">UE por Día</CardTitle>
                <CardDescription className="text-xs">
                  Producción diaria del equipo esta semana
                </CardDescription>
              </div>
              <BarChart3 className="text-muted-foreground size-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {dailyTrend.length === 0 ? (
              <div className="text-muted-foreground flex h-40 items-center justify-center text-xs">
                Sin datos de tendencia diaria
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={dailyTrend}
                  barSize={32}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <RechartsTooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "var(--muted)", radius: 6 }}
                  />
                  <Bar dataKey="teamUE" radius={[6, 6, 0, 0]}>
                    {dailyTrend.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.teamUE === maxUE
                            ? "var(--primary)"
                            : "color-mix(in oklch, var(--primary) 35%, transparent)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Week-over-Week comparison — 1/3 width on lg */}
        {weeklySummary && (
          <Card className="rounded-2xl">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-sm font-semibold">Semana vs Anterior</CardTitle>
              <CardDescription className="text-xs">
                Sem. {weeklySummary.currentWeek} vs Sem.{" "}
                {weeklySummary.currentWeek > 1 ? weeklySummary.currentWeek - 1 : 52}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              {[
                {
                  label: "UE Total",
                  current: weeklySummary.teamTotalUE,
                  previous: weeklySummary.prevTeamTotalUE,
                  fmt: (v: number) => v.toLocaleString("es-MX", { maximumFractionDigits: 0 }),
                },
                {
                  label: "UE / Surtidor",
                  current: weeklySummary.avgUEPerWorker,
                  previous: weeklySummary.prevAvgUEPerWorker,
                  fmt: (v: number) => v.toLocaleString("es-MX", { maximumFractionDigits: 1 }),
                },
                {
                  label: "Eficiencia Prom.",
                  current: weeklySummary.avgEfficiency,
                  previous: weeklySummary.prevAvgEfficiency,
                  fmt: (v: number) => `${v}%`,
                },
                {
                  label: "Surtidores",
                  current: weeklySummary.activeWorkers,
                  previous: weeklySummary.prevActiveWorkers,
                  fmt: (v: number) => String(v),
                },
              ].map(({ label, current, previous, fmt }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-mono text-xs font-semibold">
                      {fmt(current)}
                    </span>
                    <DeltaBadge current={current} previous={previous} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Podium — Top 3 */}
      {top3.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <h3 className="text-foreground text-sm font-semibold">Top 3 de la Semana</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {top3.map((m) => (
              <PodiumCard key={m.id} member={m} />
            ))}
          </div>
        </div>
      )}

      {/* Rest of ranking */}
      {restMembers.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Users className="text-muted-foreground size-4" />
            Clasificación Completa
          </h3>
          <Card className="overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    <th className="w-14 py-3 pl-5 text-left">Pos.</th>
                    <th className="py-3 text-left">Surtidor</th>
                    <th className="hidden py-3 pr-4 text-right md:table-cell">UE</th>
                    <th className="hidden py-3 pr-4 text-right lg:table-cell">Folios</th>
                    <th className="hidden py-3 pr-4 text-right lg:table-cell">SKUs</th>
                    <th className="hidden py-3 pr-4 text-right sm:table-cell">Efic.</th>
                    <th className="py-3 pr-5 text-right">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {restMembers.map((member, idx) => (
                    <tr
                      key={member.id}
                      className={`border-border/30 hover:bg-muted/20 border-t transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="py-3 pl-5">
                        <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full text-xs font-bold">
                          {member.rank}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="border-muted size-8 border">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-foreground text-xs leading-tight font-semibold">
                              {member.name}
                            </span>
                            {member.streak > 0 && (
                              <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
                                <Flame className="text-primary size-2.5" />
                                {member.streak}d
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 pr-4 text-right md:table-cell">
                        <span className="text-foreground font-mono text-xs font-bold">
                          {member.score.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="hidden py-3 pr-4 text-right lg:table-cell">
                        <span className="text-muted-foreground font-mono text-xs">
                          {(member.foliosCompleted ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="hidden py-3 pr-4 text-right lg:table-cell">
                        <span className="text-muted-foreground font-mono text-xs">
                          {(member.distinctSkus ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="hidden py-3 pr-4 text-right sm:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={member.efficiency} className="h-1.5 w-12 rounded-full" />
                          <span className="text-muted-foreground w-7 font-mono text-[10px]">
                            {member.efficiency}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-5 text-right">
                        {member.trend === "up" ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                            <TrendingUp className="size-2.5" />+{member.trendValue}%
                          </span>
                        ) : member.trend === "down" ? (
                          <span className="bg-destructive/10 text-destructive inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium">
                            <TrendingDown className="size-2.5" />-{member.trendValue}%
                          </span>
                        ) : (
                          <span className="bg-muted text-muted-foreground inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium">
                            <Minus className="size-2.5" />
                            {member.trendValue}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
