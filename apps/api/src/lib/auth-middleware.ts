/**
 * Session authentication middleware for Fastify.
 *
 * Reads the signed session cookie, validates it is non-empty, and attaches
 * the userId to request.sessionUserId.  Routes that call
 * sessionService.requireActiveUser() will receive the resolved User.
 *
 * The /v1/auth/* and /health routes are explicitly excluded.
 */

import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

declare module "fastify" {
  interface FastifyRequest {
    sessionUserId: string;
  }
}

const PUBLIC_PREFIXES = ["/v1/auth/", "/health"];

export function registerAuthMiddleware(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "";
    if (PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return;
    }

    const raw = request.cookies[env.SESSION_COOKIE_NAME];
    if (!raw) {
      throw new AppError(401, "auth_required", "Authentication required.");
    }

    const result = reply.unsignCookie(raw);
    if (!result.valid || !result.value) {
      throw new AppError(401, "auth_required", "Invalid session.");
    }

    request.sessionUserId = result.value;
  });
}
