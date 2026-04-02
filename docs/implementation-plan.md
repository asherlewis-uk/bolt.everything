# Locked MVP Implementation Plan

This plan sequences implementation for the current locked MVP only. It is derived from the existing docs and does not add scope beyond [mvp-scope.md](./mvp-scope.md).

## Guardrails

- Keep the MVP anchored to one project, one conversation, one logical workspace, and one active run per project.
- Keep the file browser read-only. File writes happen only through assistant runs or snapshot restore.
- Keep the provider abstraction limited to `OpenAI-compatible chat models` with `OpenAI`, `OpenRouter`, and `Custom` presets.
- Do not add terminal access, generic shell execution, git workflows, project import, multi-user collaboration, web or Android clients, or background autonomous agents.

## Phase 1. Foundation, Auth, And Project Bootstrap

Goal: make project creation and persistence real before assistant execution starts.

Build in this phase:

- `Sign in with Apple` auth/session bootstrap and `GET /v1/bootstrap`
- `ProviderProfile` validation, persistence, and default selection flows
- project creation, listing, and detail read models
- starter-template enforcement for `react_vite`, `nextjs`, and `node_typescript`
- workspace bootstrap plus `.bolt-everything/project.json`
- initial snapshot creation after project creation
- iOS onboarding surfaces:
  - `AuthBootstrapScreen`
  - `WelcomeScreen`
  - `SignInWithAppleScreen`
  - `ProviderSetupFlow`
  - `CreateProjectScreen`
  - `ProjectsListScreen`

Exit criteria:

- a new user can sign in, validate a provider, create a starter project, and reopen it from the project list
- project metadata, workspace linkage, and the initial snapshot persist across app relaunch

## Phase 2. Project Shell And Read-Only Inspection

Goal: let the app inspect persistent project state cleanly before the run path is turned on.

Build in this phase:

- `ProjectScreen` shell with `Chat`, `Diffs`, `Files`, and `Preview` panes
- project header state for project name, provider/model, and run status
- conversation read endpoint and message history loading
- read-only file tree and file content endpoints
- latest snapshot and preview summary reads
- local cache for recent projects, last-opened project, and stale-but-readable project state
- composer gating for missing provider and active-run states

Exit criteria:

- a user can open an existing project and inspect messages, files, and current project state without any writable in-app file controls
- the app can render the locked read-only project surfaces from persisted backend data and local cache

## Phase 3. Assistant Run Core

Goal: deliver the primary MVP loop of prompt -> workspace change -> visible result.

Build in this phase:

- `Run Coordinator` with the one-active-run-per-project guard
- user-message creation plus run creation from `POST /v1/projects/{projectId}/runs`
- provider and model resolution at run start
- orchestration against the exact `Project Workspace Contract`
- `Workspace Service Adapter` for only:
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
- ordered SSE publication for the run event stream
- `FileChange` persistence and run-level diff rendering
- `RunDetailSheet` and in-chat run status rendering
- automatic snapshot creation after successful runs

Exit criteria:

- a user can send a prompt, the assistant can modify files inside the persistent workspace, and the app shows ordered run events, file changes, and explicit failure states
- successful runs produce snapshots and failed runs remain understandable and retryable

## Phase 4. Preview, Snapshot Restore, And Recovery

Goal: complete the inspect-and-resume loop inside the app.

Build in this phase:

- `Preview Service` and `POST /v1/projects/{projectId}/preview/start`
- `PreviewSession` tracking and `preview.updated` handling
- `WKWebView` preview when an authenticated preview URL exists
- log and failure rendering when preview is unavailable or fails
- snapshot list and restore flow in `SnapshotSheet`
- visible restore audit activity in project history
- `needs_attention` handling for failed runs and broken preview state

Exit criteria:

- a user can start or restart preview, inspect the result when a preview exists, restore an earlier snapshot, and understand recovery state without leaving the app

## Phase 5. Export, Resume Quality, And Release Bar

Goal: finish the remaining locked MVP deliverables and ship against the documented release bar.

Build in this phase:

- ZIP export creation, polling, and native share presentation
- reconnect behavior for run streams using `Last-Event-ID` or run-state reload
- polish for offline and stale-cache states that still preserve read-only browsing
- final pass on onboarding speed, failure messaging, and persistence across relaunch

Exit criteria:

- export produces a usable project archive
- a returning user can resume a project reliably after app relaunch
- the release bar in [mvp-scope.md](./mvp-scope.md) is satisfied without adding post-MVP features

## Phase Order Rationale

- Phase 1 establishes identity, validated provider state, starter templates, and persistent projects because every later flow depends on them.
- Phase 2 gives the app stable project surfaces before the write path is introduced.
- Phase 3 implements the core assistant run loop, which is the center of the MVP.
- Phase 4 layers preview and restore on top of the already-working run and workspace model.
- Phase 5 finishes export, resilience, and release quality rather than widening the product surface.
