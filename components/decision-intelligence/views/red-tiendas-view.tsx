"use client"

import { motion } from "framer-motion"
import { MicroInsightsRed } from "../network/micro-insights-red"
import { MapaRendimientoRed } from "../network/mapa-rendimiento-red"
import { MotorOportunidades } from "../network/motor-oportunidades"
import { MatrizCicloProducto } from "../network/matriz-ciclo-producto"
import { CascadaCrecimiento } from "../network/cascada-crecimiento"
import { AccionesPrioritarias } from "../network/acciones-prioritarias"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
}

export function RedTiendasView() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      {/* Columna izquierda */}
      <div className="space-y-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <MicroInsightsRed />
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <MapaRendimientoRed />
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <MotorOportunidades />
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
            <MatrizCicloProducto />
          </motion.div>
          <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
            <CascadaCrecimiento />
          </motion.div>
        </div>
      </div>
      {/* Columna derecha fija */}
      <div className="xl:sticky xl:top-24 xl:h-fit">
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <AccionesPrioritarias />
        </motion.div>
      </div>
    </div>
  )
}
