import { createHermesAdminClient } from "@/lib/hermes/server"
import type { HermesTemplateRecord, HermesTemplateVariable } from "@/lib/hermes/types"
import { coerceHermesJsonObject, isHermesRecord } from "@/lib/hermes/utils"

type HermesTemplateRow = {
  id: string
  name: string
  slug: string
  description: string | null
  subject: string
  html_content: string
  text_content: string | null
  variables: unknown
  default_values: unknown
  from_email: string | null
  from_name: string | null
  reply_to: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapHermesTemplateVariable(value: unknown): HermesTemplateVariable | null {
  if (!isHermesRecord(value)) return null
  if (typeof value.name !== "string" || value.name.trim().length === 0) return null

  const rawType = value.type
  const type =
    rawType === "number" ||
    rawType === "boolean" ||
    rawType === "date" ||
    rawType === "json"
      ? rawType
      : "string"

  return {
    name: value.name,
    type,
    required: typeof value.required === "boolean" ? value.required : undefined,
    path: typeof value.path === "string" ? value.path : undefined,
    defaultValue: value.defaultValue as HermesTemplateVariable["defaultValue"],
  }
}

function mapHermesTemplateRow(row: HermesTemplateRow): HermesTemplateRecord {
  return {
    ...row,
    variables: Array.isArray(row.variables)
      ? row.variables
          .map((entry) => mapHermesTemplateVariable(entry))
          .filter((entry): entry is HermesTemplateVariable => entry !== null)
      : [],
    default_values: coerceHermesJsonObject(row.default_values),
  }
}

export async function getHermesTemplateById(id: string): Promise<HermesTemplateRecord | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .select("id, name, slug, description, subject, html_content, text_content, variables, default_values, from_email, from_name, reply_to, is_active, created_at, updated_at")
    .eq("id", id)
    .single()

  if (error) return null

  return mapHermesTemplateRow(data as HermesTemplateRow)
}

export async function getHermesTemplateBySlug(slug: string): Promise<HermesTemplateRecord | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .select("id, name, slug, description, subject, html_content, text_content, variables, default_values, from_email, from_name, reply_to, is_active, created_at, updated_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) return null

  return mapHermesTemplateRow(data as HermesTemplateRow)
}

export async function listActiveHermesTemplates(): Promise<HermesTemplateRecord[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .select("id, name, slug, description, subject, html_content, text_content, variables, default_values, from_email, from_name, reply_to, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error || !data) return []

  return data.map((row) => mapHermesTemplateRow(row as HermesTemplateRow))
}
