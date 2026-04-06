import { z } from "zod";

import {
  errorCodeSchema,
  isoUtcTimestampSchema,
  projectStatusSchema,
  providerKindSchema,
  providerPresetSchema,
  providerProfileStatusSchema,
  runStatusSchema,
  starterTemplateIdSchema,
} from "./common.js";
import {
  conversationSchema,
  messageSchema,
  previewSessionSchema,
  projectSchema,
  providerProfileSchema,
  snapshotSchema,
  userSchema,
} from "./entities.js";

export const apiErrorShapeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string().min(1),
    details: z.record(z.unknown()),
  }),
});

export const bootstrapUserSchema = userSchema.pick({
  id: true,
  defaultProviderProfileId: true,
});

export const recentProjectSummarySchema = z.object({
  id: projectSchema.shape.id,
  name: projectSchema.shape.name,
  status: projectStatusSchema,
  updatedAt: isoUtcTimestampSchema,
});

export const bootstrapResponseSchema = z.object({
  user: bootstrapUserSchema,
  providerSetupRequired: z.boolean(),
  recentProjects: z.array(recentProjectSummarySchema),
});

export const providerProfileSummarySchema = providerProfileSchema
  .pick({
    id: true,
    kind: true,
    preset: true,
    displayName: true,
    baseUrl: true,
    defaultModel: true,
    validatedAt: true,
    status: true,
  })
  .extend({
    isDefault: z.boolean(),
  });

export const providerProfileValidationRequestSchema = z.object({
  kind: providerKindSchema,
  preset: providerPresetSchema,
  displayName: z.string().min(1),
  baseUrl: z.string().url().nullable(),
  apiKey: z.string().min(1),
  defaultModel: z.string().min(1),
});

export const providerProfileValidationResponseSchema = z.object({
  valid: z.literal(true),
  resolvedBaseUrl: z.string().url().nullable(),
  resolvedModel: z.string().min(1),
  validatedAt: isoUtcTimestampSchema,
});

export const createProviderProfileRequestSchema = providerProfileValidationRequestSchema;

export const createProviderProfileResponseSchema = providerProfileSchema.pick({
  id: true,
  kind: true,
  preset: true,
  displayName: true,
  baseUrl: true,
  defaultModel: true,
  validatedAt: true,
  status: true,
});

export const updateProviderProfileRequestSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    baseUrl: z.string().url().nullable().optional(),
    apiKey: z.string().min(1).optional(),
    defaultModel: z.string().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one mutable field is required.",
  });

export const makeDefaultProviderProfileResponseSchema = z.object({
  defaultProviderProfileId: providerProfileSchema.shape.id,
});

export const projectListItemSchema = z.object({
  id: projectSchema.shape.id,
  name: projectSchema.shape.name,
  goal: projectSchema.shape.goal,
  templateId: starterTemplateIdSchema,
  status: projectStatusSchema,
  providerProfileId: projectSchema.shape.providerProfileId,
  modelId: projectSchema.shape.modelId,
  updatedAt: isoUtcTimestampSchema,
  lastMessageAt: isoUtcTimestampSchema.nullable(),
});

export const createProjectRequestSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  templateId: starterTemplateIdSchema,
  providerProfileId: providerProfileSchema.shape.id.nullable().optional(),
  modelId: z.string().min(1).nullable().optional(),
});

export const createProjectResponseSchema = z.object({
  id: projectSchema.shape.id,
  name: projectSchema.shape.name,
  goal: projectSchema.shape.goal,
  templateId: starterTemplateIdSchema,
  status: projectStatusSchema,
  conversationId: projectSchema.shape.conversationId,
  providerProfileId: projectSchema.shape.providerProfileId,
  modelId: projectSchema.shape.modelId,
  createdAt: isoUtcTimestampSchema,
});

export const currentRunSummarySchema = z.object({
  id: z.string().min(1),
  triggerMessageId: z.string().min(1),
  status: runStatusSchema,
  startedAt: isoUtcTimestampSchema,
  finishedAt: isoUtcTimestampSchema.nullable(),
  failureReason: z.string().min(1).nullable(),
});

export const currentPreviewSummarySchema = previewSessionSchema.pick({
  id: true,
  status: true,
  url: true,
  startedAt: true,
  lastHeartbeatAt: true,
});

export const latestSnapshotSummarySchema = snapshotSchema.pick({
  id: true,
  label: true,
  runId: true,
  createdAt: true,
});

export const projectDetailResponseSchema = z.object({
  id: projectSchema.shape.id,
  name: projectSchema.shape.name,
  goal: projectSchema.shape.goal,
  templateId: starterTemplateIdSchema,
  status: projectStatusSchema,
  conversationId: projectSchema.shape.conversationId,
  providerProfileId: projectSchema.shape.providerProfileId,
  modelId: projectSchema.shape.modelId,
  createdAt: isoUtcTimestampSchema,
  updatedAt: isoUtcTimestampSchema,
  currentRun: currentRunSummarySchema.nullable(),
  currentPreview: currentPreviewSummarySchema.nullable(),
  latestSnapshot: latestSnapshotSummarySchema.nullable(),
});

export type ApiErrorShape = z.infer<typeof apiErrorShapeSchema>;
export type BootstrapResponse = z.infer<typeof bootstrapResponseSchema>;
export type ProviderProfileSummary = z.infer<typeof providerProfileSummarySchema>;
export type ProviderProfileValidationRequest = z.infer<
  typeof providerProfileValidationRequestSchema
>;
export type ProviderProfileValidationResponse = z.infer<
  typeof providerProfileValidationResponseSchema
>;
export type CreateProviderProfileRequest = z.infer<typeof createProviderProfileRequestSchema>;
export type CreateProviderProfileResponse = z.infer<typeof createProviderProfileResponseSchema>;
export type UpdateProviderProfileRequest = z.infer<typeof updateProviderProfileRequestSchema>;
export type MakeDefaultProviderProfileResponse = z.infer<
  typeof makeDefaultProviderProfileResponseSchema
>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>;
export type ProjectDetailResponse = z.infer<typeof projectDetailResponseSchema>;

// --------------------------------------------------------- conversation

export const conversationResponseSchema = z.object({
  id: conversationSchema.shape.id,
  projectId: conversationSchema.shape.projectId,
  title: conversationSchema.shape.title,
  lastMessageAt: conversationSchema.shape.lastMessageAt,
  messages: z.array(
    messageSchema.pick({ id: true, role: true, content: true, runId: true, createdAt: true }),
  ),
});

export type ConversationResponse = z.infer<typeof conversationResponseSchema>;

// --------------------------------------------------------- file browser

export const fileListEntrySchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["file", "directory"]),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export const fileListResponseSchema = z.object({
  path: z.string().min(1),
  entries: z.array(fileListEntrySchema),
});

export const fileContentResponseSchema = z.object({
  path: z.string().min(1),
  content: z.string().optional(),
  encoding: z.literal("utf-8"),
  isBinary: z.boolean(),
  isTruncated: z.boolean(),
  sizeBytes: z.number().int().nonnegative(),
});

export type FileListEntry = z.infer<typeof fileListEntrySchema>;
export type FileListResponse = z.infer<typeof fileListResponseSchema>;
export type FileContentResponse = z.infer<typeof fileContentResponseSchema>;
