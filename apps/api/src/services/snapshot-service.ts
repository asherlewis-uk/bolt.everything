import { type Project, type Snapshot, snapshotSchema } from "@bolt-everything/contracts";

import { createId } from "../lib/id.js";
import type { AppStore } from "./dev-memory-store.js";
import type { WorkspaceServiceAdapter } from "./workspace-service-adapter.js";

export class SnapshotService {
  public constructor(
    private readonly store: AppStore,
    private readonly workspaceServiceAdapter: WorkspaceServiceAdapter,
  ) {}

  public async createInitialSnapshot(project: Project): Promise<Snapshot> {
    void this.workspaceServiceAdapter;

    const createdAt = new Date().toISOString();
    const snapshot = snapshotSchema.parse({
      id: createId("snp"),
      projectId: project.id,
      runId: null,
      label: "Initial project bootstrap",
      storageRef: `snapshots/${project.id}/initial.tar.zst`,
      createdAt,
    });

    // TODO: Invoke create_snapshot via the workspace contract once the real
    // workspace adapter can archive workspace state.
    await this.store.saveSnapshot(snapshot);
    return snapshot;
  }
}
