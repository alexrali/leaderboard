"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, Flame, Award, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TeamMember } from "@/lib/leaderboard-data"
import { WorkerDetailDrawer } from "@/components/worker-detail-sheet"

function TrendIcon({ trend, value }: { trend: TeamMember["trend"]; value: number }) {
  if (trend === "up")
    return (
      <span
        className="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        aria-label={`Tendencia positiva: +${value}% con respecto al período anterior`}
      >
        <TrendingUp className="size-3" aria-hidden="true" />
        {"+"}
        {value}%
      </span>
    )
  if (trend === "down")
    return (
      <span
        className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        aria-label={`Tendencia negativa: -${value}% con respecto al período anterior`}
      >
        <TrendingDown className="size-3" aria-hidden="true" />
        {"-"}
        {value}%
      </span>
    )
  return (
    <span
      className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      aria-label={`Tendencia estable: ${value}% con respecto al período anterior`}
    >
      <Minus className="size-3" aria-hidden="true" />
      {value}%
    </span>
  )
}

function RankBadge({ rank, name }: { rank: number; name: string }) {
  const styles: Record<number, string> = {
    1: "bg-amber-100 text-amber-700 border-amber-200",
    2: "bg-slate-100 text-slate-600 border-slate-200",
    3: "bg-orange-100 text-orange-600 border-orange-200",
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold ${
            styles[rank] ?? "bg-muted text-muted-foreground border-border"
          }`}
        >
          {rank}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span>
          {rank === 1 ? "Gold" : rank === 2 ? "Silver" : rank === 3 ? "Bronze" : `#${rank}`}
          {" - "}
          {name}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

interface GeneralMetricsProps {
  members: TeamMember[]
  viewMode?: "daily" | "weekly"
}

export function GeneralMetrics({ members, viewMode = "daily" }: GeneralMetricsProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const totalTasks = members.reduce((acc, m) => acc + m.score, 0)
  const avgEfficiency =
    members.length > 0
      ? Math.round(members.reduce((acc, m) => acc + m.efficiency, 0) / members.length)
      : 0
  const totalHours = members.reduce((acc, m) => acc + m.hoursLogged, 0).toFixed(1)
  const topStreak = members.length > 0 ? Math.max(...members.map((m) => m.streak)) : 0

  return (
    <section className="flex flex-col gap-6" aria-labelledby="general-metrics-heading">
      <div className="flex items-center gap-2.5">
        <Award className="text-primary size-4" />
        <h2 id="general-metrics-heading" className="text-foreground text-base font-semibold">
          Métricas Generales
        </h2>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">
              UE Total (Equipo)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold">
                {totalTasks.toLocaleString("es-MX")}
              </CardTitle>
              <span className="text-muted-foreground text-sm">UE</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">
              Eficiencia Promedio
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <CardTitle className="text-3xl font-bold">{avgEfficiency}%</CardTitle>
            <Progress value={avgEfficiency} className="mt-3 h-1.5 rounded-full" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">
              Horas Trabajadas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold">{totalHours}</CardTitle>
              <span className="text-muted-foreground text-sm">hrs</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <Zap className="text-warning size-3.5" />
              <span className="text-muted-foreground text-xs">Acumulado del equipo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">
              Mejor Racha
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold">{topStreak}</CardTitle>
              <span className="text-muted-foreground text-sm">días</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <Flame className="text-primary size-3.5" />
              <span className="text-muted-foreground text-xs">
                {members.find((m) => m.streak === topStreak)?.name ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card className="overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table aria-label="Ranking del equipo - métricas de rendimiento por surtidor">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-muted-foreground w-16 pl-5 text-xs font-medium tracking-wide uppercase" scope="col">
                  Pos.
                </TableHead>
                <TableHead className="text-muted-foreground min-w-0 text-xs font-medium tracking-wide uppercase" scope="col">
                  Surtidor
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase md:table-cell" scope="col">
                  UE
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Folios
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  SKUs
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Qty
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Peso
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Volumen
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase sm:table-cell" scope="col">
                  Eficiencia
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-center text-xs font-medium tracking-wide uppercase lg:table-cell" scope="col">
                  Racha
                </TableHead>
                <TableHead className="text-muted-foreground pr-5 text-right text-xs font-medium tracking-wide uppercase" scope="col">
                  Tendencia
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow
                  key={member.id}
                  className="hover:bg-muted/60 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedMember(member)
                    setSheetOpen(true)
                  }}
                >
                  <TableCell className="pl-5">
                    <RankBadge rank={member.rank} name={member.name} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="border-muted size-9 border-2 shrink-0" aria-label={`Avatar for ${member.name}`}>
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-foreground text-sm font-semibold truncate">{member.name}</span>
                        <span className="text-muted-foreground text-xs truncate">{member.role}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    <span className="text-foreground font-mono text-sm font-bold">
                      {member.score.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.foliosCompleted ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.distinctSkus ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.totalQuantity ?? 0).toLocaleString("es-MX", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.weightKg ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}{" "}
                      kg
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.volumeM3 ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 3 })}{" "}
                      m³
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end gap-2.5">
                          <Progress value={member.efficiency} className="h-2 w-16 rounded-full" />
                          <span className="text-muted-foreground font-mono text-xs font-medium">
                            {member.efficiency}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>
                          {member.name}: {member.efficiency}% efficiency
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="hidden text-center lg:table-cell">
                    <Badge variant="outline" className="border-border gap-1 rounded-full">
                      <Flame className="text-primary size-3" />
                      {member.streak}d
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <TrendIcon trend={member.trend} value={member.trendValue} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <WorkerDetailDrawer
        member={selectedMember}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        viewMode={viewMode}
      />
    </section>
  )
}
