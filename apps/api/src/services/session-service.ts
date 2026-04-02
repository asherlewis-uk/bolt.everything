import {
  type BootstrapResponse,
  type User,
  bootstrapResponseSchema,
} from "@bolt-everything/contracts";

import type { DevMemoryStore } from "./dev-memory-store.js";

export class SessionService {
  public constructor(private readonly store: DevMemoryStore) {}

  public async requireActiveUser(): Promise<User> {
    // TODO: Bind authenticated backend sessions to Sign in with Apple identities.
    return this.store.getUser();
  }

  public async getBootstrap(): Promise<BootstrapResponse> {
    const user = await this.requireActiveUser();
    const recentProjects = this.store
      .listProjects(user.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 10)
      .map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        updatedAt: project.updatedAt,
      }));

    const providerSetupRequired = !this.store
      .listProviderProfiles(user.id)
      .some((profile) => profile.status === "validated");

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
