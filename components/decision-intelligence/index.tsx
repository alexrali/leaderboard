"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { DIHeader } from "./di-header"
import { RedTiendasView } from "./views/red-tiendas-view"
import { CrecimientoCategoriasView } from "./views/crecimiento-categorias-view"
import { AbastecimientoView } from "./views/abastecimiento-view"

export function DecisionIntelligencePage() {
  const [activeTab, setActiveTab] = useState("network")
  const [providerCode, setProviderCode] = useState("0128")

  return (
    <div className="bg-muted/50 overflow-hidden -mx-4 -my-8 md:-mx-6 lg:-mx-8 lg:-my-10">
      <DIHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        providerCode={providerCode}
        onProviderChange={setProviderCode}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "network" && <RedTiendasView />}
          {activeTab === "category" && <CrecimientoCategoriasView />}
          {activeTab === "supply" && <AbastecimientoView />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
