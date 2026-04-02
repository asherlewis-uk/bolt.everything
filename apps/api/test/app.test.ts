import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";

describe("Phase 1 API skeleton", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns bootstrap payload", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/bootstrap",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: {
        id: "usr_phase1",
        defaultProviderProfileId: null,
      },
      providerSetupRequired: true,
      recentProjects: [],
    });
  });

  it("validates a provider profile", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/provider-profiles/validate",
      payload: {
        kind: "openai_compatible",
        preset: "openai",
        displayName: "OpenAI",
        baseUrl: null,
        apiKey: "sk-phase1",
        defaultModel: "gpt-4.1",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      valid: true,
      resolvedBaseUrl: "https://api.openai.com/v1",
      resolvedModel: "gpt-4.1",
    });
  });

  it("creates a project after provider setup", async () => {
    const createProviderResponse = await app.inject({
      method: "POST",
      url: "/v1/provider-profiles",
      payload: {
        kind: "openai_compatible",
        preset: "openai",
        displayName: "OpenAI",
        baseUrl: null,
        apiKey: "sk-phase1",
        defaultModel: "gpt-4.1",
      },
    });

    const providerProfile = createProviderResponse.json();

    const createProjectResponse = await app.inject({
      method: "POST",
      url: "/v1/projects",
      payload: {
        name: "Travel App",
        goal: "Build a premium travel startup landing page.",
        templateId: "react_vite",
        providerProfileId: providerProfile.id,
        modelId: "gpt-4.1",
      },
    });

    expect(createProjectResponse.statusCode).toBe(200);
    expect(createProjectResponse.json()).toMatchObject({
      name: "Travel App",
      templateId: "react_vite",
      providerProfileId: providerProfile.id,
      modelId: "gpt-4.1",
      status: "ready",
    });
  });
});
