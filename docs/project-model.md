# Project Model

## Model Goal

The product needs a data model that makes one thing impossible to misunderstand: every assistant interaction belongs to a persistent project.

There are no free-floating chats in MVP. A user opens a project, and the project owns the conversation, workspace state, snapshots, and preview state.

## Core Entities

| Entity | Purpose | Key Fields |
| --- | --- | --- |
| `User` | Owns projects and provider profiles. | `id`, `appleSubjectId`, `createdAt`, `defaultProviderProfileId` |
| `ProviderProfile` | Stores a validated inference configuration. | `id`, `userId`, `kind`, `displayName`, `baseUrl`, `apiKeyRef`, `defaultModel`, `validatedAt`, `status` |
| `Project` | Top-level object the user sees in the app. | `id`, `userId`, `name`, `goal`, `templateId`, `workspaceId`, `conversationId`, `providerProfileId`, `modelId`, `status`, `createdAt`, `updatedAt` |
| `Conversation` | Single project-scoped thread in MVP. | `id`, `projectId`, `title`, `lastMessageAt` |
| `Message` | User or assistant chat item. | `id`, `conversationId`, `role`, `content`, `runId`, `createdAt` |
| `Run` | One assistant execution cycle started by one user message. | `id`, `projectId`, `conversationId`, `triggerMessageId`, `status`, `startedAt`, `finishedAt`, `failureReason` |
| `Workspace` | Logical project workspace that satisfies the `Project Workspace Contract`. | `id`, `projectId`, `implementation`, `storageRef`, `state`, `lastReadyAt` |
| `FileChange` | Normalized diff record produced during a run. | `id`, `runId`, `path`, `operation`, `summary`, `bytesChanged` |
| `Snapshot` | Restorable workspace checkpoint. | `id`, `projectId`, `runId`, `label`, `storageRef`, `createdAt` |
| `PreviewSession` | Current preview process and URL state. | `id`, `projectId`, `runId`, `previewOperation`, `status`, `url`, `port`, `startedAt`, `lastHeartbeatAt` |
| `Export` | Generated archive for user download/share. | `id`, `projectId`, `snapshotId`, `storageRef`, `createdAt` |

## Relationship Rules

- A `User` can own many `Projects`.
- A `User` can own many `ProviderProfiles`.
- A `Project` has exactly one logical `Workspace`.
- A `Project` has exactly one `Conversation` in MVP.
- A `Conversation` has many `Messages`.
- A `Run` belongs to one `Project` and one triggering `Message`.
- A `Run` can produce many `FileChanges`.
- A `Project` can have many `Snapshots`, but only one active `PreviewSession`.

## Template Rule

In MVP, `templateId` is required for every `Project`.

Every project begins from one supported starter template, including the minimal `Empty Node + TypeScript project` template. There is no project import path and no template-free project creation flow in MVP.

## Project Status

Recommended project states:

- `creating`
- `ready`
- `running`
- `needs_attention`
- `archived`

Meaning:

- `creating`: template is being materialized.
- `ready`: project can accept a new prompt.
- `running`: a run is active.
- `needs_attention`: the last run failed or preview crashed.
- `archived`: hidden from the default list but still restorable.

## Run Status

Recommended run states:

- `queued`
- `running`
- `succeeded`
- `failed`
- `cancelled`

Only one run may be `queued` or `running` for a project at any given time.

## Workspace-Local Manifest

Each project workspace should include a small system manifest at `.bolt-everything/project.json`.

The file should contain only operational metadata needed to resume the project workspace cleanly:

- `schemaVersion`
- `projectId`
- `templateId`
- `executionProfile`
- `installOperation`
- `buildOperation`
- `previewOperation`
- `createdAt`

User source files live outside `.bolt-everything/`. The manifest is for workspace coordination, not for storing conversation history. These operation fields describe allowlisted workspace operations, not arbitrary shell commands.

## Persistence Split

The model intentionally separates what lives on device and what lives in service-backed systems.

### On Device

- recent project list cache
- last opened project id
- unsent message drafts
- last-known run summaries
- auth session tokens

### Service-Backed

- project metadata
- provider references
- conversation history
- authoritative project filesystem and workspace state
- snapshots
- exports
- preview metadata

## Snapshot Semantics

- A snapshot is created automatically after project creation.
- A snapshot is created automatically after each successful run.
- Restoring a snapshot updates the workspace contents but does not delete run history.
- A restore action should create a new run-like audit event so the timeline remains understandable.

## File Access Rule

The in-app file browser is read-only in MVP.

Users can inspect current files and diffs, but file creation, modification, rename, and deletion happen through chat-triggered runs that use the `Project Workspace Contract`.

## Model Decisions That Simplify MVP

- One conversation per project.
- One active run per project.
- One logical workspace per project.
- One resolved provider profile per project at run time.
- One active preview per project.
- One read-only file browser, with file edits remaining chat-mediated.

These constraints can be relaxed later, but they keep the initial build understandable and debuggable.
