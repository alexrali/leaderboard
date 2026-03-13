import { NextRequest, NextResponse } from "next/server"
import { getHermesAdminRule, listHermesAdminDeliveryLogsByRule, listHermesAdminTasksByRule } from "@/lib/hermes/admin"
import { parseHermesRuleInput, updateHermesRule } from "@/lib/hermes/rule-admin"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const [item, relatedTasks, relatedDeliveryLogs] = await Promise.all([
      getHermesAdminRule(id),
      listHermesAdminTasksByRule(id, 20),
      listHermesAdminDeliveryLogsByRule(id, 20),
    ])

    if (!item) {
      return NextResponse.json({ success: false, error: ["Rule not found"] }, { status: 404 })
    }

    return NextResponse.json({ success: true, item, relatedTasks, relatedDeliveryLogs })
  } catch (error) {
    console.error("Hermes admin rule detail error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const existing = await getHermesAdminRule(id)

  if (!existing) {
    return NextResponse.json({ success: false, error: ["Rule not found"] }, { status: 404 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: ["Request body must be valid JSON"] }, { status: 400 })
  }

  const parsed = parseHermesRuleInput(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.errors }, { status: 400 })
  }

  try {
    const item = await updateHermesRule(id, {
      ...parsed.data,
      created_by: existing.created_by,
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Hermes admin rule update error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
