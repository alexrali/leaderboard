"use client"

import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { Zap, Users, FileText, Flame } from "lucide-react"
import type { PanelKPIs } from "@/lib/leaderboard-queries"

interface PanelKpiCardsProps {
  data: PanelKPIs
}

function InlineStat({
  icon,
  label,
  value,
  suffix,
  sublabel,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  sublabel: string
  highlight?: boolean
}) {
  const animated = useAnimatedCounter(value, { duration: 1800, delay: 0 })

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          highlight ? "bg-orange-500/10" : "bg-muted/50"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium leading-none mb-1">
          {label}
        </p>
        <p className="text-xl font-mono font-semibold tracking-[-0.04em] tabular-nums leading-none">
          {animated.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
          {suffix && <span className="text-base ml-0.5">{suffix}</span>}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </div>
  )
}

export function PanelKpiCards({ data }: PanelKpiCardsProps) {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-5 sm:gap-x-10 lg:gap-x-14 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <InlineStat
        icon={<Zap className="size-4 text-yellow-500" />}
        label="UE del Equipo"
        value={data.teamTotalUE}
        sublabel="hoy"
      />
      <InlineStat
        icon={<Users className="size-4 text-blue-500" />}
        label="Trabajadores Activos"
        value={data.activeWorkers}
        sublabel="hoy"
      />
      <InlineStat
        icon={<FileText className="size-4 text-purple-500" />}
        label="Folios Completados"
        value={data.totalFolios}
        sublabel="hoy"
      />
      <InlineStat
        icon={
          <Flame
            className={`size-4 ${
              data.teamStreak >= 3 ? "text-orange-500" : "text-muted-foreground"
            }`}
          />
        }
        label="Racha de Meta"
        value={data.teamStreak}
        suffix="d"
        sublabel="dias consecutivos"
        highlight={data.teamStreak >= 3}
      />
    </div>
  )
}
