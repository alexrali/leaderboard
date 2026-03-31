"use client"

import { motion } from "framer-motion"
import { MicroInsightsAbastecimiento } from "../supply/micro-insights-abastecimiento"
import { MapaFlujoAbastecimiento } from "../supply/mapa-flujo-abastecimiento"
import { MatrizDesbalanceInventario } from "../supply/matriz-desbalance-inventario"
import { EnvejecimientoInventario } from "../supply/envejecimiento-inventario"
import { InteligenciaReposicion } from "../supply/inteligencia-reposicion"
import { AccionesAbastecimiento } from "../supply/acciones-abastecimiento"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
}

export function AbastecimientoView() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <MicroInsightsAbastecimiento />
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <MapaFlujoAbastecimiento />
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <MatrizDesbalanceInventario />
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
            <EnvejecimientoInventario />
          </motion.div>
          <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
            <InteligenciaReposicion />
          </motion.div>
        </div>
      </div>
      <div className="xl:sticky xl:top-24 xl:h-fit">
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <AccionesAbastecimiento />
        </motion.div>
      </div>
    </div>
  )
}
