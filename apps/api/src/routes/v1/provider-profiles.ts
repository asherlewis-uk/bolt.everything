import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  createProviderProfileRequestSchema,
  providerProfileValidationRequestSchema,
  updateProviderProfileRequestSchema,
} from "@bolt-everything/contracts";

import type { AppServices } from "../../app.js";

const providerProfileParamsSchema = z.object({
  providerProfileId: z.string().min(1),
});

export function registerProviderProfileRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/provider-profiles", async (request) => {
    const user = await services.sessionService.requireActiveUser(request.sessionUserId);
    return services.providerProfileService.listProviderProfiles(user.id);
  });

  app.post("/provider-profiles/validate", async (request) => {
    const payload = providerProfileValidationRequestSchema.parse(request.body);
    return services.providerProfileService.validateProfile(payload);
  });

  app.post("/provider-profiles", async (request) => {
    const user = await services.sessionService.requireActiveUser(request.sessionUserId);
    const payload = createProviderProfileRequestSchema.parse(request.body);
    return services.providerProfileService.createProviderProfile(user.id, payload);
  });

  app.patch("/provider-profiles/:providerProfileId", async (request) => {
    const user = await services.sessionService.requireActiveUser(request.sessionUserId);
    const params = providerProfileParamsSchema.parse(request.params);
    const payload = updateProviderProfileRequestSchema.parse(request.body);
    return services.providerProfileService.updateProviderProfile(
      user.id,
      params.providerProfileId,
      payload,
    );
  });

  app.post("/provider-profiles/:providerProfileId/make-default", async (request) => {
    const user = await services.sessionService.requireActiveUser(request.sessionUserId);
    const params = providerProfileParamsSchema.parse(request.params);
    return services.providerProfileService.makeDefaultProviderProfile(
      user.id,
      params.providerProfileId,
    );
  });
}
