# View Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native browser view transitions to the Leaderboard dashboard for section switching, loading reveals, mode toggles, and list reordering.

**Architecture:** Wrap conditional section renders in React `<ViewTransition>` components with enter/exit CSS classes. Wrap all navigation state changes in `startTransition()` to activate view transitions. Add CSS animation keyframes to globals.css for fade and slide effects.

**Tech Stack:** Next.js 16.1.6, React 19.2.4 (`ViewTransition` component), CSS `::view-transition-*` pseudo-elements, Zustand store.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `next.config.mjs` | Modify | Enable `experimental.viewTransition` flag |
| `app/globals.css` | Modify | Add VT animation keyframes and pseudo-element styles |
| `app/page.tsx` | Modify | Wrap sections in `<ViewTransition>`, wrap state changes in `startTransition` |
| `components/app-sidebar.tsx` | Modify | Wrap `onSectionChange` in `startTransition` |
| `components/weekly-overview.tsx` | Modify | Add per-member `<ViewTransition key={member.id}>` |
| `components/general-metrics.tsx` | Modify | Add per-member `<ViewTransition key={member.id}>` |

---

### Task 1: Enable Next.js View Transitions

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Add experimental.viewTransition flag**

Change `next.config.mjs` to:

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify build still works**

Run: `npx next build` (or note: build verification happens in final task)
Expected: No errors related to config

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "feat: enable experimental.viewTransition in Next.js config"
```

---

### Task 2: Add CSS Animation Recipes

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add view transition keyframes and pseudo-element styles**

Append after the existing `@media (prefers-reduced-motion: reduce)` block at the end of `globals.css`:

```css
@keyframes vt-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes vt-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes vt-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes vt-slide-down {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(12px); }
}

::view-transition-old(.vt-fade-out) {
  animation: vt-fade-out 150ms ease-out both;
}
::view-transition-new(.vt-fade-in) {
  animation: vt-fade-in 150ms ease-in both;
}
::view-transition-old(.vt-slide-down) {
  animation: vt-slide-down 200ms ease-out both;
}
::view-transition-new(.vt-slide-up) {
  animation: vt-slide-up 200ms ease-in both;
}
::view-transition-old(.vt-slide-down-slow) {
  animation: vt-slide-down 300ms ease-out both;
}
::view-transition-new(.vt-slide-up-slow) {
  animation: vt-slide-up 300ms ease-in both;
}
```

- [ ] **Step 2: Update the reduced-motion block to include view transitions**

Replace the existing `@media (prefers-reduced-motion: reduce)` block with:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add view transition CSS animation recipes"
```

---

### Task 3: Wrap Section Switching in ViewTransition

**Files:**
- Modify: `app/page.tsx`

This is the main task. The page renders sections conditionally based on `activeSection`. We need to:
1. Import `ViewTransition` and `startTransition` from React
2. Wrap each conditional section in `<ViewTransition>`
3. Wrap `setActiveSection` calls in `startTransition`

- [ ] **Step 1: Add imports**

At the top of `app/page.tsx`, change the React import line:

```tsx
import { Suspense, useEffect, useState, startTransition } from "react"
```

Then add the ViewTransition import:

```tsx
import { ViewTransition } from "react"
```

- [ ] **Step 2: Create a wrapper component for section content**

Inside the `PageContent` function (before the return), add a helper to wrap section content:

No helper needed — we'll wrap inline.

- [ ] **Step 3: Wrap the loading state in ViewTransition**

Replace the loading block:

```tsx
{isLoading && !EXCLUDED_SECTIONS.includes(activeSection) && (
  <ViewTransition exit="vt-fade-out" default="none">
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
        <span className="text-muted-foreground text-sm">Cargando datos...</span>
      </div>
    </div>
  </ViewTransition>
)}
```

- [ ] **Step 4: Wrap the loaded content in ViewTransition**

Wrap the entire loaded content block (the fragment starting with `{!isLoading && !isError && ...}`) in a single `<ViewTransition>` with `key={activeSection}` to force re-enter on section change:

Replace:
```tsx
{!isLoading && !isError && !EXCLUDED_SECTIONS.includes(activeSection) && (
  <>
    {activeSection === "overview" && (
      ...
    )}
    ...
  </>
)}
```

With:
```tsx
{!isLoading && !isError && !EXCLUDED_SECTIONS.includes(activeSection) && (
  <ViewTransition key={activeSection} enter="vt-fade-in" exit="vt-fade-out" default="none">
  <>
    {activeSection === "overview" && (
      ...
    )}
    ...
  </>
  </ViewTransition>
)}
```

Note: Keep all the existing conditional section renders unchanged inside the `<>...</>`.

- [ ] **Step 5: Wrap the error state in ViewTransition**

Replace the error block:

```tsx
{isError && !EXCLUDED_SECTIONS.includes(activeSection) && (
  <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
    <div className="rounded-xl shadow-[rgba(239,68,68,0.3)_0px_0px_0px_1px] bg-red-50 text-destructive px-5 py-4 text-sm">
      No se pudo cargar la información. Verifica la conexión a Supabase.
    </div>
  </ViewTransition>
)}
```

- [ ] **Step 6: Wrap excluded section renders in ViewTransition**

The excluded sections (settings, provider-performance, decision-intelligence) are rendered separately. Wrap each:

```tsx
{activeSection === "settings" && (
  <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
    <SettingsPage />
  </ViewTransition>
)}
{activeSection === "provider-performance" && (
  <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
    <ProviderPerformancePage />
  </ViewTransition>
)}
{activeSection === "decision-intelligence" && (
  <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
    <DecisionIntelligencePage />
  </ViewTransition>
)}
```

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wrap section switching in ViewTransition with fade animations"
```

---

### Task 4: Wrap Sidebar Navigation in startTransition

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: Add startTransition import**

Change the top of the file. There's no React import currently, so add one:

```tsx
import { startTransition } from "react"
```

Add it after the existing `"use client"` directive.

- [ ] **Step 2: Wrap handleSectionChange in startTransition**

Replace the `handleSectionChange` function:

```tsx
function handleSectionChange(section?: string) {
  if (section) {
    startTransition(() => {
      onSectionChange?.(section)
    })
  }
  if (isMobile) {
    setOpenMobile(false)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: wrap sidebar navigation in startTransition for view transitions"
```

---

### Task 5: Add List Identity to Weekly Overview

**Files:**
- Modify: `components/weekly-overview.tsx`

- [ ] **Step 1: Add ViewTransition import**

Add to the React import at the top:

```tsx
import { useState, useId, ViewTransition } from "react"
```

Wait — `ViewTransition` is exported from `"react"`, not from component imports. Add a separate import:

```tsx
import { ViewTransition } from "react"
```

- [ ] **Step 2: Find the member list rendering**

Search for where `members` array is mapped to render individual member cards/rows. The component receives `members` as a prop of type `TeamMember[]`.

Look for a pattern like `members.map(member =>` or `sortedMembers.map(member =>` or similar.

Wrap each item in `<ViewTransition key={member.id}>`:

Before:
```tsx
{members.map((member) => (
  <SomeComponent key={member.id} member={member} ... />
))}
```

After:
```tsx
{members.map((member) => (
  <ViewTransition key={member.id}>
    <SomeComponent member={member} ... />
  </ViewTransition>
))}
```

**Important:** Remove `key` from the inner component (it moves to `<ViewTransition>`). Avoid wrapper `<div>`s between list and VT.

If the member rendering is a table structure with `<TableRow>`s, wrap each row:

```tsx
{members.map((member) => (
  <ViewTransition key={member.id}>
    <TableRow>...</TableRow>
  </ViewTransition>
))}
```

- [ ] **Step 3: Commit**

```bash
git add components/weekly-overview.tsx
git commit -m "feat: add list identity ViewTransition to weekly overview members"
```

---

### Task 6: Add List Identity to General Metrics

**Files:**
- Modify: `components/general-metrics.tsx`

- [ ] **Step 1: Add ViewTransition import**

```tsx
import { ViewTransition } from "react"
```

- [ ] **Step 2: Find the member list rendering**

Same as Task 5 — find where `members` array is mapped to render member rows. Wrap each item in `<ViewTransition key={member.id}>`.

- [ ] **Step 3: Commit**

```bash
git add components/general-metrics.tsx
git commit -m "feat: add list identity ViewTransition to general metrics members"
```

---

### Task 7: Wrap View Mode Toggle in startTransition

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Wrap setViewMode calls in startTransition**

In `app/page.tsx`, find the two buttons that call `setViewMode("daily")` and `setViewMode("weekly")`. `startTransition` is already imported from Task 3.

Replace:
```tsx
onClick={() => setViewMode("daily")}
```
With:
```tsx
onClick={() => startTransition(() => setViewMode("daily"))}
```

Replace:
```tsx
onClick={() => setViewMode("weekly")}
```
With:
```tsx
onClick={() => startTransition(() => setViewMode("weekly"))}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wrap view mode toggle in startTransition for animated transitions"
```

---

### Task 8: Build Verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No errors (or pre-existing warnings only)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Final commit if any lint fixes needed**

```bash
git add -A
git commit -m "chore: lint fixes from view transitions integration"
```
