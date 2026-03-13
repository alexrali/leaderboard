# Weekly Worker Digest Notification — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Send a weekly ranked leaderboard email to alexlino@gmail.com every Friday at 5pm Mexico City time (23:00 UTC) using Hermes + Vercel Cron.

**Architecture:** A Vercel Cron job hits `GET /api/cron/weekly-digest` on Friday at 23:00 UTC. The route queries `performance_weekly` for the current ISO week via the Supabase service-role client, builds a Hermes event payload, and dispatches it directly through the Hermes runtime functions. Hermes matches a rule configured for `performance.weekly-digest`, renders the ranked table template, and sends via Resend to `alexlino@gmail.com`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (service-role client), Hermes runtime (`lib/hermes/*`), Resend (via Hermes delivery), Vercel Cron, `date-fns` (already installed).

---

## Task 1: Hermes Template — `weekly-worker-leaderboard`

**Files:**
- Create: `scripts/seed-weekly-digest.ts`

This script installs the template and rule idempotently (upsert by slug/name). Run it once from a terminal. It follows the same pattern as `lib/hermes/example-admin.ts`.

**Step 1: Create the seed script**

```typescript
// scripts/seed-weekly-digest.ts
// Run with: npx tsx scripts/seed-weekly-digest.ts
import { config } from "dotenv"
import path from "path"

config({ path: path.resolve(process.cwd(), ".env.local") })

// Must come after dotenv so env vars are available
const { createHermesAdminClient } = await import("../lib/hermes/server.js")

const db = createHermesAdminClient()

// ── 1. Template ──────────────────────────────────────────────────────────────

const TEMPLATE_SLUG = "weekly-worker-leaderboard"

const templateData = {
  name: "Weekly Worker Leaderboard",
  slug: TEMPLATE_SLUG,
  description: "Weekly ranked performance digest sent to management every Friday.",
  subject: "Leaderboard — Semana {{week_number}} ({{week_start_date}} – {{week_end_date}})",
  html_content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:640px;margin:0 auto;padding:24px 16px;">
  <h1 style="font-size:20px;margin-bottom:4px;">Leaderboard Semanal</h1>
  <p style="color:#6b7280;margin-top:0;">Semana {{week_number}} &mdash; {{week_start_date}} al {{week_end_date}}</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
    <thead>
      <tr style="background:#f3f4f6;text-align:left;">
        <th style="padding:8px 10px;">#</th>
        <th style="padding:8px 10px;">Trabajador</th>
        <th style="padding:8px 10px;text-align:right;">UE Total</th>
        <th style="padding:8px 10px;text-align:right;">UE/hr</th>
        <th style="padding:8px 10px;text-align:right;">Score</th>
        <th style="padding:8px 10px;text-align:right;">Tendencia</th>
      </tr>
    </thead>
    <tbody>
      {{#each workers}}
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px 10px;font-weight:bold;">{{rank}}</td>
        <td style="padding:8px 10px;">{{worker_name}}</td>
        <td style="padding:8px 10px;text-align:right;">{{total_ue | formatNumber}}</td>
        <td style="padding:8px 10px;text-align:right;">{{avg_ue_per_hour | formatNumber}}</td>
        <td style="padding:8px 10px;text-align:right;">{{efficiency_score}}</td>
        <td style="padding:8px 10px;text-align:right;">{{trend}} {{trend_percentage}}%</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <p style="margin-top:24px;color:#9ca3af;font-size:12px;">
    {{total_workers}} trabajadores &middot; Generado por Leaderboard
  </p>
</body>
</html>`,
  text_content: `Leaderboard Semanal — Semana {{week_number}} ({{week_start_date}} al {{week_end_date}})

{{#each workers}}
{{rank}}. {{worker_name}} — UE: {{total_ue}}, UE/hr: {{avg_ue_per_hour}}, Score: {{efficiency_score}}, Tendencia: {{trend}} {{trend_percentage}}%
{{/each}}

{{total_workers}} trabajadores.`,
  variables: [
    { name: "week_number", type: "number", path: "week_number", required: true },
    { name: "week_start_date", type: "string", path: "week_start_date", required: true },
    { name: "week_end_date", type: "string", path: "week_end_date", required: true },
    { name: "workers", type: "json", path: "workers", required: true },
    { name: "total_workers", type: "number", path: "total_workers", required: true },
  ],
  default_values: {},
  from_email: null,
  from_name: "Leaderboard",
  reply_to: null,
  is_active: true,
}

// ── Upsert template by slug ──────────────────────────────────────────────────

const { data: existingTemplate } = await db
  .from("hermes_templates")
  .select("id")
  .eq("slug", TEMPLATE_SLUG)
  .maybeSingle()

let templateId: string

if (existingTemplate) {
  const { data, error } = await db
    .from("hermes_templates")
    .update({ ...templateData, updated_at: new Date().toISOString() })
    .eq("id", existingTemplate.id)
    .select("id")
    .single()
  if (error) throw error
  templateId = data.id
  console.log("✓ Template updated:", templateId)
} else {
  const { data, error } = await db
    .from("hermes_templates")
    .insert(templateData)
    .select("id")
    .single()
  if (error) throw error
  templateId = data.id
  console.log("✓ Template created:", templateId)
}

// ── 2. Rule ──────────────────────────────────────────────────────────────────

const RULE_NAME = "Weekly Worker Leaderboard — Management Digest"

const ruleData = {
  name: RULE_NAME,
  description: "Sends the weekly ranked leaderboard to management every Friday via cron.",
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

const { data: existingRule } = await db
  .from("hermes_rules")
  .select("id")
  .eq("name", RULE_NAME)
  .maybeSingle()

if (existingRule) {
  const { error } = await db
    .from("hermes_rules")
    .update({ ...ruleData, updated_at: new Date().toISOString() })
    .eq("id", existingRule.id)
  if (error) throw error
  console.log("✓ Rule updated:", existingRule.id)
} else {
  const { data, error } = await db
    .from("hermes_rules")
    .insert(ruleData)
    .select("id")
    .single()
  if (error) throw error
  console.log("✓ Rule created:", data.id)
}

console.log("\n✅ Weekly digest template + rule installed successfully.")
```

**Step 2: Run the seed script**

```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
npx tsx scripts/seed-weekly-digest.ts
```

Expected output:
```
✓ Template created: <uuid>
✓ Rule created: <uuid>

✅ Weekly digest template + rule installed successfully.
```

If it was already run before, output will say "updated" instead of "created".

**Step 3: Verify in admin UI**

Open `/messaging/templates` — confirm `weekly-worker-leaderboard` appears and is active.
Open `/messaging/rules` — confirm `Weekly Worker Leaderboard — Management Digest` appears and is active, pointing to the template.

**Step 4: Commit**

```bash
git add scripts/seed-weekly-digest.ts
git commit -m "feat: add Hermes weekly digest seed script"
```

---

## Task 2: Vercel Cron Route

**Files:**
- Create: `app/api/cron/weekly-digest/route.ts`

This is a `GET` handler (Vercel Cron uses GET by default). It:
1. Verifies the Vercel-injected `Authorization: Bearer <CRON_SECRET>` header
2. Queries `performance_weekly` for the current ISO week ordered by `weekly_rank ASC`
3. Calls `createHermesEvent` + `processHermesEvent` directly (no internal HTTP round-trip)
4. Returns a JSON summary

**Step 1: Create the cron route**

```typescript
// app/api/cron/weekly-digest/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getISOWeek, getYear } from "date-fns"
import { createHermesAdminClient } from "@/lib/hermes/server"
import {
  coerceHermesEventInput,
  createHermesEvent,
  validateHermesEventInput,
} from "@/lib/hermes/events"
import { processHermesEvent } from "@/lib/hermes/runtime"

export const runtime = "nodejs"

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  // In local dev CRON_SECRET is not set — allow
  if (!secret) return true
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const weekNumber = getISOWeek(now)
  const year = getYear(now)

  const db = createHermesAdminClient()

  // Query current week's performance, ordered by rank
  const { data: workers, error } = await db
    .from("performance_weekly")
    .select(
      "worker_key, worker_name, weekly_rank, total_ue, avg_ue_per_hour, efficiency_score, trend, trend_percentage, days_worked, current_streak, week_start_date, week_end_date"
    )
    .eq("year", year)
    .eq("week_number", weekNumber)
    .not("weekly_rank", "is", null)
    .order("weekly_rank", { ascending: true })

  if (error) {
    console.error("[weekly-digest] DB query error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (!workers || workers.length === 0) {
    console.warn(`[weekly-digest] No data for week ${weekNumber}/${year}`)
    return NextResponse.json({ success: true, skipped: true, reason: "no data for current week" })
  }

  const weekStartDate = workers[0].week_start_date as string
  const weekEndDate = workers[0].week_end_date as string

  const payload = {
    week_number: weekNumber,
    year,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    total_workers: workers.length,
    workers: workers.map((w) => ({
      rank: w.weekly_rank,
      worker_name: w.worker_name,
      total_ue: Number(w.total_ue),
      avg_ue_per_hour: Number(w.avg_ue_per_hour ?? 0),
      efficiency_score: w.efficiency_score ?? 0,
      trend: w.trend ?? "stable",
      trend_percentage: Number(w.trend_percentage ?? 0),
      days_worked: w.days_worked,
      current_streak: w.current_streak ?? 0,
    })),
  }

  const input = coerceHermesEventInput({
    type: "performance.weekly-digest",
    source: "cron",
    externalId: `weekly-digest-${year}-W${String(weekNumber).padStart(2, "0")}`,
    payload,
    metadata: { triggeredAt: now.toISOString() },
  })

  const validation = validateHermesEventInput(input)
  if (!validation.valid) {
    console.error("[weekly-digest] Event validation failed:", validation.errors)
    return NextResponse.json({ success: false, error: validation.errors }, { status: 400 })
  }

  try {
    const event = await createHermesEvent(input)
    const processing = await processHermesEvent(event)

    return NextResponse.json({
      success: true,
      eventId: event.id,
      week: `${year}-W${weekNumber}`,
      workers: workers.length,
      matchedRules: processing.matchedRules,
      immediateDispatches: processing.immediateDispatches,
      errors: processing.errors,
    })
  } catch (err) {
    // Duplicate event = cron fired twice in the same week, safe to ignore
    if (err instanceof Error && err.message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ success: true, skipped: true, reason: "duplicate event" })
    }
    console.error("[weekly-digest] Hermes processing error:", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/api/cron/weekly-digest/route.ts
git commit -m "feat: add weekly digest cron route"
```

---

## Task 3: Vercel Cron Schedule

**Files:**
- Create: `vercel.json`

**Step 1: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 23 * * 5"
    }
  ]
}
```

`0 23 * * 5` = Friday 23:00 UTC = Friday 5:00pm Mexico City (UTC-6, no DST).

**Step 2: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel cron schedule for weekly digest"
```

---

## Task 4: Env Vars + End-to-End Verification

**Step 1: Confirm env vars are set**

Required in `.env.local` (local) and in Vercel project settings (production):

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Already set | Used by `createHermesAdminClient` |
| `SUPABASE_SERVICE_ROLE_KEY` | Already set | Used by `createHermesAdminClient` |
| `HERMES_API_SECRET` | Check `.env.local` | Used by Hermes auth guard — cron calls Hermes functions directly so this is only needed if you also call `/api/hermes/events` via HTTP externally |
| `RESEND_API_KEY` | Already set | Used by Hermes delivery |
| `HERMES_DEFAULT_FROM_EMAIL` | Already set or set now | Fallback sender if template `from_email` is null |
| `CRON_SECRET` | Set in Vercel only | Vercel injects this automatically in production; not needed locally |

**Step 2: Verify with the Hermes Review UI**

Open `/messaging/review` and paste this sample event payload:

```json
{
  "type": "performance.weekly-digest",
  "source": "cron",
  "payload": {
    "week_number": 11,
    "year": 2026,
    "week_start_date": "2026-03-09",
    "week_end_date": "2026-03-14",
    "total_workers": 3,
    "workers": [
      { "rank": 1, "worker_name": "Juan Pérez", "total_ue": 420.5, "avg_ue_per_hour": 52.3, "efficiency_score": 95, "trend": "up", "trend_percentage": 8.2, "days_worked": 5, "current_streak": 3 },
      { "rank": 2, "worker_name": "Ana García", "total_ue": 390.1, "avg_ue_per_hour": 48.7, "efficiency_score": 88, "trend": "stable", "trend_percentage": 0.5, "days_worked": 5, "current_streak": 1 },
      { "rank": 3, "worker_name": "Luis Torres", "total_ue": 310.8, "avg_ue_per_hour": 38.8, "efficiency_score": 72, "trend": "down", "trend_percentage": 3.1, "days_worked": 4, "current_streak": 0 }
    ]
  },
  "metadata": {}
}
```

Run **Preview** first. Confirm:
- Rule `Weekly Worker Leaderboard — Management Digest` matches
- Recipients resolve to `alexlino@gmail.com`
- Rendered subject looks correct
- HTML output shows all 3 workers in the table

**Step 3: Run Process in review mode**

Switch to **Process** mode and submit the same payload. Then check:
- `/messaging/events` — event appears as `COMPLETED`
- `/messaging/delivery` — delivery log appears as `SENT`
- Your inbox at `alexlino@gmail.com` — email arrives

**Step 4: Deploy to Vercel**

```bash
git push origin main
```

After deploy, open the Vercel dashboard → Project → Cron Jobs tab. Confirm `/api/cron/weekly-digest` appears with schedule `0 23 * * 5`.

You can trigger it manually from the Vercel dashboard to do a live test before the scheduled Friday run.

---

## Summary of Files Changed

| File | Action |
|---|---|
| `scripts/seed-weekly-digest.ts` | Created — installs Hermes template + rule |
| `app/api/cron/weekly-digest/route.ts` | Created — Vercel cron handler |
| `vercel.json` | Created — cron schedule declaration |
