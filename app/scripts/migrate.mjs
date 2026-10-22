#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, '../db/schema.sql')

const connectionString = process.env.POSTGRES_URL
if (!connectionString) {
  console.error('Set POSTGRES_URL to your Postgres connection string.')
  process.exit(1)
}

const sql = fs.readFileSync(schemaPath, 'utf8')
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  console.log('Migration complete: teams + team_trip_state')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
} finally {
  await client.end()
}
