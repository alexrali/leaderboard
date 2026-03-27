"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ChartSkeleton } from "@/components/ui/loading-skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { useTeamDayDetail } from "@/hooks/use-leaderboard-queries"
import { Zap, Users, FileText, Package, Weight, Box } from "lucide-react"

interface HeatmapDayDrawerProps {
  date: string | null
  onClose: () => void
}

export function HeatmapDayDrawer({ date, onClose }: HeatmapDayDrawerProps) {
  const { data, isLoading } = useTeamDayDetail(date)

  const formattedDate = date
    ? format(parseISO(date), "EEEE d 'de' MMMM yyyy", { locale: es })
    : ""

  // Animated counters for hero stats
  const animatedUE = useAnimatedCounter(data?.teamUE ?? 0, { duration: 1200, delay: 100, decimals: 1 })
  const animatedWorkers = useAnimatedCounter(data?.activeWorkers ?? 0, { duration: 1200, delay: 200 })
  const animatedFolios = useAnimatedCounter(data?.totalFolios ?? 0, { duration: 1200, delay: 300 })

  return (
    <Sheet open={!!date} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
            <SheetDescription className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Detalle del Día
            </SheetDescription>
          </div>
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-2xl font-mono font-bold tracking-tight capitalize leading-snug">
              {formattedDate}
            </SheetTitle>
            {data && (
              <Badge
                variant={data.totalFolios > 0 ? "default" : "secondary"}
                className="shrink-0 mt-1"
              >
                {data.totalFolios > 0 ? "Con actividad" : "Sin datos"}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {isLoading && (
          <div className="p-4 pt-6 space-y-6">
            <ChartSkeleton showLabel={false} />
          </div>
        )}

        {!isLoading && data && (
          <div className="space-y-8 p-4 pt-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  UE del Equipo
                </p>
                <p className="text-4xl font-mono font-bold tracking-tight">
                  {animatedUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                </p>
                <p className="text-[10px] text-muted-foreground">unidades estiba</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Trabajadores Activos
                </p>
                <p className="text-4xl font-mono font-bold tracking-tight">
                  {animatedWorkers.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">en el día</p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/40 rounded-lg">
              <div className="text-center">
                <FileText className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-lg font-mono font-bold">{animatedFolios.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Folios</p>
              </div>
              <div className="text-center">
                <Package className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-lg font-mono font-bold">{data.totalSkus.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">SKUs</p>
              </div>
              <div className="text-center">
                <Weight className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-lg font-mono font-bold">
                  {data.totalWeightKg.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Peso (kg)</p>
              </div>
              <div className="text-center">
                <Box className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-lg font-mono font-bold">
                  {data.totalVolumeM3.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Vol. (m3)</p>
              </div>
            </div>

            {/* Hourly Bar Chart */}
            {data.hourly.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  UE por Hora
                </p>
                <div className="h-36 w-full bg-muted/20 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hourly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-md px-3 py-2 shadow-lg">
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                              <p className="font-mono text-sm font-semibold">
                                {Number(payload[0].value).toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="teamUE" fill="#16a34a" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && !data && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Zap className="size-5" />
            </div>
            <p className="text-muted-foreground text-sm">
              Sin datos para este día.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
