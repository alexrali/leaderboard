import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Device Key ───────────────────────────────────────────────────────────────

const DEVICE_KEY = "leaderboard-device-id"

export function getDeviceKey(): string {
  if (typeof window === "undefined") return "ssr"
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_KEY, id)
  return id
}
