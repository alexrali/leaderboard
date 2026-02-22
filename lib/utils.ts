import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Device Key ───────────────────────────────────────────────────────────────

const DEVICE_KEY = "leaderboard-device-id"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getDeviceKey(): string {
  if (typeof window === "undefined") return "ssr"
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing && UUID_RE.test(existing)) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_KEY, id)
  return id
}
