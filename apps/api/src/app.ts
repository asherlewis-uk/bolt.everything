import Fastify, { type FastifyInstance } from "fastify";

import { toErrorResponse } from "./lib/app-error.js";
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
    logger: false,
  });

  const store = createDevMemoryStore();
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

  app.setErrorHandler((error, _request, reply) => {
    const { statusCode, payload } = toErrorResponse(error);
    reply.status(statusCode).send(payload);
  });

  registerV1Routes(app, services);
  return app;
}
