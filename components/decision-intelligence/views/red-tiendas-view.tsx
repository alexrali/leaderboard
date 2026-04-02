"use client"

import { MicroInsightsRed } from "../network/micro-insights-red"
import { MapaRendimientoRed } from "../network/mapa-rendimiento-red"
import { MotorOportunidades } from "../network/motor-oportunidades"
import { MatrizCicloProducto } from "../network/matriz-ciclo-producto"
import { CascadaCrecimiento } from "../network/cascada-crecimiento"
import { AccionesPrioritarias } from "../network/acciones-prioritarias"
import { ZoneDivider } from "../shared/zone-header"

export function RedTiendasView() {
  return (
    <div role="tabpanel" aria-label="Red de Tiendas" className="flex flex-col lg:flex-row border-y border-[#ebebeb] animate-in fade-in duration-700">
      <div className="flex-1 bg-background min-w-0">
        <MicroInsightsRed />
        <ZoneDivider />
        <MapaRendimientoRed />
        <ZoneDivider />
        <MotorOportunidades />
        <ZoneDivider />
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 min-w-0">
            <MatrizCicloProducto />
          </div>
          <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-[#ebebeb]/60">
            <CascadaCrecimiento />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-80 xl:w-[360px] lg:shrink-0 border-t lg:border-t-0 lg:border-l border-[#ebebeb] bg-[#fafafa]/70">
        <AccionesPrioritarias />
      </div>
    </div>
  )
}
