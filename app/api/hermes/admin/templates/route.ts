import { NextRequest, NextResponse } from "next/server"
import { listHermesAdminTemplates } from "@/lib/hermes/admin"
import { createHermesTemplate, isHermesTemplateDuplicateError, parseHermesTemplateInput } from "@/lib/hermes/template-admin"

export async function GET(request: NextRequest) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50)

  try {
    const items = await listHermesAdminTemplates(limit)
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Hermes admin templates error:", error)
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

  const parsed = parseHermesTemplateInput(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.errors }, { status: 400 })
  }

  try {
    const item = await createHermesTemplate(parsed.data)
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    if (isHermesTemplateDuplicateError(error)) {
      return NextResponse.json({ success: false, error: ["Template slug already exists"] }, { status: 409 })
    }

    console.error("Hermes admin template create error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
