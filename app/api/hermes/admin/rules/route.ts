import { NextRequest, NextResponse } from "next/server"
import { listHermesAdminRules } from "@/lib/hermes/admin"
import { createClient } from "@/lib/supabase/server"
import { createHermesRule, parseHermesRuleInput } from "@/lib/hermes/rule-admin"

export async function GET(request: NextRequest) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50)

  try {
    const items = await listHermesAdminRules(limit)
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Hermes admin rules error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const item = await createHermesRule({
      ...parsed.data,
      created_by: data.user?.id ?? null,
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error("Hermes admin rule create error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
