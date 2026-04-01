# API Contracts

## Purpose

This document defines the app-facing backend API for the locked MVP. It translates the product rules into concrete HTTP contracts without widening scope.

These API contracts preserve:

- one conversation per project
- one active run per project
- one provider abstraction: `OpenAI-compatible chat models`
- explicit provider validation before use
- read-only file browsing in the app
- chat-mediated file creation and modification
- the exact `Project Workspace Contract`

## Cross-Cutting Rules

- All endpoints are rooted at `/v1`.
- All request and response bodies are JSON unless noted otherwise.
- All timestamps use ISO 8601 UTC strings.
- All endpoints require an authenticated user session derived from `Sign in with Apple`, except the auth callback/bootstrap path owned by the auth layer.
- The app never calls a direct file mutation endpoint. File creation, modification, rename, and deletion only happen through `POST /v1/projects/{projectId}/runs`.
- The app never calls a generic terminal or shell endpoint. The backend only exposes named workspace operations.
- Every `Project` has exactly one `Conversation`. There is no conversation creation endpoint in MVP.

## Error Shape

All non-2xx responses should use this shape:

```json
{
  "error": {
    "code": "active_run_exists",
    "message": "A run is already active for this project.",
    "details": {}
  }
}
```

Recommended MVP error codes:

- `auth_required`
- `provider_validation_failed`
- `provider_required`
- `unknown_model`
- `project_not_found`
- `conversation_not_found`
- `active_run_exists`
- `run_not_found`
- `file_not_found`
- `snapshot_not_found`
- `preview_not_available`
- `workspace_unavailable`
- `forbidden_operation`

## Bootstrap

### `GET /v1/bootstrap`

Returns the minimum payload needed to draw the initial app shell.

Response:

```json
{
  "user": {
    "id": "usr_123",
    "defaultProviderProfileId": "prov_123"
  },
  "providerSetupRequired": false,
  "recentProjects": [
    {
      "id": "prj_123",
      "name": "Travel App",
      "status": "ready",
      "updatedAt": "2026-04-01T18:00:00Z"
    }
  ]
}
```

## Provider Profiles

The backend exposes only one provider abstraction:

- `kind = "openai_compatible"`

Allowed presets:

- `openai`
- `openrouter`
- `custom`

### `GET /v1/provider-profiles`

Returns the user’s saved provider profiles.

Response fields:

- `id`
- `kind`
- `preset`
- `displayName`
- `baseUrl`
- `defaultModel`
- `validatedAt`
- `status`
- `isDefault`

### `POST /v1/provider-profiles/validate`

Dry-run validation. This endpoint does not persist credentials.

Request:

```json
{
  "kind": "openai_compatible",
  "preset": "openai",
  "displayName": "OpenAI",
  "baseUrl": null,
  "apiKey": "sk-...",
  "defaultModel": "gpt-4.1"
}
```

Success response:

```json
{
  "valid": true,
  "resolvedBaseUrl": "https://api.openai.com/v1",
  "resolvedModel": "gpt-4.1",
  "validatedAt": "2026-04-01T18:05:00Z"
}
```

Failure response uses `provider_validation_failed` with a specific message such as invalid key, invalid base URL, unknown model, quota issue, or incompatible response format.

### `POST /v1/provider-profiles`

Creates a provider profile. The backend must revalidate before persistence.

Request:

```json
{
  "kind": "openai_compatible",
  "preset": "custom",
  "displayName": "My Gateway",
  "baseUrl": "https://example.com/v1",
  "apiKey": "secret",
  "defaultModel": "gateway-model"
}
```

Response:

```json
{
  "id": "prov_123",
  "kind": "openai_compatible",
  "preset": "custom",
  "displayName": "My Gateway",
  "baseUrl": "https://example.com/v1",
  "defaultModel": "gateway-model",
  "validatedAt": "2026-04-01T18:06:00Z",
  "status": "validated"
}
```

### `PATCH /v1/provider-profiles/{providerProfileId}`

Allowed mutable fields:

- `displayName`
- `baseUrl`
- `apiKey`
- `defaultModel`

The backend must revalidate the full profile before saving changes.

### `POST /v1/provider-profiles/{providerProfileId}/make-default`

Marks the profile as the user default for future project creation and run resolution fallback.

Response:

```json
{
  "defaultProviderProfileId": "prov_123"
}
```

## Projects

### `GET /v1/projects`

Returns the user’s project list.

Response item fields:

- `id`
- `name`
- `goal`
- `templateId`
- `status`
- `providerProfileId`
- `modelId`
- `updatedAt`
- `lastMessageAt`

### `POST /v1/projects`

Creates a new project. In MVP, `templateId` is required.

Request:

```json
{
  "name": "Travel App",
  "goal": "Build a premium travel startup landing page.",
  "templateId": "react_vite",
  "providerProfileId": "prov_123",
  "modelId": "gpt-4.1"
}
```

Response:

```json
{
  "id": "prj_123",
  "name": "Travel App",
  "goal": "Build a premium travel startup landing page.",
  "templateId": "react_vite",
  "status": "ready",
  "conversationId": "cnv_123",
  "providerProfileId": "prov_123",
  "modelId": "gpt-4.1",
  "createdAt": "2026-04-01T18:10:00Z"
}
```

### `GET /v1/projects/{projectId}`

Returns project metadata and the current summary state.

Response includes:

- project metadata
- current run summary, if any
- current preview summary, if any
- latest snapshot summary

### `PATCH /v1/projects/{projectId}`

Allowed mutable fields:

- `name`
- `goal`
- `providerProfileId`
- `modelId`
- `archived`

Rules:

- `providerProfileId` must reference a validated provider profile owned by the user.
- Changing provider or model affects future runs only.
- `archived = true` moves the project out of the default active list.

## Conversation And Messages

### `GET /v1/projects/{projectId}/conversation`

Returns the project’s only conversation plus recent messages.

Response:

```json
{
  "id": "cnv_123",
  "projectId": "prj_123",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Add a hero section.",
      "runId": "run_1",
      "createdAt": "2026-04-01T18:12:00Z"
    }
  ]
}
```

There is no `POST /conversations` endpoint in MVP.

## Runs

### `GET /v1/projects/{projectId}/runs`

Returns run summaries for the project.

Response item fields:

- `id`
- `triggerMessageId`
- `status`
- `startedAt`
- `finishedAt`
- `failureReason`

### `POST /v1/projects/{projectId}/runs`

Creates one user message and starts one assistant run.

Request:

```json
{
  "message": "Add a premium hero section and start the preview."
}
```

Success response:

```json
{
  "conversationId": "cnv_123",
  "messageId": "msg_2",
  "run": {
    "id": "run_2",
    "status": "queued",
    "eventsUrl": "/v1/projects/prj_123/runs/run_2/events"
  }
}
```

Rules:

- If the project has a `queued` or `running` run, return `409 active_run_exists`.
- This is the only app-facing write path for file creation, modification, rename, and deletion.
- The run is the only place where assistant-driven `Project Workspace Contract` operations are invoked.

### `GET /v1/projects/{projectId}/runs/{runId}`

Returns one run record plus file change summary.

Response includes:

- run metadata
- assistant message ids produced by the run
- `fileChanges`
- `previewSessionId`, if the run started or updated preview

### `GET /v1/projects/{projectId}/runs/{runId}/events`

Returns the authenticated Server-Sent Events stream for the run. Event definitions live in [run-events.md](/C:/Users/asher/PROJECTS/bolt.everything/docs/run-events.md).

## Files

The file browser is read-only in MVP. The API reflects that rule.

### `GET /v1/projects/{projectId}/files`

Returns a tree slice rooted at `path`.

Query parameters:

- `path`: relative path, default `/`
- `depth`: integer, default `1`

Response:

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

### `GET /v1/projects/{projectId}/files/content`

Returns the content for one file.

Query parameters:

- `path`: required relative file path

Response:

```json
{
  "path": "/src/main.tsx",
  "content": "import React from 'react';",
  "encoding": "utf-8",
  "isBinary": false,
  "isTruncated": false
}
```

There are no `POST`, `PUT`, `PATCH`, or `DELETE` file endpoints in MVP.

## Snapshots

### `GET /v1/projects/{projectId}/snapshots`

Returns snapshot history for the project.

Response item fields:

- `id`
- `label`
- `runId`
- `createdAt`

### `POST /v1/projects/{projectId}/snapshots/{snapshotId}/restore`

Restores one snapshot. This action must create a run-like audit event in project history.

Response:

```json
{
  "snapshotId": "snp_123",
  "status": "restoring"
}
```

## Preview

### `GET /v1/projects/{projectId}/preview`

Returns the current preview session state.

Response:

```json
{
  "projectId": "prj_123",
  "status": "running",
  "url": "https://preview.example.com/p/prj_123",
  "startedAt": "2026-04-01T18:20:00Z",
  "lastHeartbeatAt": "2026-04-01T18:21:00Z"
}
```

### `POST /v1/projects/{projectId}/preview/start`

Starts or restarts preview using the project’s allowlisted `start_preview` operation.

Response:

```json
{
  "status": "starting"
}
```

This endpoint does not expose arbitrary execution parameters.

## Exports

### `POST /v1/projects/{projectId}/exports`

Creates a ZIP export from the current project state.

Response:

```json
{
  "id": "exp_123",
  "status": "queued"
}
```

### `GET /v1/projects/{projectId}/exports/{exportId}`

Returns export status and download URL when ready.

Response:

```json
{
  "id": "exp_123",
  "status": "ready",
  "downloadUrl": "https://downloads.example.com/exp_123.zip"
}
```

## Explicit Omissions

The API does not include:

- direct file write endpoints
- terminal or shell endpoints
- generic workspace execution endpoints
- git import, push, branch, or pull request endpoints
- multiple conversation endpoints per project
- multi-agent orchestration endpoints
