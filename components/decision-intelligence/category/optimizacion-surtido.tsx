"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { CardHeaderContent } from "../shared/card-header"
import { skuAssortmentData, type SkuAssortment } from "../mock-data/category"

const STATUS_LABELS: Record<SkuAssortment["status"], string> = {
  core: "Core",
  crecimiento: "Crecimiento",
  revisión: "Revisión",
  faltante: "Faltante",
}

const getStatusColor = (status: SkuAssortment["status"]) => {
  switch (status) {
    case "core":       return "#22C55E"
    case "crecimiento":return "#3B82F6"
    case "revisión":   return "#F59E0B"
    case "faltante":   return "#EF4444"
    default:           return "#64748B"
  }
}

const getStatusIcon = (status: SkuAssortment["status"]) => {
  switch (status) {
    case "core":       return CheckCircle
    case "crecimiento":return CheckCircle
    case "revisión":   return AlertTriangle
    case "faltante":   return XCircle
    default:           return Package
  }
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: SkuAssortment }>
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const StatusIcon = getStatusIcon(data.status)
    const statusColor = getStatusColor(data.status)
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <StatusIcon className="h-4 w-4" style={{ color: statusColor }} />
          <p className="font-semibold text-foreground">{data.name}</p>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Categoría</span>
            <span className="font-medium">{data.category}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Contribución (%)</span>
            <span className="font-medium">{data.contribution}%</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Distribución Tiendas</span>
            <span className="font-medium">{data.stores}%</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Acumulado (%)</span>
            <span className="font-medium">{data.cumulative}%</span>
          </div>
          <div className="flex justify-between gap-6 pt-2 border-t border-border">
            <span className="text-muted-foreground">Estado</span>
            <Badge
              variant="outline"
              className="text-xs capitalize"
              style={{ borderColor: statusColor, color: statusColor }}
            >
              {STATUS_LABELS[data.status]}
            </Badge>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function OptimizacionSurtido({
  selectedCategory,
}: {
  selectedCategory: string | null
}) {
  const [selectedStatus, setSelectedStatus] = useState<SkuAssortment["status"] | null>(null)

  const filteredData = selectedCategory
    ? skuAssortmentData.filter((item) => item.category === selectedCategory)
    : skuAssortmentData

  const displayData = selectedStatus
    ? filteredData.map((item) => ({
        ...item,
        _dimmed: item.status !== selectedStatus,
      }))
    : filteredData.map((item) => ({ ...item, _dimmed: false }))

  const statusCounts = {
    core:       skuAssortmentData.filter((s) => s.status === "core").length,
    crecimiento:skuAssortmentData.filter((s) => s.status === "crecimiento").length,
    revisión:   skuAssortmentData.filter((s) => s.status === "revisión").length,
    faltante:   skuAssortmentData.filter((s) => s.status === "faltante").length,
  } as Record<SkuAssortment["status"], number>

  const statuses = (["core", "crecimiento", "revisión", "faltante"] as SkuAssortment["status"][])

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={Package}
          iconColor="#F59E0B"
          title="Optimización de Surtido"
          description="Contribución y distribución de SKU"
        />

        {/* Status filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {statuses.map((status) => {
            const StatusIcon = getStatusIcon(status)
            const count = statusCounts[status]
            const isActive = selectedStatus === status
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(isActive ? null : status)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <StatusIcon
                  className="h-3.5 w-3.5"
                  style={{
                    color: isActive ? undefined : getStatusColor(status),
                  }}
                />
                <span>{STATUS_LABELS[status]}</span>
                <span className="px-1.5 py-0.5 rounded bg-background/20 text-[10px]">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                tick={{ fontSize: 10, fill: "#64748B" }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                tick={{ fontSize: 11, fill: "#64748B" }}
                label={{
                  value: "Contribución (%)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                  fill: "#64748B",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                tick={{ fontSize: 11, fill: "#64748B" }}
                domain={[0, 100]}
                label={{
                  value: "Acumulado (%)",
                  angle: 90,
                  position: "insideRight",
                  fontSize: 11,
                  fill: "#64748B",
                }}
              />

              <ReferenceLine
                yAxisId="right"
                y={80}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: "80%",
                  position: "right",
                  fontSize: 10,
                  fill: "#F59E0B",
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar
                yAxisId="left"
                dataKey="contribution"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStatusColor(entry.status)}
                    fillOpacity={entry._dimmed ? 0.2 : 0.8}
                  />
                ))}
              </Bar>

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#1F2937"
                strokeWidth={2}
                dot={{ fill: "#1F2937", r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#22C55E]/5 border border-[#22C55E]/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-[#22C55E]" />
              <span className="text-xs text-muted-foreground">SKUs Core</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {statusCounts.core}
            </p>
            <p className="text-[10px] text-muted-foreground">
              impulsan 75% de ingresos
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#3B82F6]/5 border border-[#3B82F6]/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-xs text-muted-foreground">En Crecimiento</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {statusCounts.crecimiento}
            </p>
            <p className="text-[10px] text-muted-foreground">
              potencial de expansión
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/10">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
              <span className="text-xs text-muted-foreground">En Revisión</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {statusCounts.revisión}
            </p>
            <p className="text-[10px] text-muted-foreground">
              bajo rendimiento
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#EF4444]/5 border border-[#EF4444]/10">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-[#EF4444]" />
              <span className="text-xs text-muted-foreground">Faltantes</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {statusCounts.faltante}
            </p>
            <p className="text-[10px] text-muted-foreground">
              gaps de alto impacto
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
