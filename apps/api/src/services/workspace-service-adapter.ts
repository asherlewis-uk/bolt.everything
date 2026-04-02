import { type StarterTemplateId, starterTemplateIdSchema } from "@bolt-everything/contracts";
import {
  type ProjectWorkspaceManifest,
  projectWorkspaceManifestSchema,
} from "@bolt-everything/workspace-contract";

import { createId } from "../lib/id.js";

interface ProjectBootstrapInput {
  projectId: string;
  templateId: StarterTemplateId;
  createdAt: string;
}

export interface ProjectBootstrapResult {
  workspaceId: string;
  storageRef: string;
  implementation: "phase1_stub";
  state: "ready";
  manifest: ProjectWorkspaceManifest;
}

const manifestByTemplate: Record<
  StarterTemplateId,
  Pick<
    ProjectWorkspaceManifest,
    "executionProfile" | "installOperation" | "buildOperation" | "previewOperation"
  >
> = {
  react_vite: {
    executionProfile: "node_pnpm_workspace",
    installOperation: "react_vite_install",
    buildOperation: "react_vite_build",
    previewOperation: "react_vite_preview",
  },
  nextjs: {
    executionProfile: "node_pnpm_workspace",
    installOperation: "nextjs_install",
    buildOperation: "nextjs_build",
    previewOperation: "nextjs_preview",
  },
  node_typescript: {
    executionProfile: "node_pnpm_workspace",
    installOperation: "node_typescript_install",
    buildOperation: "node_typescript_build",
    previewOperation: null,
  },
};

export class WorkspaceServiceAdapter {
  public async bootstrapProjectWorkspace(
    input: ProjectBootstrapInput,
  ): Promise<ProjectBootstrapResult> {
    const templateId = starterTemplateIdSchema.parse(input.templateId);
    const workspaceId = createId("ws");
    const manifestConfig = manifestByTemplate[templateId];
    const manifest = projectWorkspaceManifestSchema.parse({
      schemaVersion: "1.0",
      projectId: input.projectId,
      templateId,
      executionProfile: manifestConfig.executionProfile,
      installOperation: manifestConfig.installOperation,
      buildOperation: manifestConfig.buildOperation,
      previewOperation: manifestConfig.previewOperation,
      createdAt: input.createdAt,
    });

    // TODO: Materialize the locked starter template and persist
    // .bolt-everything/project.json through the real workspace implementation.
    return {
      workspaceId,
      storageRef: `workspace://phase1/${input.projectId}`,
      implementation: "phase1_stub",
      state: "ready",
      manifest,
    };
  }
}
