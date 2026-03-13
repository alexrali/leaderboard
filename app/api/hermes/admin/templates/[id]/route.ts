import { NextRequest, NextResponse } from "next/server"
import { getHermesAdminTemplate, listHermesAdminRulesByTemplate } from "@/lib/hermes/admin"
import { isHermesTemplateDuplicateError, parseHermesTemplateInput, updateHermesTemplate } from "@/lib/hermes/template-admin"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const [item, relatedRules] = await Promise.all([
      getHermesAdminTemplate(id),
      listHermesAdminRulesByTemplate(id, 20),
    ])

    if (!item) {
      return NextResponse.json({ success: false, error: ["Template not found"] }, { status: 404 })
    }

    return NextResponse.json({ success: true, item, relatedRules })
  } catch (error) {
    console.error("Hermes admin template detail error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const existing = await getHermesAdminTemplate(id)

  if (!existing) {
    return NextResponse.json({ success: false, error: ["Template not found"] }, { status: 404 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: ["Request body must be valid JSON"] }, { status: 400 })
  }

  const parsed = parseHermesTemplateInput(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.errors }, { status: 400 })
  }

  try {
    const item = await updateHermesTemplate(id, parsed.data)
    return NextResponse.json({ success: true, item })
  } catch (error) {
    if (isHermesTemplateDuplicateError(error)) {
      return NextResponse.json({ success: false, error: ["Template slug already exists"] }, { status: 409 })
    }

    console.error("Hermes admin template update error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
