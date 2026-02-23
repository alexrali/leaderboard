# Magic Link Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Protect the leaderboard dashboard behind Supabase magic-link (OTP) authentication, redirecting unauthenticated users to `/login`.

**Architecture:** Install `@supabase/ssr` for proper cookie-based session handling in Next.js App Router. A `middleware.ts` at the project root guards all routes, redirecting unauthenticated requests to `/login`. After clicking the emailed magic link, an auth callback route exchanges the token for a session cookie and redirects to the dashboard.

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr`, `@supabase/supabase-js` v2, react-hook-form, zod, sonner (toasts), Tailwind CSS

> **Note:** No test framework is installed in this project. Each task uses manual browser verification instead of automated tests.

---

## Task 1: Add `NEXT_PUBLIC_SITE_URL` to `.env.local`

**Files:**
- Modify: `.env.local`

**Step 1: Add the environment variable**

Append to `.env.local`:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> On Vercel, this will be overridden with the production URL via the Vercel environment variables panel. The value here is only for local dev.

**Step 2: Verify**

Open `.env.local` and confirm the line is present. No restart needed yet.

**Step 3: Commit**
```bash
git add .env.local
git commit -m "chore: add NEXT_PUBLIC_SITE_URL for magic link redirect"
```

---

## Task 2: Install `@supabase/ssr`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

**Step 1: Install the package**

Run from `leaderboard/`:
```bash
pnpm add @supabase/ssr
```

**Step 2: Verify**

Check `package.json` — `"@supabase/ssr"` should appear in `dependencies`.

**Step 3: Commit**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install @supabase/ssr for Next.js App Router auth"
```

---

## Task 3: Create Supabase client utilities

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

> Keep `lib/supabase.ts` untouched — it holds types and the existing data client used by all current queries.

**Step 1: Create the browser client — `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create the server client — `lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}
```

**Step 3: Verify**

Run `pnpm build` — should compile with no errors related to these files.

**Step 4: Commit**
```bash
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "feat: add supabase browser and server client utilities"
```

---

## Task 4: Create the auth callback route

**Files:**
- Create: `app/auth/callback/route.ts`

> Supabase redirects the user here after they click the magic link. This route exchanges the one-time token for a persistent session cookie.

**Step 1: Create `app/auth/callback/route.ts`**

```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

**Step 2: Verify**

Run `pnpm build` — no TypeScript errors.

**Step 3: Commit**
```bash
git add app/auth/callback/route.ts
git commit -m "feat: add auth callback route for magic link token exchange"
```

---

## Task 5: Create the middleware

**Files:**
- Create: `middleware.ts` (project root, next to `package.json`)

> This file runs on every request. It checks for a valid Supabase session and redirects unauthenticated users to `/login`. Authenticated users visiting `/login` are sent to `/`.

**Step 1: Create `middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
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
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, images
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)",
  ],
}
```

**Step 2: Verify**

Run `pnpm build` — no errors. Then `pnpm dev` and visit `http://localhost:3000` in a private/incognito window — you should be redirected to `/login` (which shows a 404 for now, that's expected).

**Step 3: Commit**
```bash
git add middleware.ts
git commit -m "feat: add middleware to protect routes behind auth"
```

---

## Task 6: Rework `login-form.tsx` — email-only magic link

**Files:**
- Modify: `components/login-form.tsx`

> Replace the current email+password+social form with a clean email-only form. Uses react-hook-form + zod for validation. On submit, calls `supabase.auth.signInWithOtp()`. After sending, switches to a confirmation state ("check your email").

**Step 1: Replace the full contents of `components/login-form.tsx`**

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type FormData = z.infer<typeof schema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSubmittedEmail(data.email)
    setSent(true)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-6 md:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-muted-foreground text-sm text-balance">
                We sent a login link to{" "}
                <span className="font-medium text-foreground">
                  {submittedEmail}
                </span>
                . Click the link to sign in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Enter your email to receive a login link
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </Field>
                <Field>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending…" : "Send login link"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Verify**

Run `pnpm build` — no TypeScript errors on this file.

**Step 3: Commit**
```bash
git add components/login-form.tsx
git commit -m "feat: rework login form to email-only magic link"
```

---

## Task 7: Create the `/login` page

**Files:**
- Create: `app/login/page.tsx`

**Step 1: Create `app/login/page.tsx`**

```typescript
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
```

**Step 2: Verify**

Run `pnpm dev`, open an incognito window, visit `http://localhost:3000` — you should land on `/login` and see the email form.

**Step 3: Commit**
```bash
git add app/login/page.tsx
git commit -m "feat: add /login page"
```

---

## Task 8: Wire up sign-out in `app-sidebar.tsx`

**Files:**
- Modify: `components/app-sidebar.tsx`

> The sidebar footer already has a "Cerrar sesión" `DropdownMenuItem` with a `LogOut` icon. It just needs an `onClick` that calls `supabase.auth.signOut()` and redirects to `/login`.

**Step 1: Add the sign-out handler**

At the top of `app-sidebar.tsx`, add the router import and a `useRouter` hook. Then add an `async function handleSignOut()` and attach it to the existing logout `DropdownMenuItem`.

Find the `AppSidebar` function body. After the existing hooks, add:

```typescript
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
```

Inside `AppSidebar`, after `const { isMobile } = useSidebar()`:

```typescript
const router = useRouter()

async function handleSignOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  router.push("/login")
}
```

Then find this block (around line 410):
```tsx
<DropdownMenuItem>
  <LogOut className="mr-2 size-4" />
  Cerrar sesión
</DropdownMenuItem>
```

Replace it with:
```tsx
<DropdownMenuItem onClick={handleSignOut}>
  <LogOut className="mr-2 size-4" />
  Cerrar sesión
</DropdownMenuItem>
```

**Step 2: Verify**

Run `pnpm dev`. Sign in via magic link. Open the sidebar footer user dropdown. Click "Cerrar sesión" — you should be redirected to `/login`.

**Step 3: Commit**
```bash
git add components/app-sidebar.tsx
git commit -m "feat: wire up sign-out in sidebar footer"
```

---

## Task 9: End-to-end manual verification

**Goal:** Confirm the full auth flow works top to bottom.

**Checklist:**
1. Open incognito window → visit `http://localhost:3000` → lands on `/login` ✓
2. Enter your email → click "Send login link" → confirmation state shows ✓
3. Open the magic link email → click the link → redirected to `/` (dashboard) ✓
4. Refresh the dashboard — stays logged in (session persists via cookie) ✓
5. Click "Cerrar sesión" in sidebar footer → redirected to `/login` ✓
6. Try to visit `http://localhost:3000` again → redirected to `/login` ✓
7. Visit `http://localhost:3000/login` while logged in → redirected to `/` ✓

**Supabase Dashboard check:**
- Go to Supabase → Authentication → Users → confirm your user appears after first sign-in

**Step: Final commit (if any cleanup needed)**
```bash
git add -A
git commit -m "chore: complete magic link auth implementation"
```

---

## Summary of files created/modified

| Action | File |
|--------|------|
| Modified | `.env.local` |
| Created | `lib/supabase/client.ts` |
| Created | `lib/supabase/server.ts` |
| Created | `app/auth/callback/route.ts` |
| Created | `middleware.ts` |
| Modified | `components/login-form.tsx` |
| Created | `app/login/page.tsx` |
| Modified | `components/app-sidebar.tsx` |
