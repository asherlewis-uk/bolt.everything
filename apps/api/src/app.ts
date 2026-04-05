import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import { getDatabaseClient } from "./db/client.js";
import { createDrizzleStore } from "./db/drizzle-store.js";
import { toErrorResponse } from "./lib/app-error.js";
import { registerAuthMiddleware } from "./lib/auth-middleware.js";
import { registerV1Routes } from "./routes/v1/index.js";
import { createDevMemoryStore } from "./services/dev-memory-store.js";
import { ProjectService } from "./services/project-service.js";
import { ProviderProfileService } from "./services/provider-profile-service.js";
import { SessionService } from "./services/session-service.js";
import { SnapshotService } from "./services/snapshot-service.js";
import { WorkspaceServiceAdapter } from "./services/workspace-service-adapter.js";

export interface AppServices {
  sessionService: SessionService;
  providerProfileService: ProviderProfileService;
  projectService: ProjectService;
  snapshotService: SnapshotService;
  workspaceServiceAdapter: WorkspaceServiceAdapter;
}

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "test" ? "silent" : "info",
      redact: {
        paths: ["req.headers.cookie", "req.headers.authorization", "body.apiKey"],
        censor: "[REDACTED]",
      },
    },
    trustProxy: true,
    bodyLimit: 1_048_576, // 1 MB
  });

  // ----------------------------------------------------------------- security
  void app.register(helmet, {
    // Allow same-origin iframes for the in-app preview WebView.
    contentSecurityPolicy: false,
  });

  void app.register(cors, {
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : false,
    credentials: true,
  });

  void app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    // Stricter limits on auth endpoints to mitigate brute-force.
    keyGenerator: (request) => request.ip,
  });

  void app.register(cookie, {
    secret: env.SESSION_SECRET ?? "dev-secret-change-in-production",
    hook: "onRequest",
  });

  // -------------------------------------------------------------- store / DI
  const dbClient = getDatabaseClient();
  const store = dbClient ? createDrizzleStore(dbClient) : createDevMemoryStore();

  if (dbClient) {
    app.log.info("Using Drizzle PostgreSQL store.");
  } else {
    app.log.warn("DATABASE_URL not set — using in-memory store. Data will be lost on restart.");
  }

  const workspaceServiceAdapter = new WorkspaceServiceAdapter();
  const snapshotService = new SnapshotService(store, workspaceServiceAdapter);
  const sessionService = new SessionService(store);
  const providerProfileService = new ProviderProfileService(store);
  const projectService = new ProjectService(
    store,
    providerProfileService,
    workspaceServiceAdapter,
    snapshotService,
  );

  const services: AppServices = {
    sessionService,
    providerProfileService,
    projectService,
    snapshotService,
    workspaceServiceAdapter,
  };

  // --------------------------------------------------------- auth middleware
  registerAuthMiddleware(app);

  // ------------------------------------------------------------ error handler
  app.setErrorHandler((error, _request, reply) => {
    const { statusCode, payload } = toErrorResponse(error);
    if (statusCode >= 500) {
      app.log.error(error, "Unhandled server error");
    }
    reply.status(statusCode).send(payload);
  });

  // ------------------------------------------------------------------ routes
  registerV1Routes(app, services);

  return app;
}
