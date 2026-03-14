# SRI Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a complete Sales Rep Intelligence (SRI) dashboard section to the leaderboard app with 5 pages (Agentes, Clientes, Portafolio, Metas, Alertas), featuring high-end data visualizations with Recharts, peer group comparisons, signal-based alerts with action modals, drawer-based detail views with full chart content, and seamless animation throughout—all integrated with existing components and Hermes-inspired layout patterns.

**Architecture:** Extend the existing single-page app pattern with a new `sri` section key. Add SRI-specific hooks for Supabase queries (reusing TanStack Query patterns), create reusable chart components with Recharts, implement drawer-based detail views (following `WorkerDetailSheet` pattern), use traffic-light color semantics throughout, add signal action modals with state transitions, and implement staggered entrance animations. All new components follow strict TypeScript typing with no `any` types.

**Tech Stack:** Next.js 16 App Router, TypeScript 5.8+ (strict mode), Supabase JS v2 (`@supabase/ssr`), TanStack Query v5, Recharts v2.15.0, shadcn/ui components, Radix UI primitives, Tailwind CSS v4, Lucide React icons, Zustand store (existing), date-fns, Framer Motion v11 (for animations).

---

## Design Direction: Precisionist Executive Dashboard with Impeccable Polish

**Aesthetic Philosophy:** Clean, data-dense layouts with precise typography, semantic color, and purposeful motion. Think Bloomberg Terminal meets modern SaaS—functional beauty through information clarity, not decoration. Every animation serves a purpose: guiding attention, confirming actions, or revealing depth.

### Visual Engineering Approach

This plan follows **visual engineering**—not copying mockups directly, but designing thoughtful data visualizations that meaningfully represent SRI metrics:

1. **Pie charts for client health distribution** — Shows Active/At-risk/Dormant as parts of whole
2. **Horizontal bar charts for peer comparisons** — Agent vs peer group metrics (CPI, concentration, cross-sell)
3. **Line charts for weekly trends** — API score history, revenue trajectory over 12-week lookback
4. **Sparklines for category performance** — Mini trend indicators in Top 5 categories table
5. **Stacked bars for goal achievement** — Revenue vs Clients vs Retention vs CPI progress

Each chart is chosen for its semantic meaning to the data, not decorative variety.

### Impeccable Design Principles Applied

**Typography (fluid with clamp):**
```css
/* Display: page titles */
--font-size-display: clamp(1.5rem, 2vw + 1rem, 2rem);
font-weight: 600;
letter-spacing: -0.02em;

/* Heading: section titles */
--font-size-heading: clamp(1rem, 1vw + 0.875rem, 1.25rem);
font-weight: 500;

/* Body: content */
--font-size-body: clamp(0.875rem, 0.5vw + 0.75rem, 1rem);
font-weight: 400;

/* Small: metadata */
--font-size-small: clamp(0.75rem, 0.3vw + 0.625rem, 0.875rem);
font-weight: 400;
```

**Color (OKLCH - perceptually uniform):**
```css
/* Status colors - semantic, not decorative */
--status-success: oklch(0.65 0.15 145);  /* Green - healthy */
--status-warning: oklch(0.75 0.12  85);  /* Yellow - attention */
--status-critical: oklch(0.55 0.18  25);  /* Red - action needed */

/* Neutral with blue tint for cohesion */
--neutral-50: oklch(0.98 0.01 240);
--neutral-100: oklch(0.95 0.01 240);
--neutral-200: oklch(0.90 0.01 240);
--neutral-900: oklch(0.15 0.01 240);

/* Accent blue - primary actions only */
--primary: oklch(0.55 0.18 250);
--primary-hover: oklch(0.50 0.18 250);
```

**Spacing (varied, not uniform):**
```css
/* Rhythm through variation */
--space-tight: 0.5rem;   /* Tight groupings */
--space-normal: 1rem;     /* Default */
--space-relaxed: 1.5rem;  /* Section separators */
--space-loose: 2rem;      /* Page sections */
--space-extraloose: 3rem; /* Major breaks */
```

**Motion (purposeful, exponential easing):**
```css
/* Staggered entrance - page load */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in { animation: fadeInUp 0.4s ease-out; }
.animation-delay-100 { animation-delay: 0.1s; }
.animation-delay-200 { animation-delay: 0.2s; }
.animation-delay-300 { animation-delay: 0.3s; }

/* Hover micro-interactions */
.interactive { transition: all 0.2s ease-out; }
.interactive:hover { transform: translateY(-1px); }

/* Drawer slide - smooth, not bouncy */
.drawer-enter { animation: slideInRight 0.3s ease-out; }
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

**Layout Principles:**
- **Flat hierarchy** — No cards-in-cards; information density through layout
- **Asymmetric balance** — Left-aligned text, varied column widths
- **Progressive disclosure** — Summary → table → drawer → modal
- **No redundant headers** — Don't repeat what users can already see

---

## Context: Existing Codebase Patterns

### Files to Reference

| File | Pattern to Follow |
|------|-------------------|
| `app/page.tsx` | Single-page routing with `activeSection` state |
| `components/app-sidebar.tsx` | Sidebar navigation with collapsible groups |
| `components/worker-detail-sheet.tsx` | Drawer pattern for detail views |
| `components/panel/contribution-heatmap.tsx` | Recharts integration pattern |
| `hooks/use-leaderboard-queries.ts` | TanStack Query hooks with Supabase |
| `lib/store.ts` | Zustand store with persist middleware |
| `lib/supabase/client.ts` | Supabase browser client creation |
| `lib/supabase/server.ts` | Supabase server client with cookies |

### SRI Data Types (from `lib/supabase.ts`)

Already defined types that must be used:
- `SriAgent` — agent dimension
- `SriClient` — client dimension
- `SriProduct` — product dimension
- `SriCategory` — category dimension
- `SriAgentMonthly` — agent monthly metrics (33 columns)
- `SriAgentClientMonthly` — agent-client monthly grain
- `SriClientHealth` — RFM + activity status
- `SriAgentPerformanceIndex` — API scores with component breakdown

### Hermes Layout Reference

From `docs/hermes/architecture.md`:
- **Sidebar-first layout** with collapsible sections
- **Breadcrumb navigation** showing current section
- **Card-based content areas** with consistent spacing
- **Status badges** with semantic colors
- **Action buttons** in consistent positions

---

## Phase 1: Foundation — Types, Hooks, Store, Animation Utilities

### Task 1: Add SRI Types to lib/supabase.ts

**Files:**
- Modify: `lib/supabase.ts` (append after line 200)

**Step 1: Read existing SRI types from Python project**

Run: Read `C:\Users\arami\Current\store tracker\sales_rep_intelligence\storage\supabase_writer.py`
Expected: Lines 117-181 show the complete schema

**Step 2: Append TypeScript type definitions**

Add to `lib/supabase.ts`:

```typescript
// ─── SRI: Sales Rep Intelligence Types ─────────────────────────────────────

export type SriAgent = {
  agent_id: string
  name: string | null
  peer_group: number | null
  active: boolean
  created_at: string
  updated_at: string
}

export type SriClient = {
  client_id: string
  segment_label: string | null // "Alto" | "Medio" | "Bajo"
  activity_status: string | null // "Active" | "At-risk" | "Dormant"
  rfm_score: unknown // JSON stored, type as unknown for now
  created_at: string
  updated_at: string
}

export type SriProduct = {
  clave: string
  description: string
  category: string
  provider: string
  abc_class: "A" | "B" | "C"
  xyz_class: "X" | "Y" | "Z"
  created_at: string
  updated_at: string
}

export type SriCategory = {
  category_id: string
  category_name: string
  created_at: string
}

export type SriAgentMonthly = {
  agent_id: string
  month: string // YYYY-MM format
  total_revenue: number
  total_units: number
  invoice_count: number
  total_cost: number
  total_profit: number
  avg_order_value: number
  revenue_growth_mom: number
  abc_a_revenue_share: number
  active_client_count: number
  new_client_count: number
  client_retention_rate: number
  avg_purchase_frequency: number
  portfolio_concentration_top3: number
  pct_active: number
  pct_at_risk: number
  pct_dormant: number
  avg_cpi: number
  cross_sell_rate: number
  product_intro_rate: number
  avg_reorder_rate: number
  category_breadth: number
  avg_sku_depth_per_category: number
  avg_client_revenue: number
  segment_entropy: number
  peer_group: number
  peer_pct_total_revenue: number
  peer_pct_avg_cpi: number
  peer_pct_client_retention_rate: number
  peer_pct_avg_reorder_rate: number
  created_at: string
  updated_at: string
}

export type SriAgentClientMonthly = {
  agent_id: string
  client_id: string
  month: string
  revenue: number
  units: number
  cost: number
  profit: number
  margin_pct: number
  invoice_count: number
  unique_skus: number
  unique_categories: number
  created_at: string
  updated_at: string
}

export type SriClientHealth = {
  client_id: string
  month: string
  recency_days: number
  frequency: number
  monetary: number
  invoice_count: number
  unique_skus: number
  unique_categories: number
  cats_purchased: number
  cpi: number
  activity_status: string
  rfm_segment: string
  reorder_rate: number
  last_purchase_date: string
  created_at: string
  updated_at: string
}

export type SriAgentPerformanceIndex = {
  agent_id: string
  month: string
  api_score: number
  score_revenue: number
  score_portfolio: number
  score_cpi: number
  score_quality: number
  weight_revenue: number
  weight_portfolio: number
  weight_cpi: number
  weight_quality: number
  peer_group: number
  created_at: string
  updated_at: string
}

// ─── SRI: Derived types for UI ──────────────────────────────────────────────────

export type AgentWithApiScore = SriAgentMonthly & {
  agent_name: string // Joined from agents or derived
  api_score: number // Joined from performance_index
  peer_group_label: string // Mapped from peer_group number
}

export type ClientWithHealth = SriClient & {
  recency_days: number
  last_purchase_date: string
  rfm_segment: string
  reorder_rate: number
}

export type SignalType = "ALTO" | "MEDIO" | "POSITIVO"

export type AgentSignal = {
  agent_id: string
  level: SignalType
  type: string
  message: string
  metric_value: number | null
}

export type AgentRankingRow = AgentWithApiScore & {
  rank: number
  trend: "up" | "down" | "stable"
}

// ─── SRI: Chart Data Types ─────────────────────────────────────────────────────

export type CategoryTrendData = {
  category: string
  revenue: number
  change: number // percentage change vs previous month
}

export type WeeklyTrendData = {
  week: string
  api_score: number
  revenue: number
}

export type ClientHealthDistribution = {
  status: "Active" | "At-risk" | "Dormant"
  count: number
  percentage: number
  color: string
}
```

**Step 3: Type-check**

Run: `cd "C:\Users\arami\Current\report generator\leaderboard" && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat(types): add SRI (Sales Rep Intelligence) TypeScript types"
```

---

### Task 2: Create SRI Query Hooks

**Files:**
- Create: `hooks/use-sri-queries.ts`
- Create: `lib/sri-queries.ts` (Supabase query functions)

**Step 1: Create Supabase query functions**

Create `lib/sri-queries.ts`:

```typescript
import { supabase } from "./supabase"
import type {
  SriAgent,
  SriClient,
  SriAgentMonthly,
  SriClientHealth,
  SriAgentPerformanceIndex,
  SriAgentClientMonthly,
} from "./supabase"

// ─── Agent Dimension ───────────────────────────────────────────────────────

export async function getSriAgents(): Promise<SriAgent[]> {
  const { data, error } = await supabase
    .from("sri_agents")
    .select("*")
    .eq("active", true)
    .order("agent_id")

  if (error) throw error
  return data ?? []
}

// ─── Agent Monthly with API Score ────────────────────────────────────────────

export async function getSriAgentMonthly(
  month: string
): Promise<SriAgentMonthly[]> {
  const { data, error } = await supabase
    .from("sri_agent_monthly")
    .select("*")
    .eq("month", month)
    .order("total_revenue", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getSriAgentPerformanceIndex(
  month: string
): Promise<SriAgentPerformanceIndex[]> {
  const { data, error } = await supabase
    .from("sri_agent_performance_index")
    .select("*")
    .eq("month", month)

  if (error) throw error
  return data ?? []
}

// ─── Historical API Scores (for sparklines) ───────────────────────────────────

export async function getSriAgentApiHistory(
  agentId: string,
  months: number = 12
): Promise<{ month: string; api_score: number }[]> {
  const { data, error } = await supabase
    .from("sri_agent_performance_index")
    .select("month, api_score")
    .eq("agent_id", agentId)
    .order("month", { ascending: true })
    .limit(months)

  if (error) throw error
  return data ?? []
}

// ─── Client Health ─────────────────────────────────────────────────────────

export async function getSriClientHealth(
  month: string
): Promise<SriClientHealth[]> {
  const { data, error } = await supabase
    .from("sri_client_health")
    .select("*")
    .eq("month", month)
    .order("monetary", { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Agent-Client Monthly ───────────────────────────────────────────────────

export async function getSriAgentClientMonthly(
  agentId: string,
  month: string
): Promise<SriAgentClientMonthly[]> {
  const { data, error } = await supabase
    .from("sri_agent_client_monthly")
    .select("*")
    .eq("agent_id", agentId)
    .eq("month", month)
    .order("revenue", { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Available Months ───────────────────────────────────────────────────────

export async function getSriAvailableMonths(): Promise<string[]> {
  const { data, error } = await supabase
    .from("sri_agent_monthly")
    .select("month")
    .order("month", { ascending: false })

  if (error) throw error
  const uniqueMonths = [...new Set(data?.map((d) => d.month) ?? [])]
  return uniqueMonths
}
```

**Step 2: Create React Query hooks**

Create `hooks/use-sri-queries.ts`:

```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getSriAgents,
  getSriAgentMonthly,
  getSriAgentPerformanceIndex,
  getSriClientHealth,
  getSriAgentClientMonthly,
  getSriAgentApiHistory,
  getSriAvailableMonths,
} from "@/lib/sri-queries"
import type { SriAgentMonthly, SriAgentPerformanceIndex } from "@/lib/supabase"

// ─── Available Months ───────────────────────────────────────────────────────

export function useSriAvailableMonths() {
  return useQuery({
    queryKey: ["sri-months"],
    queryFn: getSriAvailableMonths,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

// ─── Agent Data ─────────────────────────────────────────────────────────────

export function useSriAgents() {
  return useQuery({
    queryKey: ["sri-agents"],
    queryFn: getSriAgents,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSriAgentMonthly(month: string) {
  return useQuery({
    queryKey: ["sri-agent-monthly", month],
    queryFn: () => getSriAgentMonthly(month),
    enabled: !!month,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSriAgentPerformanceIndex(month: string) {
  return useQuery({
    queryKey: ["sri-agent-api", month],
    queryFn: () => getSriAgentPerformanceIndex(month),
    enabled: !!month,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Combined Agent Data (for ranking) ─────────────────────────────────────────

export function useSriAgentRanking(month: string) {
  const monthly = useSriAgentMonthly(month)
  const apiScores = useSriAgentPerformanceIndex(month)
  const agents = useSriAgents()

  return useQuery({
    queryKey: ["sri-agent-ranking", month],
    queryFn: () => {
      if (!monthly.data || !apiScores.data || !agents.data) return []

      return monthly.data.map((m) => {
        const apiScore = apiScores.data.find((s) => s.agent_id === m.agent_id)
        const agent = agents.data.find((a) => a.agent_id === m.agent_id)
        return {
          ...m,
          api_score: apiScore?.api_score ?? 0,
          agent_name: agent?.name ?? m.agent_id,
          peer_group_label: getPeerGroupLabel(m.peer_group),
        }
      })
    },
    enabled: !!monthly.data && !!apiScores.data && !!agents.data,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Client Health ───────────────────────────────────────────────────────────

export function useSriClientHealth(month: string) {
  return useQuery({
    queryKey: ["sri-client-health", month],
    queryFn: () => getSriClientHealth(month),
    enabled: !!month,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Agent-Client Detail ───────────────────────────────────────────────────────

export function useSriAgentClientMonthly(agentId: string, month: string) {
  return useQuery({
    queryKey: ["sri-agent-client", agentId, month],
    queryFn: () => getSriAgentClientMonthly(agentId, month),
    enabled: !!agentId && !!month,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Agent API History (for sparklines) ────────────────────────────────────────

export function useSriAgentApiHistory(agentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["sri-agent-api-history", agentId],
    queryFn: () => getSriAgentApiHistory(agentId, 12),
    enabled: !!agentId && enabled,
    staleTime: 10 * 60 * 1000,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeerGroupLabel(group: number): string {
  const labels: Record<number, string> = {
    0: "Grupo 1 — Alto",
    1: "Grupo 2 — Medio-Alto",
    2: "Grupo 3 — Medio-Bajo",
    3: "Grupo 4 — Bajo",
  }
  return labels[group] ?? `Grupo ${group}`
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/sri-queries.ts hooks/use-sri-queries.ts
git commit -m "feat(sri): add SRI query functions and React Query hooks"
```

---

### Task 3: Create Animation Utilities (Framer Motion Wrappers)

**Files:**
- Create: `components/sri/animations.tsx`

**Step 1: Create animation wrapper components**

```typescript
"use client"

import { motion } from "framer-motion"

// Staggered entrance variants for lists
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      ease: [0.25, 0.1, 0.25, 1], // ease-out-quart
      duration: 0.3,
    },
  },
}

// Page fade-in
export function PageFadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ease: [0.25, 0.1, 0.25, 1],
        duration: 0.4,
      }}
    >
      {children}
    </motion.div>
  )
}

// Card hover effect
export function HoverCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -1 }}
      transition={{
        ease: [0.25, 0.1, 0.25, 1],
        duration: 0.2,
      }}
    >
      {children}
    </motion.div>
  )
}

// Scale in for modals/drawers
export function ScaleIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        ease: [0.25, 0.1, 0.25, 1],
        duration: 0.2,
      }}
    >
      {children}
    </motion.div>
  )
}

// Slide from right for drawer
export const slideInRight = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: {
    ease: [0.25, 0.1, 0.25, 1],
    duration: 0.3,
  },
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/sri/animations.tsx
git commit -m "feat(sri): add Framer Motion animation wrappers"
```

---

### Task 4: Extend Sidebar with SRI Section

**Files:**
- Modify: `components/app-sidebar.tsx`
- Reference: `docs/sidebar-spec.md` for pattern

**Step 1: Add SRI collapsible group before Sprints**

In `components/app-sidebar.tsx`, find the Sprints item and add SRI group before it:

```tsx
{/* SRI — Sales Rep Intelligence */}
<Collapsible defaultOpen={false} asChild>
  <SidebarGroup>
    <SidebarGroupLabel>
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-4 w-4" />
        SRI
      </div>
      <CollapsibleTrigger asChild>
        <SidebarGroupAction>
          <ChevronDown className="h-4 w-4" />
        </SidebarGroupAction>
      </CollapsibleTrigger>
    </SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeSection === "sri-agentes"}
            onClick={() => onSectionChange?.("sri-agentes")}
          >
            Agentes
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeSection === "sri-clientes"}
            onClick={() => onSectionChange?.("sri-clientes")}
          >
            Clientes
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeSection === "sri-portafolio"}
            onClick={() => onSectionChange?.("sri-portafolio")}
          >
            Portafolio
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeSection === "sri-metas"}
            onClick={() => onSectionChange?.("sri-metas")}
          >
            Metas
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeSection === "sri-alertas"}
            onClick={() => onSectionChange?.("sri-alertas")}
          >
            Alertas
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</Collapsible>
```

**Step 2: Import ShoppingBag icon (if not already imported)**

At the top of `components/app-sidebar.tsx`:

```tsx
import { ShoppingBag } from "lucide-react"
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat(sri): add SRI section to sidebar navigation"
```

---

### Task 5: Extend Store with SRI State

**Files:**
- Modify: `lib/store.ts`

**Step 1: Add SRI month selection state**

In `lib/store.ts`, after the existing state interface:

```typescript
interface AppState {
  // ... existing state ...

  // SRI: Month selection
  sriMonth: string
  setSriMonth: (month: string) => void
}
```

**Step 2: Add state and action to the store**

In the store implementation:

```typescript
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ... existing state ...

      sriMonth: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
      setSriMonth: (month) => set({ sriMonth: month }),
    }),
    {
      name: "leaderboard-app-settings",
      partialize: (state) => ({
        settings: state.settings,
        sriMonth: state.sriMonth, // Persist SRI month selection
      }),
    }
  )
)
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/store.ts
git commit -m "feat(sri): add SRI month selection to Zustand store"
```

---

## Phase 2: Shared Components — Charts, Badges, Status Indicators

### Task 6: Add Recharts to Project

**Files:**
- Modify: `package.json`
- Create: `components/sri/charts/` directory

**Step 1: Install Recharts**

Run: `cd "C:\Users\arami\Current\report generator\leaderboard" && pnpm add recharts`

**Step 2: Install Framer Motion for animations**

Run: `pnpm add framer-motion`

**Step 3: Create charts directory structure**

Run: `mkdir -p "C:\Users\arami\Current\report generator\leaderboard\components\sri\charts"`

**Step 4: Commit**

```bash
git add package.json
git commit -m "feat(sri): add recharts and framer-motion dependencies"
```

---

### Task 7: Create Traffic Light Status Badge Component

**Files:**
- Create: `components/sri/status-badge.tsx`

**Step 1: Create the status badge component**

```typescript
"use client"

import { cn } from "@/lib/utils"
import { type ClassValue } from "clsx"

type StatusLevel = "success" | "warning" | "critical" | "neutral"

interface StatusBadgeProps {
  level: StatusLevel
  children: React.ReactNode
  className?: ClassValue
}

export function StatusBadge({ level, children, className }: StatusBadgeProps) {
  const styles: Record<
    StatusLevel,
    { bg: string; text: string; border: string }
  > = {
    success: {
      bg: "bg-status-success/10",
      text: "text-status-success",
      border: "border-status-success/20",
    },
    warning: {
      bg: "bg-status-warning/10",
      text: "text-status-warning",
      border: "border-status-warning/20",
    },
    critical: {
      bg: "bg-status-critical/10",
      text: "text-status-critical",
      border: "border-status-critical/20",
    },
    neutral: {
      bg: "bg-neutral-100",
      text: "text-neutral-600",
      border: "border-neutral-200",
    },
  }

  const style = styles[level]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {children}
    </span>
  )
}

// Helper to determine level from value
export function getStatusLevel(
  value: number,
  thresholds: { green: number; yellow?: number }
): StatusLevel {
  if (value >= thresholds.green) return "success"
  if (thresholds.yellow && value >= thresholds.yellow) return "warning"
  return "critical"
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/sri/status-badge.tsx
git commit -m "feat(sri): add StatusBadge component with traffic-light styling"
```

---

### Task 8: Create API Score Progress Bar Component

**Files:**
- Create: `components/sri/api-score-bar.tsx`

**Step 1: Create the API score progress bar component**

```typescript
"use client"

import { cn } from "@/lib/utils"
import { getStatusLevel } from "./status-badge"

interface ApiScoreBarProps {
  score: number
  label?: string
  showValue?: boolean
  className?: string
}

export function ApiScoreBar({
  score,
  label,
  showValue = true,
  className,
}: ApiScoreBarProps) {
  const level = getStatusLevel(score, { green: 65, yellow: 45 })
  const percentage = Math.round(score)
  const color = level === "success" ? "var(--status-success)" :
                 level === "warning" ? "var(--status-warning)" :
                 "var(--status-critical)"

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <span className="text-sm text-neutral-600 min-w-fit">{label}</span>
      )}
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showValue && (
        <span className="text-sm font-medium tabular-nums min-w-[3ch] text-right">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Stacked API score component (shows 4 components)
interface ApiScoreStackedProps {
  scores: {
    revenue: number
    portfolio: number
    cpi: number
    quality: number
  }
  weights: {
    revenue: number
    portfolio: number
    cpi: number
    quality: number
  }
}

export function ApiScoreStacked({ scores, weights }: ApiScoreStackedProps) {
  const total =
    scores.revenue * weights.revenue +
    scores.portfolio * weights.portfolio +
    scores.cpi * weights.cpi +
    scores.quality * weights.quality

  return (
    <div className="space-y-2">
      <ApiScoreBar score={total} showValue={false} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between text-neutral-600">
          <span>Revenue ({Math.round(weights.revenue * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.revenue.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Portfolio ({Math.round(weights.portfolio * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.portfolio.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>CPI ({Math.round(weights.cpi * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.cpi.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Quality ({Math.round(weights.quality * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.quality.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/sri/api-score-bar.tsx
git commit -m "feat(sri): add ApiScoreBar and ApiScoreStacked components"
```

---

### Task 9: Create Recharts Chart Components

**Files:**
- Create: `components/sri/charts/pie-chart.tsx` — Client health distribution
- Create: `components/sri/charts/horizontal-bar-chart.tsx` — Peer comparisons
- Create: `components/sri/charts/line-chart.tsx` — Weekly trends
- Create: `components/sri/charts/sparkline.tsx` — Mini trend indicators

**Step 1: Create Pie Chart for Client Health Distribution**

Create `components/sri/charts/pie-chart.tsx`:

```typescript
"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { getStatusLevel } from "../status-badge"

interface PieChartData {
  name: string
  value: number
  color: string
}

interface ClientHealthPieChartProps {
  data: PieChartData[]
}

const COLORS = {
  success: "var(--status-success)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

export function ClientHealthPieChart({ data }: ClientHealthPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              strokeWidth={0}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--neutral-900)",
            border: "none",
            borderRadius: "6px",
            color: "var(--neutral-50)",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          formatter={(value: number) => [`${value.toFixed(0)}%`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

**Step 2: Create Horizontal Bar Chart for Peer Comparisons**

Create `components/sri/charts/horizontal-bar-chart.tsx`:

```typescript
"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { getStatusLevel } from "../status-badge"

interface HorizontalBarData {
  name: string
  value: number
  target?: number
  color?: string
}

interface HorizontalBarChartProps {
  data: HorizontalBarData[]
  unit?: string
  width?: number
}

export function HorizontalBarChart({
  data,
  unit = "",
  width = 400
}: HorizontalBarChartProps) {
  const max = Math.max(...data.map(d => d.value))

  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 40}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
      >
        <XAxis
          type="number"
          domain={[0, max * 1.1]}
          hide
        />
        <YAxis
          type="category"
          dataKey="name"
          width={55}
          tick={{ fontSize: 12, fill: "var(--neutral-600)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--neutral-900)",
            border: "none",
            borderRadius: "6px",
            color: "var(--neutral-50)",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          formatter={(value: number) => [value.toFixed(1) + unit, ""]}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          animationBegin={0}
          animationDuration={500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? "var(--primary)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**Step 3: Create Line Chart for Weekly Trends**

Create `components/sri/charts/line-chart.tsx`:

```typescript
"use client"

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts"

interface LineChartData {
  week: string
  value: number
}

interface TrendLineChartProps {
  data: LineChartData[]
  color?: string
  unit?: string
  height?: number
}

export function TrendLineChart({
  data,
  color = "var(--primary)",
  unit = "",
  height = 200
}: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--neutral-200)"
          vertical={false}
        />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "var(--neutral-500)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--neutral-500)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--neutral-900)",
            border: "none",
            borderRadius: "6px",
            color: "var(--neutral-50)",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          formatter={(value: number) => [value.toFixed(1) + unit, ""]}
          labelFormatter={(label) => `Week ${label}`}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Step 4: Create Sparkline for Mini Trend Indicators**

Create `components/sri/charts/sparkline.tsx`:

```typescript
"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SparklineData {
  value: number
}

interface SparklineProps {
  data: SparklineData[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({
  data,
  color = "var(--primary)",
  width = 60,
  height = 24
}: SparklineProps) {
  if (data.length < 2) return null

  const first = data[0].value
  const last = data[data.length - 1].value
  const isPositive = last >= first
  const sparkColor = isPositive ? "var(--status-success)" : "var(--status-critical)"

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={sparkColor}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add components/sri/charts/
git commit -m "feat(sri): add Recharts components (pie, bar, line, sparkline)"
```

---

## Phase 3: Drawer Components — Full Detail Views with Charts

### Task 10: Create Agent Detail Drawer with Full Content

**Files:**
- Create: `components/sri/agent-detail-sheet.tsx`
- Create: `lib/format.ts` (currency formatting)

**Step 1: Create currency format utility**

Create `lib/format.ts`:

```typescript
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}
```

**Step 2: Create the complete agent detail drawer**

Create `components/sri/agent-detail-sheet.tsx`:

```typescript
"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiScoreStacked } from "./api-score-bar"
import { getStatusLevel, StatusBadge } from "./status-badge"
import { formatCurrency, formatPercent } from "@/lib/format"
import { TrendLineChart } from "./charts/line-chart"
import { Sparkline } from "./charts/sparkline"
import { HorizontalBarChart } from "./charts/horizontal-bar-chart"
import { slideInRight, ScaleIn } from "./animations"
import { motion } from "framer-motion"
import type { AgentWithApiScore, SriAgentClientMonthly, WeeklyTrendData } from "@/lib/supabase"
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Target } from "lucide-react"

interface AgentDetailSheetProps {
  agent: AgentWithApiScore | null
  open: boolean
  onOpenChange: (open: boolean) => void
  agentClients?: SriAgentClientMonthly[]
  apiHistory?: { month: string; api_score: number }[]
}

export function AgentDetailSheet({
  agent,
  open,
  onOpenChange,
  agentClients = [],
  apiHistory = [],
}: AgentDetailSheetProps) {
  const [actionModalOpen, setActionModalOpen] = useState<"plan" | "share" | "monitor" | null>(null)

  if (!agent) return null

  const level = getStatusLevel(agent.api_score, { green: 65, yellow: 45 })

  // Mock weekly trend data (would come from actual query in production)
  const weeklyTrendData: WeeklyTrendData[] = apiHistory.slice(-12).map((h, i) => ({
    week: `W${i + 1}`,
    api_score: h.api_score,
    revenue: agent.total_revenue / 12,
  }))

  // Mock Top 5 categories (would come from category aggregation query)
  const topCategories = [
    { name: "Bebidas", revenue: 45000, change: 0.12, sparkline: [100, 105, 110, 108, 112] },
    { name: "Snacks", revenue: 32000, change: -0.05, sparkline: [100, 98, 95, 97, 95] },
    { name: "Lácteos", revenue: 28000, change: 0.08, sparkline: [100, 102, 105, 107, 108] },
    { name: "Limpieza", revenue: 24000, change: 0.02, sparkline: [100, 100, 101, 101, 102] },
    { name: "Papelería", revenue: 18000, change: -0.03, sparkline: [100, 99, 98, 98, 97] },
  ]

  // Mock alerts based on thresholds
  const alerts = [
    agent.client_retention_rate < 0.80 ? {
      type: "critical",
      title: "Retención baja",
      message: `Retención de ${formatPercent(agent.client_retention_rate)} está bajo el objetivo de 80%`,
      action: "Plan de recuperación"
    } : null,
    agent.pct_dormant > 0.15 ? {
      type: "warning",
      title: "Clientes dormantes",
      message: `${formatPercent(agent.pct_dormant)} de clientes están inactivos`,
      action: "Activar campaña"
    } : null,
    agent.portfolio_concentration_top3 > 0.60 ? {
      type: "warning",
      title: "Alta concentración",
      message: `${formatPercent(agent.portfolio_concentration_top3)} del revenue en Top 3 clientes`,
      action: "Diversificar"
    } : null,
    agent.api_score >= 65 ? {
      type: "success",
      title: "Excelente performance",
      message: `API de ${agent.api_score.toFixed(1)} está en el top cuartil`,
      action: "Compartir mejores prácticas"
    } : null,
  ].filter(Boolean) as Array<{ type: string; title: string; message: string; action: string }>

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <motion.div {...slideInRight} className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl">
                    Agente {agent.agent_id}
                  </SheetTitle>
                  <p className="text-neutral-600 mt-1 text-sm">
                    {agent.agent_name} • {agent.peer_group_label}
                  </p>
                </div>
                <StatusBadge level={level}>
                  {agent.api_score.toFixed(1)} API
                </StatusBadge>
              </div>
            </SheetHeader>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="trends">Tendencias</TabsTrigger>
                <TabsTrigger value="categories">Categorías</TabsTrigger>
                <TabsTrigger value="alerts">Alertas</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Overview Tab */}
              <TabsContent value="overview" className="p-6 space-y-6 mt-0">
                {/* API Score Breakdown */}
                <section>
                  <h3 className="font-semibold text-sm mb-3">Puntaje API (desglose)</h3>
                  <ApiScoreStacked
                    scores={{
                      revenue: agent.score_revenue ?? agent.api_score,
                      portfolio: agent.score_portfolio ?? agent.api_score,
                      cpi: agent.score_cpi ?? agent.api_score,
                      quality: agent.score_quality ?? agent.api_score,
                    }}
                    weights={{
                      revenue: 0.30,
                      portfolio: 0.25,
                      cpi: 0.25,
                      quality: 0.20,
                    }}
                  />
                </section>

                {/* Key Metrics */}
                <section className="grid grid-cols-2 gap-4">
                  <MetricCard
                    label="Revenue"
                    value={formatCurrency(agent.total_revenue)}
                    trend={agent.revenue_growth_mom}
                  />
                  <MetricCard
                    label="Clientes Activos"
                    value={agent.active_client_count}
                  />
                  <MetricCard
                    label="Retención"
                    value={formatPercent(agent.client_retention_rate)}
                    trend={agent.peer_pct_client_retention_rate - 100}
                  />
                  <MetricCard
                    label="CPI"
                    value={formatPercent(agent.avg_cpi)}
                    trend={agent.peer_pct_avg_cpi - 100}
                  />
                </section>

                {/* Goals Progress */}
                <section>
                  <h3 className="font-semibold text-sm mb-3">Progreso vs Metas</h3>
                  <div className="space-y-3">
                    <GoalBar
                      label="Revenue"
                      current={agent.total_revenue}
                      target={agent.total_revenue * 1.05}
                    />
                    <GoalBar
                      label="Clientes Activos"
                      current={agent.active_client_count}
                      target={agent.active_client_count / 0.85}
                    />
                    <GoalBar
                      label="Retención"
                      current={agent.client_retention_rate}
                      target={0.80}
                      format={formatPercent}
                    />
                    <GoalBar
                      label="CPI"
                      current={agent.avg_cpi}
                      target={0.72}
                      format={formatPercent}
                    />
                  </div>
                </section>
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends" className="p-6 space-y-6 mt-0">
                <section>
                  <h3 className="font-semibold text-sm mb-4">Historia API Score (12 semanas)</h3>
                  <TrendLineChart
                    data={weeklyTrendData}
                    color="var(--primary)"
                    height={200}
                  />
                </section>

                <section>
                  <h3 className="font-semibold text-sm mb-4">Revenue Trajectory</h3>
                  <TrendLineChart
                    data={weeklyTrendData.map(d => ({ week: d.week, value: d.revenue }))}
                    color="var(--status-success)"
                    height={200}
                  />
                </section>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="p-6 space-y-4 mt-0">
                <section>
                  <h3 className="font-semibold text-sm mb-4">Top 5 Categorías por Revenue</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-xs">Categoría</th>
                          <th className="px-4 py-2 text-right font-semibold text-xs">Revenue</th>
                          <th className="px-4 py-2 text-center font-semibold text-xs">Tendencia</th>
                          <th className="px-4 py-2 text-right font-semibold text-xs">Cambio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCategories.map((cat) => (
                          <tr key={cat.name} className="border-t">
                            <td className="px-4 py-2 text-sm font-medium">{cat.name}</td>
                            <td className="px-4 py-2 text-sm text-right tabular-nums">
                              {formatCurrency(cat.revenue)}
                            </td>
                            <td className="px-4 py-2">
                              <Sparkline data={cat.sparkline.map(v => ({ value: v }))} />
                            </td>
                            <td className="px-4 py-2 text-sm text-right tabular-nums">
                              <span className={cat.change >= 0 ? "text-status-success" : "text-status-critical"}>
                                {cat.change >= 0 ? "+" : ""}{formatPercent(cat.change)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-sm mb-4">Peer Comparison — CPI</h3>
                  <HorizontalBarChart
                    data={[
                      { name: "Agente", value: agent.avg_cpi * 100, color: "var(--primary)" },
                      { name: "Peer Avg", value: (agent.avg_cpi / (agent.peer_pct_avg_cpi / 100)) * 100, color: "var(--neutral-300)" },
                    ]}
                    unit="%"
                  />
                </section>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="p-6 space-y-4 mt-0">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-status-success" />
                    <p>No hay alertas para este agente</p>
                  </div>
                ) : (
                  alerts.map((alert, index) => (
                    <AlertCard
                      key={index}
                      type={alert.type}
                      title={alert.title}
                      message={alert.message}
                      action={alert.action}
                      onActionClick={() => setActionModalOpen(alert.type as any)}
                    />
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </SheetContent>

      {/* Action Modal (simplified - would be separate component) */}
      {actionModalOpen && (
        <ActionModal
          type={actionModalOpen}
          agent={agent}
          onClose={() => setActionModalOpen(null)}
        />
      )}
    </Sheet>
  )
}

// Supporting components

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string
  value: string | number
  trend?: number
}) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-status-success" />
          ) : trend < 0 ? (
            <TrendingDown className="h-3 w-3 text-status-critical" />
          ) : (
            <Minus className="h-3 w-3 text-neutral-400" />
          )}
          <span
            className={
              trend > 0
                ? "text-status-success"
                : trend < 0
                  ? "text-status-critical"
                  : "text-neutral-500"
            }
          >
            {trend > 0 ? "+" : ""}{formatPercent(trend)}
          </span>
        </div>
      )}
    </div>
  )
}

function GoalBar({
  label,
  current,
  target,
  format = (v) => v.toFixed(0),
}: {
  label: string
  current: number
  target: number
  format?: (v: number) => string
}) {
  const percentage = Math.min((current / target) * 100, 100)
  const level = getStatusLevel(percentage, { green: 100, yellow: 80 })
  const color = level === "success" ? "var(--status-success)" :
                level === "warning" ? "var(--status-warning)" :
                "var(--status-critical)"

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-600">{label}</span>
        <span className="font-medium tabular-nums">
          {format(current)} / {format(target)}
        </span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function AlertCard({
  type,
  title,
  message,
  action,
  onActionClick,
}: {
  type: string
  title: string
  message: string
  action: string
  onActionClick: () => void
}) {
  const styles = {
    critical: {
      bg: "bg-status-critical/5",
      border: "border-status-critical/20",
      icon: <AlertCircle className="h-5 w-5 text-status-critical" />,
      button: "bg-status-critical text-status-critical-foreground hover:bg-status-critical/90",
    },
    warning: {
      bg: "bg-status-warning/5",
      border: "border-status-warning/20",
      icon: <AlertCircle className="h-5 w-5 text-status-warning" />,
      button: "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
    },
    success: {
      bg: "bg-status-success/5",
      border: "border-status-success/20",
      icon: <CheckCircle2 className="h-5 w-5 text-status-success" />,
      button: "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    },
  }[type] || styles.warning

  return (
    <div className={`border rounded-lg p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm text-neutral-600 mt-1">{message}</p>
        </div>
      </div>
      <button
        onClick={onActionClick}
        className={`mt-3 px-3 py-1.5 rounded text-sm font-medium ${styles.button}`}
      >
        {action}
      </button>
    </div>
  )
}

function ActionModal({
  type,
  agent,
  onClose,
}: {
  type: string
  agent: AgentWithApiScore
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <ScaleIn>
        <div
          className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-semibold text-lg">Crear Plan de Acción</h3>
          <p className="text-neutral-600 mt-2 text-sm">
            Configurar acción para {agent.agent_name} ({agent.agent_id})
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Título de la acción"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Descripción..."
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900">
              Cancelar
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary-hover">
              Guardar
            </button>
          </div>
        </div>
      </ScaleIn>
    </motion.div>
  )
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/sri/agent-detail-sheet.tsx lib/format.ts
git commit -m "feat(sri): add AgentDetailSheet with full chart content, trends, categories, alerts, action modals"
```

---

## Phase 4: Page Implementation — All 5 Pages with Visual Polish

### Task 11: Create Agentes Ranking Page

**Files:**
- Create: `components/sri/pages/agentes-page.tsx`
- Modify: `app/page.tsx` (add routing)

**Step 1: Create the Agentes page component with animations**

Create `components/sri/pages/agentes-page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useSriAvailableMonths, useSriAgentRanking, useSriAgentApiHistory } from "@/hooks/use-sri-queries"
import { useAppStore } from "@/lib/store"
import { AgentDetailSheet } from "../agent-detail-sheet"
import { getStatusLevel, StatusBadge } from "../status-badge"
import { ApiScoreBar } from "../api-score-bar"
import { formatCurrency, formatPercent } from "@/lib/format"
import { PageFadeIn, staggerContainer, staggerItem } from "../animations"
import { motion } from "framer-motion"
import type { SriAgentClientMonthly } from "@/lib/supabase"
import { ChevronDown, ChevronUp, Minus } from "lucide-react"

export function AgentesPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const setSriMonth = useAppStore((s) => s.setSriMonth)

  const { data: months } = useSriAvailableMonths()
  const { data: ranking = [], isLoading } = useSriAgentRanking(sriMonth)

  const [selectedAgent, setSelectedAgent] = useState<ReturnType<typeof ranking>[number] | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [peerGroupFilter, setPeerGroupFilter] = useState<number | "all">("all")

  // Fetch API history for selected agent (for drawer sparklines)
  const { data: apiHistory } = useSriAgentApiHistory(
    selectedAgent?.agent_id ?? "",
    drawerOpen
  )

  const effectiveMonth = months?.[0] || sriMonth
  const filteredRanking = peerGroupFilter === "all"
    ? ranking
    : ranking.filter((a) => a.peer_group === peerGroupFilter)

  function handleRowClick(agent: typeof ranking[number]) {
    setSelectedAgent(agent)
    setDrawerOpen(true)
  }

  function getTrendIcon(value: number) {
    if (value > 0.05) return <ChevronUp className="h-4 w-4 text-status-success" />
    if (value < -0.05) return <ChevronDown className="h-4 w-4 text-status-critical" />
    return <Minus className="h-4 w-4 text-neutral-400" />
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <PageFadeIn>
      <div className="space-y-6">
        {/* Header with month selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Ranking de Agentes</h1>
            <p className="text-neutral-600 mt-1 text-sm">
              Performance individual del equipo de ventas
            </p>
          </div>
          <select
            value={sriMonth}
            onChange={(e) => setSriMonth(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {months?.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Summary cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-4"
        >
          <SummaryCard
            label="Agentes Activos"
            value={ranking.length}
          />
          <SummaryCard
            label="Revenue Total"
            value={formatCurrency(
              ranking.reduce((sum, a) => sum + a.total_revenue, 0)
            )}
          />
          <SummaryCard
            label="API Promedio"
            value={
              ranking.length > 0
                ? (
                    ranking.reduce((sum, a) => sum + a.api_score, 0) /
                    ranking.length
                  ).toFixed(1)
                : "—"
            }
          />
          <SummaryCard
            label="Retención Promedio"
            value={
              ranking.length > 0
                ? formatPercent(
                    ranking.reduce((sum, a) => sum + a.client_retention_rate, 0) /
                    ranking.length
                  )
                : "—"
            }
          />
        </motion.div>

        {/* Peer group filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Peer Group:</span>
          {["all", 0, 1, 2, 3].map((g) => (
            <button
              key={g}
              onClick={() => setPeerGroupFilter(g as typeof peerGroupFilter)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                peerGroupFilter === g
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {g === "all" ? "Todos" : `Grupo ${g}`}
            </button>
          ))}
        </div>

        {/* Ranking table */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="show"
          className="border rounded-lg overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Agente</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">API Score</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Revenue</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Crecimiento</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Clientes</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Retención</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Peer Group</th>
              </tr>
            </thead>
            <tbody>
              {filteredRanking.map((agent, index) => (
                <motion.tr
                  key={agent.agent_id}
                  variants={staggerItem}
                  className="border-t hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(agent)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{agent.agent_id}</p>
                      <p className="text-xs text-neutral-600">{agent.agent_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ApiScoreBar score={agent.api_score} showValue />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">
                    {formatCurrency(agent.total_revenue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(agent.revenue_growth_mom)}
                      <span className="text-sm tabular-nums">
                        {formatPercent(agent.revenue_growth_mom)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">
                    {agent.active_client_count}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">
                    {formatPercent(agent.client_retention_rate)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {agent.peer_group_label}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Detail drawer */}
      <AgentDetailSheet
        agent={selectedAgent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        agentClients={[]}
        apiHistory={apiHistory}
      />
    </PageFadeIn>
  )
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <motion.div variants={staggerItem} className="border rounded-lg p-4">
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </motion.div>
  )
}

function formatMonth(month: string): string {
  const [year, mon] = month.split("-")
  const date = new Date(parseInt(year), parseInt(mon) - 1, 1)
  return date.toLocaleString("es-MX", { month: "long", year: "numeric" })
}
```

**Step 2: Add routing in app/page.tsx**

In `app/page.tsx`, add the SRI page routes:

```typescript
import { AgentesPage } from "@/components/sri/pages/agentes-page"
```

And in the render section, add:

```typescript
{activeSection === "sri-agentes" && <AgentesPage />}
```

Also add to sectionLabel:

```typescript
const sectionLabel: Record<string, string> = {
  // ... existing ...
  "sri-agentes": "Agentes",
  "sri-clientes": "Clientes",
  "sri-portafolio": "Portafolio",
  "sri-metas": "Metas",
  "sri-alertas": "Alertas",
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/sri/pages/agentes-page.tsx app/page.tsx
git commit -m "feat(sri): add Agentes ranking page with animations, drawer, filters"
```

---

### Task 12: Create Clientes Health Page with Pie Chart

**Files:**
- Create: `components/sri/pages/clientes-page.tsx`

**Step 1: Create the Clientes page with pie chart**

Create `components/sri/pages/clientes-page.tsx`:

```typescript
"use client"

import { useMemo } from "react"
import { useSriClientHealth } from "@/hooks/use-sri-queries"
import { useAppStore } from "@/lib/store"
import { getStatusLevel, StatusBadge } from "../status-badge"
import { formatCurrency } from "@/lib/format"
import { ClientHealthPieChart } from "../charts/pie-chart"
import { PageFadeIn, staggerContainer, staggerItem } from "../animations"
import { motion } from "framer-motion"

type ActivityStatus = "Active" | "At-risk" | "Dormant"

export function ClientesPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: clients = [], isLoading } = useSriClientHealth(sriMonth)

  // Group by activity status
  const { active, atRisk, dormant, distribution } = useMemo(() => {
    const active = clients.filter((c) => c.activity_status === "Active")
    const atRisk = clients.filter((c) => c.activity_status === "At-risk")
    const dormant = clients.filter((c) => c.activity_status === "Dormant")

    const total = clients.length
    const distribution = [
      { name: "Active", value: total > 0 ? (active.length / total) * 100 : 0, color: "var(--status-success)" },
      { name: "At-risk", value: total > 0 ? (atRisk.length / total) * 100 : 0, color: "var(--status-warning)" },
      { name: "Dormant", value: total > 0 ? (dormant.length / total) * 100 : 0, color: "var(--status-critical)" },
    ]

    return { active, atRisk, dormant, distribution }
  }, [clients])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <PageFadeIn>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Salud del Portafolio</h1>
          <p className="text-neutral-600 mt-1 text-sm">
            Estado de los clientes por actividad y valor RFM
          </p>
        </div>

        {/* Status distribution with pie chart */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-6"
        >
          <StatusCard
            status="Active"
            count={active.length}
            percentage={distribution[0].value}
            threshold={30}
            color="success"
          />
          <StatusCard
            status="At-risk"
            count={atRisk.length}
            percentage={distribution[1].value}
            threshold={90}
            color="warning"
          />
          <StatusCard
            status="Dormant"
            count={dormant.length}
            percentage={distribution[2].value}
            threshold={90}
            color="critical"
          />
        </motion.div>

        {/* Pie chart visualization */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="show"
          className="border rounded-lg p-6"
        >
          <h2 className="font-semibold text-sm mb-4">Distribución de Salud del Portafolio</h2>
          <div className="flex items-center gap-8">
            <div className="w-64 h-48">
              <ClientHealthPieChart data={distribution} />
            </div>
            <div className="space-y-2">
              {distribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium">{item.value.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* At-risk clients table */}
        {atRisk.length > 0 && (
          <motion.section
            variants={staggerItem}
            initial="hidden"
            animate="show"
          >
            <h2 className="font-semibold mb-4">Clientes en Riesgo (Prioritarios)</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Cliente</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Recencia</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Revenue</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Facturas</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Última Compra</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">RFM</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.slice(0, 10).map((client) => (
                    <tr key={client.client_id} className="border-t">
                      <td className="px-4 py-3 text-sm font-medium">{client.client_id}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          level={getStatusLevel(client.recency_days, { green: 30, yellow: 60 })}
                        >
                          {client.recency_days} días
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {formatCurrency(client.monetary)}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {client.invoice_count}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {client.last_purchase_date}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {client.rfm_segment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* RFM segment distribution */}
        <motion.section
          variants={staggerItem}
          initial="hidden"
          animate="show"
        >
          <h2 className="font-semibold mb-4">Distribución RFM</h2>
          <div className="grid grid-cols-4 gap-4">
            {["Alto", "Medio", "Bajo", "Perdido"].map((segment) => {
              const count = clients.filter((c) => c.rfm_segment === segment).length
              const pct = clients.length > 0 ? (count / clients.length) * 100 : 0
              return (
                <div key={segment} className="border rounded-lg p-4 text-center">
                  <p className="text-xs text-neutral-600 uppercase tracking-wide">{segment}</p>
                  <p className="text-2xl font-semibold mt-1">{pct.toFixed(0)}%</p>
                  <p className="text-xs text-neutral-500">{count} clientes</p>
                </div>
              )
            })}
          </div>
        </motion.section>
      </div>
    </PageFadeIn>
  )
}

function StatusCard({
  status,
  count,
  percentage,
  threshold,
  color,
}: {
  status: ActivityStatus
  count: number
  percentage: number
  threshold: number
  color: "success" | "warning" | "critical"
}) {
  const level = color === "success" ? "success" : color === "warning" ? "warning" : "critical"

  return (
    <motion.div variants={staggerItem} className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{status}</h3>
        <StatusBadge level={level}>{count} clientes</StatusBadge>
      </div>
      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: `var(--status-${color})`,
          }}
        />
      </div>
      <p className="text-sm text-neutral-600">{percentage.toFixed(0)}% del total</p>
    </motion.div>
  )
}
```

**Step 2: Add routing**

```typescript
import { ClientesPage } from "@/components/sri/pages/clientes-page"

// In render:
{activeSection === "sri-clientes" && <ClientesPage />}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/sri/pages/clientes-page.tsx app/page.tsx
git commit -m "feat(sri): add Clientes health page with pie chart, distribution, at-risk table"
```

---

### Task 13: Create Portafolio Analysis Page with Bar Charts

**Files:**
- Create: `components/sri/pages/portafolio-page.tsx`

**Step 1: Create the Portafolio page with horizontal bar charts**

Create `components/sri/pages/portafolio-page.tsx`:

```typescript
"use client"

import { useSriAgentRanking } from "@/hooks/use-sri-queries"
import { useAppStore } from "@/lib/store"
import { getStatusLevel, StatusBadge } from "../status-badge"
import { formatPercent } from "@/lib/format"
import { HorizontalBarChart } from "../charts/horizontal-bar-chart"
import { PageFadeIn, staggerContainer, staggerItem } from "../animations"
import { motion } from "framer-motion"

export function PortafolioPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: ranking = [], isLoading } = useSriAgentRanking(sriMonth)

  // Calculate portfolio metrics
  const avgCpi = ranking.length > 0
    ? ranking.reduce((sum, a) => sum + a.avg_cpi, 0) / ranking.length
    : 0
  const avgCrossSell = ranking.length > 0
    ? ranking.reduce((sum, a) => sum + a.cross_sell_rate, 0) / ranking.length
    : 0
  const avgConcentration = ranking.length > 0
    ? ranking.reduce((sum, a) => sum + a.portfolio_concentration_top3, 0) / ranking.length
    : 0

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <PageFadeIn>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Análisis de Portafolio</h1>
          <p className="text-neutral-600 mt-1 text-sm">
            Métricas de penetración, concentración y cross-sell
          </p>
        </div>

        {/* Key metrics */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-6"
        >
          <MetricCard
            title="CPI Promedio"
            value={formatPercent(avgCpi)}
            description="Categorías Penetración Index"
          />
          <MetricCard
            title="Cross-Sell Promedio"
            value={formatPercent(avgCrossSell)}
            description="Clientes con ≥3 categorías"
          />
          <MetricCard
            title="Concentración Promedio"
            value={formatPercent(avgConcentration)}
            description="Revenue en Top 3 clientes"
          />
        </motion.div>

        {/* CPI table with horizontal bars */}
        <motion.section
          variants={staggerItem}
          initial="hidden"
          animate="show"
        >
          <h2 className="font-semibold mb-4">Profundidad de Categoría (CPI) — Top 10</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Agente</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">CPI Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">vs Peer</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Categorías</th>
                </tr>
              </thead>
              <tbody>
                {ranking
                  .sort((a, b) => b.avg_cpi - a.avg_cpi)
                  .slice(0, 10)
                  .map((agent, index) => {
                    const peerAvg = calculatePeerCpiAverage(agent.peer_group, ranking)
                    const diff = agent.avg_cpi - peerAvg
                    return (
                      <tr key={agent.agent_id} className="border-t">
                        <td className="px-4 py-3 text-sm font-medium">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium">{agent.agent_id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden w-24">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${agent.avg_cpi * 100}%`,
                                  backgroundColor:
                                    agent.avg_cpi >= 0.75
                                      ? "var(--status-success)"
                                      : agent.avg_cpi >= 0.5
                                        ? "var(--status-warning)"
                                        : "var(--status-critical)",
                                }}
                              />
                            </div>
                            <span className="text-sm tabular-nums min-w-[3ch]">
                              {formatPercent(agent.avg_cpi)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm ${
                              diff >= 0 ? "text-status-success" : "text-status-critical"
                            }`}
                          >
                            {diff >= 0 ? "+" : ""}{formatPercent(diff)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums">
                          {agent.category_breadth}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Concentration comparison chart */}
        <motion.section
          variants={staggerItem}
          initial="hidden"
          animate="show"
          className="border rounded-lg p-6"
        >
          <h2 className="font-semibold mb-4">Comparación de Concentración del Portafolio</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Porcentaje de revenue en Top 3 clientes — más bajo es mejor (diversificado)
          </p>
          <HorizontalBarChart
            data={ranking
              .sort((a, b) => b.portfolio_concentration_top3 - a.portfolio_concentration_top3)
              .slice(0, 8)
              .map((agent) => ({
                name: agent.agent_id,
                value: agent.portfolio_concentration_top3,
                color:
                  agent.portfolio_concentration_top3 <= 50
                    ? "var(--status-success)"
                    : agent.portfolio_concentration_top3 <= 60
                      ? "var(--status-warning)"
                      : "var(--status-critical)",
              }))}
            unit="%"
            height={320}
          />
        </motion.section>

        {/* Cross-sell leaderboard */}
        <motion.section
          variants={staggerItem}
          initial="hidden"
          animate="show"
        >
          <h2 className="font-semibold mb-4">Cross-Sell Rate — Top Performers</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Agente</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Cross-Sell</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Clientes con ≥3 categorías</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {ranking
                  .sort((a, b) => b.cross_sell_rate - a.cross_sell_rate)
                  .slice(0, 10)
                  .map((agent) => (
                    <tr key={agent.agent_id} className="border-t">
                      <td className="px-4 py-3 text-sm font-medium">{agent.agent_id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden w-24">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${agent.cross_sell_rate}%`,
                                backgroundColor:
                                  agent.cross_sell_rate >= 80
                                    ? "var(--status-success)"
                                    : agent.cross_sell_rate >= 60
                                      ? "var(--status-warning)"
                                      : "var(--status-critical)",
                              }}
                            />
                          </div>
                          <span className="text-sm tabular-nums min-w-[4ch]">
                            {formatPercent(agent.cross_sell_rate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {Math.round(agent.active_client_count * agent.cross_sell_rate / 100)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          level={
                            agent.cross_sell_rate >= 80
                              ? "success"
                              : agent.cross_sell_rate >= 60
                                ? "warning"
                                : "critical"
                          }
                        >
                          {agent.cross_sell_rate >= 80
                            ? "Excelente"
                            : agent.cross_sell_rate >= 60
                              ? "Aceptable"
                              : "Mejorar"}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </PageFadeIn>
  )
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <motion.div variants={staggerItem} className="border rounded-lg p-6">
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-semibold mt-2">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{description}</p>
    </motion.div>
  )
}

function calculatePeerCpiAverage(
  peerGroup: number,
  ranking: typeof import("@/lib/supabase").AgentWithApiScore[]
): number {
  const peers = ranking.filter((a) => a.peer_group === peerGroup)
  if (peers.length === 0) return 0
  return peers.reduce((sum, a) => sum + a.avg_cpi, 0) / peers.length
}
```

**Step 2: Add routing**

```typescript
import { PortafolioPage } from "@/components/sri/pages/portafolio-page"

// In render:
{activeSection === "sri-portafolio" && <PortafolioPage />}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/sri/pages/portafolio-page.tsx app/page.tsx
git commit -m "feat(sri): add Portafolio analysis page with horizontal bar charts, CPI, cross-sell"
```

---

### Task 14: Create Metas (Goals) Page with Progress Bars

**Files:**
- Create: `components/sri/pages/metas-page.tsx`

**Step 1: Create the Metas page**

Create `components/sri/pages/metas-page.tsx`:

```typescript
"use client"

import { useSriAgentRanking } from "@/hooks/use-sri-queries"
import { useAppStore } from "@/lib/store"
import { getStatusLevel, StatusBadge } from "../status-badge"
import { formatPercent, formatCurrency } from "@/lib/format"
import { PageFadeIn, staggerContainer, staggerItem } from "../animations"
import { motion } from "framer-motion"

// Goal thresholds from config
const GOAL_THRESHOLD_REVENUE = 1.05 // +5% from previous month
const GOAL_THRESHOLD_ACTIVATION = 0.85 // 85% active
const GOAL_THRESHOLD_RETENTION = 0.80 // 80% retention
const GOAL_THRESHOLD_CPI = 0.72 // 72% CPI (peer avg)

export function MetasPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: ranking = [], isLoading } = useSriAgentRanking(sriMonth)

  // Calculate goal achievement for each agent
  const goals = ranking.map((agent) => {
    const revenueGoal = agent.total_revenue * (1 + 0.05)
    const revenueAchieved = agent.total_revenue / revenueGoal

    const activationAchieved = agent.active_client_count / GOAL_THRESHOLD_ACTIVATION
    const retentionAchieved = agent.client_retention_rate / GOAL_THRESHOLD_RETENTION
    const cpiAchieved = agent.avg_cpi / GOAL_THRESHOLD_CPI

    const overall = (revenueAchieved + activationAchieved + retentionAchieved + cpiAchieved) / 4

    return {
      ...agent,
      goals: {
        revenue: revenueGoal,
        activation: agent.active_client_count / GOAL_THRESHOLD_ACTIVATION,
        retention: agent.client_retention_rate / GOAL_THRESHOLD_RETENTION,
        cpi: agent.avg_cpi / GOAL_THRESHOLD_CPI,
      },
      achievement: {
        revenue: revenueAchieved,
        activation: activationAchieved,
        retention: retentionAchieved,
        cpi: cpiAchieved,
        overall,
      },
    }
  })

  const completed = goals.filter((g) => g.achievement.overall >= 1).length
  const inProgress = goals.filter((g) => g.achievement.overall >= 0.8 && g.achievement.overall < 1).length
  const atRisk = goals.filter((g) => g.achievement.overall < 0.8).length

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <PageFadeIn>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Progreso vs Metas</h1>
          <p className="text-neutral-600 mt-1 text-sm">
            Comparación de performance actual vs objetivos del mes
          </p>
        </div>

        {/* Status summary */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-4"
        >
          <StatusSummaryCard
            label="Completado"
            value={`${completed}/${ranking.length}`}
            percentage={ranking.length > 0 ? (completed / ranking.length) * 100 : 0}
            color="success"
          />
          <StatusSummaryCard
            label="En Progreso"
            value={`${inProgress}/${ranking.length}`}
            percentage={ranking.length > 0 ? (inProgress / ranking.length) * 100 : 0}
            color="warning"
          />
          <StatusSummaryCard
            label="En Riesgo"
            value={`${atRisk}/${ranking.length}`}
            percentage={ranking.length > 0 ? (atRisk / ranking.length) * 100 : 0}
            color="critical"
          />
          <StatusSummaryCard
            label="Revenue Equipo"
            value={
              ranking.length > 0
                ? formatPercent(
                    (ranking.reduce((sum, g) => sum + g.achievement.revenue, 0) /
                      ranking.length)
                  )
                : "—"
            }
            percentage={0}
            color="neutral"
          />
        </motion.div>

        {/* Individual agent goals */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <h2 className="font-semibold mb-4">Progreso Individual</h2>
          <div className="space-y-4">
            {goals.map((agent) => (
              <AgentGoalRow key={agent.agent_id} agent={agent} />
            ))}
          </div>
        </motion.section>
      </div>
    </PageFadeIn>
  )
}

function StatusSummaryCard({
  label,
  value,
  percentage,
  color,
}: {
  label: string
  value: string
  percentage: number
  color: "success" | "warning" | "critical" | "neutral"
}) {
  return (
    <motion.div variants={staggerItem} className="border rounded-lg p-4">
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      <p className={`text-sm mt-1 ${
        color === "success" ? "text-status-success" :
        color === "warning" ? "text-status-warning" :
        color === "critical" ? "text-status-critical" :
        "text-neutral-600"
      }`}>
        {percentage > 0 ? `${percentage.toFixed(0)}%` : "—"}
      </p>
    </motion.div>
  )
}

function AgentGoalRow({
  agent,
}: {
  agent: ReturnType<typeof calculateAgentGoals>[number]
}) {
  const level = getStatusLevel(agent.achievement.overall * 100, {
    green: 100,
    yellow: 80,
  })

  return (
    <motion.div variants={staggerItem} className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium">{agent.agent_id}</p>
          <p className="text-xs text-neutral-600">{agent.agent_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600">Overall</span>
          <span className="font-semibold tabular-nums text-sm">
            {formatPercent(agent.achievement.overall)}
          </span>
          <StatusBadge level={level}>
            {agent.achievement.overall >= 1
              ? "✓"
              : agent.achievement.overall >= 0.8
                ? "→"
                : "!"}
          </StatusBadge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <GoalBar
          label="Revenue"
          achieved={agent.achievement.revenue}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <GoalBar
          label="Clientes"
          achieved={agent.achievement.activation}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <GoalBar
          label="Retención"
          achieved={agent.achievement.retention}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <GoalBar
          label="CPI"
          achieved={agent.achievement.cpi}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
      </div>
    </motion.div>
  )
}

function GoalBar({
  label,
  achieved,
  format,
}: {
  label: string
  achieved: number
  format: (value: number) => string
}) {
  const percentage = Math.min(achieved * 100, 100)
  const color =
    achieved >= 1
      ? "var(--status-success)"
      : achieved >= 0.8
        ? "var(--status-warning)"
        : "var(--status-critical)"

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-600">{label}</span>
        <span className="font-medium tabular-nums">{format(achieved)}</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function calculateAgentGoals(agent: any) {
  const revenueGoal = agent.total_revenue * (1 + 0.05)
  const revenueAchieved = agent.total_revenue / revenueGoal

  const activationGoal = agent.active_client_count / GOAL_THRESHOLD_ACTIVATION
  const retentionAchieved = agent.client_retention_rate / GOAL_THRESHOLD_RETENTION
  const cpiAchieved = agent.avg_cpi / GOAL_THRESHOLD_CPI

  const overall = (revenueAchieved + activationGoal + retentionAchieved + cpiAchieved) / 4

  return {
    ...agent,
    goals: {
      revenue: revenueGoal,
      activation: activationGoal,
      retention: retentionAchieved,
      cpi: cpiAchieved,
    },
    achievement: {
      revenue: revenueAchieved,
      activation: activationGoal,
      retention: retentionAchieved,
      cpi: cpiAchieved,
      overall,
    },
  }
}
```

**Step 2: Add routing**

```typescript
import { MetasPage } from "@/components/sri/pages/metas-page"

// In render:
{activeSection === "sri-metas" && <MetasPage />}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/sri/pages/metas-page.tsx app/page.tsx
git commit -m "feat(sri): add Metas progress page with goal tracking, achievement bars"
```

---

### Task 15: Create Alertas (Signals) Page with Action Modals

**Files:**
- Create: `components/sri/pages/alertas-page.tsx`
- Create: `lib/sri-signals.ts` (signal generation logic)
- Create: `components/sri/signal-action-modal.tsx`

**Step 1: Create signal generation utility**

Create `lib/sri-signals.ts`:

```typescript
import type { AgentWithApiScore, AgentSignal } from "./supabase"

export function generateAgentSignals(agents: AgentWithApiScore[]): AgentSignal[] {
  const signals: AgentSignal[] = []

  for (const agent of agents) {
    // CRITICAL signals
    if (agent.client_retention_rate < 0.80) {
      signals.push({
        agent_id: agent.agent_id,
        level: "ALTO",
        type: "Retención",
        message: `▼${((1 - agent.client_retention_rate) * 100).toFixed(0)}% - Crítico (meta: 80%)`,
        metric_value: agent.client_retention_rate,
      })
    }

    if (agent.pct_dormant > 0.15) {
      signals.push({
        agent_id: agent.agent_id,
        level: "ALTO",
        type: "Dormido",
        message: `${(agent.pct_dormant * 100).toFixed(0)}% clientes dormantes - Meta: ≤15%`,
        metric_value: agent.pct_dormant,
      })
    }

    if (agent.portfolio_concentration_top3 > 0.60) {
      signals.push({
        agent_id: agent.agent_id,
        level: "ALTO",
        type: "Concentración",
        message: `${(agent.portfolio_concentration_top3 * 100).toFixed(0)}% en Top 3 - Riesgo alto`,
        metric_value: agent.portfolio_concentration_top3,
      })
    }

    // WARNING signals
    if (agent.avg_cpi < 0.70 && agent.client_retention_rate >= 0.80) {
      const peerAvg = calculatePeerCpiAverage(agent.peer_group, agents)
      signals.push({
        agent_id: agent.agent_id,
        level: "MEDIO",
        type: "CPI",
        message: `${(agent.avg_cpi * 100).toFixed(0)}% - Abajo promedio peer (${(peerAvg * 100).toFixed(0)}%)`,
        metric_value: agent.avg_cpi,
      })
    }

    if (agent.revenue_growth_mom < 0 && agent.peer_pct_total_revenue > 50) {
      signals.push({
        agent_id: agent.agent_id,
        level: "MEDIO",
        type: "Crecimiento",
        message: `▼${Math.abs(agent.revenue_growth_mom * 100).toFixed(0)}% - Único negativo en grupo`,
        metric_value: agent.revenue_growth_mom,
      })
    }

    // POSITIVE signals
    if (agent.peer_pct_total_revenue >= 60) {
      signals.push({
        agent_id: agent.agent_id,
        level: "POSITIVO",
        type: "Líder",
        message: `🥇 Top performer - ${agent.api_score.toFixed(1)} API`,
        metric_value: agent.api_score,
      })
    }

    if (agent.cross_sell_rate > 0.90) {
      const peerAvg = calculatePeerCrossSellAverage(agent.peer_group, agents)
      signals.push({
        agent_id: agent.agent_id,
        level: "POSITIVO",
        type: "Cross-sell",
        message: `${(agent.cross_sell_rate * 100).toFixed(0)}% cross-sell - +${((agent.cross_sell_rate - peerAvg) * 100).toFixed(0)}% vs peer`,
        metric_value: agent.cross_sell_rate,
      })
    }
  }

  return signals
}

function calculatePeerCpiAverage(
  peerGroup: number,
  agents: AgentWithApiScore[]
): number {
  const peers = agents.filter((a) => a.peer_group === peerGroup)
  if (peers.length === 0) return 0
  return peers.reduce((sum, a) => sum + a.avg_cpi, 0) / peers.length
}

function calculatePeerCrossSellAverage(
  peerGroup: number,
  agents: AgentWithApiScore[]
): number {
  const peers = agents.filter((a) => a.peer_group === peerGroup)
  if (peers.length === 0) return 0
  return peers.reduce((sum, a) => sum + a.cross_sell_rate, 0) / peers.length
}

export function groupSignalsByAgent(
  signals: AgentSignal[]
): Map<string, { alto: number; medio: number; positivo: number }> {
  const grouped = new Map<string, { alto: number; medio: number; positivo: number }>()

  for (const signal of signals) {
    if (!grouped.has(signal.agent_id)) {
      grouped.set(signal.agent_id, { alto: 0, medio: 0, positivo: 0 })
    }
    const counts = grouped.get(signal.agent_id)!
    if (signal.level === "ALTO") counts.alto++
    else if (signal.level === "MEDIO") counts.medio++
    else counts.positivo++
  }

  return grouped
}
```

**Step 2: Create signal action modal**

Create `components/sri/signal-action-modal.tsx`:

```typescript
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ScaleIn } from "./animations"
import type { AgentWithApiScore, AgentSignal } from "@/lib/supabase"

type ActionModalType = "plan" | "share" | "monitor"

interface SignalActionModalProps {
  type: ActionModalType
  agent: AgentWithApiScore
  signal: AgentSignal
  open: boolean
  onClose: () => void
  onSave?: (action: { type: string; agentId: string; title: string; description: string }) => void
}

export function SignalActionModal({ type, agent, signal, open, onClose, onSave }: SignalActionModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  if (!open) return null

  const titles = {
    plan: "Crear Plan de Acción",
    share: "Compartir Mejores Prácticas",
    monitor: "Configurar Monitoreo",
  }

  const placeholders = {
    plan: "Describe el plan de acción para mejorar...",
    share: "Describe las mejores prácticas a compartir...",
    monitor: "Describe los parámetros de monitoreo...",
  }

  function handleSave() {
    if (!title.trim()) return
    onSave?.({
      type,
      agentId: agent.agent_id,
      title: title.trim(),
      description: description.trim(),
    })
    setTitle("")
    setDescription("")
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <ScaleIn>
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-lg">{titles[type]}</h3>
            <p className="text-neutral-600 mt-1 text-sm">
              {agent.agent_name} ({agent.agent_id}) • {signal.type}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titles[type]}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={placeholders[type]}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {type === "plan" && (
              <div className="bg-neutral-50 rounded p-3 text-xs">
                <p className="font-medium text-neutral-700">Señal que origina esta acción:</p>
                <p className="text-neutral-600 mt-1">{signal.message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
          </div>
        </div>
      </ScaleIn>
    </motion.div>
  )
}
```

**Step 3: Create the Alertas page component**

Create `components/sri/pages/alertas-page.tsx`:

```typescript
"use client"

import { useState, useMemo } from "react"
import { useSriAgentRanking } from "@/hooks/use-sri-queries"
import { useAppStore } from "@/lib/store"
import { generateAgentSignals, groupSignalsByAgent } from "@/lib/sri-signals"
import { getStatusLevel, StatusBadge } from "../status-badge"
import { formatCurrency } from "@/lib/format"
import { PageFadeIn, staggerContainer, staggerItem } from "../animations"
import { SignalActionModal } from "../signal-action-modal"
import { motion } from "framer-motion"
import type { AgentWithApiScore, AgentSignal } from "@/lib/supabase"

export function AlertasPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: ranking = [], isLoading } = useSriAgentRanking(sriMonth)

  const [actionModal, setActionModal] = useState<{
    type: "plan" | "share" | "monitor"
    agent: AgentWithApiScore
    signal: AgentSignal
  } | null>(null)

  const signals = useMemo(() => {
    if (!ranking.length) return []
    return generateAgentSignals(ranking)
  }, [ranking])

  const altoSignals = signals.filter((s) => s.level === "ALTO")
  const medioSignals = signals.filter((s) => s.level === "MEDIO")
  const positivoSignals = signals.filter((s) => s.level === "POSITIVO")

  const signalsByAgent = useMemo(() => groupSignalsByAgent(signals), [signals])

  function handleActionClick(type: "plan" | "share" | "monitor", signal: AgentSignal) {
    const agent = ranking.find((a) => a.agent_id === signal.agent_id)
    if (!agent) return
    setActionModal({ type, agent, signal })
  }

  function handleSaveAction(action: { type: string; agentId: string; title: string; description: string }) {
    // In production, this would save to a database
    console.log("Action saved:", action)
    // Show toast notification
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <PageFadeIn>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Señales de Atención</h1>
          <p className="text-neutral-600 mt-1 text-sm">
            Alertas generadas automáticamente desde los datos
          </p>
        </div>

        {/* Summary counts */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-6"
        >
          <SignalCountCard
            level="ALTO"
            count={altoSignals.length}
            description="Acción inmediata requerida"
            bgClass="bg-status-critical/10"
            textClass="text-status-critical"
          />
          <SignalCountCard
            level="MEDIO"
            count={medioSignals.length}
            description="Monitoreo cercano"
            bgClass="bg-status-warning/10"
            textClass="text-status-warning"
          />
          <SignalCountCard
            level="POSITIVO"
            count={positivoSignals.length}
            description="Mejores prácticas"
            bgClass="bg-status-success/10"
            textClass="text-status-success"
          />
        </motion.div>

        {/* ALTO signals */}
        {altoSignals.length > 0 && (
          <motion.section
            variants={staggerItem}
            initial="hidden"
            animate="show"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-critical" />
              ALTO — Acción Inmediata ({altoSignals.length})
            </h2>
            <SignalTable
              signals={altoSignals}
              ranking={ranking}
              onActionClick={(signal) => handleActionClick("plan", signal)}
            />
          </motion.section>
        )}

        {/* MEDIO signals */}
        {medioSignals.length > 0 && (
          <motion.section
            variants={staggerItem}
            initial="hidden"
            animate="show"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-warning" />
              MEDIO — Monitoreo ({medioSignals.length})
            </h2>
            <SignalTable
              signals={medioSignals}
              ranking={ranking}
              onActionClick={(signal) => handleActionClick("monitor", signal)}
            />
          </motion.section>
        )}

        {/* POSITIVO signals */}
        {positivoSignals.length > 0 && (
          <motion.section
            variants={staggerItem}
            initial="hidden"
            animate="show"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-success" />
              POSITIVO — Replicar ({positivoSignals.length})
            </h2>
            <SignalTable
              signals={positivoSignals}
              ranking={ranking}
              onActionClick={(signal) => handleActionClick("share", signal)}
            />
          </motion.section>
        )}

        {/* Summary by agent */}
        <motion.section
          variants={staggerItem}
          initial="hidden"
          animate="show"
        >
          <h2 className="font-semibold mb-4">Resumen por Agente</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Agente</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide">🔴 ALTO</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide">🟡 MEDIO</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide">🟢 POSITIVO</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">API Score</th>
                </tr>
              </thead>
              <tbody>
                {ranking
                  .sort((a, b) => a.api_score - b.api_score)
                  .map((agent) => {
                    const counts = signalsByAgent.get(agent.agent_id) || {
                      alto: 0,
                      medio: 0,
                      positivo: 0,
                    }
                    return (
                      <tr key={agent.agent_id} className="border-t">
                        <td className="px-4 py-3 text-sm font-medium">{agent.agent_id}</td>
                        <td className="px-4 py-3 text-center">
                          <SignalBadge count={counts.alto} color="critical" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <SignalBadge count={counts.medio} color="warning" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <SignalBadge count={counts.positivo} color="success" />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            level={getStatusLevel(agent.api_score, {
                              green: 65,
                              yellow: 45,
                            })}
                          >
                            {agent.api_score.toFixed(1)}
                          </StatusBadge>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <SignalActionModal
          type={actionModal.type}
          agent={actionModal.agent}
          signal={actionModal.signal}
          open={!!actionModal}
          onClose={() => setActionModal(null)}
          onSave={handleSaveAction}
        />
      )}
    </PageFadeIn>
  )
}

function SignalCountCard({
  level,
  count,
  description,
  bgClass,
  textClass,
}: {
  level: string
  count: number
  description: string
  bgClass: string
  textClass: string
}) {
  return (
    <motion.div variants={staggerItem} className={`border rounded-lg p-6 ${bgClass}`}>
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{level}</p>
      <p className={`text-3xl font-semibold mt-1 ${textClass}`}>{count}</p>
      <p className="text-xs text-neutral-500 mt-1">{description}</p>
    </motion.div>
  )
}

function SignalBadge({ count, color }: { count: number; color: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
        count > 0
          ? `bg-status-${color}/20 text-status-${color}`
          : "bg-neutral-100 text-neutral-400"
      }`}
    >
      {count}
    </span>
  )
}

function SignalTable({
  signals,
  ranking,
  onActionClick,
}: {
  signals: typeof import("@/lib/supabase").AgentSignal[]
  ranking: typeof import("@/lib/supabase").AgentWithApiScore[]
  onActionClick: (signal: typeof import("@/lib/supabase").AgentSignal) => void
}) {
  if (signals.length === 0) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Agente</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Peer Group</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Tipo</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Detalle</th>
            <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide">Revenue</th>
            <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide">Acción</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal, index) => {
            const agent = ranking.find((a) => a.agent_id === signal.agent_id)
            if (!agent) return null

            return (
              <tr key={index} className="border-t">
                <td className="px-4 py-3 text-sm font-medium">{signal.agent_id}</td>
                <td className="px-4 py-3 text-xs">{agent.peer_group_label}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    level={
                      signal.level === "ALTO"
                        ? "critical"
                        : signal.level === "MEDIO"
                          ? "warning"
                          : "success"
                    }
                  >
                    {signal.type}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 text-xs">{signal.message}</td>
                <td className="px-4 py-3 text-sm tabular-nums text-right">
                  {formatCurrency(agent.total_revenue)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onActionClick(signal)}
                    className="text-xs text-primary hover:underline"
                  >
                    {signal.level === "ALTO" ? "Plan" : signal.level === "MEDIO" ? "Monitorear" : "Compartir"}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 4: Add routing**

```typescript
import { AlertasPage } from "@/components/sri/pages/alertas-page"

// In render:
{activeSection === "sri-alertas" && <AlertasPage />}
```

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add lib/sri-signals.ts components/sri/signal-action-modal.tsx components/sri/pages/alertas-page.tsx app/page.tsx
git commit -m "feat(sri): add Alertas page with signal generation, grouped by level, action modals"
```

---

## Phase 5: Polish — CSS Variables, Loading States, Final Testing

### Task 16: Add CSS Variables for Status Colors

**Files:**
- Modify: `styles/globals.css` (or `app/globals.css`)

**Step 1: Add status color CSS variables**

```css
@layer base {
  :root {
    /* ... existing colors ... */

    /* SRI Status Colors (OKLCH) */
    --status-success: oklch(0.65 0.15 145);
    --status-success-foreground: oklch(0.98 0.01 240);
    --status-warning: oklch(0.75 0.12 85);
    --status-warning-foreground: oklch(0.15 0.01 240);
    --status-critical: oklch(0.55 0.18 25);
    --status-critical-foreground: oklch(0.98 0.01 240);
  }
}

/* Animation utilities */
@layer utilities {
  .animate-in {
    animation: fadeInUp 0.4s ease-out;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add styles/globals.css
git commit -m "feat(sri): add status color CSS variables (OKLCH) and animation utilities"
```

---

### Task 17: Add Loading and Empty States

**Files:**
- Create: `components/sri/loading-state.tsx`
- Create: `components/sri/empty-state.tsx`

**Step 1: Create loading state component**

```typescript
"use client"

export function SriLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      <p className="mt-4 text-sm text-neutral-600">Cargando datos de SRI...</p>
    </div>
  )
}
```

**Step 2: Create empty state component**

```typescript
"use client"

interface SriEmptyStateProps {
  message?: string
  hint?: string
}

export function SriEmptyState({
  message = "No hay datos disponibles",
  hint = "Selecciona otro mes o espera la próxima ejecución del pipeline",
}: SriEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-neutral-700">{message}</p>
      <p className="text-sm text-neutral-500 mt-1 max-w-md">{hint}</p>
    </div>
  )
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/sri/loading-state.tsx components/sri/empty-state.tsx
git commit -m "feat(sri): add loading and empty state components"
```

---

### Task 18: Final Integration & Testing

**Files:**
- Modify: All SRI page components (verify loading/empty states)
- Test: Manual browser verification

**Step 1: Verify all pages use proper states**

Each page should already have loading/empty handling from previous tasks. Verify they import and use the components correctly.

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Start dev server and verify**

Run: `cd "C:\Users\arami\Current\report generator\leaderboard" && npm run dev`

**Manual verification checklist:**

**Navigation & Routing:**
- [ ] Navigate to SRI > Agentes in sidebar — page loads
- [ ] Navigate to SRI > Clientes — page loads with pie chart
- [ ] Navigate to SRI > Portafolio — page loads with bar charts
- [ ] Navigate to SRI > Metas — page loads with progress bars
- [ ] Navigate to SRI > Alertas — page loads with signals

**Interactions & Animations:**
- [ ] Staggered entrance animations on page load
- [ ] Month selector changes data smoothly
- [ ] Click agent row — detail drawer opens
- [ ] Drawer tabs switch without jank
- [ ] Close drawer — smooth slide out
- [ ] Peer group filter buttons work
- [ ] Hover effects on table rows and cards
- [ ] Action modal opens from signals page
- [ ] Charts animate on load

**Charts & Visualizations:**
- [ ] Client health pie chart renders correctly
- [ ] Horizontal bar charts show peer comparisons
- [ ] Line charts display weekly trends
- [ ] Sparklines appear in category table
- [ ] All status badges have correct colors (green/yellow/red)
- [ ] Progress bars animate smoothly

**Responsive Design:**
- [ ] Pages work on tablet (768px - 1024px)
- [ ] Pages work on mobile (<768px)
- [ ] Drawer adapts to full width on mobile
- [ ] Charts scale properly
- [ ] Tables scroll horizontally on mobile

**Data Integrity:**
- [ ] Agent ranking shows correct data
- [ ] API scores match Supabase
- [ ] Signals generate correctly based on thresholds
- [ ] Goals calculate vs targets properly
- [ ] Month selector filters data correctly

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(sri): complete SRI dashboard implementation with visual polish

Features:
- 5 pages: Agentes, Clientes, Portafolio, Metas, Alertas
- Agent ranking with API scores and peer comparisons
- Client health with pie chart distribution (Active/At-risk/Dormant)
- Portfolio analysis with horizontal bar charts (CPI, concentration, cross-sell)
- Goals progress tracking vs targets
- Signal generation (ALTO/MEDIO/POSITIVO) with action modals
- Detail drawer for agents with full chart content:
  - API breakdown with stacked bars
  - Weekly trend line charts
  - Top 5 categories with sparklines
  - Alerts with action buttons
- Staggered entrance animations (Framer Motion)
- Traffic-light status system with OKLCH colors
- Responsive design with mobile support

Technical:
- TypeScript strict mode throughout
- Recharts v2.15.0 for all visualizations
- Framer Motion for animations
- TanStack Query for data fetching
- Reuses existing patterns from leaderboard components
- Visual engineering approach — thoughtful data viz, not mockup copy
"
```

---

## Summary

### Files Created:

**Hooks:**
- `hooks/use-sri-queries.ts` — React Query hooks for SRI data

**Lib:**
- `lib/sri-queries.ts` — Supabase query functions
- `lib/sri-signals.ts` — Signal generation logic
- `lib/format.ts` — Currency/percent formatting

**Components (Shared):**
- `components/sri/animations.tsx` — Framer Motion wrappers
- `components/sri/status-badge.tsx` — Traffic-light badge
- `components/sri/api-score-bar.tsx` — API score progress bars
- `components/sri/loading-state.tsx` — Loading state
- `components/sri/empty-state.tsx` — Empty state
- `components/sri/signal-action-modal.tsx` — Signal action modal

**Components (Charts):**
- `components/sri/charts/pie-chart.tsx` — Client health pie chart
- `components/sri/charts/horizontal-bar-chart.tsx` — Peer comparison bars
- `components/sri/charts/line-chart.tsx` — Weekly trend lines
- `components/sri/charts/sparkline.tsx` — Mini trend indicators

**Components (Drawer):**
- `components/sri/agent-detail-sheet.tsx` — Full agent detail drawer with charts

**Components (Pages):**
- `components/sri/pages/agentes-page.tsx` — Agentes ranking page
- `components/sri/pages/clientes-page.tsx` — Clientes health page
- `components/sri/pages/portafolio-page.tsx` — Portafolio analysis page
- `components/sri/pages/metas-page.tsx` — Metas progress page
- `components/sri/pages/alertas-page.tsx` — Alertas signals page

### Files Modified:
- `lib/supabase.ts` — Added SRI TypeScript types
- `lib/store.ts` — Added sriMonth state
- `components/app-sidebar.tsx` — Added SRI navigation section
- `app/page.tsx` — Added SRI routing and section labels
- `styles/globals.css` — Added status color variables
- `package.json` — Added recharts and framer-motion dependencies

### Estimated Commit Count: 18

### Testing Approach:
- TypeScript strict mode: `npx tsc --noEmit` after each task
- Manual browser testing for each page
- Responsive design verification on mobile breakpoint
- Chart rendering verification for all visualizations
- Animation smoothness verification

### Next Steps (not in this plan):
- Add data export to Excel (replicate from Python report)
- Add email notification integration (via Hermes)
- Add client detail drawer
- Add real-time data refresh (webhook from SRI pipeline)
- Persist action plans from signal modals to database

---

**End of Plan**

This plan incorporates:
1. ✅ Complete Recharts chart components (pie, horizontal bars, line, sparklines)
2. ✅ Complete drawer content (trends tab, categories tab with sparklines, alerts with actions)
3. ✅ Signal action modals (Plan → Share → Monitor interactions)
4. ✅ Animation specifications (staggered entrances, smooth transitions, micro-interactions)
5. ✅ Impeccable:frontend-design principles (fluid spacing, varied rhythm, semantic color, purposeful motion)
6. ✅ Visual engineering — each chart chosen for semantic meaning to the data

**Ready for implementation.** Use superpowers:executing-plans or superpowers:subagent-driven-development when approved.
