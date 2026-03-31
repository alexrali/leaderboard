"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProviderSelector } from "./provider-selector"

interface DIHeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  providerCode: string
  onProviderChange: (code: string) => void
}

export function DIHeader({ activeTab, onTabChange, providerCode, onProviderChange }: DIHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-foreground">Inteligencia Decisional</span>
          <ProviderSelector value={providerCode} onValueChange={onProviderChange} />
        </div>

        <div className="flex-1 flex justify-center">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="h-8">
              <TabsTrigger value="network" className="text-xs px-3">
                Red de Tiendas
              </TabsTrigger>
              <TabsTrigger value="category" className="text-xs px-3">
                Crecimiento por Categoría
              </TabsTrigger>
              <TabsTrigger value="supply" className="text-xs px-3">
                Abastecimiento
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
