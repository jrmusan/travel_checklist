#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, '../db/schema.sql')
const checkOnly = process.argv.includes('--check')

let sql
try {
  sql = fs.readFileSync(schemaPath, 'utf8')
} catch (err) {
  console.error('Could not read schema:', schemaPath, err)
  process.exit(1)
}

if (!sql.includes('CREATE TABLE IF NOT EXISTS teams')) {
  console.error('Schema file missing expected teams table DDL.')
  process.exit(1)
}

if (checkOnly) {
  console.log('Schema OK:', schemaPath)
  process.exit(0)
}

const connectionString = process.env.POSTGRES_URL
if (!connectionString) {
  console.error('Set POSTGRES_URL to your Postgres connection string.')
  process.exit(1)
}

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
