"use client"

import { useState, useEffect, useMemo, useId } from "react"
import { Package, Weight, Box, Zap, BarChart3 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import type { TeamMember } from "@/lib/leaderboard-data"
import { getWorkerFolioDetail, type FolioDetail } from "@/lib/leaderboard-queries"

// ─── Stat tile with animated counter ───────────────────────────────────────────

function StatTile({
  icon: Icon,
  value,
  label,
  delay = 0,
  decimals = 0,
}: {
  icon: React.ElementType
  value: number
  label: string
  delay?: number
  decimals?: number
}) {
  const animatedValue = useAnimatedCounter(value, {
    duration: 1200,
    delay,
    decimals,
  })

  return (
    <div className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
      <Icon className="text-primary mb-1 size-3.5" />
      <span className="text-foreground text-xs font-bold tabular-nums">
        {animatedValue.toLocaleString("es-MX", { maximumFractionDigits: decimals })}
      </span>
      <span className="text-muted-foreground text-[10px]">{label}</span>
    </div>
  )
}

// ─── Loading skeleton for stat tiles ───────────────────────────────────────────

function StatTilesSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 px-6 pb-4 sm:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
          <Skeleton className="mb-1 size-3.5 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
          <Skeleton className="mt-1 h-2 w-6 rounded" />
        </div>
      ))}
    </div>
  )
}

// ─── Daily UE sparkline chart ──────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  1: "Lun", 2: "Mar", 3: "Mie", 4: "Jue", 5: "Vie", 6: "Sab", 0: "Dom",
}

function DailyUESparkline({ details }: { details: FolioDetail[] }) {
  const uid = useId().replace(/:/g, "")

  // Group details by date and sum UE
  const dailyData = useMemo(() => {
    const byDate = new Map<string, number>()
    for (const d of details) {
      const current = byDate.get(d.date) ?? 0
      byDate.set(d.date, current + d.ue)
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, ue]) => {
        const d = new Date(date + "T12:00:00")
        return {
          date,
          label: DAY_LABELS[d.getDay()] ?? date,
          ue: parseFloat(ue.toFixed(1)),
        }
      })
  }, [details])

  if (dailyData.length < 2) return null

  const maxUE = Math.max(...dailyData.map((d) => d.ue), 1)

  return (
    <div className="px-6 pb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className="text-muted-foreground size-3.5" />
        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          UE por dia
        </span>
      </div>
      <div className="h-20 w-full bg-muted/20 rounded-lg p-1.5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dailyData}
            barSize={16}
            margin={{ top: 2, right: 2, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id={`sparkMuted-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 8, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0]?.payload
                  return (
                    <div className="border-border/60 bg-background rounded-md border px-2 py-1.5 text-xs shadow-lg">
                      <p className="text-muted-foreground text-[10px]">{entry?.date}</p>
                      <p className="font-mono text-xs font-semibold">
                        {Number(payload[0]?.value ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="ue" radius={[3, 3, 0, 0]}>
              {dailyData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.ue === maxUE
                      ? `url(#spark-${uid})`
                      : `url(#sparkMuted-${uid})`
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Loading skeleton for the detail table ─────────────────────────────────────

function DetailTableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[700px] w-full text-xs">
        <thead>
          <tr className="bg-muted/40">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-2.5">
                <Skeleton className="h-3 w-12 mx-auto rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-muted/10" : ""}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-2.5">
                  <Skeleton className="h-3 w-16 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main drawer component ─────────────────────────────────────────────────────

interface WorkerDetailDrawerProps {
  member: TeamMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  viewMode: "daily" | "weekly"
}

export function WorkerDetailDrawer({
  member,
  open,
  onOpenChange,
  viewMode,
}: WorkerDetailDrawerProps) {
  const [details, setDetails] = useState<FolioDetail[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !member) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetails([])
      return
    }

    let cancelled = false
    setLoading(true)

    getWorkerFolioDetail(member.id, viewMode)
      .then((data) => {
        if (!cancelled) setDetails(data)
      })
      .catch((err) => {
        console.error("Error fetching worker detail:", err)
        if (!cancelled) setDetails([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, member, viewMode])

  // Derived values (memoized to avoid recalculating on every render)
  const stats = useMemo(() => {
    const totalUE = details.reduce((s, d) => s + d.ue, 0)
    const totalQty = details.reduce((s, d) => s + d.quantity, 0)
    const totalWeight = details.reduce((s, d) => s + d.totalWeight, 0)
    const totalVolume = details.reduce((s, d) => s + d.totalVolume, 0)
    const uniqueFolios = new Set(details.map((d) => d.folio)).size
    const uniqueSkus = new Set(details.map((d) => d.itemCode)).size
    return { totalUE, totalQty, totalWeight, totalVolume, uniqueFolios, uniqueSkus }
  }, [details])

  const tableColumns = viewMode === "weekly" ? 8 : 7

  if (!member) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85vh] flex-col">
        <DrawerHeader className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="border-muted size-10 border-2" aria-label={`Avatar for ${member.name}`}>
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <DrawerTitle className="text-base">{member.name}</DrawerTitle>
              <DrawerDescription className="text-xs">
                {viewMode === "daily" ? "Detalle del dia" : "Detalle de la semana"} — {member.role}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        {/* Stat tiles */}
        {loading ? (
          <StatTilesSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-3 px-6 pb-4 sm:grid-cols-6">
            <StatTile icon={Zap} value={stats.totalUE} label="UE" delay={0} decimals={1} />
            <StatTile icon={Package} value={stats.uniqueFolios} label="Folios" delay={80} />
            <StatTile icon={Box} value={stats.uniqueSkus} label="SKUs" delay={160} />
            <StatTile icon={Box} value={stats.totalQty} label="Qty" delay={240} />
            <StatTile icon={Weight} value={stats.totalWeight} label="kg" delay={320} decimals={1} />
            <StatTile icon={Box} value={stats.totalVolume} label="m³" delay={400} decimals={3} />
          </div>
        )}

        {/* Daily UE sparkline (only in weekly mode when we have data) */}
        {!loading && viewMode === "weekly" && details.length > 0 && (
          <DailyUESparkline details={details} />
        )}

        <Separator />

        {/* Detail table */}
        <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
          {loading ? (
            <div className="py-4">
              <DetailTableSkeleton columns={tableColumns} />
            </div>
          ) : details.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-muted-foreground text-sm">Sin registros para este periodo</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    {viewMode === "weekly" && (
                      <TableHead className="text-muted-foreground pl-4 text-[10px] font-medium tracking-wide uppercase">
                        Fecha
                      </TableHead>
                    )}
                    <TableHead className="text-muted-foreground pl-4 text-[10px] font-medium tracking-wide uppercase">
                      Hora
                    </TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      Folio
                    </TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      SKU
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-[10px] font-medium tracking-wide uppercase">
                      Qty
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-[10px] font-medium tracking-wide uppercase">
                      Peso
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-[10px] font-medium tracking-wide uppercase">
                      Volumen
                    </TableHead>
                    <TableHead className="text-muted-foreground pr-4 text-right text-[10px] font-medium tracking-wide uppercase">
                      UE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((row, i) => (
                    <TableRow
                      key={`${row.folio}-${row.itemCode}-${row.hourBucket}-${i}`}
                      className="text-xs"
                    >
                      {viewMode === "weekly" && (
                        <TableCell className="text-muted-foreground pl-4 font-mono">
                          {row.date}
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground pl-4 font-mono">
                        {new Date(row.hourBucket).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-md font-mono text-[10px]">
                          {row.folio}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{row.itemCode}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.quantity.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right font-mono">
                        {row.totalWeight.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right font-mono">
                        {row.totalVolume.toLocaleString("es-MX", { maximumFractionDigits: 4 })}
                      </TableCell>
                      <TableCell className="pr-4 text-right font-mono font-semibold">
                        {row.ue.toLocaleString("es-MX", { maximumFractionDigits: 3 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!loading && details.length > 0 && (
          <>
            <Separator />
            <div className="text-muted-foreground flex items-center justify-between px-6 py-3 text-xs">
              <span>{details.length} registros</span>
              <span>
                {stats.uniqueFolios} folios · {stats.uniqueSkus} SKUs ·{" "}
                {stats.totalUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE
              </span>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
