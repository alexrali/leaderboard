import type { HermesJsonObject, HermesJsonValue } from "@/lib/hermes/types"

export function isHermesRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function normalizeHermesJsonValue(value: unknown): HermesJsonValue {
  if (value === null) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "bigint") return value.toString()

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeHermesJsonValue(entry))
  }

  if (isHermesRecord(value)) {
    return normalizeHermesJsonObject(value)
  }

  return String(value)
}

export function normalizeHermesJsonObject(value: Record<string, unknown>): HermesJsonObject {
  const normalized: HermesJsonObject = {}

  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) continue
    normalized[key] = normalizeHermesJsonValue(entry)
  }

  return normalized
}

export function coerceHermesJsonObject(value: unknown): HermesJsonObject {
  return isHermesRecord(value) ? normalizeHermesJsonObject(value) : {}
}

export function getHermesNestedValue(value: unknown, path: string): unknown {
  if (!path.trim()) return value

  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1")
  const parts = normalizedPath.split(".").filter(Boolean)
  let current: unknown = value

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (Array.isArray(current)) {
      const index = Number(part)
      if (!Number.isInteger(index)) {
        return undefined
      }
      current = current[index]
      continue
    }

    if (typeof current !== "object") {
      return undefined
    }

    current = (current as Record<string, unknown>)[part]
  }

  return current
}

export function isHermesValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
