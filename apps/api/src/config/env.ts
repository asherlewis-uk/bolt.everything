import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url().optional(),
  SESSION_COOKIE_NAME: z.string().default("bolt_session"),
  SESSION_SECRET: z.string().optional(),
  APPLE_SERVICES_ID: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

// In production all secrets must be present. Fail fast at startup if they are missing.
function parseEnv() {
  const base = baseSchema.parse(process.env);

  if (base.NODE_ENV === "production") {
    const productionSchema = baseSchema.extend({
      DATABASE_URL: z.string().url(),
      SESSION_SECRET: z.string().min(32),
      APPLE_SERVICES_ID: z.string().min(1),
    });
    return productionSchema.parse(process.env);
  }

  return base;
}

export const env = parseEnv();
