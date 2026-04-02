# View Transitions Design

Add native browser view transitions (`document.startViewTransition`) to the Leaderboard dashboard using React's `<ViewTransition>` component. Communicate spatial relationships and continuity during navigation, data loading, and state changes.

## Context

- **Framework**: Next.js 16.1.6 with React 19.2.4 (ViewTransition supported natively)
- **Navigation model**: Client-side SPA — `activeSection` state in Zustand store, no file-based routing
- **Current animations**: `framer-motion` for some components, CSS spinner for loading
- **Browser support**: Chromium 111+, Firefox 144+, Safari 18.2+. Graceful degradation.

## Applicable Patterns (in priority order)

### 1. State change (enter/exit) — Section switching

**What it communicates**: "Something appeared/disappeared"

The primary interaction. When the user clicks a sidebar item, `activeSection` changes and a different section renders. This is **lateral navigation** (peer-level sidebar items), so per the skill's guidance, we use cross-fade — not directional slides which would falsely imply spatial depth.

Implementation:
- Wrap each conditional section render in `<ViewTransition enter="fade-in" exit="fade-out">`
- Set `default="none"` to prevent animations on unrelated transitions (Suspense resolves, background refreshes)
- Wrap `setActiveSection` calls in `startTransition()` to activate VTs

### 2. Suspense reveal — Loading to content

**What it communicates**: "Data loaded"

When data finishes loading, the spinner skeleton cross-fades into the actual content. Two sub-patterns:

- **Simple cross-fade**: Wrap `<Suspense fallback={...}>` + content in a single `<ViewTransition>`
- **Directional reveal**: Separate VTs on fallback (exit) and content (enter) — skeleton slides down, content slides up

We'll use the simple cross-fade approach since the loading state is managed with `isLoading` boolean, not React Suspense boundaries.

### 3. View mode toggle — Daily ↔ Weekly

**What it communicates**: "Same view, different data scope"

The daily/weekly toggle re-renders the same sections with different data. Wrap `setViewMode` in `startTransition` and add a `<ViewTransition>` around the data-dependent content with a subtle cross-fade.

### 4. List identity — Leaderboard members

**What it communicates**: "Same items, new arrangement"

Leaderboard members can reorder when data refreshes or view mode changes. Add per-item `<ViewTransition key={member.id}>` around each member row/card. The browser will animate position changes.

## Architecture

### Files to modify

1. **`next.config.mjs`** — Add `experimental.viewTransition: true`
2. **`app/globals.css`** — Add CSS animation recipes (fade-in/out, slide-up/down) + view transition pseudo-element styles
3. **`app/page.tsx`** — Wrap section renders in `<ViewTransition>`, wrap `setActiveSection` and `setViewMode` in `startTransition`
4. **`components/app-sidebar.tsx`** — Wrap `onSectionChange` calls in `startTransition`
5. **`components/weekly-overview.tsx`** — Add per-member `<ViewTransition key={member.id}>` for list identity
6. **`components/general-metrics.tsx`** — Add per-member `<ViewTransition key={member.id}>` for list identity

### CSS Animation Recipes

Add to `globals.css`:

```css
/* View transition animations */
::view-transition-old(.fade-out) {
  animation: fade-out 150ms ease-out both;
}
::view-transition-new(.fade-in) {
  animation: fade-in 150ms ease-in both;
}
::view-transition-old(.slide-down) {
  animation: slide-down 200ms ease-out both;
}
::view-transition-new(.slide-up) {
  animation: slide-up 200ms ease-in both;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-down {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(12px); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
```

### Key Design Decisions

- **No directional slides for section switching** — lateral nav gets cross-fade only
- **`default="none"` on all VTs** — prevents unwanted animations during Suspense resolves and background refreshes
- **`startTransition` wrapping** — VTs only activate inside transitions, not regular `setState`
- **150ms duration** for fades, **200ms** for slides — fast enough to feel responsive
- **No shared element morphs** — no images or elements morph between sections in this app

## Scope Exclusions

- No route-based navigation transitions (app is SPA, no file-based routing)
- No shared element transitions (no cross-section image morphs)
- No `addTransitionType` for directional context (lateral navigation only)
- No changes to provider-performance or decision-intelligence sections (they're self-contained pages)
