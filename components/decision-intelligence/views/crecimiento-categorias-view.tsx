"use client"

import { useState } from "react"
import { MicroInsightsCategorias } from "../category/micro-insights-categorias"
import { PaisajeCrecimiento } from "../category/paisaje-crecimiento"
import { MatrizOportunidad } from "../category/matriz-oportunidad"
import { OptimizacionSurtido } from "../category/optimizacion-surtido"
import { MomentumCategoria } from "../category/momentum-categoria"
import { AccionesCrecimiento } from "../category/acciones-crecimiento"
import { ZoneDivider } from "../shared/zone-header"

export function CrecimientoCategoriasView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div role="tabpanel" aria-label="Crecimiento por Categoría" className="flex flex-col lg:flex-row border-y border-border animate-in fade-in duration-700">
      <div className="flex-1 bg-background min-w-0">
        <MicroInsightsCategorias />
        <ZoneDivider />
        <PaisajeCrecimiento onCategorySelect={setSelectedCategory} />
        <ZoneDivider />
        <MatrizOportunidad selectedCategory={selectedCategory} />
        <ZoneDivider />
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 min-w-0">
            <OptimizacionSurtido selectedCategory={selectedCategory} />
          </div>
          <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-border/60">
            <MomentumCategoria selectedCategory={selectedCategory} />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-80 xl:w-[360px] lg:shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-muted/70">
        <AccionesCrecimiento selectedCategory={selectedCategory} />
      </div>
    </div>
  )
}
