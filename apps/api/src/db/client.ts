import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../config/env.js";

let pool: Pool | null = null;

export function getDatabaseClient() {
  if (!env.DATABASE_URL) {
    return null;
  }

  pool ??= new Pool({
    connectionString: env.DATABASE_URL,
  });

  return drizzle(pool);
}
