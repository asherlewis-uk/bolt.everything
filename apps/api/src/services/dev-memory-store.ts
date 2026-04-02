import type {
  Conversation,
  PreviewSession,
  Project,
  ProviderProfile,
  Snapshot,
  User,
} from "@bolt-everything/contracts";

export interface DevMemoryStore {
  getUser(): User;
  updateUser(user: User): void;
  listProviderProfiles(userId: string): ProviderProfile[];
  getProviderProfile(userId: string, providerProfileId: string): ProviderProfile | null;
  saveProviderProfile(profile: ProviderProfile): void;
  listProjects(userId: string): Project[];
  getProject(userId: string, projectId: string): Project | null;
  saveProject(project: Project): void;
  getConversationByProject(projectId: string): Conversation | null;
  saveConversation(conversation: Conversation): void;
  saveSnapshot(snapshot: Snapshot): void;
  listSnapshots(projectId: string): Snapshot[];
  getLatestSnapshot(projectId: string): Snapshot | null;
  getPreviewSession(projectId: string): PreviewSession | null;
}

interface DevMemoryState {
  user: User;
  providerProfiles: ProviderProfile[];
  projects: Project[];
  conversations: Conversation[];
  snapshots: Snapshot[];
  previewSessions: PreviewSession[];
}

export function createDevMemoryStore(): DevMemoryStore {
  const createdAt = "2026-04-01T18:00:00Z";

  // TODO: Replace this process-local store with Drizzle-backed repositories and
  // Sign in with Apple session ownership once Phase 1 persistence/auth is implemented.
  const state: DevMemoryState = {
    user: {
      id: "usr_phase1",
      appleSubjectId: "apple_subject_todo",
      createdAt,
      defaultProviderProfileId: null,
    },
    providerProfiles: [],
    projects: [],
    conversations: [],
    snapshots: [],
    previewSessions: [],
  };

  return {
    getUser() {
      return state.user;
    },
    updateUser(user) {
      state.user = user;
    },
    listProviderProfiles(userId) {
      return state.providerProfiles.filter((profile) => profile.userId === userId);
    },
    getProviderProfile(userId, providerProfileId) {
      return (
        state.providerProfiles.find(
          (profile) => profile.userId === userId && profile.id === providerProfileId,
        ) ?? null
      );
    },
    saveProviderProfile(profile) {
      const index = state.providerProfiles.findIndex((entry) => entry.id === profile.id);

      if (index >= 0) {
        state.providerProfiles[index] = profile;
        return;
      }

      state.providerProfiles.push(profile);
    },
    listProjects(userId) {
      return state.projects.filter((project) => project.userId === userId);
    },
    getProject(userId, projectId) {
      return (
        state.projects.find((project) => project.userId === userId && project.id === projectId) ??
        null
      );
    },
    saveProject(project) {
      const index = state.projects.findIndex((entry) => entry.id === project.id);

      if (index >= 0) {
        state.projects[index] = project;
        return;
      }

      state.projects.push(project);
    },
    getConversationByProject(projectId) {
      return (
        state.conversations.find((conversation) => conversation.projectId === projectId) ?? null
      );
    },
    saveConversation(conversation) {
      const index = state.conversations.findIndex((entry) => entry.id === conversation.id);

      if (index >= 0) {
        state.conversations[index] = conversation;
        return;
      }

      state.conversations.push(conversation);
    },
    saveSnapshot(snapshot) {
      const index = state.snapshots.findIndex((entry) => entry.id === snapshot.id);

      if (index >= 0) {
        state.snapshots[index] = snapshot;
        return;
      }

      state.snapshots.push(snapshot);
    },
    listSnapshots(projectId) {
      return state.snapshots.filter((snapshot) => snapshot.projectId === projectId);
    },
    getLatestSnapshot(projectId) {
      return (
        state.snapshots
          .filter((snapshot) => snapshot.projectId === projectId)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
      );
    },
    getPreviewSession(projectId) {
      return state.previewSessions.find((session) => session.projectId === projectId) ?? null;
    },
  };
}
