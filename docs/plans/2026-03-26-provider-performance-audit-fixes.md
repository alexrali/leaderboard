  <# Provider Performance — Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 23 audit findings (2 critical, 6 high, 8 medium, 7 low) across the provider-performance module — accessibility, language consistency, theming, performance, and responsive design.

**Architecture:** Incremental fixes organized by command scope (`/harden`, `/clarify`, `/normalize`, `/onboard`, `/optimize`, `/adapt`, `/distill`). Each phase is independently committable and non-breaking. No new dependencies needed.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Recharts, React Query, Supabase RPCs, TypeScript.

**Reference:** Audit report generated 2026-03-26 via `impeccable:audit` + `impeccable:critique`.

---

## Phase 1: /harden — Resilience & Accessibility (12 issues)

### Task 1.1: Bump minimum text sizes (C2)

**Files:**
- Modify: `components/provider-performance/header.tsx:57,61,63`
- Modify: `components/provider-performance/metric-cards.tsx:17,27,37`
- Modify: `components/provider-performance/sales-chart.tsx:70,86,88`
- Modify: `components/provider-performance/channel-grid.tsx:66,79`
- Modify: `components/provider-performance/provider-sidebar.tsx:44,60,79,98,113`
- Modify: `components/provider-performance/category-detail-panel.tsx:62,66,80,83,89,92,97,101,104,107,111,115,119,127,132`

**Step 1: Replace all `text-[8px]` with `text-[10px]`**

In each file listed above, find every instance of `text-[8px]` and replace with `text-[10px]`.

**Step 2: Replace all `text-[9px]` with `text-xs`**

In each file listed above, find every instance of `text-[9px]` and replace with `text-xs` (which renders at 12px, the WCAG minimum).

**Step 3: Verify visual consistency**

Run: `pnpm dev` and visually confirm labels are readable across all sections.

**Step 4: Commit**

```bash
git add components/provider-performance/
git commit -m "fix(a11y): bump min label size to text-xs for WCAG compliance"
```

---

### Task 1.2: Fix contrast on muted text (H1)

**Files:**
- Modify: `components/provider-performance/sales-chart.tsx` — all `text-muted-foreground/40` and `text-muted-foreground/60`
- Modify: `components/provider-performance/provider-sidebar.tsx:119,126` — `text-muted-foreground/40`
- Modify: `components/provider-performance/index.tsx:25` — `text-muted-foreground/60`
- Modify: `components/provider-performance/sales-log.tsx:80` — `text-muted-foreground/60`

**Step 1: Replace all `text-muted-foreground/40` with `text-muted-foreground`**

The `muted-foreground` token itself is already tuned for safe contrast. The `/40` opacity was causing it to fall below 4.5:1.

**Step 2: Replace all `text-muted-foreground/60` with `text-muted-foreground`**

Same rationale. If visual differentiation is needed between "caption" and "annotation" levels, define a separate `--color-muted-caption` token in `globals.css` instead of using opacity.

**Step 3: Verify in browser with devtools contrast checker**

Run: `pnpm dev` → open DevTools → inspect any previously-low-contrast text → verify ratio ≥ 4.5:1 against background.

**Step 4: Commit**

```bash
git add components/provider-performance/
git commit -m "fix(a11y): remove opacity modifiers on muted-foreground for WCAG contrast"
```

---

### Task 1.3: Add ARIA attributes to interactive elements (H6)

**Files:**
- Modify: `components/provider-performance/index.tsx:14-28` (PeriodToggle)
- Modify: `components/provider-performance/sales-chart.tsx:82-100` (chart mode toggle)
- Modify: `components/provider-performance/provider-sidebar.tsx:101-107` (slide indicators)
- Modify: `components/provider-performance/provider-sidebar.tsx:120-140` (velocity list buttons)

**Step 1: Fix PeriodToggle — add role + aria-selected**

```tsx
<div className="flex ..." role="tablist" aria-label="Período">
  {options.map(o => (
    <button
      key={o.value}
      role="tab"
      aria-selected={value === o.value}
      onClick={() => onChange(o.value)}
      className={cn(
        "px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] transition-colors duration-150",
        value === o.value
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-muted-foreground bg-transparent"
      )}
    >
      {o.label}
    </button>
  ))}
</div>
```

**Step 2: Fix chart mode toggle — same pattern**

Add `role="tablist"` on the wrapper div, `role="tab"` + `aria-selected` on each button.

**Step 3: Fix slide indicator dots — add role + aria-label**

```tsx
<button
  key={index}
  role="tab"
  aria-selected={index === activeSlide}
  aria-label={`Categoría ${index + 1}: ${categorySlides[index]?.name}`}
  onClick={() => setActiveSlide(index)}
  className={cn(
    "h-1 rounded-full transition-all duration-300",
    index === activeSlide ? "w-4 bg-foreground" : "w-1 bg-foreground/20 hover:bg-foreground/40"
  )}
/>
```

**Step 4: Fix velocity list buttons — add role + aria-label**

```tsx
<button
  key={cat.category_code}
  role="option"
  aria-selected={isActive}
  aria-label={`${cat.name} — ${(cat.share * 100).toFixed(0)}% participación`}
  onClick={() => handleSelectFromPicker(index)}
  className={cn(...)}
>
```

**Step 5: Test keyboard navigation**

Tab through all interactive elements. Verify each is reachable and operable with Enter/Space.

**Step 6: Commit**

```bash
git add components/provider-performance/
git commit -m "fix(a11y): add ARIA roles and labels to custom interactive elements"
```

---

### Task 1.4: Remove fake sales log simulation (C1)

**Files:**
- Modify: `components/provider-performance/sales-log.tsx`

**Step 1: Remove the hardcoded `initialSales` array**

Delete lines defining `initialSales` (the MacBook Pro, Nike Air Max demo entries). This was the fallback when no real transactions were available.

**Step 2: Remove the hardcoded `fallbackPool` array**

Delete `fallbackPool` — it was the pool for fake live simulation.

**Step 3: Remove the `useEffect` that generates fake live entries**

Delete the `useEffect` with `setInterval` at 6000ms that randomly selected from the pool and prepended fake entries.

**Step 4: Remove the `newRowId` state and highlight animation**

Delete `const [newRowId, setNewRowId] = useState<string | null>(null)` and the `newRowId` comparison in the row className (the amber highlight on "new" rows).

**Step 5: Simplify the initial state**

Change the sales state initialization to:

```tsx
const [sales, setSales] = useState<Sale[]>(() =>
  initialTransactions.slice(0, 20).map(txToSale)
)
```

No more fallback to fake data. If `initialTransactions` is empty, show an empty state.

**Step 6: Add an empty state**

After the header row and before the data rows div, add:

```tsx
{sales.length === 0 && (
  <div className="px-4 py-12 text-center">
    <p className="text-xs text-muted-foreground">Sin transacciones recientes.</p>
  </div>
)}
```

**Step 7: Verify**

Run: `pnpm dev` → navigate to provider-performance → confirm no fake data appears, real transactions display if available, empty state shows if none.

**Step 8: Commit**

```bash
git add components/provider-performance/sales-log.tsx
git commit -m "fix(data): remove fake sales log simulation, show real data or empty state"
```

---

### Task 1.5: Fix LIVE button and Frequency stat (M2, L2)

**Files:**
- Modify: `components/provider-performance/header.tsx`

**Step 1: Remove the LIVE button entirely**

Delete the `Button` with the green ping animation, `Play` icon, and "LIVE" label. It's decorative and misleading since data refreshes every 5 minutes, not live.

**Step 2: Remove the "Frequency" stat block**

Delete the third stat block containing "Frequency" / "1 / 2min" — it's hardcoded and not derived from real data.

**Step 3: Commit**

```bash
git add components/provider-performance/header.tsx
git commit -m "fix(ux): remove decorative LIVE button and fake Frequency stat"
```

---

### Task 1.6: Fix clock locale (M3)

**Files:**
- Modify: `hooks/use-live-clock.ts:12`

**Step 1: Change locale**

```ts
// Before
setTime(now.toLocaleTimeString("en-US", { ... }))

// After
setTime(now.toLocaleTimeString("es-MX", { ... }))
```

**Step 2: Commit**

```bash
git add hooks/use-live-clock.ts
git commit -m "fix(i18n): clock locale en-US → es-MX"
```

---

### Task 1.7: Fix SVG gradient ID uniqueness (M4)

**Files:**
- Modify: `components/provider-performance/sales-chart.tsx`
- Modify: `components/provider-performance/category-detail-panel.tsx`

**Step 1: Add `useId` import to sales-chart.tsx**

```ts
import { useState, useId } from "react"
```

**Step 2: Generate unique gradient IDs in SalesChart**

```tsx
export function SalesChart({ data, yoyData }: SalesChartProps) {
  const id = useId()
  const uid = id.replace(/:/g, '')
  // ...
  // Replace all gradient id="fillRevenue" with id={`fillRevenue-${uid}`}
  // Replace all fill="url(#fillRevenue)" with fill={`url(#fillRevenue-${uid})`}
  // Same for fillCurrent, fillPrior
}
```

**Step 3: Same pattern in CategoryDetailPanel**

```tsx
export function CategoryDetailPanel({ ... }: CategoryDetailPanelProps) {
  const { data: detail, isLoading } = useCategoryDetail(categoryCode)
  const id = useId()
  const uid = id.replace(/:/g, '')
  // Replace id="catFill" with id={`catFill-${uid}`}
  // Replace fill="url(#catFill)" with fill={`url(#catFill-${uid})`}
}
```

**Step 4: Commit**

```bash
git add components/provider-performance/sales-chart.tsx components/provider-performance/category-detail-panel.tsx
git commit -m "fix(chart): use unique SVG gradient IDs via useId() to prevent collisions"
```

---

### Task 1.8: Pause category slideshow on hover (M8)

**Files:**
- Modify: `components/provider-performance/provider-sidebar.tsx`

**Step 1: Add isPaused state**

```tsx
const [isPaused, setIsPaused] = useState(false)
```

**Step 2: Modify the useEffect to respect isPaused**

```tsx
useEffect(() => {
  if (categorySlides.length === 0 || isPaused) return
  const interval = setInterval(() => {
    setActiveSlide((prev) => (prev + 1) % categorySlides.length)
  }, 4000)
  return () => clearInterval(interval)
}, [categorySlides.length, isPaused])
```

**Step 3: Add hover handlers to the slideshow container**

On the `<div className="h-28 relative overflow-hidden">`:

```tsx
<div
  className="h-28 relative overflow-hidden"
  onMouseEnter={() => setIsPaused(true)}
  onMouseLeave={() => setIsPaused(false)}
>
```

**Step 4: Commit**

```bash
git add components/provider-performance/provider-sidebar.tsx
git commit -m "fix(ux): pause category slideshow on hover"
```

---

## Phase 2: /clarify + /normalize — Language & Consistency

### Task 2.1: Unify language to Spanish (H2)

**Files:**
- Modify: `components/provider-performance/total-revenue.tsx`
- Modify: `components/provider-performance/sales-chart.tsx`
- Modify: `components/provider-performance/channel-grid.tsx`
- Modify: `components/provider-performance/provider-sidebar.tsx`
- Modify: `components/provider-performance/category-detail-panel.tsx`
- Modify: `components/provider-performance/sales-log.tsx`
- Modify: `components/provider-performance/header.tsx`

**Step 1: Create a label mapping for all English → Spanish replacements**

| Location | English | Spanish |
|----------|---------|---------|
| total-revenue.tsx | `Total Revenue` | `Ingresos Totales` |
| total-revenue.tsx | `orders` | `órdenes` |
| total-revenue.tsx | `tracking 24/7` | `seguimiento 24/7` |
| total-revenue.tsx | `no manual entry since Jan` | `sin captura manual desde ene` |
| sales-chart.tsx | `Revenue Curve — Cumulative` | `Curva de Ingresos — Acumulada` |
| sales-chart.tsx | `Revenue — Año vs Año` | keep as-is (already Spanish) |
| channel-grid.tsx | `Sales Channel Performance Grid` | `Rendimiento por Canal de Venta` |
| channel-grid.tsx | `distributed across channels` | `distribuidos en canales` |
| provider-sidebar.tsx | `Category Focus` | `Enfoque por Categoría` |
| provider-sidebar.tsx | `Milestones` | `Hitos` |
| provider-sidebar.tsx | `Velocidad MoM` | keep as-is |
| provider-sidebar.tsx | `Annual Target` | `Objetivo Anual` (already Spanish) |
| provider-sidebar.tsx | `all channels and categories` | `todos los canales y categorías` |
| provider-sidebar.tsx | `Category Deep Dive` | `Detalle de Categoría` |
| provider-sidebar.tsx | `Share` | `Participación` |
| provider-sidebar.tsx | `revenue` (in slides) | `ingresos` |
| provider-sidebar.tsx | `Ver detalles` | keep as-is |
| provider-sidebar.tsx | `current vs prior month` | `mes actual vs anterior` |
| category-detail-panel.tsx | `Total Revenue` | `Ingresos Totales` |
| category-detail-panel.tsx | `Revenue Trend — 6 Months` | `Tendencia de Ingresos — 6 Meses` |
| category-detail-panel.tsx | `Channel Distribution` | `Distribución por Canal` |
| category-detail-panel.tsx | `Top Products` | `Productos Destacados` |
| category-detail-panel.tsx | `Top Representantes` | keep as-is |
| category-detail-panel.tsx | `últimos 6 meses` | keep as-is |
| category-detail-panel.tsx | `unidades normalizadas` | keep as-is |
| sales-log.tsx | `Execution Log — Live Feed` | `Registro de Ejecución` |
| sales-log.tsx | `Canal` | keep as-is |
| sales-log.tsx | `Producto` | keep as-is |
| sales-log.tsx | `Rep` | keep as-is |
| sales-log.tsx | `Time` | `Hora` |
| sales-log.tsx | `ID` | keep as-is |
| header.tsx | `Best Day` | `Mejor Día` |
| header.tsx | `Target` | `Meta` |
| header.tsx | `distribución + autoservicio` | keep as-is |

**Step 2: Apply replacements file by file**

Go through each file and apply the mapping. Keep English-only for: MTD, QTD, YTD, B2B, YoY, P&L, MoM, SKU, Acum.

**Step 3: Verify no stray English remains**

Search: `grep -rn "Revenue\|Sales\|Channel\|Performance\|Execution\|Live Feed\|Target\|Best Day" components/provider-performance/`

**Step 4: Commit**

```bash
git add components/provider-performance/
git commit -m "fix(i18n): unify all labels to Spanish, keep international abbreviations in English"
```

---

### Task 2.2: Replace stone-* colors with design tokens (H5)

**Files:**
- Modify: `components/provider-performance/index.tsx`
- Modify: `components/provider-performance/channel-grid.tsx`
- Modify: `components/provider-performance/provider-sidebar.tsx`
- Modify: `components/provider-performance/sales-log.tsx`

**Step 1: Create the replacement mapping**

| Hardcoded | Design Token |
|-----------|-------------|
| `bg-stone-50` | `bg-muted/50` |
| `bg-stone-50/80` | `bg-muted/40` |
| `bg-stone-50/50` | `bg-muted/30` |
| `bg-stone-100/70` | `bg-muted/70` |
| `border-stone-200/80` | `border-border` |
| `border-stone-200/60` | `border-border/60` |
| `border-stone-100` | `border-border/40` |
| `divide-stone-200/60` | `divide-border` |
| `hover:bg-stone-50` | `hover:bg-muted/50` |

**Step 2: Apply replacements across all 4 files**

Use search-and-replace for each mapping. Verify the visual result is equivalent or better in both light and dark mode.

**Step 3: Test dark mode**

Run: `pnpm dev` → toggle to dark mode → verify no bright white rectangles or invisible borders.

**Step 4: Commit**

```bash
git add components/provider-performance/
git commit -m "fix(theming): replace stone-* hardcoded colors with design tokens"
```

---

### Task 2.3: Clarify sales log column headers (M7)

**Files:**
- Modify: `components/provider-performance/sales-log.tsx:123-131`

**Step 1: Replace cryptic headers**

| Current | Replacement |
|---------|-------------|
| `Time` | `Hora` |
| `ID` | keep |
| `Canal` | keep |
| `Producto` | keep |
| `n` | `Cant.` |
| `f` | remove (or merge into `Margen`) |
| `%` | `Margen` |
| `Rep` | keep |
| `P&L` | `Utilidad` |

**Step 2: Remove the `f` column entirely**

The `f` column shows `(sale.margin * 0.7).toFixed(2)` which is an opaque derived metric. Remove it from both the header row and data rows. Update the grid template from 9 columns to 8:

```tsx
// Before: grid-cols-[70px_80px_80px_1fr_50px_50px_50px_100px_80px]
// After:  grid-cols-[70px_80px_80px_1fr_50px_50px_100px_80px]
```

**Step 3: Remove the `f` value from the Sale type data row**

Remove the cell rendering for the margin factor column.

**Step 4: Commit**

```bash
git add components/provider-performance/sales-log.tsx
git commit -m "fix(ux): clarify sales log column headers, remove opaque margin factor column"
```

---

### Task 2.4: Remove motivational quote (L3)

**Files:**
- Modify: `components/provider-performance/sales-log.tsx:145-149`

**Step 1: Delete the footer quote block**

Remove the entire `<div className="flex items-center justify-end mt-4">` containing the "Don't stop until it's profitable" quote.

**Step 2: Commit**

```bash
git add components/provider-performance/sales-log.tsx
git commit -m "fix(ux): remove decorative motivational quote from sales log"
```

---

## Phase 3: /onboard + /optimize — Loading & Performance

### Task 3.1: Per-section skeleton loading (H3)

**Files:**
- Modify: `components/provider-performance/index.tsx` (main orchestrator)
- Modify: `components/provider-performance/total-revenue.tsx` (add skeleton)
- Modify: `components/provider-performance/metric-cards.tsx` (add skeleton)
- Modify: `components/provider-performance/sales-chart.tsx` (add skeleton)
- Modify: `components/provider-performance/channel-grid.tsx` (add skeleton)
- Modify: `components/provider-performance/provider-sidebar.tsx` (add skeleton)
- Modify: `components/provider-performance/sales-log.tsx` (add skeleton)

**Step 1: Remove the global loading gate in index.tsx**

Delete the `if (isLoading)` block that shows a full-page spinner. Replace with per-section rendering where each section handles its own loading state.

**Step 2: Remove the global error gate**

Delete the `if (hasError)` block. Move error handling to the summary section only (it's the most critical). Other sections can show their own inline errors.

**Step 3: Add skeleton to TotalRevenue**

When `summary` is undefined/null, show a skeleton:

```tsx
{!summary ? (
  <div className="space-y-3">
    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
    <div className="h-16 w-64 bg-muted animate-pulse rounded" />
    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
  </div>
) : (
  // existing content
)}
```

**Step 4: Add skeletons to MetricCards, SalesChart, ChannelGrid, ProviderSidebar, SalesLog**

Same pattern — when the relevant data prop is undefined, show skeleton placeholders that match the component's visual shape.

**Step 5: Add inline error for summary**

```tsx
{e1 && (
  <div className="px-6 py-4 border-b border-destructive/30 bg-destructive/5">
    <p className="text-xs text-destructive">Error cargando datos del proveedor.</p>
  </div>
)}
```

**Step 6: Verify progressive rendering**

Run: `pnpm dev` → observe that the header and layout appear immediately, sections fill in as their data arrives.

**Step 7: Commit**

```bash
git add components/provider-performance/
git commit -m "fix(ux): per-section skeleton loading instead of global spinner"
```

---

### Task 3.2: Reduce animated counters to hero metrics only (M1)

**Files:**
- Modify: `components/provider-performance/metric-cards.tsx`
- Modify: `components/provider-performance/channel-grid.tsx`
- Modify: `components/provider-performance/category-detail-panel.tsx`

**Step 1: In metric-cards.tsx — remove `useAnimatedCounter` from AnimatedStat**

Replace the animated counter with direct display:

```tsx
function AnimatedStat({ label, value, prefix, suffix, sublabel, decimals, delay }: AnimatedStatProps) {
  const displayValue = decimals ? (value * Math.pow(10, decimals) / Math.pow(10, decimals)).toFixed(decimals) : Math.floor(value)
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1.5">{label}</p>
      <p className="text-2xl font-mono font-bold tabular-nums">{prefix}{displayValue}{suffix}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sublabel}</p>
    </div>
  )
}
```

Remove `useAnimatedCounter` import. Remove `delay` prop (no longer needed). Simplify the component.

**Step 2: In channel-grid.tsx — remove `useAnimatedCounter` from ChannelColumn**

Display `channel.amount` directly with `toLocaleString()` instead of animating.

**Step 3: In category-detail-panel.tsx — keep animated counters only for hero stats**

The panel already uses 3 counters (revenue, orders, units) which is reasonable for a detail sheet that opens on demand. Keep these — the performance impact is isolated to when the sheet is open.

**Step 4: Commit**

```bash
git add components/provider-performance/metric-cards.tsx components/provider-performance/channel-grid.tsx
git commit -m "perf: remove animated counters from metric cards and channel grid, keep on hero metrics only"
```

---

### Task 3.3: Deduplicate YTD fetch (M5)

**Files:**
- Modify: `components/provider-performance/index.tsx:38-39`

**Step 1: Replace the separate `useProviderSummary('ytd')` call with conditional logic**

```tsx
// Before:
const { data: summary, isLoading: l1, error: e1 } = useProviderSummary(period)
const { data: annualSummary } = useProviderSummary('ytd')

// After:
const { data: summary, isLoading: l1, error: e1 } = useProviderSummary(period)
const { data: annualSummaryData } = useProviderSummary('ytd')
const annualSummary = period === 'ytd' ? summary : annualSummaryData
```

This way, when period is 'ytd', we reuse the same query result instead of firing a duplicate.

**Step 2: Commit**

```bash
git add components/provider-performance/index.tsx
git commit -m "perf: deduplicate YTD summary fetch when period is already ytd"
```

---

### Task 3.4: Scope period toggle to hero section (H4)

**Files:**
- Modify: `components/provider-performance/index.tsx`
- Move: `PeriodToggle` into `total-revenue.tsx` or a new wrapper component

**Step 1: Create a HeroSection component**

Extract the top area (TotalRevenue + PeriodToggle) into its own component that owns the period state:

```tsx
// components/provider-performance/hero-section.tsx
"use client"
import { useState } from "react"
import { TotalRevenue } from "./total-revenue"
import { cn } from "@/lib/utils"
import type { ProviderSummary } from "@/lib/provider-types"

type Period = 'mtd' | 'qtd' | 'ytd'

function PeriodToggle({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  // ... same as before, with ARIA from Task 1.3
}

export function HeroSection({ summary }: { summary?: ProviderSummary | null }) {
  const [period, setPeriod] = useState<Period>('mtd')
  // This component would need its own useProviderSummary(period) hook call
  // OR the parent passes period down and the parent manages the query
}
```

**Step 2: Evaluate scope of change**

This is a structural refactor — the period state currently lives in the parent `ProviderPerformancePage`. If we want the toggle to only affect hero metrics, we need to:
- Move `useProviderSummary(period)` into the hero section
- Keep other queries period-agnostic (which they already are)
- Remove `period` state from the parent

**Step 3: Implement the refactor**

Move `PeriodToggle` + `useProviderSummary(period)` into the hero area. Pass `annualSummary` to the header from a separate `useProviderSummary('ytd')` call in the parent (with the dedup fix from Task 3.3).

**Step 4: Commit**

```bash
git add components/provider-performance/
git commit -m "fix(ux): scope period toggle to hero metrics only, clarify it doesn't affect chart/channels"
```

---

## Phase 4: /adapt — Responsive

### Task 4.1: Sales log responsive columns (M6)

**Files:**
- Modify: `components/provider-performance/sales-log.tsx`

**Step 1: Add responsive column visibility**

On mobile, hide low-priority columns. Show them on sm/md breakpoints:

```tsx
{/* Header Row */}
<div className="grid grid-cols-[60px_1fr_50px_80px] sm:grid-cols-[70px_80px_80px_1fr_50px_50px_100px_80px] gap-3 ...">
  <span>Hora</span>
  <span>Producto</span>
  <span className="text-right">Cant.</span>
  <span className="text-right hidden sm:block">Utilidad</span>
  <span className="hidden sm:block">Canal</span>
  <span className="text-right hidden sm:block">Margen</span>
  <span className="hidden sm:block">Rep</span>
</div>
```

**Step 2: Same responsive visibility on data rows**

Apply `hidden sm:block` to the same columns in the data row grid.

**Step 3: Remove the `min-w-[680px]` wrapper**

Since columns are now hidden on mobile instead of forcing horizontal scroll, remove the `min-w-[680px]` div and the `overflow-x-auto` wrapper.

**Step 4: Verify on mobile viewport**

Use DevTools responsive mode at 375px width. Confirm no horizontal scroll, all shown columns are readable.

**Step 5: Commit**

```bash
git add components/provider-performance/sales-log.tsx
git commit -m "fix(responsive): hide low-priority sales log columns on mobile, remove forced horizontal scroll"
```

---

### Task 4.2: Responsive revenue font scaling (L7)

**Files:**
- Modify: `components/provider-performance/total-revenue.tsx:15`

**Step 1: Add intermediate breakpoints**

```tsx
// Before: text-6xl md:text-[80px]
// After:
className="text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-bold tracking-tighter font-mono leading-none"
```

**Step 2: Commit**

```bash
git add components/provider-performance/total-revenue.tsx
git commit -m "fix(responsive): add graduated font scaling for revenue number on mobile"
```

---

## Task Summary

| Task | Phase | Issues Addressed | Est. Effort |
|------|-------|-----------------|-------------|
| 1.1 | harden | C2 (min text size) | 20 min |
| 1.2 | harden | H1 (contrast) | 10 min |
| 1.3 | harden | H6 (ARIA) | 25 min |
| 1.4 | harden | C1 (fake data) | 15 min |
| 1.5 | harden | M2, L2 (LIVE btn, Frequency) | 10 min |
| 1.6 | harden | M3 (clock locale) | 2 min |
| 1.7 | harden | M4 (SVG IDs) | 10 min |
| 1.8 | harden | M8 (slideshow pause) | 10 min |
| 2.1 | clarify+normalize | H2 (language) | 30 min |
| 2.2 | clarify+normalize | H5 (design tokens) | 20 min |
| 2.3 | clarify+normalize | M7 (column headers) | 10 min |
| 2.4 | clarify+normalize | L3 (quote removal) | 5 min |
| 3.1 | onboard+optimize | H3 (skeleton loading) | 45 min |
| 3.2 | onboard+optimize | M1 (counter reduction) | 15 min |
| 3.3 | onboard+optimize | M5 (YTD dedup) | 5 min |
| 3.4 | onboard+optimize | H4 (period scope) | 30 min |
| 4.1 | adapt | M6 (responsive log) | 20 min |
| 4.2 | adapt | L7 (font scaling) | 5 min |

**Total estimated: ~17 tasks, ~5.5 hours**

---

## Parallelization Opportunities

These task groups can run in parallel (no file overlap):

- **Group A** (harden): Tasks 1.1, 1.2, 1.3 — different files within same components, but touch different lines
- **Group B** (harden): Tasks 1.4, 1.5, 1.6 — completely independent files
- **Group C** (normalize): Tasks 2.2, 2.3, 2.4 — independent files
- **Group D** (optimize): Tasks 3.2, 3.3 — independent files
- **Group E** (adapt): Tasks 4.1, 4.2 — same file (sequence required)

Tasks within the same file MUST run sequentially: 1.4+2.3+2.4 (sales-log.tsx), 3.1 (all files).
