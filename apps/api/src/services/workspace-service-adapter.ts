/**
 * WorkspaceServiceAdapter — filesystem-backed implementation of the
 * Project Workspace Contract for Phase 1.
 *
 * Storage layout on disk:
 *   {baseDir}/workspaces/{workspaceId}/   — live workspace files
 *   {baseDir}/snapshots/{snapshotId}/    — point-in-time directory copies
 *
 * The storageRef stored in the workspace record is the absolute path to the
 * workspace root directory.  Snapshot storageRefs are absolute paths to the
 * snapshot directory.
 *
 * Phase 3 will add the write operations (create_file, update_file, etc.) and
 * subprocess execution (install_dependencies, build_project, start_preview).
 * Those operations throw WorkspaceNotImplemented until then.
 */

import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { type StarterTemplateId, starterTemplateIdSchema } from "@bolt-everything/contracts";
import {
  type ProjectWorkspaceManifest,
  projectWorkspaceManifestSchema,
} from "@bolt-everything/workspace-contract";

import { createId } from "../lib/id.js";
import { NEXTJS_FILES } from "../templates/nextjs.js";
import { NODE_TYPESCRIPT_FILES } from "../templates/node_typescript.js";
import { REACT_VITE_FILES } from "../templates/react_vite.js";
import type { AppStore } from "./dev-memory-store.js";

// ----------------------------------------------------------------- types

export interface ProjectBootstrapResult {
  workspaceId: string;
  storageRef: string;
  implementation: "filesystem";
  state: "ready";
  manifest: ProjectWorkspaceManifest;
}

export interface WorkspaceListEntry {
  path: string;
  name: string;
  kind: "file" | "directory";
  sizeBytes?: number;
}

export interface WorkspaceFileContent {
  path: string;
  content: string | undefined;
  encoding: "utf-8";
  isBinary: boolean;
  isTruncated: boolean;
  sizeBytes: number;
}

// ----------------------------------------------------------------- constants

const MAX_READ_BYTES = 512 * 1024; // 512 KB truncation limit

const RESERVED_PREFIX = "/.bolt-everything/";

const MANIFEST_BY_TEMPLATE: Record<
  StarterTemplateId,
  Pick<
    ProjectWorkspaceManifest,
    "executionProfile" | "installOperation" | "buildOperation" | "previewOperation"
  >
> = {
  react_vite: {
    executionProfile: "node_pnpm_workspace",
    installOperation: "react_vite_install",
    buildOperation: "react_vite_build",
    previewOperation: "react_vite_preview",
  },
  nextjs: {
    executionProfile: "node_pnpm_workspace",
    installOperation: "nextjs_install",
    buildOperation: "nextjs_build",
    previewOperation: "nextjs_preview",
  },
  node_typescript: {
    executionProfile: "node_pnpm_workspace",
    installOperation: "node_typescript_install",
    buildOperation: "node_typescript_build",
    previewOperation: null,
  },
};

const FILES_BY_TEMPLATE: Record<StarterTemplateId, Record<string, string>> = {
  react_vite: REACT_VITE_FILES,
  nextjs: NEXTJS_FILES,
  node_typescript: NODE_TYPESCRIPT_FILES,
};

// ----------------------------------------------------------------- adapter

export class WorkspaceServiceAdapter {
  public constructor(
    private readonly store: AppStore,
    private readonly baseDir: string,
  ) {}

  // ------------------------------------------- Phase 1: bootstrap

  public async bootstrapProjectWorkspace(input: {
    projectId: string;
    templateId: StarterTemplateId;
    createdAt: string;
  }): Promise<ProjectBootstrapResult> {
    const templateId = starterTemplateIdSchema.parse(input.templateId);
    const workspaceId = createId("ws");
    const workspaceDir = join(this.baseDir, "workspaces", workspaceId);

    // Materialize the starter template files.
    const templateFiles = FILES_BY_TEMPLATE[templateId];
    for (const [relPath, content] of Object.entries(templateFiles)) {
      // relPath is like "/src/App.tsx" — strip leading slash for join.
      const absPath = join(workspaceDir, relPath.slice(1));
      await mkdir(join(absPath, ".."), { recursive: true });
      await writeFile(absPath, content, "utf-8");
    }

    // Write .bolt-everything/project.json (reserved system directory).
    const manifestConfig = MANIFEST_BY_TEMPLATE[templateId];
    const manifest = projectWorkspaceManifestSchema.parse({
      schemaVersion: "1.0",
      projectId: input.projectId,
      templateId,
      executionProfile: manifestConfig.executionProfile,
      installOperation: manifestConfig.installOperation,
      buildOperation: manifestConfig.buildOperation,
      previewOperation: manifestConfig.previewOperation,
      createdAt: input.createdAt,
    });

    const boltDir = join(workspaceDir, ".bolt-everything");
    await mkdir(boltDir, { recursive: true });
    await writeFile(join(boltDir, "project.json"), JSON.stringify(manifest, null, 2), "utf-8");

    // Persist workspace record so future lookups resolve the storageRef.
    await this.store.saveWorkspace({
      id: workspaceId,
      projectId: input.projectId,
      implementation: "filesystem",
      storageRef: workspaceDir,
      state: "ready",
      lastReadyAt: input.createdAt,
      createdAt: input.createdAt,
    });

    return {
      workspaceId,
      storageRef: workspaceDir,
      implementation: "filesystem",
      state: "ready",
      manifest,
    };
  }

  // ------------------------------------------- Phase 2: read-only inspection

  public async listFiles(
    workspaceId: string,
    path: string,
    depth: number,
    includeSystem = false,
  ): Promise<WorkspaceListEntry[]> {
    const storageRef = await this.resolveStorageRef(workspaceId);
    const absRoot = join(storageRef, path.slice(1)); // strip leading /

    const entries: WorkspaceListEntry[] = [];
    await this.collectEntries(storageRef, absRoot, depth, includeSystem, entries);
    return entries;
  }

  public async readFile(workspaceId: string, path: string): Promise<WorkspaceFileContent> {
    if (path.startsWith(RESERVED_PREFIX)) {
      throw Object.assign(new Error("Reserved path is not readable via this API."), {
        code: "reserved_path",
      });
    }

    const storageRef = await this.resolveStorageRef(workspaceId);
    const absPath = join(storageRef, path.slice(1));

    let stats: Awaited<ReturnType<typeof stat>>;
    try {
      stats = await stat(absPath);
    } catch {
      throw Object.assign(new Error(`File not found: ${path}`), { code: "file_not_found" });
    }

    if (!stats.isFile()) {
      throw Object.assign(new Error(`Path is not a file: ${path}`), { code: "file_not_found" });
    }

    const sizeBytes = stats.size;
    const isTruncated = sizeBytes > MAX_READ_BYTES;

    // Attempt UTF-8 read; treat as binary if it throws.
    try {
      const rawBuffer = await readFile(absPath);
      const slice = isTruncated ? rawBuffer.slice(0, MAX_READ_BYTES) : rawBuffer;
      const content = slice.toString("utf-8");
      return { path, content, encoding: "utf-8", isBinary: false, isTruncated, sizeBytes };
    } catch {
      return {
        path,
        content: undefined,
        encoding: "utf-8",
        isBinary: true,
        isTruncated: false,
        sizeBytes,
      };
    }
  }

  // ------------------------------------------- Phase 1: snapshot (initial)

  public async createSnapshot(workspaceId: string, label: string): Promise<string> {
    const storageRef = await this.resolveStorageRef(workspaceId);
    const snapshotId = createId("snp");
    const snapshotDir = join(this.baseDir, "snapshots", snapshotId);

    await copyDir(storageRef, snapshotDir);
    return snapshotDir; // this is the snapshot storageRef
  }

  // ----------------------------------------------------------------- private

  private async resolveStorageRef(workspaceId: string): Promise<string> {
    const workspace = await this.store.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw Object.assign(new Error(`Workspace not found: ${workspaceId}`), {
        code: "workspace_unavailable",
      });
    }
    return workspace.storageRef;
  }

  private async collectEntries(
    workspaceRoot: string,
    absDir: string,
    depth: number,
    includeSystem: boolean,
    out: WorkspaceListEntry[],
  ): Promise<void> {
    let names: string[];
    try {
      names = await readdir(absDir);
    } catch {
      return; // Directory doesn't exist — treat as empty.
    }

    for (const name of names) {
      const absChild = join(absDir, name);
      const relPath = `/${relative(workspaceRoot, absChild).replace(/\\/g, "/")}`;

      // Filter out the reserved .bolt-everything directory unless requested.
      if (!includeSystem && relPath.startsWith(RESERVED_PREFIX.slice(0, -1))) continue;

      const childStat = await stat(absChild).catch(() => null);
      if (!childStat) continue;

      if (childStat.isDirectory()) {
        out.push({ path: relPath, name, kind: "directory" });
        if (depth > 0) {
          await this.collectEntries(workspaceRoot, absChild, depth - 1, includeSystem, out);
        }
      } else if (childStat.isFile()) {
        out.push({ path: relPath, name, kind: "file", sizeBytes: childStat.size });
      }
    }
  }
}

// ----------------------------------------------------------------- helpers

async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const names = await readdir(src);
  for (const name of names) {
    const srcPath = join(src, name);
    const destPath = join(dest, name);
    const entryStat = await stat(srcPath).catch(() => null);
    if (!entryStat) continue;
    if (entryStat.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      const content = await readFile(srcPath);
      await writeFile(destPath, content);
    }
  }
}
