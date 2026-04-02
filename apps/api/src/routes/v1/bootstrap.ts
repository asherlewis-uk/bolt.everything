import type { FastifyInstance } from "fastify";

import type { AppServices } from "../../app.js";

export function registerBootstrapRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/bootstrap", async () => services.sessionService.getBootstrap());
}
