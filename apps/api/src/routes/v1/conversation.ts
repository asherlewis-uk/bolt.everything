import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { conversationResponseSchema } from "@bolt-everything/contracts";

import type { AppServices } from "../../app.js";
import { AppError } from "../../lib/app-error.js";

const projectParamsSchema = z.object({
  projectId: z.string().min(1),
});

export function registerConversationRoutes(app: FastifyInstance, services: AppServices) {
  /**
   * GET /v1/projects/:projectId/conversation
   * Returns the conversation record with its full message history.
   * Read-only in Phase 2; Phase 3 will add message creation via runs.
   */
  app.get("/projects/:projectId/conversation", async (request) => {
    const user = await services.sessionService.requireActiveUser(request.sessionUserId);
    const { projectId } = projectParamsSchema.parse(request.params);

    const project = await services.projectService.getProjectRecord(user.id, projectId);

    const conversation = await services.projectService.getConversationRecord(project.id);
    if (!conversation) {
      throw new AppError(404, "conversation_not_found", "Conversation not found.", { projectId });
    }

    const messages = await services.projectService.listMessages(conversation.id);

    return conversationResponseSchema.parse({
      id: conversation.id,
      projectId: conversation.projectId,
      title: conversation.title,
      lastMessageAt: conversation.lastMessageAt,
      messages,
    });
  });
}
