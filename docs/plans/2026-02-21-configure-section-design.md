# Configure Section Design
**Date:** 2026-02-21
**Status:** Approved

## Overview

Add a full-page Configure section to the Leaderboard dashboard, accessible via the existing "Configuración" sidebar button. Covers user profile, appearance, and dashboard preferences. Persisted locally via Zustand + localStorage, synced remotely to Supabase.

---

## Architecture

### 1. Zustand Store Extension (`lib/store.ts`)

Extend the existing store with a `settings` slice using the `persist` middleware:

```ts
userProfile: { displayName: string; role: string }
appearance: { theme: "light" | "dark" | "system" }
dashboardPrefs: {
  defaultView: "daily" | "weekly"
  defaultSection: string      // "overview" | "metrics" | "day-progress" | "resources" | "dashboard"
  refreshInterval: number     // minutes: 1 | 5 | 10 | 30
}
```

### 2. Custom Hook (`hooks/use-settings-sync.ts`)

- On mount: fetch from Supabase via TanStack Query → merge into Zustand store (remote wins)
- On save: upsert to Supabase after local state is committed
- Sonner toasts for success/error feedback
- Fallback: if Supabase unavailable, local state is preserved silently

### 3. Settings Page Component (`components/settings-page.tsx`)

New component rendered when `activeSection === "settings"`.

### 4. Supabase Table (`user_settings`)

```sql
create table user_settings (
  id          text primary key,   -- stable device key (crypto.randomUUID stored in localStorage)
  profile     jsonb,
  appearance  jsonb,
  preferences jsonb,
  updated_at  timestamptz default now()
);
```

Single row per device. One upsert per save.

**Auth note:** Device key (`crypto.randomUUID()`) stored in localStorage on first visit. Auth integration is on the roadmap — this approach bridges cleanly to per-user rows when auth lands.

### 5. Sidebar Wiring (`components/app-sidebar.tsx`)

Wire the existing "Configuración" `SidebarMenuButton` to call `onSectionChange("settings")`.

---

## UI Layout

```
SettingsPage
├── Header: "Configuración" + subtitle
└── Tabs (Radix Tabs — already installed)
    ├── [Perfil]
    │     Card: Display name (Input) + Role (Input)
    │           [Guardar cambios] — react-hook-form + zod
    │
    ├── [Apariencia]
    │     Card: Theme selector
    │           Three buttons: Claro / Oscuro / Sistema
    │           → wired to next-themes setTheme
    │           → saves instantly (no submit button)
    │
    └── [Preferencias]
          Card: Default view     → RadioGroup (Hoy / Semana)
          Card: Default section  → Select (Panel/Resumen/Métricas/Progreso/Recursos)
          Card: Refresh interval → Select (1 / 5 / 10 / 30 min)
                [Guardar cambios]
```

---

## Data Flow

### On app load
1. Zustand hydrates from `localStorage` instantly
2. `use-settings-sync` fetches from Supabase (TanStack Query)
   - Found → merge remote into store (remote wins on conflict)
   - Not found → push local defaults to Supabase (first-time setup)

### On setting change
1. Zustand store updates (in-memory, instant)
2. `zustand/persist` writes to `localStorage` (~0ms)
3. UI reflects change immediately
4. `use-settings-sync` fires Supabase upsert in background
   - Success → sonner toast "Configuración guardada"
   - Failure → sonner toast "Error al guardar" (local state preserved)

---

## Packages Used (all already installed)

| Package | Usage |
|---|---|
| `zustand` | Settings state + persist middleware |
| `next-themes` | Theme switching |
| `@supabase/supabase-js` | Remote sync |
| `@tanstack/react-query` | Remote read on mount |
| `react-hook-form` + `zod` | Profile & preferences forms |
| `sonner` | Save/error toasts |
| `@radix-ui/react-tabs` | Settings tab navigation |
| `@radix-ui/react-select` | Dropdowns |
| `@radix-ui/react-radio-group` | Default view toggle |
| `lucide-react` | Icons |

**No new packages required.**

---

## Files to Create / Modify

| Action | File |
|---|---|
| Modify | `lib/store.ts` — add settings slice with persist |
| Create | `hooks/use-settings-sync.ts` — Supabase sync hook |
| Create | `components/settings-page.tsx` — full page UI |
| Modify | `components/app-sidebar.tsx` — wire Configuración button |
| Modify | `app/page.tsx` — render SettingsPage for activeSection === "settings" |
| Modify | `components/providers.tsx` — add ThemeProvider if not already wrapping |
| SQL | Add `user_settings` table to Supabase |
