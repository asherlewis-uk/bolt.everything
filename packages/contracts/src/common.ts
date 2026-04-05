import { z } from "zod";

export const isoUtcTimestampSchema = z.string().datetime({ offset: true });
export const entityIdSchema = z.string().min(1);
export const optionalEntityIdSchema = entityIdSchema.nullable();

export const providerKindSchema = z.literal("openai_compatible");
export const providerPresetSchema = z.enum(["openai", "openrouter", "custom"]);
export const providerProfileStatusSchema = z.enum([
  "pending_validation",
  "validated",
  "validation_failed",
]);

export const starterTemplateIdSchema = z.enum(["react_vite", "nextjs", "node_typescript"]);
export const projectStatusSchema = z.enum([
  "creating",
  "ready",
  "running",
  "needs_attention",
  "archived",
]);
export const messageRoleSchema = z.enum(["user", "assistant"]);
export const runStatusSchema = z.enum(["queued", "running", "succeeded", "failed", "cancelled"]);
export const fileChangeOperationSchema = z.enum(["created", "updated", "renamed", "deleted"]);
export const previewStatusSchema = z.enum(["starting", "running", "failed", "unavailable"]);
export const exportStatusSchema = z.enum(["queued", "ready", "failed"]);

export const errorCodeSchema = z.enum([
  "auth_required",
  "invalid_request",
  "provider_validation_failed",
  "provider_required",
  "unknown_model",
  "project_not_found",
  "conversation_not_found",
  "active_run_exists",
  "run_not_found",
  "file_not_found",
  "snapshot_not_found",
  "preview_not_available",
  "workspace_unavailable",
  "forbidden_operation",
]);

export const providerBaseUrlByPreset = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  custom: null,
} as const;

export type ProviderKind = z.infer<typeof providerKindSchema>;
export type ProviderPreset = z.infer<typeof providerPresetSchema>;
export type ProviderProfileStatus = z.infer<typeof providerProfileStatusSchema>;
export type StarterTemplateId = z.infer<typeof starterTemplateIdSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type MessageRole = z.infer<typeof messageRoleSchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;
export type FileChangeOperation = z.infer<typeof fileChangeOperationSchema>;
export type PreviewStatus = z.infer<typeof previewStatusSchema>;
export type ExportStatus = z.infer<typeof exportStatusSchema>;
export type ErrorCode = z.infer<typeof errorCodeSchema>;
