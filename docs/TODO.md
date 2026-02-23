# Leaderboard — Feature Backlog

Each item here follows the sequence:
1. Identified → added to this list
2. Plan created in `docs/plans/YYYY-MM-DD-<feature>.md`
3. Developed
4. Marked complete ✅

---

## Auth & Access

- [ ] **Custom domain for Resend** — swap `onboarding@resend.dev` for `noreply@yourdomain.com` once a domain is available. Update Supabase SMTP sender and Resend verified domain settings.
- [ ] **Roles + JWT claims** — add `role` column to a `profiles` table, expose as custom JWT claim via Supabase hook. Roles: `admin` (manage workers, settings) vs `viewer` (read-only). RLS policies use `auth.jwt() ->> 'role'`.
- [ ] **RLS policies** — implement Row Level Security on `performance_*` and `leaderboard` tables using auth roles from JWT claims. Currently tables are unprotected beyond anon key.

## Email & Notifications

- [ ] **Resend transactional emails** — use Resend SDK (not just SMTP) for app-triggered emails: weekly summary, performance alerts, streak notifications. Requires Edge Function or API route.

## Infrastructure

- [ ] **Supabase Edge Functions** — cron job for daily/weekly performance aggregation (currently done externally?). Evaluate which scheduled tasks belong here vs Next.js API routes.
- [ ] **`signup-form.tsx` cleanup** — file exists but is empty. Either implement an invite-only signup flow or delete the file.

---

> Plans live in `docs/plans/`. When starting a feature, create the plan first, link it here.
