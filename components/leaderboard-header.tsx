import { Trophy, Calendar, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface LeaderboardHeaderProps {
  memberCount?: number
  viewMode?: "daily" | "weekly"
  dataDate?: string | null
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function LeaderboardHeader({ memberCount = 0, viewMode = "daily", dataDate }: LeaderboardHeaderProps) {
  const now = new Date()
  const week = getISOWeek(now)
  const today = now.toISOString().split("T")[0]

  const displayDate = dataDate
    ? new Date(dataDate + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    : now.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })

  const isStale = dataDate && dataDate < today

  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
            <Trophy className="size-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {viewMode === "daily"
              ? <>
                  {`Desempeño del día — ${displayDate}`}
                  {isStale && (
                    <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning-foreground">
                      último dato disponible
                    </span>
                  )}
                </>
              : `Desempeño semanal — Semana ${week}, ${now.getFullYear()}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <Calendar className="size-3" />
          Semana {week}
        </Badge>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <Users className="size-3" />
          {memberCount} surtidores
        </Badge>
      </div>
    </header>
  )
}
