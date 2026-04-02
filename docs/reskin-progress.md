# Vercel Design System Reskin — Progress Tracker

**Branch:** `feat/vercel-design-system-reskin`
**Plan:** `docs/plans/2026-04-02-vercel-design-system-reskin-a0a962.md`
**Design Spec:** `DESIGN.md`
**Design Context:** `CLAUDE.md`
**Commit:** `e92d9e0` — `feat: Phase 1 — Vercel/Geist foundations (font, colors, shadows, tokens)`

---

## Required Skills

| Skill | When | Purpose |
|---|---|---|
| `subagent-driven-development` | Every session | Dispatch implementer + reviewer subagents per phase |
| `verification-before-completion` | After each phase | Confirm build passes, no regressions |
| `requesting-code-review` | Phase 8 | Final code review before merge |
| `finishing-a-development-branch` | After Phase 8 | Merge/PR/commit flow |

## Session Strategy

Each session should cover **2 phases max** to avoid context overflow and subagent hallucinations. Sequence:

| Session | Phases | Files | Notes |
|---|---|---|---|
| **1 (done)** | Phase 1 | 2 files | Foundations — font, tokens, shadows |
| **2 (done)** | Phase 2 | 15 files | UI primitives — shadow-as-border, no dark:, Vercel palette |
| **3 (next)** | Phase 3 + 4 | ~13 files | Shell + typography pass |
| **4** | Phase 5 | ~40 files | Section pages (biggest session) |
| **5** | Phase 6 + 7 + 8 | ~30 files | Hermes/messaging + auth + validation |

---

## Phase 1 — Foundations ✅ DONE

**Commit:** `e92d9e0`
**Files changed:** `app/layout.tsx`, `app/globals.css`

### What was done
- [x] 1.1 Replace `Outfit` with `Geist` + `Geist_Mono` from `next/font/google`
- [x] 1.2 Rewrite all oklch tokens → Vercel hex palette
- [x] 1.3 Card shadow → Vercel multi-layer stack via `--vercel-shadow-card`
- [x] 1.4 Focus ring → `hsla(212, 100%, 48%, 1)`
- [x] 1.5 Remove `.dark` block and `@custom-variant dark` entirely
- [x] 1.6 Add `--vercel-shadow-border`, `--vercel-shadow-card`, `--vercel-gray-600`, `--vercel-gray-100`
- [x] 1.7 Enable `font-feature-settings: "liga"` on body

### Decisions made
1. **Chart colors kept as oklch** — Recharts uses these as functional accent colors, not part of the achromatic palette. Converting them would break chart rendering.
2. **Card hover shadow = same as rest** — The Vercel design system uses consistent shadow-as-border. The plan didn't specify a different hover elevation, so both states use `--vercel-shadow-card`.
3. **Dark mode fully removed** — No dark mode toggle exists in the app. The `.dark` block and `@custom-variant dark` directive were both deleted cleanly.
4. **`border-color: transparent` on `[data-slot="card"]`** — Cards still have the Tailwind `border` class from `card.tsx` (will be removed in Phase 2), so we neutralize it with `border-color: transparent` in the global CSS until then.
5. **`--radius: 0.625rem` kept** — This is the base radius (10px). `--radius-lg` = 10px, `--radius-md` = 8px, `--radius-sm` = 6px. Phase 2 will use `rounded-lg` (which maps to `--radius-lg` = 10px) for cards per DESIGN.md's "comfortable" 8px radius spec.

### Current token map (quick reference)

| Token | Value | Use |
|---|---|---|
| `--background` | `#ffffff` | Page bg |
| `--foreground` | `#171717` | Primary text |
| `--primary` | `#171717` | CTA dark |
| `--secondary` | `#fafafa` | Gray-50 surface |
| `--muted-foreground` | `#666666` | Muted text |
| `--border` | `rgba(0,0,0,0.08)` | Shadow-as-border opacity |
| `--ring` | `hsla(212,100%,48%,1)` | Focus blue |
| `--info` | `#0072f5` | Link blue |
| `--vercel-shadow-border` | `rgba(0,0,0,0.08) 0px 0px 0px 1px` | Border shadow |
| `--vercel-shadow-card` | Full 4-layer stack | Card elevation |
| `--vercel-gray-600` | `#4d4d4d` | Body text |
| `--vercel-gray-100` | `#ebebeb` | Dividers |

---

## Phase 2 — UI Primitives ✅ DONE

**Plan ref:** `docs/plans/2026-04-02-vercel-design-system-reskin-a0a962.md` lines 63–98
**Working dir:** `leaderboard/`
**Files modified (15):**

### What was done
- [x] 2.1 `card.tsx` — Removed `border` and `shadow-sm`, changed `rounded-xl` → `rounded-lg`
- [x] 2.2 `button.tsx` — Removed `border border-transparent` from base, removed all `dark:` classes, outline uses shadow-ring, cleaned orphaned `focus-visible:border-ring`
- [x] 2.3 `badge.tsx` — Removed `border` from base, `rounded-md` → `rounded-full`, default variant → blue pill (`#ebf5ff`/`#0068d6`), removed `dark:` classes, cleaned orphaned border refs
- [x] 2.4 `tabs.tsx` — TabsList: `bg-transparent` + inset shadow-ring, TabsTrigger: removed `dark:`, removed `border border-transparent`, added `data-[state=active]:font-semibold`
- [x] 2.5 `table.tsx` — TableHead: added `text-xs uppercase tracking-wide`, TableRow: `hover:bg-[#fafafa]`, `border-b border-[#ebebeb]`
- [x] 2.6 `input.tsx` — `border` → inset shadow-as-border, focus shadow ring, `transition-colors` → `transition-shadow`, removed all `dark:` classes, cleaned orphaned border refs
- [x] 2.7 `separator.tsx` — `bg-border` → `bg-[#ebebeb]`
- [x] 2.8 `progress.tsx` — Track `bg-primary/20` → `bg-[#ebebeb]`, fill kept as `bg-primary` (#171717)
- [x] 2.9 `dialog.tsx` — Overlay `bg-black/10` → `bg-white/80`, content ring → shadow-as-border stack, `rounded-xl` → `rounded-lg`, footer removed `border-t`
- [x] 2.10 `sheet.tsx` — Overlay `bg-white/80`, removed `bg-clip-padding` and all side border classes, added shadow-as-border stack, added directional rounded corners
- [x] 2.11 `drawer.tsx` — Overlay `bg-black/50` → `bg-white/80`, removed all direction border classes, added full shadow-as-border stack
- [x] 2.12 `select.tsx` — Trigger: shadow-as-border + focus shadow, removed `dark:` + orphaned `border-input`, content: shadow-as-border + `rounded-lg`
- [x] 2.13 `dropdown-menu.tsx` — Content + SubContent: `ring-foreground/10 ring-1` → shadow-as-border stack, removed `dark:` from items
- [x] 2.14 `popover.tsx` — `border shadow-md` → shadow-as-border stack, `rounded-md` → `rounded-lg`
- [x] 2.15 `command.tsx` — `rounded-xl!` → `rounded-lg!`, input wrapper → `bg-[#fafafa]`, separator → `bg-[#ebebeb]`

### Decisions made
1. **Shadow-as-border stack for all panels** — Dialog, sheet, drawer, select content, dropdown, popover all use the same 3-layer shadow: `rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px`
2. **Inset shadow for input fields** — Input, select trigger, and tabs list use `inset` variant to create recessed fields vs. outset shadow on panels
3. **Card has no local shadow/border** — The global `[data-slot="card"]` CSS rule in globals.css handles all card styling; card.tsx just needs `border` and `shadow-sm` removed
4. **Sheet gets directional rounding** — Added `data-[side=bottom]:rounded-t-lg`, `data-[side=left]:rounded-r-lg`, etc. for rounded corners on exposed edges
5. **Table rows use actual CSS borders** — `border-b border-[#ebebeb]` for horizontal dividers is appropriate for table context (shadow-as-border is for card/panel boundaries)
6. **Orphaned border references cleaned** — Removed no-op `focus-visible:border-ring`, `aria-invalid:border-destructive`, `border-input` from button, badge, tabs, input, and select (these set border-color without border-width)

### Validation
- `npx next build` — ✅ passes
- Zero `dark:` classes remain in all 15 Phase 2 files
- Zero `ring-foreground/10` references remain
- Zero orphaned border-color references without border-width

---

## Phase 3 — Shell 🔲 NEXT

**Plan ref:** lines 102–121
**Files to modify (2):** `components/app-sidebar.tsx`, `app/page.tsx`

### Key changes
- `app-sidebar.tsx`: Logo block bg → `#171717`, group labels → 12px/500/uppercase/`#666666`, menu buttons → 14px/500, tree line → already handled by globals.css `--vercel-gray-100`, user card → shadow-ring
- `app/page.tsx`: Header `border-b` → `shadow-[0_1px_0_0_rgba(0,0,0,0.08)]`, Hoy/Semana toggle → pill nav (64px radius), breadcrumb → 14px/500, metadata → 12px/400/`#666666`

### Suggestions for Phase 3
- **SidebarInset is sacrosanct** — Do NOT touch any `SidebarInset` class, its `rounded-xl`, or its `shadow-sm`. Only modify content inside and around it.
- **`app-sidebar.tsx`** likely uses shadcn sidebar primitives (`data-slot="sidebar-*"`). Some styling may already be handled by the updated sidebar tokens in globals.css. Check before overwriting.
- **Toggle buttons** (Hoy/Semana): These may be custom components or use `Tabs`/`ToggleGroup`. Check what `app/page.tsx` actually renders before deciding the approach.

---

## Phase 4 — Typography Pass 🔲

**Plan ref:** lines 124–150
**Files (~10):** `leaderboard-header.tsx`, `weekly-overview.tsx`, `general-metrics.tsx`, `day-progress.tsx`, `resources-detail.tsx`, `panel-overview.tsx`, `panel/` components, `section-tabs.tsx`, `worker-detail-sheet.tsx`, `settings-page.tsx`, `spotlight.tsx`

### Type hierarchy (from DESIGN.md)

| Context | Tailwind classes |
|---|---|
| Page/section titles (32px/600/-1.28px) | `text-[32px] font-semibold tracking-[-0.04em]` |
| Card titles (24px/600/-0.96px) | `text-2xl font-semibold tracking-[-0.04em]` |
| Body large (20px/400) | `text-xl font-normal` |
| Body (16px/400) | `text-base font-normal` |
| Body medium (16px/500) | `text-base font-medium` |
| Buttons/links (14px/500) | `text-sm font-medium` |
| Metadata (12px/400-500) | `text-xs font-normal` or `text-xs font-medium` |
| Technical labels (12px mono/500/uppercase) | `text-xs font-medium uppercase font-mono tracking-wide` |

### Suggestions for Phase 4
- **Use `tracking-[-0.04em]`** instead of pixel values for negative letter-spacing — Tailwind's em-based tracking scales with font size automatically.
- **`settings-page.tsx` has pre-existing tsc errors** — Don't try to fix them. Only apply typography changes.
- **Search for `font-bold`** across all Phase 4 files — Vercel system caps at weight 600. Replace `font-bold` (700) with `font-semibold` (600).
- **Search for `text-lg`/`text-xl`/`text-2xl`** on section titles — These likely need to become `text-[32px]` with negative tracking.

---

## Phase 5 — Section Pages 🔲

**Plan ref:** lines 153–178
**Files (~40):**

| Section | Directory | Files |
|---|---|---|
| SRI | `components/sri/` | ~10 files (5 pages + detail sheet + score bar + badge + states + charts) |
| Provider Performance | `components/provider-performance/` | 10 files |
| Decision Intelligence | `components/decision-intelligence/` | ~20 files (3 sub-dirs with ~6 files each + views + shared) |

### Suggestions for Phase 5
- **This is the largest phase** — Consider splitting across two sub-sessions if the subagent struggles.
- **Recharts charts**: Only change axis/grid text to 12px Geist. Do NOT change chart data colors — they're functional accents.
- **`status-badge.tsx`** should use the same pill style from Phase 2's `badge.tsx` changes. Check if it imports `Badge` or rolls its own.
- **Decision Intelligence has 18+ files in sub-dirs** — The subagent should process `category/`, `network/`, `supply/` sequentially, not all at once.

---

## Phase 6 — Hermes / Messaging 🔲

**Plan ref:** lines 181–198
**Files (~25):** `app/messaging/layout.tsx`, `components/hermes/` (11 files), `app/messaging/` pages (~12)

### Suggestions for Phase 6
- **Messaging pages likely inherit styling** from shared components. After updating `hermes-*` components, most pages may need zero changes.
- **`hermes-status-badge.tsx`** — Same pill approach as Phase 2 badge changes.

---

## Phase 7 — Login / Auth 🔲

**Plan ref:** lines 201–212
**Files (3):** `app/login/page.tsx`, `components/login-form.tsx`, `components/signup-form.tsx`

### Suggestions for Phase 7
- Simplest phase — only 3 files with straightforward token/class swaps.

---

## Phase 8 — Validation & Cleanup 🔲

**Plan ref:** lines 215–222

- [ ] `npx next build` passes
- [ ] Visual check against `DESIGN.md`
- [ ] `SidebarInset` `rounded-xl` untouched
- [ ] Focus rings = `hsla(212,100%,48%,1)` on keyboard nav
- [ ] No `border` classes on cards (grep `border` in card components)
- [ ] Reduced-motion media query works
- [ ] Run `requesting-code-review` skill
- [ ] Run `finishing-a-development-branch` skill

### Validation commands
```bash
npx next build
grep -r "border" components/ui/card.tsx
grep -r "font-bold" components/
grep -r "dark:" components/ app/
```

---

## Risk Register

| Risk | Status | Notes |
|---|---|---|
| `settings-page.tsx` pre-existing tsc errors | Open | Don't fix, don't worsen |
| Recharts chart colors forced achromatic | Mitigated | Chart colors kept as oklch accents |
| `SidebarInset` accidentally modified | Mitigated | Global constraint documented |
| Subagent context overflow on large phases | Mitigated | 2-phase-per-session limit |
| `button.tsx` base `border border-transparent` removal | Phase 2 | Must update outline/ghost to use shadow-ring instead |
