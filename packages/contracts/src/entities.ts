import { z } from "zod";

import {
  entityIdSchema,
  fileChangeOperationSchema,
  isoUtcTimestampSchema,
  messageRoleSchema,
  optionalEntityIdSchema,
  previewStatusSchema,
  projectStatusSchema,
  providerKindSchema,
  providerPresetSchema,
  providerProfileStatusSchema,
  runStatusSchema,
  starterTemplateIdSchema,
} from "./common.js";

export const userSchema = z.object({
  id: entityIdSchema,
  appleSubjectId: z.string().min(1),
  createdAt: isoUtcTimestampSchema,
  defaultProviderProfileId: optionalEntityIdSchema,
});

export const providerProfileSchema = z.object({
  id: entityIdSchema,
  userId: entityIdSchema,
  kind: providerKindSchema,
  preset: providerPresetSchema,
  displayName: z.string().min(1),
  baseUrl: z.string().url().nullable(),
  apiKeyRef: z.string().min(1),
  defaultModel: z.string().min(1),
  validatedAt: isoUtcTimestampSchema.nullable(),
  status: providerProfileStatusSchema,
  createdAt: isoUtcTimestampSchema,
  updatedAt: isoUtcTimestampSchema,
});

export const projectSchema = z.object({
  id: entityIdSchema,
  userId: entityIdSchema,
  name: z.string().min(1),
  goal: z.string().min(1),
  templateId: starterTemplateIdSchema,
  workspaceId: entityIdSchema,
  conversationId: entityIdSchema,
  providerProfileId: optionalEntityIdSchema,
  modelId: z.string().min(1).nullable(),
  status: projectStatusSchema,
  createdAt: isoUtcTimestampSchema,
  updatedAt: isoUtcTimestampSchema,
});

export const conversationSchema = z.object({
  id: entityIdSchema,
  projectId: entityIdSchema,
  title: z.string().min(1),
  lastMessageAt: isoUtcTimestampSchema.nullable(),
});

export const messageSchema = z.object({
  id: entityIdSchema,
  conversationId: entityIdSchema,
  role: messageRoleSchema,
  content: z.string().min(1),
  runId: optionalEntityIdSchema,
  createdAt: isoUtcTimestampSchema,
});

export const runSchema = z.object({
  id: entityIdSchema,
  projectId: entityIdSchema,
  conversationId: entityIdSchema,
  triggerMessageId: entityIdSchema,
  status: runStatusSchema,
  startedAt: isoUtcTimestampSchema,
  finishedAt: isoUtcTimestampSchema.nullable(),
  failureReason: z.string().min(1).nullable(),
});

export const fileChangeSchema = z.object({
  id: entityIdSchema,
  runId: entityIdSchema,
  path: z.string().min(1),
  operation: fileChangeOperationSchema,
  summary: z.string().min(1),
  bytesChanged: z.number().int().nullable(),
});

export const snapshotSchema = z.object({
  id: entityIdSchema,
  projectId: entityIdSchema,
  runId: optionalEntityIdSchema,
  label: z.string().min(1),
  storageRef: z.string().min(1),
  createdAt: isoUtcTimestampSchema,
});

export const previewSessionSchema = z.object({
  id: entityIdSchema,
  projectId: entityIdSchema,
  runId: optionalEntityIdSchema,
  previewOperation: z.string().min(1),
  status: previewStatusSchema,
  url: z.string().url().nullable(),
  port: z.number().int().nullable(),
  startedAt: isoUtcTimestampSchema,
  lastHeartbeatAt: isoUtcTimestampSchema.nullable(),
});

export const exportSchema = z.object({
  id: entityIdSchema,
  projectId: entityIdSchema,
  snapshotId: entityIdSchema,
  storageRef: z.string().min(1),
  createdAt: isoUtcTimestampSchema,
});

export type User = z.infer<typeof userSchema>;
export type ProviderProfile = z.infer<typeof providerProfileSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Run = z.infer<typeof runSchema>;
export type FileChange = z.infer<typeof fileChangeSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type PreviewSession = z.infer<typeof previewSessionSchema>;
export type Export = z.infer<typeof exportSchema>;
