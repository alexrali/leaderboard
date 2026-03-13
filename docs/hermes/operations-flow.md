# Hermes Operations Flow

## 1. Purpose

This document describes the concrete operating flow for configuring, validating, executing, and supporting Hermes in the `leaderboard` application.

It is written for administrators, implementers, and support engineers.

## 2. Mental Model

Hermes should be operated with the following sequence in mind:

1. **Create a template**
   - Define the content to send.

2. **Create a rule**
   - Define when the template should be used, for whom, and on what schedule.

3. **Submit or preview an event**
   - Events are the trigger input.

4. **Let Hermes process the event**
   - Hermes matches rules and either sends immediately or creates a scheduled task.

5. **Monitor execution artifacts**
   - Event record
   - scheduled task
   - delivery logs
   - webhook updates

The most important conceptual rule is:

- **Templates do not trigger events.**
- **Rules do not generate events.**
- **Events enter the system first. Rules react to them. Templates render the resulting messages.**

## 3. Standard Configuration Workflow

### 3.1 Step 1: Create the template

Use:

- `/messaging/templates`
- `/messaging/templates/new`

Define:

- `name`
- `slug`
- `description`
- `subject`
- `html_content`
- `text_content`
- `variables`
- `default_values`
- `from_email`
- `from_name`
- `reply_to`
- `is_active`

Recommended practice:

- keep `slug` stable and descriptive
- define `variables` with `path` whenever the value should come from event payload data
- use `default_values` only for true fallbacks

### 3.2 Step 2: Create the rule

Use:

- `/messaging/rules`
- `/messaging/rules/new`

Define:

- `name`
- `event_type`
- `event_conditions`
- `schedule_type`
- `schedule_config`
- `timezone`
- `recipient_type`
- `recipient_config`
- `template_id`
- `priority`
- `is_active`

Recommended practice:

- use a precise `event_type`
- keep `priority` lower for more specific rules
- use `event_conditions` to gate execution, not to encode all business logic into the event name
- prefer `DYNAMIC` recipients when the target recipient is already in the payload
- use `CONDITIONAL` recipients when escalation or fallback behavior is required

## 4. Validation Workflow Before Live Usage

### 4.1 Review mode

Use:

- `/messaging/review`
- `POST /api/hermes/admin/review/events`

Supported modes:

- `preview`
- `process`

#### `preview`

Use when you want to validate:

- event format
- rule matching
- condition results
- extracted data
- recipient resolution
- subject rendering
- potential render errors

This mode does not persist a production event.

#### `process`

Use when you want to execute the actual runtime path:

- event persistence
- rule execution
- task creation or delivery attempts
- timeline generation

### 4.2 What to inspect in review

Before promoting a new rule/template combination, confirm:

- the intended rule matched
- unexpected rules did not match
- all conditions passed for the intended reason
- recipients resolved correctly
- the rendered subject is correct
- no render error is present
- delayed rules create the expected future `scheduled_for` time

## 5. Live Event Processing Flow

### 5.1 Ingress path

Production or internal systems submit to:

- `POST /api/hermes/events`

Required shape:

```json
{
  "type": "namespace.action",
  "source": "api",
  "payload": {},
  "externalId": "optional-dedup-key",
  "metadata": {}
}
```

### 5.2 Runtime behavior

When an event is accepted:

1. Hermes stores the event in `hermes_events`.
2. Hermes evaluates all active matching rules.
3. For each matched rule:
   - `IMMEDIATE` sends now.
   - any other schedule type creates a row in `hermes_scheduled_tasks`.
4. Hermes stores outcomes and errors on the event record.

### 5.3 What gets created

Depending on the rule, the following artifacts can appear:

- `hermes_events`
- `hermes_scheduled_tasks`
- `hermes_delivery_logs`
- `hermes_webhook_events`

## 6. Scheduled Task Flow

### 6.1 When tasks are created

Tasks are created when a matched rule uses:

- `DELAYED`
- `SCHEDULED`
- `RECURRING`
- `BATCHED`

### 6.2 How tasks are executed

Tasks are executed by:

- `POST /api/hermes/process-due`
- `POST /api/hermes/admin/operations/process-due`

Operational model:

1. load due tasks where `status` is `PENDING` or `RETRYING`
2. rehydrate the execution context
3. attempt delivery
4. mark task `COMPLETED`, `RETRYING`, or `FAILED`

### 6.3 Retry behavior

If a task fails:

- `retry_count` is incremented
- `next_retry_at` is computed using exponential backoff
- task moves to `RETRYING`
- once retries are exhausted, task becomes `FAILED`

## 7. Delivery and Webhook Flow

### 7.1 Delivery creation

For each resolved recipient, Hermes attempts delivery and inserts a row into `hermes_delivery_logs`.

Initial states typically become:

- `SENT` on success
- `FAILED` on send error

### 7.2 Status progression

Resend webhook events update delivery rows to later states such as:

- `DELIVERED`
- `OPENED`
- `CLICKED`
- `BOUNCED`
- `UNSUBSCRIBED`

### 7.3 Webhook intake

Webhook ingestion route:

- `POST /api/hermes/webhook`

Operator expectation:

- if the Resend webhook is wired correctly, delivery logs should progress after send
- the raw webhook payload is stored in `hermes_webhook_events`

## 8. Admin Operating Surfaces

### 8.1 Summary and monitoring

Use:

- `/messaging`
- `/api/hermes/admin/summary`

Watch:

- active templates and rules
- pending and failed events
- pending and retrying tasks
- sent and failed deliveries today

### 8.2 Detailed inspection

Use:

- `/messaging/events`
- `/messaging/events/[id]`
- `/messaging/events/[id]/timeline`
- `/messaging/tasks`
- `/messaging/tasks/[id]`
- `/messaging/delivery`
- `/messaging/delivery/[id]`

Use these views to answer:

- which rule matched
- which conditions passed or failed
- whether recipients resolved correctly
- whether a task was created
- whether delivery succeeded
- whether webhook feedback arrived

### 8.3 Operations panel

Use:

- `/messaging/operations`

This page provides:

- operational context
- recent config changes
- recent incidents
- example scenario installation
- manual process-due execution
- bulk event/task operations

## 9. Example Installation Flow

Example scenarios are installed through:

- `POST /api/hermes/admin/operations/bootstrap-examples`
- UI trigger in `/messaging/operations`

Current installed scenarios:

- `welcome_signup`
- `report_ready`

Behavior:

- templates are upserted by `slug`
- rules are upserted by `name`
- installation is idempotent

Recommended use:

1. install examples
2. open `/messaging/operations`
3. copy one of the sample event payloads
4. paste it into `/messaging/review`
5. run preview first
6. run process second
7. inspect the timeline and resulting records

## 10. Real Operating Sequence for New Integrations

When integrating a real business flow into Hermes, use this sequence:

### 10.1 Define the event contract

Example:

- `report.generated`
- `user.signup`
- `invoice.overdue`

Be explicit about the payload fields the rule and template will consume.

### 10.2 Build the template

Ensure the template variables map to real payload paths.

Example:

- `report.name`
- `requester.email`
- `user.name`

### 10.3 Build the rule

Use the smallest necessary logic:

- event type
- conditions
- schedule
- recipient mapping
- template selection

### 10.4 Validate in review mode

Do not rely on assumptions.

Check:

- conditions
- recipients
- rendered output
- schedule result

### 10.5 Promote to live event emission

Only after preview and process validation should the producing application submit events to `/api/hermes/events`.

## 11. Troubleshooting Guide

### 11.1 Event accepted but nothing sent

Check:

- did any rule match the event type
- did all conditions pass
- is the rule active
- does the rule reference a valid template
- did recipient resolution produce at least one recipient

### 11.2 Event completed but no immediate delivery exists

Possible causes:

- the matched rule created a scheduled task instead of sending immediately
- the rule had no valid recipients
- rendering failed
- delivery failed for all recipients

Check:

- event timeline
- task list
- delivery logs

### 11.3 Scheduled task remains pending

Check:

- `scheduled_for`
- whether `process-due` has been executed
- whether the task is still in the future

### 11.4 Task keeps retrying

Check:

- sender configuration
- Resend API key
- template sender email validity
- recipient validity
- last stored `result.error`

### 11.5 Delivery log never moves past `SENT`

Check:

- Resend webhook configuration
- `POST /api/hermes/webhook` reachability
- presence of `hermes_webhook_events`
- matching `resend_id` in `hermes_delivery_logs`

### 11.6 Example bootstrap fails

Check:

- Hermes schema was applied to Supabase
- all Hermes tables exist
- the bootstrap route can read the current user

## 12. Current Operational Caveats

Operators should be aware of the following implementation realities:

- `LOOKUP` and `GROUP` recipient types are not executable yet.
- recurring and batched scheduling are not full-featured engines yet.
- admin route authorization should be treated as a hardening area.
- direct send uses a different path from the event/rule pipeline and should be used deliberately.

## 13. Recommended Safe Usage Pattern

For routine administration, use this order:

1. configure template
2. configure rule
3. preview in review mode
4. process a controlled test event
5. verify timeline and logs
6. enable or keep the rule active for production
7. monitor `/messaging/operations` and delivery/task views

This is the safest way to manage Hermes without bypassing its designed operational visibility.
