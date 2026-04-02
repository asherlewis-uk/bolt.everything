import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url().optional(),
  SESSION_COOKIE_NAME: z.string().default("bolt_everything_session"),
  APPLE_SERVICES_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
