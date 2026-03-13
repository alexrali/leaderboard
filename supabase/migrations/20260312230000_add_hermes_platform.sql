-- Hermes Messaging Platform (additive, isolated namespace)

create table if not exists hermes_templates (
  id             uuid primary key default gen_random_uuid(),
  name           varchar(255) not null,
  slug           varchar(100) not null unique,
  description    text,
  subject        varchar(500) not null,
  html_content   text not null,
  text_content   text,
  variables      jsonb not null default '[]'::jsonb,
  default_values jsonb not null default '{}'::jsonb,
  from_email     varchar(255),
  from_name      varchar(255),
  reply_to       varchar(255),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_hermes_templates_slug on hermes_templates (slug);
create index if not exists idx_hermes_templates_active on hermes_templates (is_active);

create table if not exists hermes_rules (
  id                uuid primary key default gen_random_uuid(),
  name              varchar(255) not null,
  description       text,
  event_type        varchar(255) not null,
  event_conditions  jsonb not null default '[]'::jsonb,
  schedule_type     varchar(50) not null default 'IMMEDIATE',
  schedule_config   jsonb not null default '{}'::jsonb,
  timezone          varchar(100) not null default 'UTC',
  recipient_type    varchar(50) not null default 'STATIC',
  recipient_config  jsonb not null default '{}'::jsonb,
  template_id       uuid references hermes_templates(id) on delete set null,
  priority          integer not null default 100,
  is_active         boolean not null default true,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint hermes_rules_schedule_type_chk check (
    schedule_type in ('IMMEDIATE', 'DELAYED', 'SCHEDULED', 'RECURRING', 'BATCHED')
  ),
  constraint hermes_rules_recipient_type_chk check (
    recipient_type in ('STATIC', 'DYNAMIC', 'LOOKUP', 'GROUP', 'CONDITIONAL')
  )
);

create index if not exists idx_hermes_rules_event_type on hermes_rules (event_type);
create index if not exists idx_hermes_rules_active on hermes_rules (is_active);
create index if not exists idx_hermes_rules_priority on hermes_rules (priority);

create table if not exists hermes_events (
  id            uuid primary key default gen_random_uuid(),
  type          varchar(255) not null,
  source        varchar(50) not null,
  external_id   varchar(255),
  payload       jsonb not null default '{}'::jsonb,
  metadata      jsonb not null default '{}'::jsonb,
  status        varchar(50) not null default 'PENDING',
  processed_at  timestamptz,
  error_message text,
  retry_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint hermes_events_source_chk check (source in ('webhook', 'cron', 'api', 'queue')),
  constraint hermes_events_status_chk check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  constraint hermes_events_source_external_id_key unique (source, external_id)
);

create index if not exists idx_hermes_events_type on hermes_events (type);
create index if not exists idx_hermes_events_status on hermes_events (status);
create index if not exists idx_hermes_events_created_at on hermes_events (created_at desc);

create table if not exists hermes_scheduled_tasks (
  id            uuid primary key default gen_random_uuid(),
  rule_id       uuid not null references hermes_rules(id) on delete cascade,
  event_id      uuid references hermes_events(id) on delete cascade,
  event_data    jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  processed_at  timestamptz,
  status        varchar(50) not null default 'PENDING',
  result        jsonb,
  retry_count   integer not null default 0,
  max_retries   integer not null default 3,
  next_retry_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint hermes_scheduled_tasks_status_chk check (
    status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING')
  )
);

create index if not exists idx_hermes_scheduled_tasks_status on hermes_scheduled_tasks (status);
create index if not exists idx_hermes_scheduled_tasks_scheduled_for on hermes_scheduled_tasks (scheduled_for);
create index if not exists idx_hermes_scheduled_tasks_rule_id on hermes_scheduled_tasks (rule_id);

create table if not exists hermes_delivery_logs (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references hermes_events(id) on delete set null,
  rule_id         uuid references hermes_rules(id) on delete set null,
  user_id         uuid references auth.users(id) on delete set null,
  template_id     uuid references hermes_templates(id) on delete set null,
  recipient_email varchar(255) not null,
  recipient_name  varchar(255),
  subject         varchar(500),
  resend_id       varchar(255),
  resend_status   varchar(50),
  status          varchar(50) not null default 'QUEUED',
  error_message   text,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  constraint hermes_delivery_logs_status_chk check (
    status in ('QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED')
  )
);

create index if not exists idx_hermes_delivery_logs_recipient_email on hermes_delivery_logs (recipient_email);
create index if not exists idx_hermes_delivery_logs_status on hermes_delivery_logs (status);
create index if not exists idx_hermes_delivery_logs_sent_at on hermes_delivery_logs (sent_at desc);

create table if not exists hermes_webhook_events (
  id           uuid primary key default gen_random_uuid(),
  resend_id    varchar(255) not null,
  event_type   varchar(50) not null,
  data         jsonb not null,
  processed    boolean not null default false,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  constraint hermes_webhook_events_type_chk check (
    event_type in ('email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained')
  )
);

create index if not exists idx_hermes_webhook_events_resend_id on hermes_webhook_events (resend_id);
create index if not exists idx_hermes_webhook_events_processed on hermes_webhook_events (processed);

alter table hermes_templates enable row level security;
alter table hermes_rules enable row level security;
alter table hermes_events enable row level security;
alter table hermes_scheduled_tasks enable row level security;
alter table hermes_delivery_logs enable row level security;
alter table hermes_webhook_events enable row level security;

drop policy if exists "service_full_hermes_templates" on hermes_templates;
create policy "service_full_hermes_templates" on hermes_templates
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_full_hermes_rules" on hermes_rules;
create policy "service_full_hermes_rules" on hermes_rules
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_full_hermes_events" on hermes_events;
create policy "service_full_hermes_events" on hermes_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_full_hermes_scheduled_tasks" on hermes_scheduled_tasks;
create policy "service_full_hermes_scheduled_tasks" on hermes_scheduled_tasks
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_full_hermes_delivery_logs" on hermes_delivery_logs;
create policy "service_full_hermes_delivery_logs" on hermes_delivery_logs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_full_hermes_webhook_events" on hermes_webhook_events;
create policy "service_full_hermes_webhook_events" on hermes_webhook_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function update_hermes_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hermes_templates_updated_at on hermes_templates;
create trigger hermes_templates_updated_at
  before update on hermes_templates
  for each row execute procedure update_hermes_updated_at_column();

drop trigger if exists hermes_rules_updated_at on hermes_rules;
create trigger hermes_rules_updated_at
  before update on hermes_rules
  for each row execute procedure update_hermes_updated_at_column();

drop trigger if exists hermes_events_updated_at on hermes_events;
create trigger hermes_events_updated_at
  before update on hermes_events
  for each row execute procedure update_hermes_updated_at_column();

drop trigger if exists hermes_scheduled_tasks_updated_at on hermes_scheduled_tasks;
create trigger hermes_scheduled_tasks_updated_at
  before update on hermes_scheduled_tasks
  for each row execute procedure update_hermes_updated_at_column();
