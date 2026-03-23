# Provider Performance Responsive Layout Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the provider-performance dashboard responsive for mobile and tablet using a "stack below" approach — the right sidebar collapses under the main content, channels stack vertically, and the sales log gets horizontal scroll.

**Architecture:** Pure Tailwind CSS breakpoint changes across 4 component files — no new components, no JS logic. Breakpoints used: `sm` (640px), `lg` (1024px). The sidebar stacks below on anything smaller than `lg`. Channel columns stack at `sm`. Sales log scrolls horizontally on all sizes.

**Tech Stack:** Tailwind CSS v4, Next.js 16 App Router, React 19.

---

### Task 1: Stack sidebar below main content (index.tsx)

**Files:**
- Modify: `leaderboard/components/provider-performance/index.tsx`

The main flex container and the sidebar div need responsive classes. No other changes.

**Step 1: Apply changes**

In `components/provider-performance/index.tsx`, make exactly two edits:

**Edit A** — flex container (line ~19):
```
OLD: <div className="flex border-y border-stone-200/80">
NEW: <div className="flex flex-col lg:flex-row border-y border-stone-200/80">
```

**Edit B** — sidebar wrapper (line ~38):
```
OLD: <div className="w-72 xl:w-80 shrink-0 border-l border-stone-200/80 bg-stone-100/70">
NEW: <div className="w-full lg:w-72 xl:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200/80 bg-stone-100/70">
```

**Step 2: Commit**
```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
git add components/provider-performance/index.tsx
git commit -m "feat(responsive): stack provider sidebar below main content on mobile/tablet"
```

---

### Task 2: Stack channel columns vertically on mobile (channel-grid.tsx)

**Files:**
- Modify: `leaderboard/components/provider-performance/channel-grid.tsx`

The three channel columns (`flex` row) need to stack on mobile and lay out in a row from `sm` up. The `border-r` separator must become `border-b` on mobile and revert to `border-r` on `sm`.

**Step 1: Read the file**

Read `leaderboard/components/provider-performance/channel-grid.tsx` in full to find the exact class strings for the columns container and the conditional border class.

**Step 2: Apply changes**

**Edit A** — columns container (find the `flex bg-background` div):
```
OLD: className="flex bg-background"
NEW: className="flex flex-col sm:flex-row bg-background"
```

**Edit B** — the conditional border on each column (find where `border-r border-stone-200/60` is applied conditionally based on `isLast` or similar):

The column component applies `border-r border-stone-200/60` when it's not the last column. Change that conditional class to:
```
OLD: "border-r border-stone-200/60"
NEW: "border-b sm:border-b-0 sm:border-r border-stone-200/60"
```

If the border is applied via a ternary like `!isLast ? "border-r border-stone-200/60" : ""`, replace only the truthy string.

**Step 3: Commit**
```bash
git add components/provider-performance/channel-grid.tsx
git commit -m "feat(responsive): stack channel columns on mobile, row from sm breakpoint"
```

---

### Task 3: Horizontal scroll for sales log table (sales-log.tsx)

**Files:**
- Modify: `leaderboard/components/provider-performance/sales-log.tsx`

The sales log uses a fixed 9-column CSS grid (`grid-cols-[70px_80px_80px_1fr_50px_50px_50px_100px_80px]`). On small screens this overflows. Wrap the table section (header row + data rows) in an `overflow-x-auto` div and add `min-w-[680px]` to the inner grid container so columns don't collapse.

**Step 1: Read the file**

Read `leaderboard/components/provider-performance/sales-log.tsx` in full to locate:
- The table wrapper div (the `bg-background` div that contains the grid rows)
- The header row div with the `grid grid-cols-[...]` class

**Step 2: Apply changes**

Wrap the entire table section (from the header row div to the closing of the rows container) in:
```tsx
<div className="overflow-x-auto">
  <div className="min-w-[680px]">
    {/* existing header row + data rows */}
  </div>
</div>
```

Do NOT wrap the section header bar (the `px-6 py-3 border-b` title bar) — only the grid rows inside.

**Step 3: Commit**
```bash
git add components/provider-performance/sales-log.tsx
git commit -m "feat(responsive): add horizontal scroll to sales log table"
```

---

### Task 4: Tighten metric card gaps on mobile (metric-cards.tsx)

**Files:**
- Modify: `leaderboard/components/provider-performance/metric-cards.tsx`

The metric cards use `gap-x-10 lg:gap-x-14`. On mobile `gap-x-10` (40px) is still quite wide. Add a `sm:gap-x-10` step and reduce the base to `gap-x-6` so cards breathe on narrow screens without wrapping awkwardly.

**Step 1: Apply change**

In `components/provider-performance/metric-cards.tsx`, find the outer flex container:
```
OLD: className="flex flex-wrap items-start gap-x-10 gap-y-6 lg:gap-x-14"
NEW: className="flex flex-wrap items-start gap-x-6 gap-y-6 sm:gap-x-10 lg:gap-x-14"
```

**Step 2: Commit**
```bash
git add components/provider-performance/metric-cards.tsx
git commit -m "feat(responsive): reduce metric card gap on mobile"
```

---

### Task 5: Push border-removal fix and verify tsc

**Files:**
- Already modified: `leaderboard/components/provider-performance/index.tsx` (outer border removed in previous session)

**Step 1: Check git status**
```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
git status
```

The border removal edit (`border border-stone-200/80` removed from index.tsx) may or may not already be committed. If it shows as uncommitted, commit it:
```bash
git add components/provider-performance/index.tsx
git commit -m "fix(provider-performance): remove outer border from dashboard wrapper"
```

**Step 2: Run type check**
```bash
pnpm tsc --noEmit 2>&1
```

Expected: same pre-existing 3 errors in `settings-page.tsx` only. Zero new errors from our changes (these are all pure className string changes with no TypeScript impact).

**Step 3: Push**
```bash
git push origin master
```

Expected: Vercel deployment triggered automatically.
