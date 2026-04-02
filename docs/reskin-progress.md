# Vercel Design System Reskin — Progress Tracker

**Branch:** `feat/vercel-design-system-reskin`
**Plan:** `docs/plans/2026-04-02-vercel-design-system-reskin-a0a962.md`

---

## Session 1: Phases 1–3

### Phase 1 — Foundations ✅
- [x] 1.1 Replace Outfit with Geist font in `layout.tsx`
- [x] 1.2 Rewrite CSS custom properties in `globals.css` (oklch → Vercel hex)
- [x] 1.3 Update card shadow rule to Vercel multi-layer stack
- [x] 1.4 Update base focus ring to `hsla(212, 100%, 48%, 1)`
- [x] 1.5 Drop `.dark` block and `@custom-variant dark`
- [x] 1.6 Add semantic tokens: `--vercel-shadow-border`, `--vercel-shadow-card`, `--vercel-gray-600`, `--vercel-gray-100`
- [x] 1.7 Enable `font-feature-settings: "liga"` globally
- **Files:** `app/layout.tsx`, `app/globals.css`

### Phase 2 — UI Primitives 🔲
- [ ] 2.1 `card.tsx` — radius → `rounded-lg`, remove `border` and `shadow-sm`
- [ ] 2.2 `button.tsx` — primary dark, outline/ghost shadow-ring, 14px/500
- [ ] 2.3 `badge.tsx` — pill style for default/secondary
- [ ] 2.4 `tabs.tsx` — transparent TabsList with ring-border, pill triggers
- [ ] 2.5 `table.tsx` — header uppercase/tracking, row hover, separator color
- [ ] 2.6 `input.tsx` — shadow-as-border, focus blue ring
- [ ] 2.7 Other primitives (separator, progress, dialog/sheet/drawer, select/dropdown/popover/command)
- **Files:** `components/ui/card.tsx`, `button.tsx`, `badge.tsx`, `tabs.tsx`, `table.tsx`, `input.tsx`, + others

### Phase 3 — Shell 🔲
- [ ] 3.1 `app-sidebar.tsx` — logo block, group labels, menu buttons, tree line, user card
- [ ] 3.2 `app/page.tsx` header bar — shadow-border bottom, breadcrumb, toggle, search
- [ ] 3.3 `app/page.tsx` main area — footer separator, metadata text
- **Files:** `components/app-sidebar.tsx`, `app/page.tsx`

---

## Session 2: Phases 4–5 (future)

### Phase 4 — Typography Pass 🔲
- Apply DESIGN.md type hierarchy to ~10 core dashboard components
- **Files:** `leaderboard-header.tsx`, `weekly-overview.tsx`, `general-metrics.tsx`, `day-progress.tsx`, `resources-detail.tsx`, `panel-overview.tsx`, `section-tabs.tsx`, `worker-detail-sheet.tsx`, `settings-page.tsx`, `spotlight.tsx`

### Phase 5 — Section Pages 🔲
- [ ] 5.1 SRI components (~10 files)
- [ ] 5.2 Provider Performance components (~10 files)
- [ ] 5.3 Decision Intelligence components (~20 files)
- **Files:** `components/sri/`, `components/provider-performance/`, `components/decision-intelligence/`

---

## Session 3: Phases 6–8 (future)

### Phase 6 — Hermes / Messaging 🔲
- [ ] 6.1 `app/messaging/layout.tsx`
- [ ] 6.2 Hermes components (~11 files)
- [ ] 6.3 Messaging pages (~12 files)

### Phase 7 — Login / Auth 🔲
- [ ] 7.1 `app/login/page.tsx`
- [ ] 7.2 `login-form.tsx` + `signup-form.tsx`

### Phase 8 — Validation & Cleanup 🔲
- [ ] 8.1 `npx next build` passes
- [ ] 8.2 Visual check against DESIGN.md
- [ ] 8.3 SidebarInset rounded corners untouched
- [ ] 8.4 Focus rings blue on keyboard nav
- [ ] 8.5 No `border` classes on cards
- [ ] 8.6 Reduced-motion media query works
