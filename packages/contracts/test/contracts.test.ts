import { describe, expect, it } from "vitest";

import {
  bootstrapResponseSchema,
  createProjectRequestSchema,
  projectDetailResponseSchema,
} from "../src/index.js";

describe("contracts", () => {
  it("parses the locked bootstrap payload shape", () => {
    const parsed = bootstrapResponseSchema.parse({
      user: {
        id: "usr_123",
        defaultProviderProfileId: null,
      },
      providerSetupRequired: true,
      recentProjects: [],
    });

    expect(parsed.providerSetupRequired).toBe(true);
  });

  it("requires a starter template for project creation", () => {
    const parsed = createProjectRequestSchema.parse({
      name: "Travel App",
      goal: "Build a premium travel startup landing page.",
      templateId: "react_vite",
      providerProfileId: "prov_123",
      modelId: "gpt-4.1",
    });

    expect(parsed.templateId).toBe("react_vite");
  });

  it("parses the project detail summary shape", () => {
    const parsed = projectDetailResponseSchema.parse({
      id: "prj_123",
      name: "Travel App",
      goal: "Build a premium travel startup landing page.",
      templateId: "react_vite",
      status: "ready",
      conversationId: "cnv_123",
      providerProfileId: "prov_123",
      modelId: "gpt-4.1",
      createdAt: "2026-04-01T18:10:00Z",
      updatedAt: "2026-04-01T18:10:00Z",
      currentRun: null,
      currentPreview: null,
      latestSnapshot: {
        id: "snp_123",
        label: "Initial project bootstrap",
        runId: null,
        createdAt: "2026-04-01T18:10:10Z",
      },
    });

    expect(parsed.latestSnapshot?.label).toBe("Initial project bootstrap");
  });
});
