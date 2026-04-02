import { describe, expect, it } from "vitest";

import {
  projectWorkspaceManifestSchema,
  workspaceRequestSchema,
  workspaceResultSchema,
} from "../src/index.js";

describe("workspace contract", () => {
  it("parses a read_file request", () => {
    const parsed = workspaceRequestSchema.parse({
      contractVersion: "1.0",
      workspaceId: "ws_123",
      operationId: "op_123",
      operation: "read_file",
      context: {
        projectId: "prj_123",
        conversationId: "cnv_123",
        runId: "run_123",
        initiator: "assistant_run",
      },
      payload: {
        path: "/src/App.tsx",
      },
    });

    expect(parsed.operation).toBe("read_file");
  });

  it("parses the reserved workspace manifest shape", () => {
    const parsed = projectWorkspaceManifestSchema.parse({
      schemaVersion: "1.0",
      projectId: "prj_123",
      templateId: "react_vite",
      executionProfile: "node_pnpm_workspace",
      installOperation: "react_vite_install",
      buildOperation: "react_vite_build",
      previewOperation: "react_vite_preview",
      createdAt: "2026-04-01T18:10:00Z",
    });

    expect(parsed.templateId).toBe("react_vite");
  });

  it("parses a successful build_project result", () => {
    const parsed = workspaceResultSchema.parse({
      contractVersion: "1.0",
      workspaceId: "ws_123",
      operationId: "op_123",
      operation: "build_project",
      status: "succeeded",
      startedAt: "2026-04-01T18:40:00Z",
      finishedAt: "2026-04-01T18:40:10Z",
      result: {
        operation: "build_project",
        configuredBy: ".bolt-everything/project.json#buildOperation",
        summary: "Build completed.",
      },
      error: null,
    });

    expect(parsed.status).toBe("succeeded");
  });
});
