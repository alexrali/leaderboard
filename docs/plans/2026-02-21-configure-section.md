# Configure Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full-page Configure section (Perfil, Apariencia, Preferencias) wired to Zustand persist + Supabase sync, accessible from the sidebar.

**Architecture:** Extend the Zustand store with a `settings` slice using the `persist` middleware for instant localStorage hydration. A dedicated sync hook reads from / upserts to a Supabase `user_settings` table keyed by a stable device UUID. The settings page is a new `activeSection = "settings"` rendered in `app/page.tsx`, using Radix Tabs with three cards.

**Tech Stack:** Next.js 16 App Router, Zustand 5 (persist middleware), Supabase JS v2, TanStack Query v5, next-themes, react-hook-form + zod, Radix UI (Tabs, Select, RadioGroup, Switch), sonner, lucide-react, Tailwind CSS v4.

---

## Context: Key Files

- `lib/store.ts` — Zustand store (currently only `activeSection`)
- `lib/supabase.ts` — exports `supabase` client
- `components/providers.tsx` — QueryClientProvider only (ThemeProvider NOT wired yet)
- `components/theme-provider.tsx` — ThemeProvider wrapper exists but unused
- `app/layout.tsx` — root layout, imports `Providers`
- `components/app-sidebar.tsx` — has "Configuración" button at bottom (line 331) with no `onClick`
- `app/page.tsx` — renders sections based on `activeSection`, needs "settings" case added

---

## Task 1: Wire ThemeProvider into the app

**Files:**
- Modify: `components/providers.tsx`

The `ThemeProvider` component exists at `components/theme-provider.tsx` but is never used. Wire it now so `next-themes` works.

**Step 1: Open `components/providers.tsx` and replace its contents**

```tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchInterval: 5 * 60 * 1000,
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd "C:\Users\arami\Current\report generator\leaderboard" && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add components/providers.tsx
git commit -m "feat: wire ThemeProvider into app providers"
```

---

## Task 2: Extend Zustand store with settings + persist

**Files:**
- Modify: `lib/store.ts`

The store currently has only `activeSection`. Add a `settings` slice with the `persist` middleware so settings survive page refreshes via localStorage.

**Step 1: Replace `lib/store.ts` with the extended version**

```ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

// ─── Settings Types ───────────────────────────────────────────────────────────

export type AppTheme = "light" | "dark" | "system"
export type ViewMode = "daily" | "weekly"
export type RefreshInterval = 1 | 5 | 10 | 30

export interface UserProfile {
  displayName: string
  role: string
}

export interface AppearanceSettings {
  theme: AppTheme
}

export interface DashboardPrefs {
  defaultView: ViewMode
  defaultSection: string
  refreshInterval: RefreshInterval
}

export interface AppSettings {
  userProfile: UserProfile
  appearance: AppearanceSettings
  dashboardPrefs: DashboardPrefs
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  activeSection: string
  setActiveSection: (section: string) => void

  // Settings
  settings: AppSettings
  updateUserProfile: (profile: Partial<UserProfile>) => void
  updateAppearance: (appearance: Partial<AppearanceSettings>) => void
  updateDashboardPrefs: (prefs: Partial<DashboardPrefs>) => void
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  userProfile: {
    displayName: "Alejandro RL",
    role: "Ingeniero Líder",
  },
  appearance: {
    theme: "system",
  },
  dashboardPrefs: {
    defaultView: "daily",
    defaultSection: "overview",
    refreshInterval: 5,
  },
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSection: "overview",
      setActiveSection: (section) => set({ activeSection: section }),

      settings: defaultSettings,

      updateUserProfile: (profile) =>
        set((state) => ({
          settings: {
            ...state.settings,
            userProfile: { ...state.settings.userProfile, ...profile },
          },
        })),

      updateAppearance: (appearance) =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: { ...state.settings.appearance, ...appearance },
          },
        })),

      updateDashboardPrefs: (prefs) =>
        set((state) => ({
          settings: {
            ...state.settings,
            dashboardPrefs: { ...state.settings.dashboardPrefs, ...prefs },
          },
        })),
    }),
    {
      name: "leaderboard-app-settings",
      // Only persist settings, not activeSection (navigation is transient)
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add lib/store.ts
git commit -m "feat: extend Zustand store with settings slice + persist middleware"
```

---

## Task 3: Create Supabase `user_settings` table

**Files:**
- Modify: `supabase-schema.sql` (append the new table DDL)

**Step 1: Append to `supabase-schema.sql`**

```sql
-- ─── User Settings (local-first, device-keyed) ───────────────────────────────

create table if not exists user_settings (
  id          text primary key,           -- stable device UUID from localStorage
  profile     jsonb not null default '{}',
  appearance  jsonb not null default '{}',
  preferences jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on upsert
create or replace function update_user_settings_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute procedure update_user_settings_timestamp();
```

**Step 2: Run this SQL in the Supabase dashboard SQL editor**

Navigate to your Supabase project → SQL Editor → paste and run the SQL above.
Expected: "Success. No rows returned."

**Step 3: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: add user_settings table to Supabase schema"
```

---

## Task 4: Create device key utility

**Files:**
- Modify: `lib/utils.ts` (append helper)

The device key is a `crypto.randomUUID()` stored in localStorage. It acts as the row identifier in `user_settings` until auth is implemented.

**Step 1: Append to `lib/utils.ts`**

Read `lib/utils.ts` first, then append at the end:

```ts
// ─── Device Key ───────────────────────────────────────────────────────────────

const DEVICE_KEY = "leaderboard-device-id"

export function getDeviceKey(): string {
  if (typeof window === "undefined") return "ssr"
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_KEY, id)
  return id
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add lib/utils.ts
git commit -m "feat: add getDeviceKey utility for settings persistence"
```

---

## Task 5: Create `hooks/use-settings-sync.ts`

**Files:**
- Create: `hooks/use-settings-sync.ts`

This hook handles the Supabase read-on-mount and write-on-demand. Uses TanStack Query for the remote read (consistent with how the rest of the app does data fetching).

**Step 1: Create `hooks/use-settings-sync.ts`**

```ts
"use client"

import { useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAppStore, type AppSettings } from "@/lib/store"
import { getDeviceKey } from "@/lib/utils"

// ─── Remote read ──────────────────────────────────────────────────────────────

async function fetchRemoteSettings(): Promise<AppSettings | null> {
  const id = getDeviceKey()
  const { data, error } = await supabase
    .from("user_settings")
    .select("profile, appearance, preferences")
    .eq("id", id)
    .single()

  if (error || !data) return null

  return {
    userProfile: data.profile as AppSettings["userProfile"],
    appearance: data.appearance as AppSettings["appearance"],
    dashboardPrefs: data.preferences as AppSettings["dashboardPrefs"],
  }
}

// ─── Remote write ─────────────────────────────────────────────────────────────

async function upsertRemoteSettings(settings: AppSettings): Promise<void> {
  const id = getDeviceKey()
  const { error } = await supabase.from("user_settings").upsert({
    id,
    profile: settings.userProfile,
    appearance: settings.appearance,
    preferences: settings.dashboardPrefs,
  })
  if (error) throw error
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSettingsSync() {
  const settings = useAppStore((s) => s.settings)
  const updateUserProfile = useAppStore((s) => s.updateUserProfile)
  const updateAppearance = useAppStore((s) => s.updateAppearance)
  const updateDashboardPrefs = useAppStore((s) => s.updateDashboardPrefs)

  // Hydrate from Supabase on mount (remote wins on conflict)
  const { data: remoteSettings } = useQuery({
    queryKey: ["user-settings"],
    queryFn: fetchRemoteSettings,
    staleTime: Infinity, // only fetch once per session
    retry: 1,
  })

  useEffect(() => {
    if (!remoteSettings) return
    updateUserProfile(remoteSettings.userProfile)
    updateAppearance(remoteSettings.appearance)
    updateDashboardPrefs(remoteSettings.dashboardPrefs)
  }, [remoteSettings]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mutation for saving
  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: upsertRemoteSettings,
    onSuccess: () => toast.success("Configuración guardada"),
    onError: () => toast.error("Error al guardar. Los cambios se guardaron localmente."),
  })

  return {
    saveSettings: () => saveSettings(settings),
    isSaving: isPending,
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add hooks/use-settings-sync.ts
git commit -m "feat: add useSettingsSync hook for Supabase read/write"
```

---

## Task 6: Create `components/settings-page.tsx`

**Files:**
- Create: `components/settings-page.tsx`

The full-page settings UI. Three Radix Tabs: Perfil, Apariencia, Preferencias. Uses react-hook-form + zod for the forms with save buttons, and instant save for theme.

**Step 1: Create `components/settings-page.tsx`**

```tsx
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAppStore } from "@/lib/store"
import { useSettingsSync } from "@/hooks/use-settings-sync"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  displayName: z.string().min(1, "El nombre es requerido").max(50),
  role: z.string().min(1, "El rol es requerido").max(50),
})

const prefsSchema = z.object({
  defaultView: z.enum(["daily", "weekly"]),
  defaultSection: z.enum(["overview", "metrics", "day-progress", "resources", "dashboard"]),
  refreshInterval: z.coerce.number().refine((v) => [1, 5, 10, 30].includes(v)),
})

type ProfileForm = z.infer<typeof profileSchema>
type PrefsForm = z.infer<typeof prefsSchema>

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { setTheme } = useTheme()
  const settings = useAppStore((s) => s.settings)
  const updateUserProfile = useAppStore((s) => s.updateUserProfile)
  const updateAppearance = useAppStore((s) => s.updateAppearance)
  const updateDashboardPrefs = useAppStore((s) => s.updateDashboardPrefs)
  const { saveSettings, isSaving } = useSettingsSync()

  // ── Profile form ────────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: settings.userProfile,
  })

  useEffect(() => {
    profileForm.reset(settings.userProfile)
  }, [settings.userProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSaveProfile(data: ProfileForm) {
    updateUserProfile(data)
    saveSettings()
  }

  // ── Prefs form ──────────────────────────────────────────────────────────────
  const prefsForm = useForm<PrefsForm>({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      defaultView: settings.dashboardPrefs.defaultView,
      defaultSection: settings.dashboardPrefs.defaultSection as PrefsForm["defaultSection"],
      refreshInterval: settings.dashboardPrefs.refreshInterval,
    },
  })

  useEffect(() => {
    prefsForm.reset({
      defaultView: settings.dashboardPrefs.defaultView,
      defaultSection: settings.dashboardPrefs.defaultSection as PrefsForm["defaultSection"],
      refreshInterval: settings.dashboardPrefs.refreshInterval,
    })
  }, [settings.dashboardPrefs]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSavePrefs(data: PrefsForm) {
    updateDashboardPrefs({
      defaultView: data.defaultView,
      defaultSection: data.defaultSection,
      refreshInterval: data.refreshInterval as 1 | 5 | 10 | 30,
    })
    saveSettings()
  }

  // ── Theme (instant save) ────────────────────────────────────────────────────
  function onThemeChange(theme: "light" | "dark" | "system") {
    setTheme(theme)
    updateAppearance({ theme })
    saveSettings()
  }

  const currentTheme = settings.appearance.theme

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personaliza tu experiencia en el dashboard
        </p>
      </div>

      <Separator className="opacity-20" />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        {/* ── Perfil ─────────────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Perfil de usuario</CardTitle>
              <CardDescription>
                Tu nombre y rol se muestran en la barra lateral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="displayName">Nombre</Label>
                  <Input
                    id="displayName"
                    placeholder="Tu nombre"
                    {...profileForm.register("displayName")}
                  />
                  {profileForm.formState.errors.displayName && (
                    <p className="text-destructive text-xs">
                      {profileForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input
                    id="role"
                    placeholder="Tu rol"
                    {...profileForm.register("role")}
                  />
                  {profileForm.formState.errors.role && (
                    <p className="text-destructive text-xs">
                      {profileForm.formState.errors.role.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isSaving} className="self-start">
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Apariencia ─────────────────────────────────────────────────────── */}
        <TabsContent value="appearance">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Elige el tema de la interfaz.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(
                  [
                    { value: "light", label: "Claro", Icon: Sun },
                    { value: "dark", label: "Oscuro", Icon: Moon },
                    { value: "system", label: "Sistema", Icon: Monitor },
                  ] as const
                ).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onThemeChange(value)}
                    className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-colors ${
                      currentTheme === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferencias ───────────────────────────────────────────────────── */}
        <TabsContent value="preferences">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Preferencias del dashboard</CardTitle>
              <CardDescription>
                Define los valores por defecto al abrir el dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={prefsForm.handleSubmit(onSavePrefs)} className="flex flex-col gap-6">
                {/* Default view */}
                <div className="flex flex-col gap-3">
                  <Label>Vista por defecto</Label>
                  <RadioGroup
                    value={prefsForm.watch("defaultView")}
                    onValueChange={(v) =>
                      prefsForm.setValue("defaultView", v as "daily" | "weekly")
                    }
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="daily" id="view-daily" />
                      <Label htmlFor="view-daily" className="font-normal cursor-pointer">Hoy</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="weekly" id="view-weekly" />
                      <Label htmlFor="view-weekly" className="font-normal cursor-pointer">Semana</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Default section */}
                <div className="flex flex-col gap-2">
                  <Label>Sección inicial</Label>
                  <Select
                    value={prefsForm.watch("defaultSection")}
                    onValueChange={(v) =>
                      prefsForm.setValue("defaultSection", v as PrefsForm["defaultSection"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Resumen Semanal</SelectItem>
                      <SelectItem value="metrics">Métricas Generales</SelectItem>
                      <SelectItem value="day-progress">Progreso del Día</SelectItem>
                      <SelectItem value="resources">Recursos</SelectItem>
                      <SelectItem value="dashboard">Panel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refresh interval */}
                <div className="flex flex-col gap-2">
                  <Label>Intervalo de actualización</Label>
                  <Select
                    value={String(prefsForm.watch("refreshInterval"))}
                    onValueChange={(v) =>
                      prefsForm.setValue("refreshInterval", Number(v) as 1 | 5 | 10 | 30)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Cada 1 minuto</SelectItem>
                      <SelectItem value="5">Cada 5 minutos</SelectItem>
                      <SelectItem value="10">Cada 10 minutos</SelectItem>
                      <SelectItem value="30">Cada 30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={isSaving} className="self-start">
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add components/settings-page.tsx
git commit -m "feat: add SettingsPage component with profile, appearance, and preferences tabs"
```

---

## Task 7: Wire sidebar "Configuración" button

**Files:**
- Modify: `components/app-sidebar.tsx`

The "Configuración" button at line 331 has no `onClick`. Wire it to `onSectionChange`.

**Step 1: In `components/app-sidebar.tsx`, find this block (around line 330-334):**

```tsx
<SidebarMenuButton size="sm" tooltip="Configuración">
  <Settings />
  <span>Configuración</span>
</SidebarMenuButton>
```

Replace with:

```tsx
<SidebarMenuButton
  size="sm"
  tooltip="Configuración"
  isActive={activeSection === "settings"}
  onClick={() => onSectionChange?.("settings")}
>
  <Settings />
  <span>Configuración</span>
</SidebarMenuButton>
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: wire Configuración sidebar button to settings section"
```

---

## Task 8: Render SettingsPage in `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add `SettingsPage` import at the top of `app/page.tsx` alongside other component imports:**

```tsx
import { SettingsPage } from "@/components/settings-page"
```

**Step 2: In the breadcrumb label map, add the settings label:**

Find:
```tsx
const sectionLabel: Record<string, string> = {
  overview: "Resumen Semanal",
  metrics: "Métricas Generales",
  "day-progress": "Progreso del Día",
  resources: "Detalle de Recursos",
  dashboard: "Dashboard",
}
```

Replace with:
```tsx
const sectionLabel: Record<string, string> = {
  overview: "Resumen Semanal",
  metrics: "Métricas Generales",
  "day-progress": "Progreso del Día",
  resources: "Detalle de Recursos",
  dashboard: "Dashboard",
  settings: "Configuración",
}
```

**Step 3: In the render block, add the settings case inside the `{!isLoading && !isError && (...)}` block.**

Find the last section:
```tsx
{activeSection === "dashboard" && (
  <SectionTabs ... />
)}
```

Add after it:
```tsx
{activeSection === "settings" && <SettingsPage />}
```

**Note:** The settings page doesn't need `isLoading`/`isError` guards — wrap it outside those guards so it always renders. Find the `{isLoading && ...}` block and restructure the conditional render:

```tsx
{!isLoading && !isError && activeSection !== "settings" && (
  <>
    {activeSection === "overview" && (...)}
    {activeSection === "metrics" && (...)}
    {activeSection === "day-progress" && (...)}
    {activeSection === "resources" && (...)}
    {activeSection === "dashboard" && (...)}
  </>
)}

{activeSection === "settings" && <SettingsPage />}
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: render SettingsPage when activeSection is settings"
```

---

## Task 9: Wire user profile from store to sidebar footer

**Files:**
- Modify: `components/app-sidebar.tsx`

The sidebar footer currently has hardcoded name/role. Replace with values from the Zustand store.

**Step 1: Add the store import to `components/app-sidebar.tsx`:**

```tsx
import { useAppStore } from "@/lib/store"
```

**Step 2: Inside `AppSidebar`, read from the store:**

Add after the `useSidebar()` call:
```tsx
const displayName = useAppStore((s) => s.settings.userProfile.displayName)
const userRole = useAppStore((s) => s.settings.userProfile.role)
```

**Step 3: Replace the two hardcoded instances of `"Alejandro RL"` and `"Ingeniero Líder"` with the store values.**

There are two occurrences (trigger button + dropdown label). Replace both:
- `"Alejandro RL"` → `{displayName}`
- `"Ingeniero Líder"` → `{userRole}`
- `"SC"` (AvatarFallback) → `{displayName.slice(0, 2).toUpperCase()}`

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 5: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: wire sidebar user profile display to settings store"
```

---

## Task 10: Wire `refreshInterval` from settings to QueryClient

**Files:**
- Modify: `components/providers.tsx`

The `refetchInterval` is currently hardcoded to `5 * 60 * 1000`. Read it from the store.

**Note:** `Providers` is a Server Component boundary wrapper — QueryClient is created once. The cleanest way is to read the persisted value directly from localStorage before QueryClient creation.

**Step 1: Update `components/providers.tsx`**

```tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"

function getRefreshIntervalMs(): number {
  if (typeof window === "undefined") return 5 * 60 * 1000
  try {
    const raw = localStorage.getItem("leaderboard-app-settings")
    if (!raw) return 5 * 60 * 1000
    const parsed = JSON.parse(raw)
    const interval = parsed?.state?.settings?.dashboardPrefs?.refreshInterval ?? 5
    return interval * 60 * 1000
  } catch {
    return 5 * 60 * 1000
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchInterval: getRefreshIntervalMs(),
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add components/providers.tsx
git commit -m "feat: read refresh interval from persisted settings for QueryClient"
```

---

## Task 11: Add Toaster to layout

**Files:**
- Modify: `app/layout.tsx`

`sonner` needs a `<Toaster />` component in the layout to render toasts. It's installed but not mounted.

**Step 1: In `app/layout.tsx`, add the Toaster import:**

```tsx
import { Toaster } from "sonner"
```

**Step 2: Add `<Toaster />` inside `<body>`, after `{children}`:**

```tsx
<body className="font-sans antialiased">
  <Providers>
    <NuqsAdapter>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </NuqsAdapter>
  </Providers>
  <Toaster richColors position="bottom-right" />
  <Analytics />
</body>
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 4: Start dev server and verify end-to-end**

Run: `npm run dev`

Manual verification checklist:
- [ ] Click "Configuración" in sidebar → Settings page opens
- [ ] Breadcrumb shows "Configuración"
- [ ] Profile tab: change name/role → click save → sonner toast appears → sidebar footer updates
- [ ] Appearance tab: click Oscuro → page switches to dark mode instantly
- [ ] Preferences tab: change default section → save → toast appears
- [ ] Refresh page → profile name still shows (localStorage persist works)

**Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add Sonner Toaster to layout for settings feedback"
```

---

## Summary: Files Changed

| File | Action |
|---|---|
| `components/providers.tsx` | Modified — add ThemeProvider + read refreshInterval |
| `lib/store.ts` | Modified — settings slice + persist |
| `lib/utils.ts` | Modified — getDeviceKey() |
| `supabase-schema.sql` | Modified — user_settings table |
| `hooks/use-settings-sync.ts` | Created |
| `components/settings-page.tsx` | Created |
| `components/app-sidebar.tsx` | Modified — wire Configuración + dynamic profile |
| `app/page.tsx` | Modified — add SettingsPage render + breadcrumb label |
| `app/layout.tsx` | Modified — add Toaster |

**No new packages required** — everything is already installed.
