import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

import { createHermesAdminClient } from "../lib/hermes/server.js"

const TEMPLATE_SLUG = "weekly-worker-leaderboard"
const RULE_NAME = "Weekly Worker Leaderboard — Management Digest"

const HTML_CONTENT = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Leaderboard Semanal</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; margin: 0; padding: 0; background-color: #f9fafb;">
    <div style="max-width: 640px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: #1d4ed8; padding: 24px 32px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">
          Leaderboard — Semana {{week_number}}
        </h1>
        <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">
          {{week_start_date}} – {{week_end_date}}
        </p>
      </div>

      <div style="padding: 24px 32px;">
        <p style="margin: 0 0 20px; color: #374151; font-size: 14px;">
          Reporte de desempeño para <strong>{{total_workers}} trabajadores</strong> en la semana {{week_number}}.
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="text-align: center; padding: 10px 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; width: 48px;">#</th>
              <th style="text-align: left; padding: 10px 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Trabajador</th>
              <th style="text-align: right; padding: 10px 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">UE Total</th>
              <th style="text-align: right; padding: 10px 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">UE / hr</th>
              <th style="text-align: right; padding: 10px 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Eficiencia</th>
              <th style="text-align: center; padding: 10px 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {{#each workers}}
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="text-align: center; padding: 10px 8px; color: #9ca3af; font-weight: 600;">{{this.rank}}</td>
              <td style="padding: 10px 8px; color: #111827; font-weight: 500;">{{this.worker_name}}</td>
              <td style="text-align: right; padding: 10px 8px; color: #374151; font-variant-numeric: tabular-nums;">{{formatNumber this.total_ue}}</td>
              <td style="text-align: right; padding: 10px 8px; color: #374151; font-variant-numeric: tabular-nums;">{{formatNumber this.avg_ue_per_hour}}</td>
              <td style="text-align: right; padding: 10px 8px; color: #374151;">{{this.efficiency_score}}</td>
              <td style="text-align: center; padding: 10px 8px; color: #374151;">{{this.trend}} {{this.trend_percentage}}%</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
      </div>

      <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
          Generado automáticamente por Leaderboard · Semana {{week_number}}
        </p>
      </div>
    </div>
  </body>
</html>`

const TEXT_CONTENT = `Leaderboard — Semana {{week_number}} ({{week_start_date}} – {{week_end_date}})

Reporte de desempeño para {{total_workers}} trabajadores.

{{#each workers}}
{{this.rank}}. {{this.worker_name}}
   UE Total: {{formatNumber this.total_ue}}
   UE / hr: {{formatNumber this.avg_ue_per_hour}}
   Eficiencia: {{this.efficiency_score}}
   Tendencia: {{this.trend}} {{this.trend_percentage}}%

{{/each}}

Generado automáticamente por Leaderboard.`

async function main() {
  const supabase = createHermesAdminClient()

  // ── Template ──────────────────────────────────────────────────────────────

  const { data: existingTemplate, error: templateFetchError } = await supabase
    .from("hermes_templates")
    .select("id")
    .eq("slug", TEMPLATE_SLUG)
    .maybeSingle()

  if (templateFetchError) {
    console.error("Error fetching template:", templateFetchError.message)
    process.exit(1)
  }

  const templatePayload = {
    slug: TEMPLATE_SLUG,
    name: "Weekly Worker Leaderboard",
    subject: "Leaderboard — Semana {{week_number}} ({{week_start_date}} – {{week_end_date}})",
    html_content: HTML_CONTENT,
    text_content: TEXT_CONTENT,
    variables: [
      { name: "week_number", type: "number", path: "week_number", required: true },
      { name: "week_start_date", type: "string", path: "week_start_date", required: true },
      { name: "week_end_date", type: "string", path: "week_end_date", required: true },
      { name: "workers", type: "json", path: "workers", required: true },
      { name: "total_workers", type: "number", path: "total_workers", required: true },
    ],
    default_values: {},
    from_name: "Leaderboard",
    from_email: null,
    reply_to: null,
    is_active: true,
  }

  let templateId: string

  if (existingTemplate) {
    const { data: updated, error } = await supabase
      .from("hermes_templates")
      .update({ ...templatePayload, updated_at: new Date().toISOString() })
      .eq("id", existingTemplate.id)
      .select("id")
      .single()

    if (error || !updated) {
      console.error("Error updating template:", error?.message)
      process.exit(1)
    }

    templateId = updated.id
    console.log(`✓ Template updated: ${templateId}`)
  } else {
    const { data: inserted, error } = await supabase
      .from("hermes_templates")
      .insert(templatePayload)
      .select("id")
      .single()

    if (error || !inserted) {
      console.error("Error inserting template:", error?.message)
      process.exit(1)
    }

    templateId = inserted.id
    console.log(`✓ Template created: ${templateId}`)
  }

  // ── Rule ──────────────────────────────────────────────────────────────────

  const { data: existingRule, error: ruleFetchError } = await supabase
    .from("hermes_rules")
    .select("id")
    .eq("name", RULE_NAME)
    .maybeSingle()

  if (ruleFetchError) {
    console.error("Error fetching rule:", ruleFetchError.message)
    process.exit(1)
  }

  const rulePayload = {
    name: RULE_NAME,
    event_type: "performance.weekly-digest",
    event_conditions: [],
    schedule_type: "IMMEDIATE",
    schedule_config: {},
    timezone: "America/Mexico_City",
    recipient_type: "STATIC",
    recipient_config: { emails: ["alexlino@gmail.com"] },
    template_id: templateId,
    priority: 10,
    is_active: true,
    created_by: null,
  }

  let ruleId: string

  if (existingRule) {
    const { data: updated, error } = await supabase
      .from("hermes_rules")
      .update({ ...rulePayload, updated_at: new Date().toISOString() })
      .eq("id", existingRule.id)
      .select("id")
      .single()

    if (error || !updated) {
      console.error("Error updating rule:", error?.message)
      process.exit(1)
    }

    ruleId = updated.id
    console.log(`✓ Rule updated: ${ruleId}`)
  } else {
    const { data: inserted, error } = await supabase
      .from("hermes_rules")
      .insert(rulePayload)
      .select("id")
      .single()

    if (error || !inserted) {
      console.error("Error inserting rule:", error?.message)
      process.exit(1)
    }

    ruleId = inserted.id
    console.log(`✓ Rule created: ${ruleId}`)
  }

  console.log("✅ Done")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
