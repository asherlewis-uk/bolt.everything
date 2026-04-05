import type { FastifyInstance } from "fastify";

import type { AppServices } from "../../app.js";
import { registerAuthRoutes } from "./auth.js";
import { registerBootstrapRoutes } from "./bootstrap.js";
import { registerHealthRoutes } from "./health.js";
import { registerProjectRoutes } from "./projects.js";
import { registerProviderProfileRoutes } from "./provider-profiles.js";

export function registerV1Routes(app: FastifyInstance, services: AppServices) {
  // Health check — unauthenticated, outside the /v1 prefix so load balancers
  // can reach it without auth headers.
  registerHealthRoutes(app);

  app.register(
    async (v1) => {
      registerAuthRoutes(v1, services);
      registerBootstrapRoutes(v1, services);
      registerProviderProfileRoutes(v1, services);
      registerProjectRoutes(v1, services);
    },
    { prefix: "/v1" },
  );
}
