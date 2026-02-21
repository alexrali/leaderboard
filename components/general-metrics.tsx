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
import type { TeamSummary } from "@/lib/leaderboard-queries"
import { WorkerDetailDrawer } from "@/components/worker-detail-sheet"

function TrendIcon({ trend, value }: { trend: TeamMember["trend"]; value: number }) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        <TrendingUp className="size-3" />
        {"+"}
        {value}%
      </span>
    )
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        <TrendingDown className="size-3" />
        {"-"}
        {value}%
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="size-3" />
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
  teamSummary?: TeamSummary | null
  viewMode?: "daily" | "weekly"
}

export function GeneralMetrics({ members, teamSummary, viewMode = "daily" }: GeneralMetricsProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const totalTasks = teamSummary?.teamTotalUE ?? members.reduce((acc, m) => acc + m.score, 0)
  const totalTarget = members.reduce((acc, m) => acc + m.tasksTotal, 0)
  const avgEfficiency = members.length > 0
    ? Math.round(members.reduce((acc, m) => acc + m.efficiency, 0) / members.length)
    : 0
  const totalHours = members.reduce((acc, m) => acc + m.hoursLogged, 0).toFixed(1)
  const topStreak = members.length > 0 ? Math.max(...members.map((m) => m.streak)) : 0

  return (
    <section className="flex flex-col gap-6" aria-labelledby="general-metrics-heading">
      <div className="flex items-center gap-2.5">
        <Award className="size-4 text-primary" />
        <h2 id="general-metrics-heading" className="text-base font-semibold text-foreground">
          Métricas Generales
        </h2>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">UE Total (Equipo)</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold">{totalTasks.toLocaleString("es-MX")}</CardTitle>
              <span className="text-sm text-muted-foreground">UE</span>
            </div>
            <Progress value={totalTarget > 0 ? (totalTasks / totalTarget) * 100 : 0} className="mt-3 h-1.5 rounded-full" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Eficiencia Promedio</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <CardTitle className="text-3xl font-bold">{avgEfficiency}%</CardTitle>
            <Progress value={avgEfficiency} className="mt-3 h-1.5 rounded-full" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Horas Trabajadas</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold">{totalHours}</CardTitle>
              <span className="text-sm text-muted-foreground">hrs</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <Zap className="size-3.5 text-warning" />
              <span className="text-xs text-muted-foreground">Acumulado del equipo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Mejor Racha</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold">{topStreak}</CardTitle>
              <span className="text-sm text-muted-foreground">días</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <Flame className="size-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">
                {members.find((m) => m.streak === topStreak)?.name ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card className="overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-16 pl-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pos.</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Surtidor</TableHead>
                <TableHead className="hidden text-right md:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">UE</TableHead>
                <TableHead className="hidden text-right xl:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">Folios</TableHead>
                <TableHead className="hidden text-right xl:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">SKUs</TableHead>
                <TableHead className="hidden text-right xl:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">Qty</TableHead>
                <TableHead className="hidden text-right xl:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">Peso</TableHead>
                <TableHead className="hidden text-right xl:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">Volumen</TableHead>
                <TableHead className="hidden text-right sm:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">Eficiencia</TableHead>
                <TableHead className="hidden text-center lg:table-cell text-xs font-medium uppercase tracking-wide text-muted-foreground">Racha</TableHead>
                <TableHead className="pr-5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Tendencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow
                  key={member.id}
                  className="transition-colors cursor-pointer hover:bg-muted/60"
                  onClick={() => { setSelectedMember(member); setSheetOpen(true) }}
                >
                  <TableCell className="pl-5">
                    <RankBadge rank={member.rank} name={member.name} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border-2 border-muted">
                        <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{member.name}</span>
                        <span className="text-xs text-muted-foreground">{member.role}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {member.score.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">
                      {(member.foliosCompleted ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">
                      {(member.distinctSkus ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">
                      {(member.totalQuantity ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">
                      {(member.weightKg ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">
                      {(member.volumeM3 ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 3 })} m³
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end gap-2.5">
                          <Progress
                            value={member.efficiency}
                            className="h-2 w-16 rounded-full"
                          />
                          <span className="font-mono text-xs font-medium text-muted-foreground">
                            {member.efficiency}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{member.name}: {member.efficiency}% efficiency</span>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="hidden text-center lg:table-cell">
                    <Badge variant="outline" className="gap-1 rounded-full border-border">
                      <Flame className="size-3 text-primary" />
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
