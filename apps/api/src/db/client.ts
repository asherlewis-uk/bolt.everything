import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../config/env.js";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDatabaseClient(): ReturnType<typeof drizzle> | null {
  if (!env.DATABASE_URL) return null;

  if (!db) {
    pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
    db = drizzle(pool);
  }

  return db;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
