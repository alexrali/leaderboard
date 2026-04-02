"use client"

import { cn } from "@/lib/utils"
import { type ClassValue } from "clsx"

export type StatusLevel = "success" | "warning" | "critical" | "neutral"

interface StatusBadgeProps {
  level: StatusLevel
  children: React.ReactNode
  className?: ClassValue
}

export function StatusBadge({ level, children, className }: StatusBadgeProps) {
  const styles: Record<
    StatusLevel,
    { bg: string; text: string; ariaLabel: string }
  > = {
    success: {
      bg: "bg-status-success/10",
      text: "text-status-success",
      ariaLabel: "Exitoso",
    },
    warning: {
      bg: "bg-status-warning/10",
      text: "text-status-warning",
      ariaLabel: "Precaución",
    },
    critical: {
      bg: "bg-status-critical/10",
      text: "text-status-critical",
      ariaLabel: "Crítico",
    },
    neutral: {
      bg: "bg-[#fafafa]",
      text: "text-[#4d4d4d]",
      ariaLabel: "Neutral",
    },
  }

  const style = styles[level]

  return (
    <span
      role="status"
      aria-label={style.ariaLabel}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      {children}
    </span>
  )
}

export function getStatusLevel(
  value: number,
  thresholds: { green: number; yellow?: number }
): StatusLevel {
  if (value >= thresholds.green) return "success"
  if (thresholds.yellow && value >= thresholds.yellow) return "warning"
  return "critical"
}
