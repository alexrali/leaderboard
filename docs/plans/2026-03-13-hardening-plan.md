# Hardening Implementation Plan

## Overview

Comprehensive hardening pass to improve accessibility, edge case handling, and mobile touch interactions across the Leaderboard Dashboard.

**Goals:**
- Fix critical accessibility issues (WCAG compliance)
- Handle extreme content (long text, empty states)
- Improve mobile touch interactions
- Strengthen keyboard navigation

---

## Task 1: Foundation Layer Fixes

**File:** `app/layout.tsx`

**Changes:**
1. Fix `lang="en"` → `lang="es"` (content is Spanish)
2. Add skip link component with focus-visible styles
3. Add global `prefers-reduced-motion` CSS to `globals.css`

**Acceptance Criteria:**
- Root HTML has `lang="es"`
- Skip link appears on Tab press, jumps to main content
- All animations respect `prefers-reduced-motion`

---

## Task 2: Focus Indicators System

**Files:** `app/globals.css`, `app/page.tsx`, various components

**Changes:**
1. Add consistent `focus-visible` ring styles to globals.css
2. Add focus styles to view mode toggle buttons (page.tsx:152-172)
3. Ensure all custom buttons have visible focus states

**Acceptance Criteria:**
- All interactive elements show visible focus ring on keyboard navigation
- Focus ring uses `--ring` color token
- Focus indicators have 3px minimum stroke for visibility

---

## Task 3: Heatmap Accessibility

**File:** `components/panel/contribution-heatmap.tsx`

**Changes:**
1. Make cells keyboard-navigable (add `tabindex` where needed)
2. Expand touch targets to 44x44px minimum (invisible padding)
3. Ensure focus states are visible on cells

**Acceptance Criteria:**
- Heatmap cells can be navigated with keyboard
- Touch target size meets 44x44px minimum
- Focus indicator clearly shows selected cell

---

## Task 4: Table Accessibility

**Files:** `components/weekly-overview.tsx`, `components/general-metrics.tsx`, `components/day-progress.tsx`

**Changes:**
1. Add `scope="col"` to all `<th>` elements
2. Add `scope="row"` to row headers where applicable
3. Ensure tables have proper captions or aria-labels

**Acceptance Criteria:**
- All table headers have scope attributes
- Screen readers announce table structure correctly
- Tables have accessible names

---

## Task 5: Text Overflow & Edge Cases

**Files:** Multiple component files with tables and cards

**Changes:**
1. Add `truncate` class to long name cells
2. Add `min-width: 0` to flex/grid items that may overflow
3. Ensure avatar initials are limited to 2 chars max
4. Add `line-clamp` to description fields

**Acceptance Criteria:**
- Long names truncate with ellipsis
- No text overflow breaks layout
- Avatar fallbacks handle long names gracefully

---

## Task 6: Avatar Accessibility

**File:** `components/ui/avatar.tsx`, usage sites

**Changes:**
1. Add `aria-label` prop to Avatar component
2. Ensure fallback text is announced properly
3. Add meaningful labels for user avatars

**Acceptance Criteria:**
- Avatar component accepts aria-label prop
- User avatars have readable labels (e.g., "Avatar for Juan Pérez")
- Screen readers announce avatar purpose correctly

---

## Task 7: Mobile Sidebar Behavior

**File:** `app/page.tsx`, sidebar components

**Changes:**
1. Auto-close mobile sidebar after navigation selection
2. Ensure focus returns to triggering element
3. Add escape key to close sidebar

**Acceptance Criteria:**
- Mobile sidebar closes after selecting a menu item
- Focus management is correct
- Escape key closes sidebar on mobile

---

## Task 8: Status Badge Accessibility

**Files:** `components/general-metrics.tsx`, `components/weekly-overview.tsx`

**Changes:**
1. Ensure trend indicators have text alternatives (icons already present)
2. Verify color contrast meets WCAG AA for status badges
3. Add aria-labels where color is the only indicator

**Acceptance Criteria:**
- Trend direction is communicated beyond color alone
- Status badges meet contrast requirements
- No color-only communication

---

## Success Criteria

- All critical accessibility issues resolved
- Touch targets meet minimum size requirements
- Keyboard navigation works throughout the app
- Text overflow handled gracefully
- Mobile interactions work as expected
