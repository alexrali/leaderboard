import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Temporary diagnostic endpoint — delete after debugging
export async function GET() {
  return NextResponse.json({
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `set (starts with ${process.env.RESEND_API_KEY.slice(0, 4)}...)` : "MISSING",
    HERMES_DEFAULT_FROM_EMAIL: process.env.HERMES_DEFAULT_FROM_EMAIL ?? "MISSING",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
  })
}
