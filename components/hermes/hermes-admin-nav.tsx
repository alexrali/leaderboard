"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, FileText, LayoutDashboard, Mail, Search, Send, Wrench, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/messaging", label: "Resumen", icon: LayoutDashboard },
  { href: "/messaging/templates", label: "Templates", icon: FileText },
  { href: "/messaging/rules", label: "Rules", icon: Workflow },
  { href: "/messaging/events", label: "Eventos", icon: Activity },
  { href: "/messaging/delivery", label: "Entregas", icon: Send },
  { href: "/messaging/tasks", label: "Tareas", icon: Mail },
  { href: "/messaging/review", label: "Review", icon: Search },
  { href: "/messaging/operations", label: "Operaciones", icon: Wrench },
]

export function HermesAdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === "/messaging"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
