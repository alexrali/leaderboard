"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Trophy,
  BarChart2,
  Clock,
  Package,
  Settings,
  Calendar,
  CalendarDays,
  BadgeCheck,
  Bell,
  LogOut,
  User,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import type { TeamMember } from "@/lib/leaderboard-data"

interface SpotlightProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: TeamMember[]
  onSetViewMode: (mode: "daily" | "weekly") => void
  onSelectWorker: (member: TeamMember) => void
}

const NAV_ITEMS = [
  { label: "Panel", section: "panel", icon: LayoutDashboard },
  { label: "Resumen Semanal", section: "overview", icon: Trophy },
  { label: "Métricas Generales", section: "metrics", icon: BarChart2 },
  { label: "Progreso del Día", section: "day-progress", icon: Clock },
  { label: "Recursos", section: "resources", icon: Package },
  { label: "Configuración", section: "settings", icon: Settings },
]

const ACTION_ITEMS = [
  { label: "Ver Hoy", icon: Calendar, action: "view-daily" as const },
  { label: "Ver Semana", icon: CalendarDays, action: "view-weekly" as const },
  { label: "Mi Cuenta", icon: BadgeCheck, action: "account" as const },
  { label: "Notificaciones", icon: Bell, action: "notifications" as const },
  { label: "Cerrar sesión", icon: LogOut, action: "signout" as const },
]

export function Spotlight({ open, onOpenChange, members, onSetViewMode, onSelectWorker }: SpotlightProps) {
  const setActiveSection = useAppStore((s) => s.setActiveSection)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  function close() {
    onOpenChange(false)
  }

  function handleNav(section: string) {
    setActiveSection(section)
    close()
  }

  async function handleAction(action: (typeof ACTION_ITEMS)[number]["action"]) {
    if (action === "view-daily") {
      onSetViewMode("daily")
      close()
    } else if (action === "view-weekly") {
      onSetViewMode("weekly")
      close()
    } else if (action === "account") {
      setActiveSection("account")
      close()
    } else if (action === "notifications") {
      setActiveSection("notifications")
      close()
    } else if (action === "signout") {
      close()
      const supabase = createClient()
      await supabase.auth.signOut()
      router.refresh()
      router.push("/login")
    }
  }

  function handleWorker(member: TeamMember) {
    onSelectWorker(member)
    close()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar secciones, trabajadores, acciones..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Navegación">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.section}
              value={item.label}
              onSelect={() => handleNav(item.section)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {members.length > 0 && (
          <>
            <CommandSeparator />

            <CommandGroup heading="Trabajadores">
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.name}
                  onSelect={() => handleWorker(member)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-medium">{member.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    #{member.rank} · {member.score} UE
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Acciones">
          {ACTION_ITEMS.map((item) => (
            <CommandItem
              key={item.action}
              value={item.label}
              onSelect={() => handleAction(item.action)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
