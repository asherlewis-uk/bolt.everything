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
import type { AppStore } from "./dev-memory-store.js";
import type { ProviderProfileService } from "./provider-profile-service.js";
import type { SnapshotService } from "./snapshot-service.js";
import type { WorkspaceServiceAdapter } from "./workspace-service-adapter.js";

export class ProjectService {
  public constructor(
    private readonly store: AppStore,
    private readonly providerProfileService: ProviderProfileService,
    private readonly workspaceServiceAdapter: WorkspaceServiceAdapter,
    private readonly snapshotService: SnapshotService,
  ) {}

  public async listProjects(userId: string): Promise<ProjectListItem[]> {
    const projects = await this.store.listProjects(userId);

    return Promise.all(
      projects
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(async (project) => {
          const conversation = await this.store.getConversationByProject(project.id);
          return projectListItemSchema.parse({
            id: project.id,
            name: project.name,
            goal: project.goal,
            templateId: project.templateId,
            status: project.status,
            providerProfileId: project.providerProfileId,
            modelId: project.modelId,
            updatedAt: project.updatedAt,
            lastMessageAt: conversation?.lastMessageAt ?? null,
          });
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

    const user = await this.store.getUserById(userId);
    const resolvedProviderProfileId =
      request.providerProfileId ?? user?.defaultProviderProfileId ?? null;
    const resolvedProviderProfile = resolvedProviderProfileId
      ? await this.providerProfileService.getValidatedProfileOrThrow(
          userId,
          resolvedProviderProfileId,
        )
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

    await this.store.saveProject(project);
    await this.store.saveConversation(conversation);
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
    const project = await this.store.getProject(userId, projectId);

    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found.", { projectId });
    }

    const latestSnapshot = await this.store.getLatestSnapshot(project.id);
    const currentPreview = await this.store.getPreviewSession(project.id);

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
