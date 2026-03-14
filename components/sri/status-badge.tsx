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
    { bg: string; text: string; border: string; ariaLabel: string }
  > = {
    success: {
      bg: "bg-status-success/10",
      text: "text-status-success",
      border: "border-status-success/20",
      ariaLabel: "Exitoso",
    },
    warning: {
      bg: "bg-status-warning/10",
      text: "text-status-warning",
      border: "border-status-warning/20",
      ariaLabel: "Precaución",
    },
    critical: {
      bg: "bg-status-critical/10",
      text: "text-status-critical",
      border: "border-status-critical/20",
      ariaLabel: "Crítico",
    },
    neutral: {
      bg: "bg-neutral-100",
      text: "text-neutral-600",
      border: "border-neutral-200",
      ariaLabel: "Neutral",
    },
  }

  const style = styles[level]

  return (
    <span
      role="status"
      aria-label={style.ariaLabel}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {children}
    </span>
  )
}

// Helper to determine level from value
export function getStatusLevel(
  value: number,
  thresholds: { green: number; yellow?: number }
): StatusLevel {
  if (value >= thresholds.green) return "success"
  if (thresholds.yellow && value >= thresholds.yellow) return "warning"
  return "critical"
}
