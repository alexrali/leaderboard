"use client"

import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CardHeaderContentProps {
  icon?: LucideIcon
  iconColor?: string
  title: string
  description?: string
  badge?: ReactNode
  actions?: ReactNode
  className?: string
}

export function CardHeaderContent({
  icon: Icon,
  iconColor = "#3B82F6",
  title,
  description,
  badge,
  actions,
  className,
}: CardHeaderContentProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${iconColor}10` }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground leading-none">
              {title}
            </h3>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

interface InsightBannerProps {
  icon?: LucideIcon
  message: string
  variant?: "warning" | "info" | "success" | "danger"
  className?: string
}

export function InsightBanner({
  icon: Icon,
  message,
  variant = "warning",
  className,
}: InsightBannerProps) {
  const variants = {
    warning: {
      bg: "bg-[#FEF3C7]",
      border: "border-[#F59E0B]/20",
      text: "text-[#92400E]",
      iconColor: "#F59E0B",
    },
    info: {
      bg: "bg-[#EFF6FF]",
      border: "border-[#3B82F6]/20",
      text: "text-[#1E40AF]",
      iconColor: "#3B82F6",
    },
    success: {
      bg: "bg-[#F0FDF4]",
      border: "border-[#22C55E]/20",
      text: "text-[#166534]",
      iconColor: "#22C55E",
    },
    danger: {
      bg: "bg-[#FEF2F2]",
      border: "border-[#EF4444]/20",
      text: "text-[#991B1B]",
      iconColor: "#EF4444",
    },
  }

  const styles = variants[variant]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
        styles.bg,
        styles.border,
        styles.text,
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" style={{ color: styles.iconColor }} />}
      <span>{message}</span>
    </div>
  )
}

interface LegendItemProps {
  color: string
  label: string
}

export function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export function Legend({ items }: { items: LegendItemProps[] }) {
  return (
    <div className="flex items-center gap-4">
      {items.map((item, i) => (
        <LegendItem key={i} {...item} />
      ))}
    </div>
  )
}
