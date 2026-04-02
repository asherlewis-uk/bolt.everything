import { z } from "zod";

import { entityIdSchema } from "@bolt-everything/contracts";

export const workspaceContractVersionSchema = z.literal("1.0");
export const workspaceOperationSchema = z.enum([
  "list_files",
  "read_file",
  "create_file",
  "update_file",
  "rename_file",
  "delete_file",
  "install_dependencies",
  "build_project",
  "start_preview",
  "create_snapshot",
  "restore_snapshot",
]);
export const workspaceInitiatorSchema = z.enum(["assistant_run", "user_action", "system"]);
export const workspaceResultStatusSchema = z.enum(["succeeded", "failed"]);
export const workspacePreviewStatusSchema = z.enum([
  "starting",
  "running",
  "failed",
  "unavailable",
]);
export const workspaceErrorCodeSchema = z.enum([
  "invalid_path",
  "reserved_path",
  "file_not_found",
  "already_exists",
  "workspace_unavailable",
  "operation_not_configured",
  "preview_not_available",
  "snapshot_not_found",
  "operation_failed",
]);

export const workspacePathSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith("/"), {
    message: "Workspace paths must be rooted at /.",
  })
  .refine((value) => !value.includes("\\"), {
    message: "Workspace paths must use forward slashes.",
  })
  .refine((value) => !value.includes(".."), {
    message: "Workspace paths must not traverse upward.",
  });

export const workspaceContextSchema = z.object({
  projectId: entityIdSchema,
  conversationId: entityIdSchema.nullable().optional(),
  runId: entityIdSchema.nullable().optional(),
  initiator: workspaceInitiatorSchema,
});

export const workspaceRequestBaseSchema = z.object({
  contractVersion: workspaceContractVersionSchema,
  workspaceId: entityIdSchema,
  operationId: entityIdSchema,
  context: workspaceContextSchema,
});

export const listFilesPayloadSchema = z.object({
  path: workspacePathSchema,
  depth: z.number().int().min(0),
  includeSystem: z.boolean(),
});

export const readFilePayloadSchema = z.object({
  path: workspacePathSchema,
});

export const createFilePayloadSchema = z.object({
  path: workspacePathSchema,
  content: z.string(),
  encoding: z.literal("utf-8"),
});

export const updateFilePayloadSchema = createFilePayloadSchema;

export const renameFilePayloadSchema = z.object({
  fromPath: workspacePathSchema,
  toPath: workspacePathSchema,
});

export const deleteFilePayloadSchema = z.object({
  path: workspacePathSchema,
});

export const installDependenciesPayloadSchema = z.object({});
export const buildProjectPayloadSchema = z.object({});

export const startPreviewPayloadSchema = z.object({
  restartIfRunning: z.boolean(),
});

export const createSnapshotPayloadSchema = z.object({
  label: z.string().min(1),
});

export const restoreSnapshotPayloadSchema = z.object({
  snapshotRef: z.string().min(1),
});

export const workspaceRequestSchema = z.discriminatedUnion("operation", [
  workspaceRequestBaseSchema.extend({
    operation: z.literal("list_files"),
    payload: listFilesPayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("read_file"),
    payload: readFilePayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("create_file"),
    payload: createFilePayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("update_file"),
    payload: updateFilePayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("rename_file"),
    payload: renameFilePayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("delete_file"),
    payload: deleteFilePayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("install_dependencies"),
    payload: installDependenciesPayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("build_project"),
    payload: buildProjectPayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("start_preview"),
    payload: startPreviewPayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("create_snapshot"),
    payload: createSnapshotPayloadSchema,
  }),
  workspaceRequestBaseSchema.extend({
    operation: z.literal("restore_snapshot"),
    payload: restoreSnapshotPayloadSchema,
  }),
]);

export const workspaceListEntrySchema = z.object({
  path: workspacePathSchema,
  name: z.string().min(1),
  kind: z.enum(["file", "directory"]),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export const workspaceResultPayloadSchema = z.union([
  z.object({
    path: workspacePathSchema,
    entries: z.array(workspaceListEntrySchema),
  }),
  z.object({
    path: workspacePathSchema,
    content: z.string().optional(),
    encoding: z.literal("utf-8"),
    isBinary: z.boolean(),
    isTruncated: z.boolean(),
    sizeBytes: z.number().int().nonnegative(),
  }),
  z.object({
    path: workspacePathSchema,
    operation: z.enum(["created", "updated", "deleted"]),
  }),
  z.object({
    fromPath: workspacePathSchema,
    toPath: workspacePathSchema,
    operation: z.literal("renamed"),
  }),
  z.object({
    operation: z.enum(["install_dependencies", "build_project"]),
    configuredBy: z.string().min(1),
    summary: z.string().min(1),
  }),
  z.object({
    operation: z.literal("start_preview"),
    configuredBy: z.string().min(1),
    status: workspacePreviewStatusSchema,
    url: z.string().url().nullable(),
  }),
  z.object({
    snapshotRef: z.string().min(1),
    label: z.string().min(1).optional(),
    operation: z.literal("restored").optional(),
  }),
  z.object({}),
]);

export const workspaceErrorSchema = z.object({
  code: workspaceErrorCodeSchema,
  message: z.string().min(1),
  details: z.record(z.unknown()),
});

export const workspaceResultSchema = z.object({
  contractVersion: workspaceContractVersionSchema,
  workspaceId: entityIdSchema,
  operationId: entityIdSchema,
  operation: workspaceOperationSchema,
  status: workspaceResultStatusSchema,
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }),
  result: workspaceResultPayloadSchema,
  error: workspaceErrorSchema.nullable(),
});

export const workspaceProgressSchema = z.object({
  operationId: entityIdSchema,
  operation: workspaceOperationSchema,
  level: z.enum(["info", "warn", "error"]),
  chunk: z.string(),
  occurredAt: z.string().datetime({ offset: true }),
});

export type WorkspaceOperation = z.infer<typeof workspaceOperationSchema>;
export type WorkspaceRequest = z.infer<typeof workspaceRequestSchema>;
export type WorkspaceResult = z.infer<typeof workspaceResultSchema>;
export type WorkspaceError = z.infer<typeof workspaceErrorSchema>;
