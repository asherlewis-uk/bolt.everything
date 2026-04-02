import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { createProjectRequestSchema } from "@bolt-everything/contracts";

import type { AppServices } from "../../app.js";

const projectParamsSchema = z.object({
  projectId: z.string().min(1),
});

export function registerProjectRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/projects", async () => {
    const user = await services.sessionService.requireActiveUser();
    return services.projectService.listProjects(user.id);
  });

  app.post("/projects", async (request) => {
    const user = await services.sessionService.requireActiveUser();
    const payload = createProjectRequestSchema.parse(request.body);
    return services.projectService.createProject(user.id, payload);
  });

  app.get("/projects/:projectId", async (request) => {
    const user = await services.sessionService.requireActiveUser();
    const params = projectParamsSchema.parse(request.params);
    return services.projectService.getProject(user.id, params.projectId);
  });
}
