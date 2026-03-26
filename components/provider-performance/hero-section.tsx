"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { TotalRevenue } from "@/components/provider-performance/total-revenue"
import { useProviderSummary } from "@/hooks/use-provider-queries"
import type { ProviderSummary } from "@/lib/provider-types"

type Period = "mtd" | "qtd" | "ytd"

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period
  onChange: (v: Period) => void
}) {
  const options: { value: Period; label: string }[] = [
    { value: "mtd", label: "Mes" },
    { value: "qtd", label: "Trim" },
    { value: "ytd", label: "Año" },
  ]
  return (
    <div
      className="flex border border-border divide-x divide-border"
      role="tablist"
      aria-label="Período"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.14em] transition-colors duration-150",
            value === o.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-muted-foreground bg-transparent",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function HeroSection() {
  const [period, setPeriod] = useState<Period>("mtd")
  const { data: summary } = useProviderSummary(period)

  return (
    <div className="px-6 pt-6 pb-5">
      <div className="flex items-start justify-between">
        <TotalRevenue summary={summary} />
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
    </div>
  )
}
