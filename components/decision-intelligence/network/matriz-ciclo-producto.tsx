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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardHeaderContent } from "../shared/card-header"
import { LayoutGrid } from "lucide-react"
import { productLifecycleData } from "../mock-data/network"
import type { ProductLifecycle } from "../mock-data/network"

const categoryColors: Record<string, string> = {
  Aceites:       "#F59E0B",
  Limpieza:      "#3B82F6",
  "C. Personal": "#EC4899",
  Alimentos:     "#22C55E",
  Bebidas:       "#8B5CF6",
}

const getCategoryColor = (category: string): string =>
  categoryColors[category] ?? "#64748B"

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
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={LayoutGrid}
          iconColor="#8B5CF6"
          title="Matriz de Ciclo de Vida de Producto"
          description="Frecuencia de venta vs contribución de ingresos"
          actions={
            <div className="flex flex-wrap gap-3 text-xs">
              {Object.entries(categoryColors).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-muted-foreground">{cat}</span>
                </div>
              ))}
            </div>
          }
        />
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />

              {/* Áreas de cuadrante */}
              <ReferenceArea x1={0}  x2={50}  y1={50} y2={100} fill="#22C55E" fillOpacity={0.04} />
              <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="#22C55E" fillOpacity={0.08} />
              <ReferenceArea x1={0}  x2={50}  y1={0}  y2={50}  fill="#EF4444" fillOpacity={0.04} />
              <ReferenceArea x1={50} x2={100} y1={0}  y2={50}  fill="#3B82F6" fillOpacity={0.04} />

              {/* Divisores de cuadrante */}
              <ReferenceLine x={50} stroke="#CBD5E1" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="#CBD5E1" strokeDasharray="4 4" />

              <XAxis
                type="number"
                dataKey="frequency"
                name="Frecuencia"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 11 }}
                label={{
                  value: "Frecuencia de Venta (%)",
                  position: "bottom",
                  offset: 20,
                  style: { fill: "#64748B", fontSize: 11, fontWeight: 500 },
                }}
              />
              <YAxis
                type="number"
                dataKey="revenue"
                name="Ingresos"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 11 }}
                label={{
                  value: "Contribución de Ingresos (%)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: "#64748B", fontSize: 11, fontWeight: 500 },
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

        {/* Etiquetas de cuadrante */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
            <span className="font-medium text-foreground">Oportunidades de Crecimiento</span>
            <span className="text-muted-foreground ml-auto">Baja frec, alto ing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
            <span className="font-medium text-foreground">Portafolio Core</span>
            <span className="text-muted-foreground ml-auto">Alta frec, alto ing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-[#EF4444]" />
            <span className="font-medium text-foreground">Bajo Rendimiento</span>
            <span className="text-muted-foreground ml-auto">Baja frec, bajo ing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
            <span className="font-medium text-foreground">Nicho Estable</span>
            <span className="text-muted-foreground ml-auto">Alta frec, bajo ing</span>
          </div>
        </div>

        {/* Banner de insight */}
        <div className="mt-4 px-4 py-3 bg-[#EFF6FF] border border-[#3B82F6]/20 rounded-lg">
          <span className="text-sm font-medium text-[#1E40AF]">
            Transicionar 4 SKUs nicho al portafolio core para Q4
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
