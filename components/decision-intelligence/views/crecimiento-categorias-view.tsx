"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MicroInsightsCategorias } from "../category/micro-insights-categorias"
import { PaisajeCrecimiento } from "../category/paisaje-crecimiento"
import { MatrizOportunidad } from "../category/matriz-oportunidad"
import { OptimizacionSurtido } from "../category/optimizacion-surtido"
import { MomentumCategoria } from "../category/momentum-categoria"
import { AccionesCrecimiento } from "../category/acciones-crecimiento"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
}

export function CrecimientoCategoriasView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <MicroInsightsCategorias />
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <PaisajeCrecimiento onCategorySelect={setSelectedCategory} />
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <MatrizOportunidad selectedCategory={selectedCategory} />
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
            <OptimizacionSurtido selectedCategory={selectedCategory} />
          </motion.div>
          <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
            <MomentumCategoria selectedCategory={selectedCategory} />
          </motion.div>
        </div>
      </div>
      <div className="xl:sticky xl:top-24 xl:h-fit">
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <AccionesCrecimiento selectedCategory={selectedCategory} />
        </motion.div>
      </div>
    </div>
  )
}
