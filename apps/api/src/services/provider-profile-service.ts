import {
  type CreateProviderProfileRequest,
  type CreateProviderProfileResponse,
  type MakeDefaultProviderProfileResponse,
  type ProviderProfile,
  type ProviderProfileSummary,
  type ProviderProfileValidationRequest,
  type ProviderProfileValidationResponse,
  type UpdateProviderProfileRequest,
  createProviderProfileResponseSchema,
  makeDefaultProviderProfileResponseSchema,
  providerBaseUrlByPreset,
  providerProfileSchema,
  providerProfileSummarySchema,
  providerProfileValidationResponseSchema,
} from "@bolt-everything/contracts";

import { decryptApiKey, encryptApiKey } from "../lib/api-key-crypto.js";
import { AppError } from "../lib/app-error.js";
import { createId } from "../lib/id.js";
import type { AppStore } from "./dev-memory-store.js";

export class ProviderProfileService {
  public constructor(
    private readonly store: AppStore,
    private readonly sessionSecret: string,
  ) {}

  public async listProviderProfiles(userId: string): Promise<ProviderProfileSummary[]> {
    const user = await this.store.getUserById(userId);
    const profiles = await this.store.listProviderProfiles(userId);

    return profiles.map((profile) =>
      providerProfileSummarySchema.parse({
        id: profile.id,
        kind: profile.kind,
        preset: profile.preset,
        displayName: profile.displayName,
        baseUrl: profile.baseUrl,
        defaultModel: profile.defaultModel,
        validatedAt: profile.validatedAt,
        status: profile.status,
        isDefault: user?.defaultProviderProfileId === profile.id,
      }),
    );
  }

  public async validateProfile(
    input: ProviderProfileValidationRequest,
  ): Promise<ProviderProfileValidationResponse> {
    if (input.kind !== "openai_compatible") {
      throw new AppError(400, "provider_validation_failed", "Only openai_compatible is supported.");
    }

    if (!input.apiKey.trim()) {
      throw new AppError(400, "provider_validation_failed", "API key is required.");
    }

    if (!input.defaultModel.trim()) {
      throw new AppError(400, "unknown_model", "A default model is required.");
    }

    const resolvedBaseUrl = this.resolveBaseUrl(input);
    const validatedAt = new Date().toISOString();

    // TODO: Replace this local-only validation with the real lightweight
    // authenticated HTTPS validation flow described in docs/provider-strategy.md.
    return providerProfileValidationResponseSchema.parse({
      valid: true,
      resolvedBaseUrl,
      resolvedModel: input.defaultModel,
      validatedAt,
    });
  }

  public async createProviderProfile(
    userId: string,
    input: CreateProviderProfileRequest,
  ): Promise<CreateProviderProfileResponse> {
    const validation = await this.validateProfile(input);
    const timestamp = validation.validatedAt;
    const profile = providerProfileSchema.parse({
      id: createId("prov"),
      userId,
      kind: input.kind,
      preset: input.preset,
      displayName: input.displayName,
      baseUrl: validation.resolvedBaseUrl,
      apiKeyRef: encryptApiKey(input.apiKey, this.sessionSecret),
      defaultModel: validation.resolvedModel,
      validatedAt: validation.validatedAt,
      status: "validated",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await this.store.saveProviderProfile(profile);

    const user = await this.store.getUserById(userId);
    if (user && !user.defaultProviderProfileId) {
      await this.store.updateUser({ ...user, defaultProviderProfileId: profile.id });
    }

    return createProviderProfileResponseSchema.parse({
      id: profile.id,
      kind: profile.kind,
      preset: profile.preset,
      displayName: profile.displayName,
      baseUrl: profile.baseUrl,
      defaultModel: profile.defaultModel,
      validatedAt: profile.validatedAt,
      status: profile.status,
    });
  }

  public async updateProviderProfile(
    userId: string,
    providerProfileId: string,
    input: UpdateProviderProfileRequest,
  ): Promise<CreateProviderProfileResponse> {
    const existing = await this.getOwnedProfileOrThrow(userId, providerProfileId);
    const mergedValidationInput = {
      kind: existing.kind,
      preset: existing.preset,
      displayName: input.displayName ?? existing.displayName,
      baseUrl: input.baseUrl ?? existing.baseUrl,
      apiKey: input.apiKey ?? decryptApiKey(existing.apiKeyRef, this.sessionSecret),
      defaultModel: input.defaultModel ?? existing.defaultModel,
    } as const;

    // TODO: Revalidate using the decrypted stored credential when apiKey is omitted.
    const validation = await this.validateProfile(mergedValidationInput);
    const updated = providerProfileSchema.parse({
      ...existing,
      displayName: mergedValidationInput.displayName,
      baseUrl: validation.resolvedBaseUrl,
      defaultModel: validation.resolvedModel,
      validatedAt: validation.validatedAt,
      status: "validated",
      updatedAt: validation.validatedAt,
    });

    await this.store.saveProviderProfile(updated);

    return createProviderProfileResponseSchema.parse({
      id: updated.id,
      kind: updated.kind,
      preset: updated.preset,
      displayName: updated.displayName,
      baseUrl: updated.baseUrl,
      defaultModel: updated.defaultModel,
      validatedAt: updated.validatedAt,
      status: updated.status,
    });
  }

  public async makeDefaultProviderProfile(
    userId: string,
    providerProfileId: string,
  ): Promise<MakeDefaultProviderProfileResponse> {
    await this.getOwnedProfileOrThrow(userId, providerProfileId);

    const user = await this.store.getUserById(userId);
    if (user) {
      await this.store.updateUser({ ...user, defaultProviderProfileId: providerProfileId });
    }

    return makeDefaultProviderProfileResponseSchema.parse({
      defaultProviderProfileId: providerProfileId,
    });
  }

  public async getValidatedProfileOrThrow(
    userId: string,
    providerProfileId: string,
  ): Promise<ProviderProfile> {
    const profile = await this.getOwnedProfileOrThrow(userId, providerProfileId);

    if (profile.status !== "validated") {
      throw new AppError(
        400,
        "provider_required",
        "Provider profile must be validated before it can be attached to a project.",
      );
    }

    return profile;
  }

  private async getOwnedProfileOrThrow(userId: string, providerProfileId: string) {
    const profile = await this.store.getProviderProfile(userId, providerProfileId);
    if (!profile) {
      throw new AppError(404, "provider_required", "Provider profile not found.", {
        providerProfileId,
      });
    }
    return profile;
  }

  private resolveBaseUrl(input: ProviderProfileValidationRequest) {
    if (input.preset === "custom") {
      if (!input.baseUrl) {
        throw new AppError(
          400,
          "provider_validation_failed",
          "Custom providers require an explicit base URL.",
        );
      }
      return input.baseUrl;
    }
    return providerBaseUrlByPreset[input.preset];
  }
}
