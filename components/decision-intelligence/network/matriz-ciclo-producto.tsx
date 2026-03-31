"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
} from "recharts"
import { ZoneHeaderBar, ZoneInsight, Legend } from "../shared/zone-header"
import { DI_COLORS, CHART } from "../shared/di-tokens"
import { productLifecycleData } from "../mock-data/network"
import type { ProductLifecycle } from "../mock-data/network"

const categoryColors: Record<string, string> = {
  Aceites:       CHART.opportunity,
  Limpieza:      CHART.total,
  "C. Personal": DI_COLORS.pink,
  Alimentos:     CHART.growth,
  Bebidas:       DI_COLORS.purple,
}

const getCategoryColor = (category: string): string =>
  categoryColors[category] ?? DI_COLORS.slate

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ProductLifecycle }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <p className="font-semibold text-foreground mb-1">{data.name}</p>
        <p className="text-xs text-muted-foreground mb-2">SKU: {data.sku}</p>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            Frecuencia:{" "}
            <span className="text-foreground font-medium">{data.frequency}%</span>
          </p>
          <p className="text-muted-foreground">
            Ingresos:{" "}
            <span className="text-foreground font-medium">{data.revenue}%</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getCategoryColor(data.category) }}
            />
            <span className="text-muted-foreground">{data.category}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function MatrizCicloProducto() {
  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: "200ms" }}>
      <ZoneHeaderBar
        title="CICLO DE VIDA DEL PRODUCTO"
        right={
          <Legend
            items={Object.entries(categoryColors).map(([cat, color]) => ({
              color,
              label: cat,
            }))}
          />
        }
      />
      <ZoneInsight
        message="Transicionar 4 SKUs nicho al portafolio core para Q4"
        variant="info"
      />
      <div className="px-6 py-5">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

              <ReferenceArea x1={0}  x2={50}  y1={50} y2={100} fill={CHART.growth} fillOpacity={0.04} />
              <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill={CHART.growth} fillOpacity={0.08} />
              <ReferenceArea x1={0}  x2={50}  y1={0}  y2={50}  fill={CHART.decline} fillOpacity={0.04} />
              <ReferenceArea x1={50} x2={100} y1={0}  y2={50}  fill={CHART.total} fillOpacity={0.04} />

              <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="4 4" />

              <XAxis
                type="number"
                dataKey="frequency"
                name="Frecuencia"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: DI_COLORS.slate, fontSize: 11 }}
                label={{
                  value: "Frecuencia de Venta (%)",
                  position: "bottom",
                  offset: 20,
                  style: { fill: DI_COLORS.slate, fontSize: 11, fontWeight: 500 },
                }}
              />
              <YAxis
                type="number"
                dataKey="revenue"
                name="Ingresos"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: DI_COLORS.slate, fontSize: 11 }}
                label={{
                  value: "Contribucion de Ingresos (%)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: DI_COLORS.slate, fontSize: 11, fontWeight: 500 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={productLifecycleData}>
                {productLifecycleData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={getCategoryColor(entry.category)}
                    fillOpacity={0.7}
                    r={6}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 border border-green-500/20 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium text-foreground">Oportunidades de Crecimiento</span>
            <span className="text-muted-foreground ml-auto">Baja frec, alto ing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium text-foreground">Portafolio Core</span>
            <span className="text-muted-foreground ml-auto">Alta frec, alto ing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="font-medium text-foreground">Bajo Rendimiento</span>
            <span className="text-muted-foreground ml-auto">Baja frec, bajo ing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="font-medium text-foreground">Nicho Estable</span>
            <span className="text-muted-foreground ml-auto">Alta frec, bajo ing</span>
          </div>
        </div>
      </div>
    </div>
  )
}
