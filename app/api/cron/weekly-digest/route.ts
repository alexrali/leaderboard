import { NextRequest, NextResponse } from "next/server"
import { format, endOfISOWeek, getISOWeek, getYear, startOfISOWeek } from "date-fns"
import { createHermesAdminClient } from "@/lib/hermes/server"
import {
  coerceHermesEventInput,
  createHermesEvent,
  isHermesDuplicateEventError,
  validateHermesEventInput,
} from "@/lib/hermes/events"
import { processHermesEvent } from "@/lib/hermes/runtime"
import type { HermesEventInput } from "@/lib/hermes/types"

export const runtime = "nodejs"

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET

  // If no CRON_SECRET is set (local dev), allow through
  if (!cronSecret) {
    return true
  }

  const authorization = request.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length) === cronSecret
  }

  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const weekNumber = getISOWeek(now)
  const year = getYear(now)

  const supabase = createHermesAdminClient()

  const { data: workers, error: queryError } = await supabase
    .from("performance_weekly")
    .select(
      "worker_name, weekly_rank, total_ue, avg_ue_per_hour, efficiency_score, trend, trend_percentage, days_worked, current_streak, week_start_date, week_end_date"
    )
    .eq("year", year)
    .eq("week_number", weekNumber)
    .not("weekly_rank", "is", null)
    .order("weekly_rank", { ascending: true })

  if (queryError) {
    console.error("Weekly digest cron: failed to query performance_weekly:", queryError)
    return NextResponse.json({ success: false, error: "Failed to query performance data" }, { status: 500 })
  }

  if (!workers || workers.length === 0) {
    console.warn(`Weekly digest cron: no data for year=${year} week=${weekNumber}`)
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "no data for current week",
    })
  }

  const weekLabel = `${year}-W${String(weekNumber).padStart(2, "0")}`

  const rawInput = coerceHermesEventInput({
    type: "performance.weekly-digest",
    source: "cron",
    externalId: `weekly-digest-${weekLabel}`,
    payload: {
      week_number: weekNumber,
      year,
      week_start_date: workers[0].week_start_date ?? format(startOfISOWeek(now), "yyyy-MM-dd"),
      week_end_date: workers[0].week_end_date ?? format(endOfISOWeek(now), "yyyy-MM-dd"),
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
    },
    metadata: { triggeredAt: now.toISOString() },
  })

  const validation = validateHermesEventInput(rawInput)

  if (!validation.valid) {
    console.error("Weekly digest cron: invalid Hermes event input:", validation.errors)
    return NextResponse.json(
      { success: false, error: "Invalid event payload", details: validation.errors },
      { status: 500 }
    )
  }

  try {
    const event = await createHermesEvent(rawInput as HermesEventInput)
    const processing = await processHermesEvent(event)

    return NextResponse.json({
      success: true,
      eventId: event.id,
      week: weekLabel,
      workers: workers.length,
      matchedRules: processing.matchedRules,
      immediateDispatches: processing.immediateDispatches,
      errors: processing.errors,
    })
  } catch (error) {
    if (isHermesDuplicateEventError(error)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "duplicate event",
      })
    }

    console.error("Weekly digest cron: Hermes event error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
