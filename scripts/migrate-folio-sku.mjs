import pg from "pg";
const { Client } = pg;
const PASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z2FhbWJxemFrcXZ1dm9hY2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMjcxNywiZXhwIjoyMDg3MDA4NzE3fQ.q0tAgVCK9LgFzjxmDF0ZwpJdqwtBZwG9-Pg3mZxGKqU";
const CONFIGS = [
  {
    "label": "Transaction pooler 6543",
    "host": "aws-0-us-east-1.pooler.supabase.com",
    "port": 6543,
    "user": "postgres.lwgaambqzakqvuvoacem"
  },
  {
    "label": "Session pooler 5432",
    "host": "aws-0-us-east-1.pooler.supabase.com",
    "port": 5432,
    "user": "postgres.lwgaambqzakqvuvoacem"
  },
  {
    "label": "Direct DB 5432",
    "host": "db.lwgaambqzakqvuvoacem.supabase.co",
    "port": 5432,
    "user": "postgres"
  }
];
const STMTS = [
  {
    "n": 1,
    "label": "Create table performance_folio_sku",
    "sql": "CREATE TABLE IF NOT EXISTS performance_folio_sku (\n    id BIGSERIAL PRIMARY KEY,\n    worker_key VARCHAR(50) REFERENCES workers(worker_key),\n    worker_name VARCHAR(200) NOT NULL,\n    date DATE NOT NULL,\n    hour_bucket TIMESTAMP NOT NULL,\n    folio VARCHAR(10) NOT NULL,\n    item_code VARCHAR(50) NOT NULL,\n    total_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,\n    total_weight_kg DECIMAL(12,3) NOT NULL DEFAULT 0,\n    total_volume_m3 DECIMAL(12,3) NOT NULL DEFAULT 0,\n    total_ue DECIMAL(12,3) NOT NULL DEFAULT 0,\n    created_at TIMESTAMP DEFAULT NOW(),\n    UNIQUE(worker_key, date, hour_bucket, folio, item_code)\n)"
  },
  {
    "n": 2,
    "label": "Index idx_folio_sku_worker_date",
    "sql": "CREATE INDEX IF NOT EXISTS idx_folio_sku_worker_date ON performance_folio_sku(worker_key, date)"
  },
  {
    "n": 3,
    "label": "Index idx_folio_sku_date",
    "sql": "CREATE INDEX IF NOT EXISTS idx_folio_sku_date ON performance_folio_sku(date DESC)"
  },
  {
    "n": 4,
    "label": "Index idx_folio_sku_folio",
    "sql": "CREATE INDEX IF NOT EXISTS idx_folio_sku_folio ON performance_folio_sku(folio)"
  },
  {
    "n": 5,
    "label": "Enable RLS",
    "sql": "ALTER TABLE performance_folio_sku ENABLE ROW LEVEL SECURITY"
  },
  {
    "n": 6,
    "label": "Policy public_read_folio_sku",
    "sql": "CREATE POLICY \"public_read_folio_sku\" ON performance_folio_sku FOR SELECT USING (true)"
  },
  {
    "n": 7,
    "label": "Policy service_full_folio_sku",
    "sql": "CREATE POLICY \"service_full_folio_sku\" ON performance_folio_sku FOR ALL USING (auth.role() = 'service_role')"
  },
  {
    "n": 8,
    "label": "View worker_daily_sku_summary",
    "sql": "CREATE OR REPLACE VIEW worker_daily_sku_summary AS\nSELECT\n    worker_key,\n    worker_name,\n    date,\n    COUNT(DISTINCT folio)::INT     AS folios_completed,\n    COUNT(DISTINCT item_code)::INT AS distinct_skus,\n    SUM(total_quantity)            AS total_quantity,\n    SUM(total_weight_kg)           AS total_weight_kg,\n    SUM(total_volume_m3)           AS total_volume_m3,\n    SUM(total_ue)                  AS total_ue\nFROM performance_folio_sku\nGROUP BY worker_key, worker_name, date"
  },
  {
    "n": 9,
    "label": "View worker_weekly_sku_summary",
    "sql": "CREATE OR REPLACE VIEW worker_weekly_sku_summary AS\nSELECT\n    worker_key,\n    worker_name,\n    EXTRACT(ISOYEAR FROM date)::INT AS year,\n    EXTRACT(WEEK  FROM date)::INT   AS week_number,\n    COUNT(DISTINCT folio)::INT      AS folios_completed,\n    COUNT(DISTINCT item_code)::INT  AS distinct_skus,\n    SUM(total_quantity)             AS total_quantity,\n    SUM(total_weight_kg)            AS total_weight_kg,\n    SUM(total_volume_m3)            AS total_volume_m3,\n    SUM(total_ue)                   AS total_ue\nFROM performance_folio_sku\nGROUP BY worker_key, worker_name, EXTRACT(ISOYEAR FROM date)::INT, EXTRACT(WEEK FROM date)::INT"
  }
];

async function getClient() {
  const pw = process.env.DB_PASSWORD || PASSWORD;
  for (const cfg of CONFIGS) {
    const c = new Client({ host:cfg.host, port:cfg.port, database:"postgres", user:cfg.user, password:pw, ssl:{rejectUnauthorized:false}, connectionTimeoutMillis:10000 });
    try { await c.connect(); console.log("Connected via:", cfg.label); return c; }
    catch(e) { console.log("  [try]", cfg.label, "=>", e.message); try{await c.end()}catch{} }
  }
  throw new Error("All connection configs failed. Provide DB_PASSWORD=<pw> node scripts/migrate-folio-sku.mjs");
}

async function migrate() {
  console.log("Connecting to Supabase PostgreSQL...");
  const client = await getClient();
  console.log("");
  let ok=0, skipped=0, errors=0;
  for (const {n, label, sql} of STMTS) {
    try {
      await client.query(sql);
      ok++;
      console.log("  OK   Statement", n, "-", label);
    } catch(err) {
      if (err.message.includes("already exists")) {
        skipped++;
        console.log("  SKIP Statement", n, "-", label);
        console.log("       ("+err.message+")");
      } else {
        errors++;
        console.error("  ERR  Statement", n, "-", label);
        console.error("       "+err.message);
      }
    }
  }
  console.log("\nDone.", ok, "succeeded,", skipped, "already existed,", errors, "errors.");
  await client.end();
}

migrate().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
