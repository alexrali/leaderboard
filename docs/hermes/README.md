# Hermes Documentation for Leaderboard

## Purpose

This folder documents the Hermes messaging subsystem as it is currently implemented in `leaderboard`.

The content in this folder is validated against:

- `lib/hermes/*`
- `app/api/hermes/*`
- `app/messaging/*`
- `supabase/migrations/20260312230000_add_hermes_platform.sql`

The `hermes-base` documentation was used as structural reference only. Where `hermes-base` describes aspirational or broader platform behavior, this folder reflects the concrete implementation that exists in `leaderboard` today.

## Document Map

- `architecture.md`
  - System boundaries, runtime components, trust model, and processing paths.

- `specification.md`
  - Canonical technical specification for tables, enums, routes, behaviors, constraints, and current implementation boundaries.

- `operations-flow.md`
  - Practical operating guide for configuring, validating, executing, and troubleshooting Hermes from the admin surface.

## System Summary

Hermes is an isolated event-driven email automation subsystem embedded into the Leaderboard application.

At a high level, the implemented flow is:

1. An event is submitted to Hermes.
2. Hermes validates and stores the event in `hermes_events`.
3. Hermes loads active rules from `hermes_rules` and evaluates event matching and conditions.
4. Hermes either:
   - sends immediately using a template from `hermes_templates`, or
   - creates a scheduled task in `hermes_scheduled_tasks`.
5. All outbound attempts are recorded in `hermes_delivery_logs`.
6. Resend webhook updates are persisted in `hermes_webhook_events` and used to update delivery status.
7. Administrators operate Hermes through the `/messaging` UI and the `/api/hermes/admin/*` route group.

## Current Implemented Capabilities

- Event validation and normalization.
- Event deduplication by `(source, external_id)`.
- Rule matching by exact or wildcard event type.
- Rule conditions with payload-based operators.
- Recipient resolution for:
  - `STATIC`
  - `DYNAMIC`
  - `CONDITIONAL`
- Immediate and delayed delivery execution.
- Scheduled task persistence and retry processing.
- Template rendering with:
  - `{{variable}}`
  - dot-path lookup
  - `#if`
  - `#unless`
  - `#each`
  - helper pipes such as `formatDate`, `formatNumber`, `formatCurrency`, `truncate`, `upper`, `lower`, and `capitalize`
- Resend delivery logging and webhook status updates.
- Admin UI for:
  - templates
  - rules
  - events
  - scheduled tasks
  - delivery logs
  - review/preview
  - operations
  - example scenario bootstrap

## Current Implementation Limits

The following limitations are important and intentional to document:

- `LOOKUP` recipient resolution is defined at the type/schema level but is not implemented in `lib/hermes/rules.ts`.
- `GROUP` recipient resolution is defined at the type/schema level but is not implemented in `lib/hermes/rules.ts`.
- `RECURRING` and `BATCHED` schedule types exist in the schema and type system, but current execution logic does not implement a dedicated cron parser or batching engine. They currently depend on generic `schedule_config` interpretation in `calculateScheduledFor`.
- There is no persisted event-to-rule match table in the current Leaderboard implementation. Match analysis is derived at runtime and surfaced through preview/timeline logic.
- The admin surface is intended for authenticated use from the internal UI, but route-level authorization is not enforced consistently across all `/api/hermes/admin/*` handlers. This should be treated as an implementation fact and a hardening item, not as an assumption of security.
- `POST /api/hermes/send` performs direct template send orchestration without the service-secret guard used by `/api/hermes/events` and `/api/hermes/process-due`.

## Recommended Reading Order

For new contributors:

1. `architecture.md`
2. `specification.md`
3. `operations-flow.md`

For operators and testers:

1. `operations-flow.md`
2. `specification.md`

For backend changes:

1. `specification.md`
2. `architecture.md`

## Maintenance Rule

When Hermes behavior changes, update this folder from the real implementation first. Do not update these documents from `hermes-base` alone without validating the corresponding behavior in `leaderboard`.
