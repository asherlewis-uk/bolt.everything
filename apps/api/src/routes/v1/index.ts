import type { FastifyInstance } from "fastify";

import type { AppServices } from "../../app.js";
import { registerBootstrapRoutes } from "./bootstrap.js";
import { registerProjectRoutes } from "./projects.js";
import { registerProviderProfileRoutes } from "./provider-profiles.js";

export function registerV1Routes(app: FastifyInstance, services: AppServices) {
  app.register(
    async (v1) => {
      registerBootstrapRoutes(v1, services);
      registerProviderProfileRoutes(v1, services);
      registerProjectRoutes(v1, services);
    },
    { prefix: "/v1" },
  );
}
