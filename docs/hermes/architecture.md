# Hermes Architecture

## 1. Architectural Intent

Hermes in `leaderboard` is an additive, isolated messaging subsystem designed to decouple event production from email delivery.

The implementation follows four principles:

- **Isolation**
  - Hermes lives under its own namespace in `lib/hermes`, `app/api/hermes`, `app/messaging`, and dedicated Supabase tables.

- **Server-side execution**
  - Database access is performed through a Supabase service-role client created by `createHermesAdminClient()`.

- **Configuration-driven behavior**
  - Administrators manage templates and rules through the Hermes admin UI instead of embedding message logic throughout the application.

- **Operational visibility**
  - Events, tasks, deliveries, and webhook updates are persisted and exposed through review, detail, and operations screens.

## 2. Runtime Topology

```text
Application / Internal Services / Admin UI
                |
                v
        app/api/hermes/*
                |
                v
        lib/hermes runtime layer
                |
      +---------+---------+----------------+
      |                   |                |
      v                   v                v
 hermes_events      hermes_rules      hermes_templates
      |                   |                |
      +---------+---------+                |
                v                          |
        processHermesEvent                 |
                |                          |
      +---------+---------+                |
      |                   |                |
      v                   v                v
Immediate delivery   Scheduled task   Template rendering
      |                   |                |
      v                   v                v
hermes_delivery_logs  hermes_scheduled_tasks
      |                   |
      +---------+---------+
                |
                v
            Resend API
                |
                v
     /api/hermes/webhook updates
                |
                v
      hermes_webhook_events + hermes_delivery_logs
```

## 3. Component Layers

### 3.1 Presentation Layer

The admin UI is exposed under `/messaging`.

Implemented pages include:

- `/messaging`
- `/messaging/templates`
- `/messaging/templates/new`
- `/messaging/templates/[id]`
- `/messaging/templates/[id]/edit`
- `/messaging/rules`
- `/messaging/rules/new`
- `/messaging/rules/[id]`
- `/messaging/rules/[id]/edit`
- `/messaging/events`
- `/messaging/events/[id]`
- `/messaging/events/[id]/timeline`
- `/messaging/tasks`
- `/messaging/tasks/[id]`
- `/messaging/delivery`
- `/messaging/delivery/[id]`
- `/messaging/review`
- `/messaging/operations`

These pages are server-rendered admin surfaces that call Hermes helpers and admin APIs.

### 3.2 API Layer

Hermes exposes two route groups:

- **Service/Internal routes** under `/api/hermes/*`
- **Admin routes** under `/api/hermes/admin/*`

#### Service/Internal routes

- `POST /api/hermes/events`
  - Validates, persists, and processes an event.
  - Protected by `HERMES_API_SECRET` through `isAuthorizedHermesServiceRequest()`.

- `POST /api/hermes/process-due`
  - Processes due scheduled tasks.
  - Protected by `HERMES_API_SECRET`.

- `POST /api/hermes/webhook`
  - Receives Resend webhook payloads.
  - Can optionally use `HERMES_WEBHOOK_SECRET`; if the secret is absent, the current implementation allows the route.

- `POST /api/hermes/send`
  - Performs a direct template send.
  - Current implementation does not apply `isAuthorizedHermesServiceRequest()`.

#### Admin routes

Admin routes cover templates, rules, events, tasks, delivery logs, summary, review, timeline, and operations.

Representative examples:

- `GET/POST /api/hermes/admin/templates`
- `GET/POST /api/hermes/admin/rules`
- `POST /api/hermes/admin/review/events`
- `GET /api/hermes/admin/summary`
- `POST /api/hermes/admin/operations/process-due`
- `POST /api/hermes/admin/operations/bootstrap-examples`
- bulk retry, cancel, and reprocess operations

The admin route group is intended to be used by the authenticated admin UI, but explicit route-level authorization is not applied consistently across handlers.

### 3.3 Domain Layer

The domain logic lives in `lib/hermes/*`.

Core modules:

- `events.ts`
  - Validates event payload shape.
  - Normalizes JSON.
  - Enforces payload and metadata size limits.
  - Persists events.
  - Detects duplicate `(source, external_id)` submissions.

- `rules.ts`
  - Loads active rules.
  - Supports wildcard event matching.
  - Evaluates conditions using payload field paths.
  - Resolves recipients.

- `renderer.ts`
  - Resolves template variables from explicit input, payload paths, and defaults.
  - Renders subject, HTML, and text output.

- `runtime.ts`
  - Orchestrates event processing and scheduled task execution.
  - Decides between immediate delivery and deferred scheduling.

- `tasks.ts`
  - Computes `scheduled_for`.
  - Persists scheduled tasks.
  - Loads due tasks.
  - Computes exponential backoff retry times.

- `delivery.ts`
  - Validates sender configuration.
  - Sends through Resend.
  - Persists delivery logs.

- `webhooks.ts`
  - Stores inbound webhook payloads.
  - Updates corresponding delivery log rows.

- `admin.ts`
  - Query layer for summary, lists, and detail views.

- `review.ts`
  - Provides non-destructive preview and timeline reconstruction for analysis.

- `example-admin.ts`
  - Installs idempotent example templates, rules, and sample scenarios.

### 3.4 Persistence Layer

Hermes persists to dedicated Supabase tables:

- `hermes_templates`
- `hermes_rules`
- `hermes_events`
- `hermes_scheduled_tasks`
- `hermes_delivery_logs`
- `hermes_webhook_events`

All of these tables are protected by RLS and granted a `service_role` full-access policy in the migration.

## 4. Processing Paths

### 4.1 Event Ingestion Path

The canonical runtime path begins at `POST /api/hermes/events`.

Sequence:

1. Request authorization is verified with `HERMES_API_SECRET`.
2. Input is coerced through `coerceHermesEventInput()`.
3. Input is validated by `validateHermesEventInput()`.
4. Event is persisted to `hermes_events`.
5. `processHermesEvent()` transitions the event to `PROCESSING`.
6. Hermes loads active rules and evaluates matches.
7. For each matched rule:
   - `IMMEDIATE` routes execute delivery immediately.
   - Other schedule types create a row in `hermes_scheduled_tasks`.
8. Event is finalized as `COMPLETED` or `FAILED`.

### 4.2 Rule Evaluation Path

Rule evaluation in `lib/hermes/rules.ts` is deterministic and ordered.

Processing behavior:

- Rules are loaded from `hermes_rules` where `is_active = true`.
- Event type matching supports:
  - exact match
  - single-segment wildcard matching using `*`
- Conditions are evaluated against `event.payload`.
- A rule is considered matched only when all configured conditions pass.
- Matching results are sorted by ascending `priority`.

### 4.3 Immediate Delivery Path

For `schedule_type = IMMEDIATE`:

1. Hermes resolves recipients.
2. Hermes loads the referenced template.
3. Hermes renders the subject, HTML, and text output.
4. Hermes sends one or more messages through Resend.
5. Hermes inserts rows into `hermes_delivery_logs`.
6. Delivery success or failure is summarized back into the processing result.

### 4.4 Scheduled Task Path

For non-immediate schedule types:

1. Hermes computes `scheduled_for` using `calculateScheduledFor()`.
2. Hermes stores the task in `hermes_scheduled_tasks`.
3. A later call to `processDueHermesTasks()` loads due tasks.
4. Each task is rehydrated with its event context and rule.
5. Delivery is executed.
6. Task status is updated to:
   - `COMPLETED`
   - `RETRYING`
   - `FAILED`

### 4.5 Webhook Update Path

The webhook path is intentionally narrow:

1. Hermes accepts a supported Resend event type.
2. Hermes extracts a Resend message identifier.
3. Hermes stores the raw webhook payload in `hermes_webhook_events`.
4. Hermes updates matching `hermes_delivery_logs` rows by `resend_id`.
5. Hermes marks the webhook record as processed.

### 4.6 Admin Review Path

`POST /api/hermes/admin/review/events` supports two modes:

- `preview`
  - Creates an in-memory event model.
  - Evaluates rules and rendering without persisting an event.

- `process`
  - Persists the event.
  - Executes the normal runtime path.
  - Returns a timeline built from the stored event, tasks, and deliveries.

This route is the safest operator-facing surface for validating rules and templates before using live service endpoints.

## 5. Trust and Security Boundaries

### 5.1 Service-Role Database Access

All Hermes persistence flows use `createHermesAdminClient()`, which requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

This means Hermes server code bypasses user-scoped RLS and operates as a privileged server subsystem.

### 5.2 Service Endpoint Authorization

`isAuthorizedHermesServiceRequest()` supports two secret transport modes:

- `x-hermes-api-secret`
- `Authorization: Bearer <secret>`

This guard is applied to:

- `/api/hermes/events`
- `/api/hermes/process-due`
- `/api/hermes/webhook` with optional alternate env key

### 5.3 Admin Surface Authorization Reality

The intended operating model is an internal authenticated admin panel. However, the current implementation should be documented exactly as it exists:

- The `/messaging` layout does not perform an explicit auth gate.
- Many `/api/hermes/admin/*` routes do not perform an explicit session/role check.
- Some admin routes read the current user through `createClient().auth.getUser()` to populate `created_by` or example ownership metadata.

This is not a theoretical concern; it is part of the current implementation boundary and should inform future hardening work.

## 6. Architectural Deviations from `hermes-base`

Compared with the broader `hermes-base` documentation, the Leaderboard implementation differs in several important ways:

- The persistence model is Supabase/Postgres, not Prisma/SQLite.
- The implementation is intentionally additive and isolated under a `hermes` namespace.
- There is no dedicated persisted `EventRuleMatch` table.
- The current recipient engine does not implement `LOOKUP` or `GROUP`.
- The scheduler supports delayed and scheduled execution but does not yet provide a dedicated recurring/batching engine.
- The admin UI is a concrete server-rendered operational console, not the broader product surface described by the reference docs.

## 7. Current Gaps and Hardening Priorities

The most relevant architectural gaps are:

- consistent route-level authorization for `/api/hermes/admin/*`
- authorization review for `POST /api/hermes/send`
- implementation of `LOOKUP` recipient resolution
- implementation of `GROUP` recipient resolution
- fuller recurring/batched scheduling semantics
- richer audit/version history for configuration changes

These items should be treated as deliberate future work, not as existing platform guarantees.
