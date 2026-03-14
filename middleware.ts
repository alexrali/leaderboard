import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const isHermesEventsRoute = request.nextUrl.pathname.startsWith("/api/hermes/events")
  const isHermesWebhookRoute = request.nextUrl.pathname.startsWith("/api/hermes/webhook")
  const isHermesProcessDueRoute = request.nextUrl.pathname.startsWith("/api/hermes/process-due")
  const isCronRoute = request.nextUrl.pathname.startsWith("/api/cron/")

  if (isHermesEventsRoute || isHermesWebhookRoute || isHermesProcessDueRoute || isCronRoute) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  // A simple mistake here can break session refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname.startsWith("/login")
  const isCallbackRoute = request.nextUrl.pathname.startsWith("/auth/callback")

  if (!user && !isLoginPage && !isCallbackRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\.ico|.*\.png$|.*\.svg$|.*\.jpg$).*)",
  ],
}
