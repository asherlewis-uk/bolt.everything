import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { fileContentResponseSchema, fileListResponseSchema } from "@bolt-everything/contracts";

import type { AppServices } from "../../app.js";
import { AppError } from "../../lib/app-error.js";

const projectParamsSchema = z.object({
  projectId: z.string().min(1),
});

const listQuerySchema = z.object({
  path: z.string().min(1).default("/"),
  depth: z.coerce.number().int().min(0).max(10).default(1),
});

const contentQuerySchema = z.object({
  path: z.string().min(1),
});

export function registerFileRoutes(app: FastifyInstance, services: AppServices) {
  /**
   * GET /v1/projects/:projectId/files?path=/&depth=1
   * Returns a directory tree slice from the workspace.  Read-only.
   */
  app.get("/projects/:projectId/files", async (request) => {
    const user = await services.sessionService.requireActiveUser(request.sessionUserId);
    const { projectId } = projectParamsSchema.parse(request.params);
    const { path, depth } = listQuerySchema.parse(request.query);

    const project = await services.projectService.getProjectRecord(user.id, projectId);

    const entries = await services.workspaceServiceAdapter.listFiles(
      project.workspaceId,
      path,
      depth,
    );

    return fileListResponseSchema.parse({ path, entries });
  });

  /**
   * GET /v1/projects/:projectId/files/content?path=/src/App.tsx
   * Returns the content of a single file from the workspace.  Read-only.
   */
  app.get("/projects/:projectId/files/content", async (request) => {
    const user = await services.sessionService.requireActiveUser(request.sessionUserId);
    const { projectId } = projectParamsSchema.parse(request.params);
    const { path } = contentQuerySchema.parse(request.query);

    const project = await services.projectService.getProjectRecord(user.id, projectId);

    try {
      const file = await services.workspaceServiceAdapter.readFile(project.workspaceId, path);
      return fileContentResponseSchema.parse(file);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "file_not_found") {
        throw new AppError(404, "file_not_found", `File not found: ${path}`, { path });
      }
      if (code === "reserved_path") {
        throw new AppError(403, "forbidden_operation", "Reserved paths are not accessible.", {
          path,
        });
      }
      throw err;
    }
  });
}
