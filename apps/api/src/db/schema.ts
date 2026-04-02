import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    appleSubjectId: text("apple_subject_id").notNull(),
    defaultProviderProfileId: text("default_provider_profile_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    appleSubjectIdUnique: uniqueIndex("users_apple_subject_id_unique").on(table.appleSubjectId),
  }),
);

export const providerProfilesTable = pgTable(
  "provider_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    preset: text("preset").notNull(),
    displayName: text("display_name").notNull(),
    baseUrl: text("base_url"),
    apiKeyRef: text("api_key_ref").notNull(),
    defaultModel: text("default_model").notNull(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    providerProfilesUserIdIndex: index("provider_profiles_user_id_idx").on(table.userId),
  }),
);

export const workspacesTable = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    implementation: text("implementation").notNull(),
    storageRef: text("storage_ref").notNull(),
    state: text("state").notNull(),
    lastReadyAt: timestamp("last_ready_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    workspacesProjectIdUnique: uniqueIndex("workspaces_project_id_unique").on(table.projectId),
  }),
);

export const projectsTable = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    goal: text("goal").notNull(),
    templateId: text("template_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    conversationId: text("conversation_id").notNull(),
    providerProfileId: text("provider_profile_id"),
    modelId: text("model_id"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    projectsUserIdIndex: index("projects_user_id_idx").on(table.userId),
  }),
);

export const conversationsTable = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    title: text("title").notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  },
  (table) => ({
    conversationsProjectIdUnique: uniqueIndex("conversations_project_id_unique").on(
      table.projectId,
    ),
  }),
);

export const messagesTable = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    runId: text("run_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    messagesConversationIdIndex: index("messages_conversation_id_idx").on(table.conversationId),
  }),
);

export const runsTable = pgTable(
  "runs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    conversationId: text("conversation_id").notNull(),
    triggerMessageId: text("trigger_message_id").notNull(),
    status: text("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
  },
  (table) => ({
    runsProjectIdIndex: index("runs_project_id_idx").on(table.projectId),
  }),
);

export const fileChangesTable = pgTable(
  "file_changes",
  {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    path: text("path").notNull(),
    operation: text("operation").notNull(),
    summary: text("summary").notNull(),
    bytesChanged: integer("bytes_changed"),
  },
  (table) => ({
    fileChangesRunIdIndex: index("file_changes_run_id_idx").on(table.runId),
  }),
);

export const snapshotsTable = pgTable(
  "snapshots",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    runId: text("run_id"),
    label: text("label").notNull(),
    storageRef: text("storage_ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    snapshotsProjectIdIndex: index("snapshots_project_id_idx").on(table.projectId),
  }),
);

export const previewSessionsTable = pgTable(
  "preview_sessions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    runId: text("run_id"),
    previewOperation: text("preview_operation").notNull(),
    status: text("status").notNull(),
    url: text("url"),
    port: integer("port"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
  },
  (table) => ({
    previewSessionsProjectIdIndex: index("preview_sessions_project_id_idx").on(table.projectId),
  }),
);

export const exportsTable = pgTable(
  "exports",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    snapshotId: text("snapshot_id").notNull(),
    storageRef: text("storage_ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    exportsProjectIdIndex: index("exports_project_id_idx").on(table.projectId),
  }),
);
