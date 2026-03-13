# Hermes Technical Specification

## 1. Scope

This specification defines the current Hermes subsystem in `leaderboard`, including its database model, route contracts, runtime behavior, supported configuration surface, and known implementation boundaries.

## 2. Technology Context

- Framework: Next.js 16
- Language: TypeScript
- Database: Supabase Postgres
- Transport/Delivery: Resend
- Admin UI: `app/messaging/*`
- Server namespace: `lib/hermes/*`

## 3. Environment Variables

### Required for database access

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Required for outbound delivery

- `RESEND_API_KEY`
- one of:
  - template-specific `from_email`
  - or `HERMES_DEFAULT_FROM_EMAIL`

### Optional delivery defaults

- `HERMES_DEFAULT_FROM_NAME`

### Optional service endpoint protection

- `HERMES_API_SECRET`
- `HERMES_WEBHOOK_SECRET`

## 4. Canonical Tables

The following tables are created by `supabase/migrations/20260312230000_add_hermes_platform.sql`.

### 4.1 `hermes_templates`

Purpose: stores reusable message templates.

Key columns:

- `id uuid primary key`
- `name varchar(255) not null`
- `slug varchar(100) not null unique`
- `description text`
- `subject varchar(500) not null`
- `html_content text not null`
- `text_content text`
- `variables jsonb not null default []`
- `default_values jsonb not null default {}`
- `from_email varchar(255)`
- `from_name varchar(255)`
- `reply_to varchar(255)`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `idx_hermes_templates_slug`
- `idx_hermes_templates_active`

### 4.2 `hermes_rules`

Purpose: defines when Hermes should react to an event and how the delivery should be executed.

Key columns:

- `id uuid primary key`
- `name varchar(255) not null`
- `description text`
- `event_type varchar(255) not null`
- `event_conditions jsonb not null default []`
- `schedule_type varchar(50) not null default 'IMMEDIATE'`
- `schedule_config jsonb not null default {}`
- `timezone varchar(100) not null default 'UTC'`
- `recipient_type varchar(50) not null default 'STATIC'`
- `recipient_config jsonb not null default {}`
- `template_id uuid references hermes_templates(id) on delete set null`
- `priority integer not null default 100`
- `is_active boolean not null default true`
- `created_by uuid references auth.users(id) on delete set null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `schedule_type` in `IMMEDIATE`, `DELAYED`, `SCHEDULED`, `RECURRING`, `BATCHED`
- `recipient_type` in `STATIC`, `DYNAMIC`, `LOOKUP`, `GROUP`, `CONDITIONAL`

Indexes:

- `idx_hermes_rules_event_type`
- `idx_hermes_rules_active`
- `idx_hermes_rules_priority`

### 4.3 `hermes_events`

Purpose: stores inbound events and their processing outcome.

Key columns:

- `id uuid primary key`
- `type varchar(255) not null`
- `source varchar(50) not null`
- `external_id varchar(255)`
- `payload jsonb not null default {}`
- `metadata jsonb not null default {}`
- `status varchar(50) not null default 'PENDING'`
- `processed_at timestamptz`
- `error_message text`
- `retry_count integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `source` in `webhook`, `cron`, `api`, `queue`
- `status` in `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`
- unique `(source, external_id)`

Indexes:

- `idx_hermes_events_type`
- `idx_hermes_events_status`
- `idx_hermes_events_created_at`

### 4.4 `hermes_scheduled_tasks`

Purpose: stores deferred execution work created from matched rules.

Key columns:

- `id uuid primary key`
- `rule_id uuid not null references hermes_rules(id) on delete cascade`
- `event_id uuid references hermes_events(id) on delete cascade`
- `event_data jsonb not null default {}`
- `scheduled_for timestamptz not null`
- `processed_at timestamptz`
- `status varchar(50) not null default 'PENDING'`
- `result jsonb`
- `retry_count integer not null default 0`
- `max_retries integer not null default 3`
- `next_retry_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraint:

- `status` in `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`, `RETRYING`

Indexes:

- `idx_hermes_scheduled_tasks_status`
- `idx_hermes_scheduled_tasks_scheduled_for`
- `idx_hermes_scheduled_tasks_rule_id`

### 4.5 `hermes_delivery_logs`

Purpose: stores message delivery attempts and status progression.

Key columns:

- `id uuid primary key`
- `event_id uuid references hermes_events(id) on delete set null`
- `rule_id uuid references hermes_rules(id) on delete set null`
- `user_id uuid references auth.users(id) on delete set null`
- `template_id uuid references hermes_templates(id) on delete set null`
- `recipient_email varchar(255) not null`
- `recipient_name varchar(255)`
- `subject varchar(500)`
- `resend_id varchar(255)`
- `resend_status varchar(50)`
- `status varchar(50) not null default 'QUEUED'`
- `error_message text`
- `sent_at timestamptz`
- `delivered_at timestamptz`
- `opened_at timestamptz`
- `clicked_at timestamptz`
- `metadata jsonb not null default {}`
- `created_at timestamptz not null default now()`

Constraint:

- `status` in `QUEUED`, `SENT`, `DELIVERED`, `OPENED`, `CLICKED`, `BOUNCED`, `FAILED`, `UNSUBSCRIBED`

Indexes:

- `idx_hermes_delivery_logs_recipient_email`
- `idx_hermes_delivery_logs_status`
- `idx_hermes_delivery_logs_sent_at`

### 4.6 `hermes_webhook_events`

Purpose: persists raw webhook status events from Resend.

Key columns:

- `id uuid primary key`
- `resend_id varchar(255) not null`
- `event_type varchar(50) not null`
- `data jsonb not null`
- `processed boolean not null default false`
- `processed_at timestamptz`
- `created_at timestamptz not null default now()`

Constraint:

- `event_type` in `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

Indexes:

- `idx_hermes_webhook_events_resend_id`
- `idx_hermes_webhook_events_processed`

## 5. Security Model

### 5.1 Database security

All Hermes tables have RLS enabled.

The migration defines `service_full_*` policies that grant full access only when `auth.role() = 'service_role'`.

Operational consequence:

- Hermes reads and writes must execute server-side through the service-role client.
- Browser-side direct access is not part of the design.

### 5.2 Endpoint authorization

#### Service-protected endpoints

- `POST /api/hermes/events`
- `POST /api/hermes/process-due`
- `POST /api/hermes/webhook` with optional `HERMES_WEBHOOK_SECRET`

Authorization transport:

- `x-hermes-api-secret`
- `Authorization: Bearer <secret>`

#### Admin endpoints

Admin endpoints are designed for internal use from the admin console. Explicit route-level authorization is not currently enforced consistently across handlers.

#### Direct send endpoint

`POST /api/hermes/send` currently does not apply the service-secret authorization guard.

## 6. Domain Types and Enums

### 6.1 Event sources

- `webhook`
- `cron`
- `api`
- `queue`

### 6.2 Event statuses

- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

### 6.3 Schedule types

- `IMMEDIATE`
- `DELAYED`
- `SCHEDULED`
- `RECURRING`
- `BATCHED`

### 6.4 Recipient types

- `STATIC`
- `DYNAMIC`
- `LOOKUP`
- `GROUP`
- `CONDITIONAL`

Implemented in runtime today:

- `STATIC`
- `DYNAMIC`
- `CONDITIONAL`

Declared but not implemented in runtime today:

- `LOOKUP`
- `GROUP`

### 6.5 Delivery statuses

- `QUEUED`
- `SENT`
- `DELIVERED`
- `OPENED`
- `CLICKED`
- `BOUNCED`
- `FAILED`
- `UNSUBSCRIBED`

### 6.6 Task statuses

- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`
- `RETRYING`

### 6.7 Webhook event types

- `email.delivered`
- `email.opened`
- `email.clicked`
- `email.bounced`
- `email.complained`

## 7. Event Contract

Hermes event input shape:

```json
{
  "type": "namespace.action",
  "source": "api",
  "payload": {},
  "externalId": "optional-string",
  "metadata": {}
}
```

Validation rules enforced in `lib/hermes/events.ts`:

- body must be a JSON object
- `type` must be a non-empty string
- `type` must contain a `.` separator
- `type` must match `^[a-z0-9._-]+$` case-insensitively
- `type` length must be `<= 100`
- `source` must be one of the allowed event sources
- `payload` must be a JSON object
- `payload` must be JSON-serializable
- payload size limit: `1 MB`
- metadata size limit: `64 KB`
- `externalId`, if present, must be a non-empty string of at most `255` characters

## 8. Rule Specification

### 8.1 Event type matching

Hermes supports:

- exact event type matching
- wildcard matching using `*` per dot-delimited segment

Examples:

- `user.signup` matches only `user.signup`
- `user.*` matches `user.signup` and `user.created`

### 8.2 Condition operators

Supported operators:

- `eq`
- `neq`
- `gt`
- `lt`
- `gte`
- `lte`
- `contains`
- `regex`
- `exists`
- `notExists`

Conditions are evaluated against `event.payload` using nested paths.

### 8.3 Priority semantics

- Lower numeric priority executes first.
- Matches are sorted in ascending `priority` order.

### 8.4 Recipient resolution

#### `STATIC`

Expected config shape:

```json
{
  "emails": ["ops@example.com", "support@example.com"]
}
```

#### `DYNAMIC`

Expected config shape:

```json
{
  "emailPath": "user.email",
  "namePath": "user.name"
}
```

#### `CONDITIONAL`

Expected config shape:

```json
{
  "conditions": [
    {
      "when": [{ "field": "report.priority", "operator": "eq", "value": "high" }],
      "then": { "emails": ["ops@example.com"] }
    }
  ],
  "default": {
    "emailPath": "requester.email",
    "namePath": "requester.name"
  }
}
```

## 9. Template Specification

### 9.1 Variable resolution order

`renderHermesTemplate()` resolves variables in this order:

1. explicitly provided variables
2. payload path from `template.variables[].path`
3. `template.variables[].defaultValue`
4. `template.default_values`
5. remaining explicit variables not already materialized

### 9.2 Supported syntax

#### Interpolation

- `{{variable}}`
- `{{nested.path}}`

#### Conditional blocks

- `{{#if path}}...{{/if}}`
- `{{#unless path}}...{{/unless}}`

#### Iteration blocks

- `{{#each items}}...{{/each}}`
- supports `{{@index}}`
- supports `{{this}}`

#### Helper pipes

- `formatDate`
- `formatNumber`
- `formatCurrency`
- `truncate`
- `upper`
- `lower`
- `capitalize`

Example:

```text
{{order.total | formatCurrency USD en-US}}
```

## 10. Scheduling Specification

Scheduling is currently implemented in `calculateScheduledFor()`.

### 10.1 `IMMEDIATE`

- Executes immediately during event processing.

### 10.2 `DELAYED`

Reads numeric values from `schedule_config` using these keys:

- `delayMinutes` or `delay_minutes`
- `delayHours` or `delay_hours`
- `delayDays` or `delay_days`

### 10.3 `SCHEDULED`, `RECURRING`, `BATCHED`

Current implementation supports generic date/time extraction from `schedule_config`:

- explicit date keys:
  - `scheduledFor`
  - `scheduled_for`
  - `executeAt`
  - `execute_at`
  - `nextRunAt`
  - `next_run_at`
- time-of-day keys:
  - `time`
  - `scheduledTime`
  - `scheduled_time`

If none are present, Hermes falls back to `now`.

Important: the current runtime does not implement a dedicated cron engine or batch aggregation engine.

## 11. Retry Specification

Scheduled task retries are computed by `getHermesTaskRetryTime()`.

Behavior:

- exponential backoff based on `retry_count`
- base delay: `5 minutes`
- maximum delay: `60 minutes`
- task is marked `FAILED` once `retry_count + 1 >= max_retries`

## 12. API Surface

### 12.1 Service/Internal endpoints

#### `POST /api/hermes/events`

Purpose:

- ingress a validated event and process it immediately

Response includes:

- `eventId`
- `status`
- `matchedRules`
- `immediateDispatches`
- `scheduledTasks`
- `errors`

#### `POST /api/hermes/process-due`

Purpose:

- process up to `limit` due scheduled tasks

Query parameter:

- `limit` default `25`, maximum `100`

#### `POST /api/hermes/webhook`

Purpose:

- process a supported Resend webhook update

#### `POST /api/hermes/send`

Purpose:

- direct template send outside the event/rule flow

Accepted fields include:

- `templateId` or `templateSlug`
- `to`
- `variables`
- `event`
- `eventId`
- `ruleId`
- `metadata`

### 12.2 Admin endpoints

Implemented route groups include:

- `GET/POST /api/hermes/admin/templates`
- `PATCH /api/hermes/admin/templates/[id]`
- `GET/POST /api/hermes/admin/rules`
- `PATCH /api/hermes/admin/rules/[id]`
- `GET /api/hermes/admin/events`
- `GET /api/hermes/admin/events/[id]`
- `GET /api/hermes/admin/events/[id]/timeline`
- `GET /api/hermes/admin/scheduled-tasks`
- `GET /api/hermes/admin/scheduled-tasks/[id]`
- `GET /api/hermes/admin/delivery-logs`
- `GET /api/hermes/admin/delivery-logs/[id]`
- `GET /api/hermes/admin/summary`
- `POST /api/hermes/admin/review/events`
- `POST /api/hermes/admin/operations/process-due`
- `POST /api/hermes/admin/operations/bootstrap-examples`
- `POST /api/hermes/admin/operations/events/[id]/reprocess`
- `POST /api/hermes/admin/operations/events/bulk-reprocess`
- `POST /api/hermes/admin/operations/tasks/[id]/retry`
- `POST /api/hermes/admin/operations/tasks/bulk-retry`
- `POST /api/hermes/admin/operations/tasks/bulk-cancel`

## 13. Example Scenarios Installed by Admin Operations

The current implementation installs two idempotent scenarios through `installHermesExampleScenarios()`:

- `welcome_signup`
  - template slug: `example-welcome-signup`
  - rule name: `[Example] Welcome Signup Rule`
  - event type: `user.signup`

- `report_ready`
  - template slug: `example-report-ready`
  - rule name: `[Example] Report Ready Rule`
  - event type: `report.generated`

These are updated in place if they already exist.

## 14. Current Non-Goals and Gaps

The following should not be documented as present capabilities:

- persisted event-rule match history table
- implemented `LOOKUP` recipient execution
- implemented `GROUP` recipient execution
- full cron-based recurring processing engine
- full batching/aggregation engine
- fully enforced route-level admin authorization
- configuration versioning/diff and comprehensive audit history

## 15. Implementation Authority

If a discrepancy exists between this specification and external reference documentation, the following order of authority applies:

1. `supabase/migrations/20260312230000_add_hermes_platform.sql`
2. `lib/hermes/*`
3. `app/api/hermes/*`
4. `app/messaging/*`
5. `hermes-base` reference documentation
