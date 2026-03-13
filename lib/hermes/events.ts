import { createHermesAdminClient } from "@/lib/hermes/server"
import {
  hermesEventSources,
  type HermesEventStatus,
  type HermesEventInput,
  type HermesEventRecord,
  type HermesEventValidationResult,
  type HermesJsonObject,
  type HermesJsonValue,
} from "@/lib/hermes/types"

const MAX_PAYLOAD_SIZE_BYTES = 1024 * 1024
const MAX_METADATA_SIZE_BYTES = 64 * 1024

type HermesEventRow = {
  id: string
  type: string
  source: HermesEventRecord["source"]
  external_id: string | null
  payload: HermesJsonObject
  metadata: HermesJsonObject
  status: HermesEventStatus
  processed_at: string | null
  error_message: string | null
  retry_count: number
  created_at: string
  updated_at: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function serializeSize(value: unknown): number | null {
  try {
    return JSON.stringify(value).length
  } catch {
    return null
  }
}

function normalizeJsonValue(value: unknown): HermesJsonValue {
  if (value === null) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "bigint") return value.toString()

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonValue(entry))
  }

  if (isRecord(value)) {
    return normalizeRecord(value)
  }

  return String(value)
}

function normalizeRecord(record: Record<string, unknown>): HermesJsonObject {
  const normalized: HermesJsonObject = {}

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue
    normalized[key] = normalizeJsonValue(value)
  }

  return normalized
}

function mapHermesEventRow(row: HermesEventRow): HermesEventRecord {
  return {
    id: row.id,
    type: row.type,
    source: row.source,
    external_id: row.external_id,
    payload: row.payload,
    metadata: row.metadata,
    status: row.status,
    processed_at: row.processed_at,
    error_message: row.error_message,
    retry_count: row.retry_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function coerceHermesEventInput(input: unknown): unknown {
  if (!isRecord(input)) return input
  if (input.source !== undefined) return input

  return {
    ...input,
    source: "api",
  }
}

export function validateHermesEventInput(input: unknown): HermesEventValidationResult {
  const errors: string[] = []

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: ["Request body must be a JSON object"],
    }
  }

  if (typeof input.type !== "string" || input.type.trim().length === 0) {
    errors.push("Event type is required")
  } else {
    const normalizedType = input.type.trim()

    if (!normalizedType.includes(".")) {
      errors.push('Event type must use the format "namespace.action"')
    }

    if (!/^[a-z0-9._-]+$/i.test(normalizedType)) {
      errors.push("Event type contains invalid characters")
    }

    if (normalizedType.length > 100) {
      errors.push("Event type must be at most 100 characters")
    }
  }

  if (typeof input.source !== "string" || !hermesEventSources.includes(input.source as (typeof hermesEventSources)[number])) {
    errors.push(`Source must be one of: ${hermesEventSources.join(", ")}`)
  }

  if (!isRecord(input.payload)) {
    errors.push("Payload must be a JSON object")
  } else {
    const payloadSize = serializeSize(input.payload)

    if (payloadSize === null) {
      errors.push("Payload must be JSON-serializable")
    } else if (payloadSize > MAX_PAYLOAD_SIZE_BYTES) {
      errors.push(`Payload exceeds the maximum size of ${MAX_PAYLOAD_SIZE_BYTES} bytes`)
    }
  }

  if (input.externalId !== undefined) {
    if (typeof input.externalId !== "string") {
      errors.push("externalId must be a string")
    } else if (input.externalId.trim().length === 0) {
      errors.push("externalId cannot be empty")
    } else if (input.externalId.trim().length > 255) {
      errors.push("externalId must be at most 255 characters")
    }
  }

  if (input.metadata !== undefined) {
    if (!isRecord(input.metadata)) {
      errors.push("metadata must be a JSON object")
    } else {
      const metadataSize = serializeSize(input.metadata)

      if (metadataSize === null) {
        errors.push("metadata must be JSON-serializable")
      } else if (metadataSize > MAX_METADATA_SIZE_BYTES) {
        errors.push(`metadata exceeds the maximum size of ${MAX_METADATA_SIZE_BYTES} bytes`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function normalizeHermesEventInput(input: HermesEventInput) {
  return {
    type: input.type.trim().toLowerCase(),
    source: input.source,
    payload: normalizeRecord(input.payload),
    externalId: input.externalId?.trim() || undefined,
    metadata: input.metadata ? normalizeRecord(input.metadata) : {},
  }
}

export async function createHermesEvent(input: HermesEventInput): Promise<HermesEventRecord> {
  const supabase = createHermesAdminClient()
  const normalized = normalizeHermesEventInput(input)

  const { data, error } = await supabase
    .from("hermes_events")
    .insert({
      type: normalized.type,
      source: normalized.source,
      payload: normalized.payload,
      external_id: normalized.externalId ?? null,
      metadata: normalized.metadata,
    })
    .select("id, type, source, external_id, payload, metadata, status, processed_at, error_message, retry_count, created_at, updated_at")
    .single()

  if (error) {
    throw error
  }

  return mapHermesEventRow(data as HermesEventRow)
}

export async function getHermesEventById(id: string): Promise<HermesEventRecord | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_events")
    .select("id, type, source, external_id, payload, metadata, status, processed_at, error_message, retry_count, created_at, updated_at")
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return mapHermesEventRow(data as HermesEventRow)
}

export async function updateHermesEvent(id: string, updates: {
  status?: HermesEventStatus
  processed_at?: string | null
  error_message?: string | null
  retry_count?: number
}): Promise<HermesEventRecord> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_events")
    .update(updates)
    .eq("id", id)
    .select("id, type, source, external_id, payload, metadata, status, processed_at, error_message, retry_count, created_at, updated_at")
    .single()

  if (error) {
    throw error
  }

  return mapHermesEventRow(data as HermesEventRow)
}

export function isHermesDuplicateEventError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const code = "code" in error ? error.code : null
  return code === "23505"
}
