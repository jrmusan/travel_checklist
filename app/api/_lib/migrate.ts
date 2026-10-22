import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@vercel/postgres'

const SCHEMA_RELATIVE = path.join('db', 'schema.sql')

/** Idempotent DDL from db/schema.sql (CREATE … IF NOT EXISTS). */
export function readSchemaSql(): string {
  const schemaPath = path.join(process.cwd(), SCHEMA_RELATIVE)
  return fs.readFileSync(schemaPath, 'utf8')
}

export async function runSchemaMigration(): Promise<void> {
  const ddl = readSchemaSql()
  const client = createClient()
  try {
    await client.connect()
    await client.query(ddl)
  } finally {
    await client.end()
  }
}
