# Run Events

## Purpose

This document defines the app-facing run event stream used to render one active assistant run for one project.

The event stream exists to support:

- status visibility
- streamed assistant output
- operation visibility for the exact `Project Workspace Contract`
- file change summaries
- execution output for named workspace operations
- preview updates
- explicit failure reporting

It does not exist to emulate a terminal or expose arbitrary execution.

## Transport

MVP transport: authenticated Server-Sent Events from:

- `GET /v1/projects/{projectId}/runs/{runId}/events`

Headers:

- `Accept: text/event-stream`

The server should support SSE resume with `Last-Event-ID`.

## Event Envelope

Each SSE `data:` payload uses this JSON envelope:

```json
{
  "seq": 12,
  "type": "workspace.operation.started",
  "projectId": "prj_123",
  "conversationId": "cnv_123",
  "runId": "run_123",
  "occurredAt": "2026-04-01T18:30:00Z",
  "payload": {}
}
```

Field rules:

- `seq` is strictly increasing within a run.
- `type` is one of the event types defined below.
- `projectId`, `conversationId`, and `runId` are constant for the stream.
- `payload` varies by event type.

## Event Types

### `run.queued`

Payload:

```json
{
  "status": "queued"
}
```

### `run.started`

Payload:

```json
{
  "status": "running"
}
```

### `assistant.message.started`

Payload:

```json
{
  "messageId": "msg_123"
}
```

### `assistant.message.delta`

Payload:

```json
{
  "messageId": "msg_123",
  "delta": "Adding a hero section now..."
}
```

### `assistant.message.completed`

Payload:

```json
{
  "messageId": "msg_123",
  "content": "I updated the hero section and started preview."
}
```

### `workspace.operation.started`

Payload:

```json
{
  "stepIndex": 3,
  "operation": "update_file",
  "targetPath": "/src/App.tsx"
}
```

Allowed `operation` values are fixed to the exact `Project Workspace Contract`:

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

### `execution.output`

Payload:

```json
{
  "stepIndex": 5,
  "operation": "build_project",
  "level": "info",
  "chunk": "Build completed in 2.4s\n"
}
```

Rules:

- This event is used only for named workspace operations such as `install_dependencies`, `build_project`, and `start_preview`.
- `level` is `info` or `error`.
- This is structured execution output, not a terminal stream.

### `workspace.operation.completed`

Payload:

```json
{
  "stepIndex": 3,
  "operation": "update_file",
  "summary": "Updated /src/App.tsx"
}
```

### `workspace.operation.failed`

Payload:

```json
{
  "stepIndex": 5,
  "operation": "build_project",
  "errorCode": "operation_failed",
  "message": "Build step failed."
}
```

### `file.change`

Payload:

```json
{
  "path": "/src/App.tsx",
  "changeType": "updated",
  "summary": "Reworked hero section layout.",
  "bytesChanged": 812
}
```

Allowed `changeType` values:

- `created`
- `updated`
- `renamed`
- `deleted`

### `preview.updated`

Payload:

```json
{
  "status": "running",
  "url": "https://preview.example.com/p/prj_123"
}
```

Allowed `status` values:

- `starting`
- `running`
- `failed`
- `stopped`
- `unavailable`

### `snapshot.created`

Payload:

```json
{
  "snapshotId": "snp_123",
  "label": "After run_123"
}
```

### `run.succeeded`

Payload:

```json
{
  "status": "succeeded"
}
```

### `run.failed`

Payload:

```json
{
  "status": "failed",
  "failureReason": "build_project failed"
}
```

### `run.cancelled`

Payload:

```json
{
  "status": "cancelled"
}
```

This event exists because `Run.status` includes `cancelled`, even though cancel UX is not otherwise expanded in MVP.

## Ordering Rules

- Each stream begins with `run.queued` or `run.started`.
- Each stream ends with exactly one terminal event:
  - `run.succeeded`
  - `run.failed`
  - `run.cancelled`
- No events are emitted after a terminal event.
- `workspace.operation.completed` or `workspace.operation.failed` must correspond to a prior `workspace.operation.started`.
- `file.change` events are observational. They do not imply a writable file browser.
- `assistant.message.completed` should be emitted before the terminal run event when an assistant message exists.

## Example Sequence

A typical successful run may look like:

1. `run.queued`
2. `run.started`
3. `assistant.message.started`
4. `assistant.message.delta`
5. `workspace.operation.started` with `list_files`
6. `workspace.operation.completed` with `list_files`
7. `workspace.operation.started` with `update_file`
8. `file.change`
9. `workspace.operation.completed` with `update_file`
10. `workspace.operation.started` with `install_dependencies`
11. `execution.output`
12. `workspace.operation.completed` with `install_dependencies`
13. `workspace.operation.started` with `start_preview`
14. `preview.updated`
15. `workspace.operation.completed` with `start_preview`
16. `assistant.message.completed`
17. `snapshot.created`
18. `run.succeeded`

## Client Rendering Rules

- The chat screen renders `assistant.message.delta` inline.
- The run timeline renders `workspace.operation.*` and `execution.output`.
- Diff views consume `file.change`.
- The preview screen reacts to `preview.updated`.
- The file browser remains read-only even when `file.change` arrives.
- If the stream disconnects, the client reconnects using `Last-Event-ID` or reloads run state from the REST endpoints.

## Explicit Omissions

The event stream does not include:

- terminal session events
- generic shell prompt events
- git events
- multi-agent events
- events for direct file editing in the app
