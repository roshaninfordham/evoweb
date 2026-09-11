import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

async function ensureSchema(sql: NeonQueryFunction<false, false>) {
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS evolutions (
      id BIGSERIAL PRIMARY KEY,
      slot_id TEXT NOT NULL,
      version INT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      reasoning TEXT NOT NULL DEFAULT '',
      code TEXT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS components (
      slot_id TEXT PRIMARY KEY,
      active_version INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function getDb() {
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL!);
  if (!schemaReady) schemaReady = ensureSchema(sqlClient);
  await schemaReady;
  return sqlClient;
}
