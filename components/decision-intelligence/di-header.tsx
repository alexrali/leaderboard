"use client"

import { cn } from "@/lib/utils"
import { ProviderSelector } from "./provider-selector"

interface DIHeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  providerCode: string
  onProviderChange: (code: string) => void
}

const tabs = [
  { value: "network", label: "RED", "aria-label": "Red de Tiendas" },
  { value: "category", label: "CATEGORÍA", "aria-label": "Crecimiento por Categoría" },
  { value: "supply", label: "ABASTECIMIENTO", "aria-label": "Abastecimiento" },
] as const

export function DIHeader({ activeTab, onTabChange, providerCode, onProviderChange }: DIHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-sm font-mono font-semibold tracking-tight">
          DI<span className="text-muted-foreground">.intel</span>
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-mono">
            3 vistas · {providerCode}
          </span>
          <ProviderSelector value={providerCode} onValueChange={onProviderChange} />
        </div>
      </div>

      <div className="bg-[#fafafa] border-t border-[#ebebeb]/60 px-6 py-2">
        <div
          role="tablist"
          className="flex shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] divide-x divide-[#ebebeb]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "px-4 py-1.5 text-[9px] font-mono uppercase tracking-[0.12em] transition-colors duration-150",
                activeTab === tab.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-muted-foreground"
              )}
              aria-label={tab["aria-label"]}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
