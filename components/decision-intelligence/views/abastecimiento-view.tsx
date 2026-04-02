"use client"

import { MicroInsightsAbastecimiento } from "../supply/micro-insights-abastecimiento"
import { MapaFlujoAbastecimiento } from "../supply/mapa-flujo-abastecimiento"
import { MatrizDesbalanceInventario } from "../supply/matriz-desbalance-inventario"
import { EnvejecimientoInventario } from "../supply/envejecimiento-inventario"
import { InteligenciaReposicion } from "../supply/inteligencia-reposicion"
import { AccionesAbastecimiento } from "../supply/acciones-abastecimiento"
import { ZoneDivider } from "../shared/zone-header"

export function AbastecimientoView() {
  return (
    <div role="tabpanel" aria-label="Abastecimiento" className="flex flex-col lg:flex-row border-y border-[#ebebeb] animate-in fade-in duration-700">
      <div className="flex-1 bg-background min-w-0">
        <MicroInsightsAbastecimiento />
        <ZoneDivider />
        <MapaFlujoAbastecimiento />
        <ZoneDivider />
        <MatrizDesbalanceInventario />
        <ZoneDivider />
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 min-w-0">
            <EnvejecimientoInventario />
          </div>
          <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-[#ebebeb]/60">
            <InteligenciaReposicion />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-80 xl:w-[360px] lg:shrink-0 border-t lg:border-t-0 lg:border-l border-[#ebebeb] bg-[#fafafa]/70">
        <AccionesAbastecimiento />
      </div>
    </div>
  )
}
