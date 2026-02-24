"use client"

import { Flame, Users, FileText, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { PanelKPIs } from "@/lib/leaderboard-queries"

interface PanelKpiCardsProps {
  data: PanelKPIs
}

export function PanelKpiCards({ data }: PanelKpiCardsProps) {
  const cards = [
    {
      label: "UE del Equipo",
      value: data.teamTotalUE.toLocaleString("es-MX", { maximumFractionDigits: 1 }),
      icon: <Zap className="size-4 text-yellow-500" />,
      sub: "hoy",
    },
    {
      label: "Trabajadores Activos",
      value: String(data.activeWorkers),
      icon: <Users className="size-4 text-blue-500" />,
      sub: "hoy",
    },
    {
      label: "Folios Completados",
      value: String(data.totalFolios),
      icon: <FileText className="size-4 text-purple-500" />,
      sub: "hoy",
    },
    {
      label: "Racha de Meta",
      value: `${data.teamStreak}d`,
      icon: <Flame className={`size-4 ${data.teamStreak >= 3 ? "text-orange-500" : "text-muted-foreground"}`} />,
      sub: "días consecutivos",
      highlight: data.teamStreak >= 3,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className={card.highlight ? "border-orange-500/30 bg-orange-500/5" : ""}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-muted-foreground text-xs font-medium">{card.label}</p>
              {card.icon}
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
