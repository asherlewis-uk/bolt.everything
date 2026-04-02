import { z } from "zod";

import { isoUtcTimestampSchema, starterTemplateIdSchema } from "@bolt-everything/contracts";

export const projectWorkspaceManifestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  projectId: z.string().min(1),
  templateId: starterTemplateIdSchema,
  executionProfile: z.string().min(1),
  installOperation: z.string().min(1).nullable(),
  buildOperation: z.string().min(1).nullable(),
  previewOperation: z.string().min(1).nullable(),
  createdAt: isoUtcTimestampSchema,
});

export type ProjectWorkspaceManifest = z.infer<typeof projectWorkspaceManifestSchema>;
