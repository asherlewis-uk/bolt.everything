import {
  type CreateProjectRequest,
  type CreateProjectResponse,
  type ProjectDetailResponse,
  type ProjectListItem,
  conversationSchema,
  createProjectRequestSchema,
  createProjectResponseSchema,
  projectDetailResponseSchema,
  projectListItemSchema,
  projectSchema,
} from "@bolt-everything/contracts";

import { AppError } from "../lib/app-error.js";
import { createId } from "../lib/id.js";
import type { DevMemoryStore } from "./dev-memory-store.js";
import type { ProviderProfileService } from "./provider-profile-service.js";
import type { SnapshotService } from "./snapshot-service.js";
import type { WorkspaceServiceAdapter } from "./workspace-service-adapter.js";

export class ProjectService {
  public constructor(
    private readonly store: DevMemoryStore,
    private readonly providerProfileService: ProviderProfileService,
    private readonly workspaceServiceAdapter: WorkspaceServiceAdapter,
    private readonly snapshotService: SnapshotService,
  ) {}

  public async listProjects(userId: string): Promise<ProjectListItem[]> {
    return this.store
      .listProjects(userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((project) =>
        projectListItemSchema.parse({
          id: project.id,
          name: project.name,
          goal: project.goal,
          templateId: project.templateId,
          status: project.status,
          providerProfileId: project.providerProfileId,
          modelId: project.modelId,
          updatedAt: project.updatedAt,
          lastMessageAt: this.store.getConversationByProject(project.id)?.lastMessageAt ?? null,
        }),
      );
  }

  public async createProject(
    userId: string,
    input: CreateProjectRequest,
  ): Promise<CreateProjectResponse> {
    const request = createProjectRequestSchema.parse(input);
    const now = new Date().toISOString();
    const projectId = createId("prj");
    const conversationId = createId("cnv");
    const user = this.store.getUser();

    const resolvedProviderProfileId = request.providerProfileId ?? user.defaultProviderProfileId;
    const resolvedProviderProfile = resolvedProviderProfileId
      ? this.providerProfileService.getValidatedProfileOrThrow(userId, resolvedProviderProfileId)
      : null;

    const workspace = await this.workspaceServiceAdapter.bootstrapProjectWorkspace({
      projectId,
      templateId: request.templateId,
      createdAt: now,
    });

    const project = projectSchema.parse({
      id: projectId,
      userId,
      name: request.name,
      goal: request.goal,
      templateId: request.templateId,
      workspaceId: workspace.workspaceId,
      conversationId,
      providerProfileId: resolvedProviderProfile?.id ?? null,
      modelId: request.modelId ?? resolvedProviderProfile?.defaultModel ?? null,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    });

    const conversation = conversationSchema.parse({
      id: conversationId,
      projectId,
      title: request.name,
      lastMessageAt: null,
    });

    this.store.saveProject(project);
    this.store.saveConversation(conversation);
    await this.snapshotService.createInitialSnapshot(project);

    return createProjectResponseSchema.parse({
      id: project.id,
      name: project.name,
      goal: project.goal,
      templateId: project.templateId,
      status: project.status,
      conversationId: project.conversationId,
      providerProfileId: project.providerProfileId,
      modelId: project.modelId,
      createdAt: project.createdAt,
    });
  }

  public async getProject(userId: string, projectId: string): Promise<ProjectDetailResponse> {
    const project = this.store.getProject(userId, projectId);

    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found.", { projectId });
    }

    const latestSnapshot = this.store.getLatestSnapshot(project.id);
    const currentPreview = this.store.getPreviewSession(project.id);

    return projectDetailResponseSchema.parse({
      id: project.id,
      name: project.name,
      goal: project.goal,
      templateId: project.templateId,
      status: project.status,
      conversationId: project.conversationId,
      providerProfileId: project.providerProfileId,
      modelId: project.modelId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      currentRun: null,
      currentPreview,
      latestSnapshot: latestSnapshot
        ? {
            id: latestSnapshot.id,
            label: latestSnapshot.label,
            runId: latestSnapshot.runId,
            createdAt: latestSnapshot.createdAt,
          }
        : null,
    });
  }
}
