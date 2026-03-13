-- ============================================================
-- SIM-PCR Leaderboard - Supabase Schema DDL
-- Run this in the Supabase SQL Editor (project: lwgaambqzakqvuvoacem)
-- ============================================================

-- ─── Master Data ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workers (
    worker_key VARCHAR(50) PRIMARY KEY,
    worker_name VARCHAR(200) NOT NULL,
    avatar_initials VARCHAR(10),
    role VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(is_active);

COMMENT ON TABLE workers IS 'Worker master data (from gdsurtidores)';
COMMENT ON COLUMN workers.worker_key IS 'Unique worker identifier from ERP (gdsurtidores.c1)';
COMMENT ON COLUMN workers.avatar_initials IS 'Initials for avatar display (e.g., "JP" for Juan Pérez)';

-- ─── Fact Table: Hourly ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_hourly (
    id BIGSERIAL PRIMARY KEY,
    worker_key VARCHAR(50) REFERENCES workers(worker_key),
    worker_name VARCHAR(200) NOT NULL,
    hour_bucket TIMESTAMP NOT NULL,
    date DATE NOT NULL,
    week_number INT NOT NULL,
    year INT NOT NULL,

    total_ue DECIMAL(12,3) NOT NULL,
    routes_completed INT NOT NULL,
    items_processed INT NOT NULL,
    total_quantity DECIMAL(12,2) NOT NULL,
    total_weight_kg DECIMAL(12,3) NOT NULL,
    total_volume_m3 DECIMAL(12,3) NOT NULL,
    transactions INT NOT NULL,

    ue_per_hour DECIMAL(12,3),

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(worker_key, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_perf_hourly_worker_date ON performance_hourly(worker_key, date);
CREATE INDEX IF NOT EXISTS idx_perf_hourly_date ON performance_hourly(date DESC);
CREATE INDEX IF NOT EXISTS idx_perf_hourly_hour ON performance_hourly(hour_bucket DESC);

COMMENT ON TABLE performance_hourly IS 'Worker performance aggregated by hour (primary fact table)';
COMMENT ON COLUMN performance_hourly.hour_bucket IS 'Start of hour (e.g., 2026-02-18 14:00:00)';
COMMENT ON COLUMN performance_hourly.total_ue IS 'Sum of all UE earned during this hour';
COMMENT ON COLUMN performance_hourly.ue_per_hour IS 'Efficiency metric: total_ue / 1 hour';

-- ─── Fact Table: Daily ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_daily (
    id BIGSERIAL PRIMARY KEY,
    worker_key VARCHAR(50) REFERENCES workers(worker_key),
    worker_name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    week_number INT NOT NULL,
    year INT NOT NULL,

    total_ue DECIMAL(12,3) NOT NULL,
    routes_completed INT NOT NULL,
    items_processed INT NOT NULL,
    total_quantity DECIMAL(12,2) NOT NULL,
    total_weight_kg DECIMAL(12,3) NOT NULL,
    total_volume_m3 DECIMAL(12,3) NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,

    ue_per_hour DECIMAL(12,3),
    ue_per_route DECIMAL(12,3),
    efficiency_score INT,

    daily_rank INT,
    hit_target BOOLEAN DEFAULT false,
    current_streak INT DEFAULT 0,
    trend VARCHAR(10),
    trend_percentage DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(worker_key, date)
);

CREATE INDEX IF NOT EXISTS idx_perf_daily_worker ON performance_daily(worker_key, date DESC);
CREATE INDEX IF NOT EXISTS idx_perf_daily_date ON performance_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_perf_daily_rank ON performance_daily(date, daily_rank);

COMMENT ON TABLE performance_daily IS 'Worker performance aggregated by day';
COMMENT ON COLUMN performance_daily.efficiency_score IS 'Percentile rank of ue_per_hour (0-100, 100 is best)';
COMMENT ON COLUMN performance_daily.daily_rank IS 'Ranking for this day (1 is best)';
COMMENT ON COLUMN performance_daily.hit_target IS 'True if worker met daily UE target';
COMMENT ON COLUMN performance_daily.current_streak IS 'Consecutive days hitting target up to this date';
COMMENT ON COLUMN performance_daily.trend IS 'Performance trend vs previous day: up, down, stable';

-- ─── Fact Table: Weekly ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_weekly (
    id BIGSERIAL PRIMARY KEY,
    worker_key VARCHAR(50) REFERENCES workers(worker_key),
    worker_name VARCHAR(200) NOT NULL,
    week_number INT NOT NULL,
    year INT NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,

    total_ue DECIMAL(12,3) NOT NULL,
    routes_completed INT NOT NULL,
    items_processed INT NOT NULL,
    total_quantity DECIMAL(12,2) NOT NULL,
    total_weight_kg DECIMAL(12,3) NOT NULL,
    total_volume_m3 DECIMAL(12,3) NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    days_worked INT NOT NULL,

    avg_ue_per_day DECIMAL(12,3),
    avg_ue_per_hour DECIMAL(12,3),
    efficiency_score INT,

    weekly_rank INT,
    current_streak INT DEFAULT 0,

    trend VARCHAR(10),
    trend_percentage DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(worker_key, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_perf_weekly_worker ON performance_weekly(worker_key, year, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_perf_weekly_week ON performance_weekly(year DESC, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_perf_weekly_rank ON performance_weekly(year, week_number, weekly_rank);

COMMENT ON TABLE performance_weekly IS 'Worker performance aggregated by week';
COMMENT ON COLUMN performance_weekly.current_streak IS 'Consecutive days hitting target this week';
COMMENT ON COLUMN performance_weekly.trend IS 'Performance trend vs previous week: up, down, stable';

-- ─── Team Table: Hourly ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_performance_hourly (
    id BIGSERIAL PRIMARY KEY,
    hour_bucket TIMESTAMP NOT NULL UNIQUE,
    date DATE NOT NULL,

    team_total_ue DECIMAL(12,3) NOT NULL,
    active_workers INT NOT NULL,
    total_routes_completed INT NOT NULL,
    total_items_processed INT NOT NULL,

    avg_ue_per_worker DECIMAL(12,3),
    avg_routes_per_worker DECIMAL(8,2),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_hourly_date ON team_performance_hourly(date DESC);
CREATE INDEX IF NOT EXISTS idx_team_hourly_hour ON team_performance_hourly(hour_bucket DESC);

COMMENT ON TABLE team_performance_hourly IS 'Team-level performance aggregated by hour';

-- ─── Team Table: Daily ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_performance_daily (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    week_number INT NOT NULL,
    year INT NOT NULL,

    team_total_ue DECIMAL(12,3) NOT NULL,
    active_workers INT NOT NULL,
    total_routes_completed INT NOT NULL,
    total_items_processed INT NOT NULL,
    total_hours_worked DECIMAL(8,2) NOT NULL,

    avg_ue_per_worker DECIMAL(12,3),
    avg_ue_per_hour DECIMAL(12,3),
    team_efficiency_score INT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_daily_date ON team_performance_daily(date DESC);

COMMENT ON TABLE team_performance_daily IS 'Team-level performance aggregated by day';

-- ─── Team Table: Weekly ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_performance_weekly (
    id BIGSERIAL PRIMARY KEY,
    year INT NOT NULL,
    week_number INT NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,

    team_total_ue DECIMAL(12,3) NOT NULL,
    active_workers INT NOT NULL,
    total_routes_completed INT NOT NULL,
    total_items_processed INT NOT NULL,
    total_hours_worked DECIMAL(8,2) NOT NULL,

    avg_ue_per_worker DECIMAL(12,3),
    avg_ue_per_day DECIMAL(12,3),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_team_weekly_week ON team_performance_weekly(year DESC, week_number DESC);

COMMENT ON TABLE team_performance_weekly IS 'Team-level performance aggregated by week';

-- ─── Leaderboards Table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leaderboards (
    id BIGSERIAL PRIMARY KEY,
    leaderboard_type VARCHAR(50) NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    period_date DATE NOT NULL,
    worker_key VARCHAR(50) REFERENCES workers(worker_key),
    worker_name VARCHAR(200),

    rank INT NOT NULL,
    score DECIMAL(12,3) NOT NULL,
    metric_value DECIMAL(12,3),

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(leaderboard_type, period_date, worker_key)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON leaderboards(leaderboard_type, period_date DESC, rank);

COMMENT ON TABLE leaderboards IS 'Multiple leaderboard types (UE, efficiency, volume, etc.)';
COMMENT ON COLUMN leaderboards.leaderboard_type IS 'Type: daily_ue, weekly_ue, efficiency, volume, routes';
COMMENT ON COLUMN leaderboards.score IS 'Primary score for ranking';
COMMENT ON COLUMN leaderboards.metric_value IS 'Additional metric for display';

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboard frontend (anon key)
CREATE POLICY "public_read_workers" ON workers FOR SELECT USING (true);
CREATE POLICY "public_read_perf_daily" ON performance_daily FOR SELECT USING (true);
CREATE POLICY "public_read_perf_weekly" ON performance_weekly FOR SELECT USING (true);
CREATE POLICY "public_read_perf_hourly" ON performance_hourly FOR SELECT USING (true);
CREATE POLICY "public_read_team_hourly" ON team_performance_hourly FOR SELECT USING (true);
CREATE POLICY "public_read_team_daily" ON team_performance_daily FOR SELECT USING (true);
CREATE POLICY "public_read_team_weekly" ON team_performance_weekly FOR SELECT USING (true);
CREATE POLICY "public_read_leaderboards" ON leaderboards FOR SELECT USING (true);

-- Service role full access (for Airflow ETL)
CREATE POLICY "service_full_perf_hourly" ON performance_hourly FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_perf_daily" ON performance_daily FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_perf_weekly" ON performance_weekly FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_team_hourly" ON team_performance_hourly FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_team_daily" ON team_performance_daily FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_team_weekly" ON team_performance_weekly FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_leaderboards" ON leaderboards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_workers" ON workers FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- performance_folio_sku  (added 2026-02-20)
-- Grain: worker × date × hour_bucket × folio × item_code
-- Enables accurate COUNT(DISTINCT) in views without double-counting
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_folio_sku (
    id             BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    worker_key     VARCHAR(50)   NOT NULL,
    date           DATE          NOT NULL,
    week_number    INT           NOT NULL,
    year           INT           NOT NULL,
    hour_bucket    TIMESTAMP     NOT NULL,
    folio          VARCHAR(10)   NOT NULL,
    item_code      VARCHAR(20)   NOT NULL,
    quantity       DECIMAL(12,3) NOT NULL DEFAULT 0,
    total_weight   DECIMAL(12,3) NOT NULL DEFAULT 0,
    total_volume   DECIMAL(12,6) NOT NULL DEFAULT 0,
    ue             DECIMAL(12,3) NOT NULL DEFAULT 0,
    CONSTRAINT uq_pfs_grain UNIQUE (worker_key, date, hour_bucket, folio, item_code)
);

CREATE INDEX IF NOT EXISTS idx_pfs_worker_date ON performance_folio_sku (worker_key, date);
CREATE INDEX IF NOT EXISTS idx_pfs_date        ON performance_folio_sku (date);
CREATE INDEX IF NOT EXISTS idx_pfs_week        ON performance_folio_sku (year, week_number);

ALTER TABLE performance_folio_sku ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_pfs"
    ON performance_folio_sku
    FOR SELECT
    USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Views
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW worker_daily_sku_summary AS
SELECT
    worker_key,
    date,
    COUNT(DISTINCT folio)     AS folios_completed,
    COUNT(DISTINCT item_code) AS distinct_skus,
    SUM(quantity)             AS total_quantity,
    SUM(total_weight)         AS total_weight_kg,
    SUM(total_volume)         AS total_volume_m3
FROM performance_folio_sku
GROUP BY worker_key, date;

CREATE OR REPLACE VIEW worker_weekly_sku_summary AS
SELECT
    worker_key,
    week_number,
    year,
    COUNT(DISTINCT folio)     AS folios_completed,
    COUNT(DISTINCT item_code) AS distinct_skus,
    SUM(quantity)             AS total_quantity,
    SUM(total_weight)         AS total_weight_kg,
    SUM(total_volume)         AS total_volume_m3
FROM performance_folio_sku
GROUP BY worker_key, week_number, year;

-- ─── Sample Data (optional - remove before production) ───────────────────────
-- Uncomment to seed test workers and verify the leaderboard UI:
--
-- INSERT INTO workers (worker_key, worker_name, avatar_initials, role, is_active) VALUES
--   ('W001', 'Juan Pérez', 'JP', 'Surtidor', true),
--   ('W002', 'María López', 'ML', 'Surtidor', true),
--   ('W003', 'Carlos Ramírez', 'CR', 'Surtidor', true),
--   ('W004', 'Ana García', 'AG', 'Surtidor', true),
--   ('W005', 'Luis Hernández', 'LH', 'Surtidor', true)
-- ON CONFLICT (worker_key) DO NOTHING;
--
-- INSERT INTO performance_daily (worker_key, worker_name, date, week_number, year,
--   total_ue, routes_completed, items_processed, total_quantity, total_weight_kg,
--   total_volume_m3, hours_worked, ue_per_hour, efficiency_score, daily_rank,
--   hit_target, current_streak, trend, trend_percentage)
-- VALUES
--   ('W001','Juan Pérez',     CURRENT_DATE, EXTRACT(WEEK FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 312.5, 18, 420, 420, 1260.0, 8.4, 7.5, 41.67, 95, 1, true, 5, 'up',   8.2),
--   ('W002','María López',    CURRENT_DATE, EXTRACT(WEEK FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 287.3, 16, 390, 390, 1170.0, 7.8, 7.2, 39.90, 88, 2, true, 3, 'up',   4.1),
--   ('W003','Carlos Ramírez', CURRENT_DATE, EXTRACT(WEEK FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 265.0, 15, 360, 360, 1080.0, 7.2, 7.0, 37.86, 82, 3, true, 2, 'stable', 0.5),
--   ('W004','Ana García',     CURRENT_DATE, EXTRACT(WEEK FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 241.8, 14, 330, 330,  990.0, 6.6, 6.8, 35.56, 74, 4, true, 1, 'down', 3.2),
--   ('W005','Luis Hernández', CURRENT_DATE, EXTRACT(WEEK FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 198.2, 12, 280, 280,  840.0, 5.6, 6.5, 30.49, 61, 5, false,0, 'down', 7.8)
-- ON CONFLICT (worker_key, date) DO NOTHING;

-- ─── User Settings (local-first, device-keyed) ───────────────────────────────

create table if not exists user_settings (
  id          text primary key,           -- stable device UUID from localStorage
  profile     jsonb not null default '{}',
  appearance  jsonb not null default '{}',
  preferences jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on upsert
create or replace function update_user_settings_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute procedure update_user_settings_timestamp();

-- Enable Row Level Security on user_settings
alter table user_settings enable row level security;

create policy "allow_read_user_settings" on user_settings
  for select using (true);

create policy "allow_insert_user_settings" on user_settings
  for insert with check (true);

create policy "allow_update_user_settings" on user_settings
  for update using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Hermes Messaging Platform (additive, isolated namespace)
-- ─────────────────────────────────────────────────────────────────────────────

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
