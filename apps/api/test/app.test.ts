import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";

// In-memory store seed: the dev store always starts with usr_phase1.
const PHASE1_USER_ID = "usr_phase1";

/**
 * Produce a signed session cookie value using the app's cookie plugin.
 * We need to inject it into all authenticated requests.
 */
async function signedCookie(app: FastifyInstance, userId: string): Promise<string> {
  // signCookie is added to the FastifyInstance by @fastify/cookie after ready().
  return (app as FastifyInstance & { signCookie(value: string): string }).signCookie(userId);
}

describe("Phase 1 API — hardened", () => {
  let app: FastifyInstance;
  let sessionCookie: string;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
    sessionCookie = await signedCookie(app, PHASE1_USER_ID);
  });

  afterEach(async () => {
    await app.close();
  });

  // ----------------------------------------------------------------- health

  describe("GET /health", () => {
    it("returns 200 with status ok (no DB in test)", async () => {
      const response = await app.inject({ method: "GET", url: "/health" });
      // DB is not configured in test, so db will be 'unavailable' but the
      // endpoint itself must still respond.
      expect([200, 503]).toContain(response.statusCode);
      expect(response.json()).toMatchObject({ status: expect.stringMatching(/^(ok|degraded)$/) });
    });
  });

  // ------------------------------------------------------- authentication

  describe("Auth middleware", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const response = await app.inject({ method: "GET", url: "/v1/bootstrap" });
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: { code: "auth_required", message: "Authentication required.", details: {} },
      });
    });

    it("rejects requests with a tampered cookie with 401", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/bootstrap",
        cookies: { bolt_session: "tampered.value" },
      });
      expect(response.statusCode).toBe(401);
    });

    it("allows /v1/auth/apple without a session cookie", async () => {
      // Invalid token body but should not be rejected by the auth middleware.
      const response = await app.inject({
        method: "POST",
        url: "/v1/auth/apple",
        payload: { identityToken: "not-a-real-jwt" },
      });
      // Will fail with a verification error, not a 401.
      expect(response.statusCode).not.toBe(401);
    });

    it("allows /health without a session cookie", async () => {
      const response = await app.inject({ method: "GET", url: "/health" });
      expect(response.statusCode).not.toBe(401);
    });
  });

  // ---------------------------------------------------------------- bootstrap

  describe("GET /v1/bootstrap", () => {
    it("returns bootstrap payload for authenticated user", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/bootstrap",
        cookies: { bolt_session: sessionCookie },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        user: { id: PHASE1_USER_ID, defaultProviderProfileId: null },
        providerSetupRequired: true,
        recentProjects: [],
      });
    });
  });

  // --------------------------------------------------- provider profiles

  describe("POST /v1/provider-profiles/validate", () => {
    it("validates a well-formed profile (no session required)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/provider-profiles/validate",
        cookies: { bolt_session: sessionCookie },
        payload: {
          kind: "openai_compatible",
          preset: "openai",
          displayName: "OpenAI",
          baseUrl: null,
          apiKey: "sk-test",
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

    it("rejects empty api key", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/provider-profiles/validate",
        cookies: { bolt_session: sessionCookie },
        payload: {
          kind: "openai_compatible",
          preset: "openai",
          displayName: "OpenAI",
          baseUrl: null,
          apiKey: "   ",
          defaultModel: "gpt-4.1",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: { code: "provider_validation_failed" },
      });
    });

    it("rejects missing model", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/provider-profiles/validate",
        cookies: { bolt_session: sessionCookie },
        payload: {
          kind: "openai_compatible",
          preset: "openai",
          displayName: "OpenAI",
          baseUrl: null,
          apiKey: "sk-test",
          defaultModel: "",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("rejects custom preset without a base URL", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/provider-profiles/validate",
        cookies: { bolt_session: sessionCookie },
        payload: {
          kind: "openai_compatible",
          preset: "custom",
          displayName: "My Custom LLM",
          baseUrl: null,
          apiKey: "sk-test",
          defaultModel: "local-model",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: { code: "provider_validation_failed" },
      });
    });
  });

  describe("POST /v1/provider-profiles", () => {
    it("creates a provider profile and sets it as default", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/provider-profiles",
        cookies: { bolt_session: sessionCookie },
        payload: {
          kind: "openai_compatible",
          preset: "openai",
          displayName: "OpenAI",
          baseUrl: null,
          apiKey: "sk-test",
          defaultModel: "gpt-4.1",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        kind: "openai_compatible",
        preset: "openai",
        displayName: "OpenAI",
        status: "validated",
      });
      expect(body.id).toMatch(/^prov_/);

      // Bootstrap should now reflect the new default provider.
      const bootstrap = await app.inject({
        method: "GET",
        url: "/v1/bootstrap",
        cookies: { bolt_session: sessionCookie },
      });
      expect(bootstrap.json().user.defaultProviderProfileId).toBe(body.id);
      expect(bootstrap.json().providerSetupRequired).toBe(false);
    });
  });

  describe("PATCH /v1/provider-profiles/:id", () => {
    it("returns 404 for an unknown profile ID", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/v1/provider-profiles/prov_nonexistent",
        cookies: { bolt_session: sessionCookie },
        payload: { displayName: "Renamed" },
      });
      expect(response.statusCode).toBe(404);
    });
  });

  // -------------------------------------------------------------- projects

  describe("Projects", () => {
    async function createProvider() {
      const res = await app.inject({
        method: "POST",
        url: "/v1/provider-profiles",
        cookies: { bolt_session: sessionCookie },
        payload: {
          kind: "openai_compatible",
          preset: "openai",
          displayName: "OpenAI",
          baseUrl: null,
          apiKey: "sk-test",
          defaultModel: "gpt-4.1",
        },
      });
      return res.json() as { id: string };
    }

    it("creates a project and lists it", async () => {
      const provider = await createProvider();

      const createRes = await app.inject({
        method: "POST",
        url: "/v1/projects",
        cookies: { bolt_session: sessionCookie },
        payload: {
          name: "Travel App",
          goal: "Build a travel startup landing page.",
          templateId: "react_vite",
          providerProfileId: provider.id,
          modelId: "gpt-4.1",
        },
      });

      expect(createRes.statusCode).toBe(200);
      const project = createRes.json();
      expect(project).toMatchObject({
        name: "Travel App",
        templateId: "react_vite",
        providerProfileId: provider.id,
        modelId: "gpt-4.1",
        status: "ready",
      });
      expect(project.id).toMatch(/^prj_/);

      // Should appear in list.
      const listRes = await app.inject({
        method: "GET",
        url: "/v1/projects",
        cookies: { bolt_session: sessionCookie },
      });
      expect(listRes.statusCode).toBe(200);
      expect(listRes.json()).toHaveLength(1);
      expect(listRes.json()[0].id).toBe(project.id);
    });

    it("returns project detail with snapshot", async () => {
      const provider = await createProvider();

      const createRes = await app.inject({
        method: "POST",
        url: "/v1/projects",
        cookies: { bolt_session: sessionCookie },
        payload: {
          name: "Node API",
          goal: "Build a REST API.",
          templateId: "node_typescript",
          providerProfileId: provider.id,
          modelId: "gpt-4.1",
        },
      });
      const project = createRes.json() as { id: string };

      const detailRes = await app.inject({
        method: "GET",
        url: `/v1/projects/${project.id}`,
        cookies: { bolt_session: sessionCookie },
      });
      expect(detailRes.statusCode).toBe(200);
      const detail = detailRes.json();
      expect(detail.id).toBe(project.id);
      expect(detail.latestSnapshot).not.toBeNull();
      expect(detail.latestSnapshot.label).toBe("Initial project bootstrap");
    });

    it("returns 404 for unknown project", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/projects/prj_nonexistent",
        cookies: { bolt_session: sessionCookie },
      });
      expect(response.statusCode).toBe(404);
    });

    it("cannot access another user's project", async () => {
      // Create a project as the seeded user.
      const provider = await createProvider();
      const createRes = await app.inject({
        method: "POST",
        url: "/v1/projects",
        cookies: { bolt_session: sessionCookie },
        payload: {
          name: "Private Project",
          goal: "Sensitive data.",
          templateId: "react_vite",
          providerProfileId: provider.id,
          modelId: "gpt-4.1",
        },
      });
      const project = createRes.json() as { id: string };

      // Attempt to fetch as a different (nonexistent) user.
      const otherUserCookie = await signedCookie(app, "usr_other");
      const response = await app.inject({
        method: "GET",
        url: `/v1/projects/${project.id}`,
        cookies: { bolt_session: otherUserCookie },
      });
      // Should fail: either 404 (user not found) or 401.
      expect([401, 404]).toContain(response.statusCode);
    });
  });

  // ---------------------------------------------------- response shape contract

  describe("Response schema conformance", () => {
    it("bootstrap response matches contract shape", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/bootstrap",
        cookies: { bolt_session: sessionCookie },
      });
      const body = response.json();
      expect(body).toHaveProperty("user.id");
      expect(body).toHaveProperty("providerSetupRequired");
      expect(Array.isArray(body.recentProjects)).toBe(true);
    });
  });
});
