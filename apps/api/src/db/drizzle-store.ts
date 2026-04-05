/**
 * Drizzle (PostgreSQL) implementation of AppStore.
 * Used in production when DATABASE_URL is set.
 */

import { and, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type {
  Conversation,
  PreviewSession,
  Project,
  ProviderProfile,
  Snapshot,
  User,
} from "@bolt-everything/contracts";

import type { AppStore } from "../services/dev-memory-store.js";
import {
  conversationsTable,
  previewSessionsTable,
  projectsTable,
  providerProfilesTable,
  snapshotsTable,
  usersTable,
} from "./schema.js";

// biome-ignore lint/suspicious/noExplicitAny: Drizzle generics vary by schema config
type DB = NodePgDatabase<any>;

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function toIsoRequired(date: Date): string {
  return date.toISOString();
}

export function createDrizzleStore(db: DB): AppStore {
  return {
    // ------------------------------------------------------------------ users

    async getUserById(userId) {
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        appleSubjectId: row.appleSubjectId,
        createdAt: toIsoRequired(row.createdAt),
        defaultProviderProfileId: row.defaultProviderProfileId ?? null,
      };
    },

    async getUserByAppleSubjectId(appleSubjectId) {
      const rows = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.appleSubjectId, appleSubjectId))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        appleSubjectId: row.appleSubjectId,
        createdAt: toIsoRequired(row.createdAt),
        defaultProviderProfileId: row.defaultProviderProfileId ?? null,
      };
    },

    async createUser(user) {
      // onConflictDoNothing guards against a race where two concurrent sign-ins
      // for the same Apple subject ID both pass the "user not found" check and
      // attempt to insert.  The losing INSERT is silently ignored; the caller
      // re-fetches the winning row.
      await db
        .insert(usersTable)
        .values({
          id: user.id,
          appleSubjectId: user.appleSubjectId,
          createdAt: new Date(user.createdAt),
          defaultProviderProfileId: user.defaultProviderProfileId ?? null,
        })
        .onConflictDoNothing();
    },

    async updateUser(user) {
      await db
        .update(usersTable)
        .set({ defaultProviderProfileId: user.defaultProviderProfileId ?? null })
        .where(eq(usersTable.id, user.id));
    },

    // --------------------------------------------------------- provider profiles

    async listProviderProfiles(userId) {
      const rows = await db
        .select()
        .from(providerProfilesTable)
        .where(eq(providerProfilesTable.userId, userId));
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        kind: row.kind as ProviderProfile["kind"],
        preset: row.preset as ProviderProfile["preset"],
        displayName: row.displayName,
        baseUrl: row.baseUrl ?? null,
        apiKeyRef: row.apiKeyRef,
        defaultModel: row.defaultModel,
        validatedAt: toIso(row.validatedAt),
        status: row.status as ProviderProfile["status"],
        createdAt: toIsoRequired(row.createdAt),
        updatedAt: toIsoRequired(row.updatedAt),
      }));
    },

    async getProviderProfile(userId, providerProfileId) {
      const rows = await db
        .select()
        .from(providerProfilesTable)
        .where(
          and(
            eq(providerProfilesTable.userId, userId),
            eq(providerProfilesTable.id, providerProfileId),
          ),
        )
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        kind: row.kind as ProviderProfile["kind"],
        preset: row.preset as ProviderProfile["preset"],
        displayName: row.displayName,
        baseUrl: row.baseUrl ?? null,
        apiKeyRef: row.apiKeyRef,
        defaultModel: row.defaultModel,
        validatedAt: toIso(row.validatedAt),
        status: row.status as ProviderProfile["status"],
        createdAt: toIsoRequired(row.createdAt),
        updatedAt: toIsoRequired(row.updatedAt),
      };
    },

    async saveProviderProfile(profile) {
      await db
        .insert(providerProfilesTable)
        .values({
          id: profile.id,
          userId: profile.userId,
          kind: profile.kind,
          preset: profile.preset,
          displayName: profile.displayName,
          baseUrl: profile.baseUrl ?? null,
          apiKeyRef: profile.apiKeyRef,
          defaultModel: profile.defaultModel,
          validatedAt: profile.validatedAt ? new Date(profile.validatedAt) : null,
          status: profile.status,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt),
        })
        .onConflictDoUpdate({
          target: providerProfilesTable.id,
          set: {
            displayName: profile.displayName,
            baseUrl: profile.baseUrl ?? null,
            apiKeyRef: profile.apiKeyRef,
            defaultModel: profile.defaultModel,
            validatedAt: profile.validatedAt ? new Date(profile.validatedAt) : null,
            status: profile.status,
            updatedAt: new Date(profile.updatedAt),
          },
        });
    },

    // ---------------------------------------------------------------- projects

    async listProjects(userId) {
      const rows = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.userId, userId))
        .orderBy(desc(projectsTable.updatedAt));
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        name: row.name,
        goal: row.goal,
        templateId: row.templateId as Project["templateId"],
        workspaceId: row.workspaceId,
        conversationId: row.conversationId,
        providerProfileId: row.providerProfileId ?? null,
        modelId: row.modelId ?? null,
        status: row.status as Project["status"],
        createdAt: toIsoRequired(row.createdAt),
        updatedAt: toIsoRequired(row.updatedAt),
      }));
    },

    async getProject(userId, projectId) {
      const rows = await db
        .select()
        .from(projectsTable)
        .where(and(eq(projectsTable.userId, userId), eq(projectsTable.id, projectId)))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        goal: row.goal,
        templateId: row.templateId as Project["templateId"],
        workspaceId: row.workspaceId,
        conversationId: row.conversationId,
        providerProfileId: row.providerProfileId ?? null,
        modelId: row.modelId ?? null,
        status: row.status as Project["status"],
        createdAt: toIsoRequired(row.createdAt),
        updatedAt: toIsoRequired(row.updatedAt),
      };
    },

    async saveProject(project) {
      await db
        .insert(projectsTable)
        .values({
          id: project.id,
          userId: project.userId,
          name: project.name,
          goal: project.goal,
          templateId: project.templateId,
          workspaceId: project.workspaceId,
          conversationId: project.conversationId,
          providerProfileId: project.providerProfileId ?? null,
          modelId: project.modelId ?? null,
          status: project.status,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        })
        .onConflictDoUpdate({
          target: projectsTable.id,
          set: {
            name: project.name,
            goal: project.goal,
            providerProfileId: project.providerProfileId ?? null,
            modelId: project.modelId ?? null,
            status: project.status,
            updatedAt: new Date(project.updatedAt),
          },
        });
    },

    // ----------------------------------------------------------- conversations

    async getConversationByProject(projectId) {
      const rows = await db
        .select()
        .from(conversationsTable)
        .where(eq(conversationsTable.projectId, projectId))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        projectId: row.projectId,
        title: row.title,
        lastMessageAt: toIso(row.lastMessageAt),
      };
    },

    async saveConversation(conversation) {
      await db
        .insert(conversationsTable)
        .values({
          id: conversation.id,
          projectId: conversation.projectId,
          title: conversation.title,
          lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt) : null,
        })
        .onConflictDoUpdate({
          target: conversationsTable.id,
          set: {
            title: conversation.title,
            lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt) : null,
          },
        });
    },

    // ---------------------------------------------------------------- snapshots

    async saveSnapshot(snapshot) {
      await db
        .insert(snapshotsTable)
        .values({
          id: snapshot.id,
          projectId: snapshot.projectId,
          runId: snapshot.runId ?? null,
          label: snapshot.label,
          storageRef: snapshot.storageRef,
          createdAt: new Date(snapshot.createdAt),
        })
        .onConflictDoUpdate({
          target: snapshotsTable.id,
          set: { label: snapshot.label },
        });
    },

    async listSnapshots(projectId) {
      const rows = await db
        .select()
        .from(snapshotsTable)
        .where(eq(snapshotsTable.projectId, projectId))
        .orderBy(desc(snapshotsTable.createdAt));
      return rows.map((row) => ({
        id: row.id,
        projectId: row.projectId,
        runId: row.runId ?? null,
        label: row.label,
        storageRef: row.storageRef,
        createdAt: toIsoRequired(row.createdAt),
      }));
    },

    async getLatestSnapshot(projectId) {
      const rows = await db
        .select()
        .from(snapshotsTable)
        .where(eq(snapshotsTable.projectId, projectId))
        .orderBy(desc(snapshotsTable.createdAt))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        projectId: row.projectId,
        runId: row.runId ?? null,
        label: row.label,
        storageRef: row.storageRef,
        createdAt: toIsoRequired(row.createdAt),
      };
    },

    // --------------------------------------------------------- preview sessions

    async getPreviewSession(projectId) {
      const rows = await db
        .select()
        .from(previewSessionsTable)
        .where(eq(previewSessionsTable.projectId, projectId))
        .orderBy(desc(previewSessionsTable.startedAt))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        projectId: row.projectId,
        runId: row.runId ?? null,
        previewOperation: row.previewOperation,
        status: row.status as PreviewSession["status"],
        url: row.url ?? null,
        port: row.port ?? null,
        startedAt: toIsoRequired(row.startedAt),
        lastHeartbeatAt: toIso(row.lastHeartbeatAt),
      };
    },
  };
}
