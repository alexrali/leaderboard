import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const sql = readFileSync(join(__dirname, '..', 'supabase-schema.sql'), 'utf8')

// Supabase direct PostgreSQL connection (Transaction pooler - port 6543, or direct - port 5432)
const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.lwgaambqzakqvuvoacem',
  password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z2FhbWJxemFrcXZ1dm9hY2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMjcxNywiZXhwIjoyMDg3MDA4NzE3fQ.q0tAgVCK9LgFzjxmDF0ZwpJdqwtBZwG9-Pg3mZxGKqU',
  ssl: { rejectUnauthorized: false },
})

async function deploy() {
  console.log('Connecting to Supabase PostgreSQL...')
  await client.connect()
  console.log('Connected. Running schema DDL...')

  // Split on statement boundaries and run each separately to get clear error messages
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let ok = 0
  let skipped = 0
  for (const stmt of statements) {
    try {
      await client.query(stmt)
      ok++
      const label = stmt.slice(0, 60).replace(/\n/g, ' ')
      console.log(`  ✓ ${label}...`)
    } catch (err) {
      if (err.message.includes('already exists')) {
        skipped++
        const label = stmt.slice(0, 60).replace(/\n/g, ' ')
        console.log(`  ~ already exists, skipping: ${label}...`)
      } else {
        console.error(`  ✗ ERROR: ${err.message}`)
        console.error(`    Statement: ${stmt.slice(0, 120)}`)
      }
    }
  }

  console.log(`\nDone. ${ok} statements executed, ${skipped} already existed.`)
  await client.end()
}

deploy().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
