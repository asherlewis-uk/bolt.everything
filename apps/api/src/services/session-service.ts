import {
  type BootstrapResponse,
  type User,
  bootstrapResponseSchema,
} from "@bolt-everything/contracts";

import { AppError } from "../lib/app-error.js";
import { createId } from "../lib/id.js";
import type { AppStore } from "./dev-memory-store.js";

export class SessionService {
  public constructor(private readonly store: AppStore) {}

  /**
   * Resolves the authenticated user for the current request.
   * The session cookie is validated by the auth middleware in app.ts before
   * this is called; here we load the full user record from the store.
   */
  public async requireActiveUser(userId: string): Promise<User> {
    const user = await this.store.getUserById(userId);
    if (!user) {
      throw new AppError(401, "auth_required", "Session user not found.");
    }
    return user;
  }

  /**
   * Used by the auth route on Sign in with Apple callback to find or create a user.
   */
  public async findOrCreateUser(appleSubjectId: string): Promise<User> {
    const existing = await this.store.getUserByAppleSubjectId(appleSubjectId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const candidate: User = {
      id: createId("usr"),
      appleSubjectId,
      createdAt: now,
      defaultProviderProfileId: null,
    };
    // createUser uses onConflictDoNothing in the Drizzle store, so a concurrent
    // sign-in that won the insert race will have already written the user row.
    // We re-fetch to return whichever row actually persisted.
    await this.store.createUser(candidate);
    return (await this.store.getUserByAppleSubjectId(appleSubjectId)) ?? candidate;
  }

  public async getBootstrap(userId: string): Promise<BootstrapResponse> {
    const user = await this.requireActiveUser(userId);

    const allProjects = await this.store.listProjects(user.id);
    const recentProjects = allProjects
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 10)
      .map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        updatedAt: project.updatedAt,
      }));

    const profiles = await this.store.listProviderProfiles(user.id);
    const providerSetupRequired = !profiles.some((profile) => profile.status === "validated");

    return bootstrapResponseSchema.parse({
      user: {
        id: user.id,
        defaultProviderProfileId: user.defaultProviderProfileId,
      },
      providerSetupRequired,
      recentProjects,
    });
  }
}
