import type {
  Conversation,
  PreviewSession,
  Project,
  ProviderProfile,
  Snapshot,
  User,
} from "@bolt-everything/contracts";

/**
 * Fully-async store interface.
 * In-memory implementation is used in development/test; the Drizzle implementation
 * is used in production once DATABASE_URL is set.
 */
export interface AppStore {
  // Users
  getUserById(userId: string): Promise<User | null>;
  getUserByAppleSubjectId(appleSubjectId: string): Promise<User | null>;
  createUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  // Provider profiles
  listProviderProfiles(userId: string): Promise<ProviderProfile[]>;
  getProviderProfile(userId: string, providerProfileId: string): Promise<ProviderProfile | null>;
  saveProviderProfile(profile: ProviderProfile): Promise<void>;
  // Projects
  listProjects(userId: string): Promise<Project[]>;
  getProject(userId: string, projectId: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  // Conversations
  getConversationByProject(projectId: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  // Snapshots
  saveSnapshot(snapshot: Snapshot): Promise<void>;
  listSnapshots(projectId: string): Promise<Snapshot[]>;
  getLatestSnapshot(projectId: string): Promise<Snapshot | null>;
  // Preview sessions
  getPreviewSession(projectId: string): Promise<PreviewSession | null>;
}

// Keep the old export name so existing imports don't break during the transition.
export type DevMemoryStore = AppStore;

interface DevMemoryState {
  users: User[];
  providerProfiles: ProviderProfile[];
  projects: Project[];
  conversations: Conversation[];
  snapshots: Snapshot[];
  previewSessions: PreviewSession[];
}

export function createDevMemoryStore(): AppStore {
  const createdAt = "2026-04-01T18:00:00Z";

  // TODO: This process-local store is used in development/test only.
  // Production uses the Drizzle-backed store in src/db/drizzle-store.ts.
  const state: DevMemoryState = {
    users: [
      {
        id: "usr_phase1",
        appleSubjectId: "apple_subject_todo",
        createdAt,
        defaultProviderProfileId: null,
      },
    ],
    providerProfiles: [],
    projects: [],
    conversations: [],
    snapshots: [],
    previewSessions: [],
  };

  return {
    async getUserById(userId) {
      return state.users.find((u) => u.id === userId) ?? null;
    },

    async getUserByAppleSubjectId(appleSubjectId) {
      return state.users.find((u) => u.appleSubjectId === appleSubjectId) ?? null;
    },

    async createUser(user) {
      state.users.push(user);
    },

    async updateUser(user) {
      const index = state.users.findIndex((u) => u.id === user.id);
      if (index >= 0) {
        state.users[index] = user;
      }
    },

    async listProviderProfiles(userId) {
      return state.providerProfiles.filter((profile) => profile.userId === userId);
    },

    async getProviderProfile(userId, providerProfileId) {
      return (
        state.providerProfiles.find(
          (profile) => profile.userId === userId && profile.id === providerProfileId,
        ) ?? null
      );
    },

    async saveProviderProfile(profile) {
      const index = state.providerProfiles.findIndex((entry) => entry.id === profile.id);
      if (index >= 0) {
        state.providerProfiles[index] = profile;
        return;
      }
      state.providerProfiles.push(profile);
    },

    async listProjects(userId) {
      return state.projects.filter((project) => project.userId === userId);
    },

    async getProject(userId, projectId) {
      return (
        state.projects.find((project) => project.userId === userId && project.id === projectId) ??
        null
      );
    },

    async saveProject(project) {
      const index = state.projects.findIndex((entry) => entry.id === project.id);
      if (index >= 0) {
        state.projects[index] = project;
        return;
      }
      state.projects.push(project);
    },

    async getConversationByProject(projectId) {
      return (
        state.conversations.find((conversation) => conversation.projectId === projectId) ?? null
      );
    },

    async saveConversation(conversation) {
      const index = state.conversations.findIndex((entry) => entry.id === conversation.id);
      if (index >= 0) {
        state.conversations[index] = conversation;
        return;
      }
      state.conversations.push(conversation);
    },

    async saveSnapshot(snapshot) {
      const index = state.snapshots.findIndex((entry) => entry.id === snapshot.id);
      if (index >= 0) {
        state.snapshots[index] = snapshot;
        return;
      }
      state.snapshots.push(snapshot);
    },

    async listSnapshots(projectId) {
      return state.snapshots.filter((snapshot) => snapshot.projectId === projectId);
    },

    async getLatestSnapshot(projectId) {
      return (
        state.snapshots
          .filter((snapshot) => snapshot.projectId === projectId)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
      );
    },

    async getPreviewSession(projectId) {
      return state.previewSessions.find((session) => session.projectId === projectId) ?? null;
    },
  };
}
