# Workspace Contract Schema

## Purpose

This document defines the schema for the exact `Project Workspace Contract`. It is the only execution contract between the run system and the active workspace implementation in MVP.

## Contract Invariants

- The operation set is fixed in MVP:
  - `list_files`
  - `read_file`
  - `create_file`
  - `update_file`
  - `rename_file`
  - `delete_file`
  - `install_dependencies`
  - `build_project`
  - `start_preview`
  - `create_snapshot`
  - `restore_snapshot`
- There is no generic `run_command` or `execute` operation.
- There is no arbitrary shell or terminal access.
- File browsing remains read-only at the app layer even though the contract includes write operations for assistant-driven runs.
- Operations are invoked sequentially within a run.
- Paths are relative to the project workspace root.

## Reserved Paths

- `.bolt-everything/` is reserved for system use.
- `.bolt-everything/project.json` is system-managed workspace metadata.
- Assistant-facing file operations must not create, modify, rename, or delete anything under `.bolt-everything/`.

## Common Request Envelope

```json
{
  "contractVersion": "1.0",
  "workspaceId": "ws_123",
  "operationId": "op_123",
  "operation": "read_file",
  "context": {
    "projectId": "prj_123",
    "conversationId": "cnv_123",
    "runId": "run_123",
    "initiator": "assistant_run"
  },
  "payload": {}
}
```

Field rules:

- `contractVersion`: fixed contract version string.
- `workspaceId`: logical workspace identifier.
- `operationId`: unique per invocation.
- `operation`: one of the exact operations listed above.
- `context.projectId`: required.
- `context.conversationId`: required for run-driven operations.
- `context.runId`: optional for system-driven project bootstrap and explicit user preview actions.
- `context.initiator`: one of:
  - `assistant_run`
  - `user_action`
  - `system`

## Common Result Envelope

```json
{
  "contractVersion": "1.0",
  "workspaceId": "ws_123",
  "operationId": "op_123",
  "operation": "read_file",
  "status": "succeeded",
  "startedAt": "2026-04-01T18:40:00Z",
  "finishedAt": "2026-04-01T18:40:00Z",
  "result": {},
  "error": null
}
```

Allowed `status` values:

- `succeeded`
- `failed`

## Path Rules

- Paths use normalized forward slashes.
- Paths are always relative to workspace root when passed into the contract.
- Absolute paths are invalid.
- `..` path traversal is invalid.
- `read_file` applies only to files.
- `rename_file` and `delete_file` may target either a file or a directory path because the contract does not define separate directory operations.
- `create_file` must create missing parent directories when necessary.

## Operation Schemas

### `list_files`

Request payload:

```json
{
  "path": "/",
  "depth": 1,
  "includeSystem": false
}
```

Result:

```json
{
  "path": "/",
  "entries": [
    {
      "path": "/src",
      "name": "src",
      "kind": "directory"
    },
    {
      "path": "/package.json",
      "name": "package.json",
      "kind": "file",
      "sizeBytes": 612
    }
  ]
}
```

### `read_file`

Request payload:

```json
{
  "path": "/src/App.tsx"
}
```

Result:

```json
{
  "path": "/src/App.tsx",
  "content": "export function App() {}",
  "encoding": "utf-8",
  "isBinary": false,
  "isTruncated": false,
  "sizeBytes": 128
}
```

If the file is binary, `content` may be omitted and `isBinary` must be `true`.

### `create_file`

Request payload:

```json
{
  "path": "/src/components/Hero.tsx",
  "content": "export function Hero() {}",
  "encoding": "utf-8"
}
```

Result:

```json
{
  "path": "/src/components/Hero.tsx",
  "operation": "created"
}
```

Rules:

- `encoding` is `utf-8` in MVP.
- This operation creates any missing parent directories.
- It fails with `already_exists` if the target file already exists.

### `update_file`

Request payload:

```json
{
  "path": "/src/App.tsx",
  "content": "export function App() { return null; }",
  "encoding": "utf-8"
}
```

Result:

```json
{
  "path": "/src/App.tsx",
  "operation": "updated"
}
```

Rules:

- `encoding` is `utf-8` in MVP.
- This operation replaces the full file content.

### `rename_file`

Request payload:

```json
{
  "fromPath": "/src/old-name.tsx",
  "toPath": "/src/new-name.tsx"
}
```

Result:

```json
{
  "fromPath": "/src/old-name.tsx",
  "toPath": "/src/new-name.tsx",
  "operation": "renamed"
}
```

This operation may rename either a file or a directory path.

### `delete_file`

Request payload:

```json
{
  "path": "/src/unused"
}
```

Result:

```json
{
  "path": "/src/unused",
  "operation": "deleted"
}
```

This operation may delete either a file or a directory path.

### `install_dependencies`

Request payload:

```json
{}
```

Result:

```json
{
  "operation": "install_dependencies",
  "configuredBy": ".bolt-everything/project.json#installOperation",
  "summary": "Dependencies installed."
}
```

Rules:

- The workspace implementation resolves the actual install behavior from the system manifest.
- The caller cannot pass an arbitrary command string.

### `build_project`

Request payload:

```json
{}
```

Result:

```json
{
  "operation": "build_project",
  "configuredBy": ".bolt-everything/project.json#buildOperation",
  "summary": "Build completed."
}
```

Rules:

- The workspace implementation resolves the actual build behavior from the system manifest.
- The caller cannot pass an arbitrary command string.

### `start_preview`

Request payload:

```json
{
  "restartIfRunning": true
}
```

Result:

```json
{
  "operation": "start_preview",
  "configuredBy": ".bolt-everything/project.json#previewOperation",
  "status": "starting",
  "url": null
}
```

Allowed result `status` values:

- `starting`
- `running`
- `failed`
- `unavailable`

Rules:

- The caller cannot pass arbitrary runtime parameters.
- If an HTTP preview endpoint becomes available, the control plane is responsible for turning it into the authenticated preview URL shown to the app.

### `create_snapshot`

Request payload:

```json
{
  "label": "After run_123"
}
```

Result:

```json
{
  "snapshotRef": "snapshots/prj_123/run_123.tar.zst",
  "label": "After run_123"
}
```

### `restore_snapshot`

Request payload:

```json
{
  "snapshotRef": "snapshots/prj_123/run_120.tar.zst"
}
```

Result:

```json
{
  "snapshotRef": "snapshots/prj_123/run_120.tar.zst",
  "operation": "restored"
}
```

## Execution Progress

For `install_dependencies`, `build_project`, and `start_preview`, the workspace implementation must surface progress and output back to the caller’s run pipeline. That progress is not a separate user-callable operation.

Recommended internal progress shape:

```json
{
  "operationId": "op_123",
  "operation": "build_project",
  "level": "info",
  "chunk": "Build completed in 2.4s\n",
  "occurredAt": "2026-04-01T18:45:00Z"
}
```

The control plane adapts these internal progress updates into the public run stream described in [run-events.md](/C:/Users/asher/PROJECTS/bolt.everything/docs/run-events.md).

## Error Shape

```json
{
  "code": "reserved_path",
  "message": "Paths under .bolt-everything are reserved.",
  "details": {}
}
```

Recommended contract error codes:

- `invalid_path`
- `reserved_path`
- `file_not_found`
- `already_exists`
- `workspace_unavailable`
- `operation_not_configured`
- `preview_not_available`
- `snapshot_not_found`
- `operation_failed`

## Explicit Omissions

The contract does not include:

- generic shell execution
- terminal sessions
- git operations
- conversation management
- multi-agent coordination
