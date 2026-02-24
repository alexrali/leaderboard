"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { useTeamDayDetail } from "@/hooks/use-leaderboard-queries"

interface HeatmapDayDrawerProps {
  date: string | null
  onClose: () => void
}

export function HeatmapDayDrawer({ date, onClose }: HeatmapDayDrawerProps) {
  const { data, isLoading } = useTeamDayDetail(date)

  const formattedDate = date
    ? format(parseISO(date), "EEEE d 'de' MMMM yyyy", { locale: es })
    : ""

  const metrics = data
    ? [
        { label: "UE del Equipo", value: data.teamUE.toLocaleString("es-MX", { maximumFractionDigits: 1 }) },
        { label: "Trabajadores", value: String(data.activeWorkers) },
        { label: "Folios", value: String(data.totalFolios) },
        { label: "SKUs", value: String(data.totalSkus) },
        { label: "Peso (kg)", value: data.totalWeightKg.toLocaleString("es-MX", { maximumFractionDigits: 1 }) },
        { label: "Volumen (m³)", value: data.totalVolumeM3.toLocaleString("es-MX", { maximumFractionDigits: 2 }) },
      ]
    : []

  return (
    <Sheet open={!!date} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-[380px] sm:w-[460px] overflow-y-auto p-6">
        {date && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-base capitalize leading-snug">
                  {formattedDate}
                </SheetTitle>
                {data && (
                  <Badge
                    variant={data.totalFolios > 0 ? "default" : "secondary"}
                    className="shrink-0 mt-0.5"
                  >
                    {data.totalFolios > 0 ? "✅ Con actividad" : "Sin datos"}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            )}

            {!isLoading && data && (
              <div className="space-y-6">
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((m) => (
                    <Card key={m.label}>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-xs">{m.label}</p>
                        <p className="mt-1 text-xl font-bold">{m.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Mini hourly bar chart */}
                {data.hourly.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">UE por hora</p>
                    <div className="h-28">
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
                                <div className="border-border bg-card rounded-lg border px-3 py-2 text-xs shadow-lg">
                                  <p className="font-semibold">{label}</p>
                                  <p className="text-muted-foreground">
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
              <p className="text-muted-foreground py-8 text-center text-sm">
                Sin datos para este día.
              </p>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
