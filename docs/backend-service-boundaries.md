# Backend Service Boundaries

## Purpose

This document defines the backend boundaries required by the locked MVP. It keeps the system small and explicit while preserving the existing architecture and the exact `Project Workspace Contract`.

## Boundary Rules

- The app talks only to the control plane API.
- The `Project Workspace Contract` is the only allowed execution boundary between the run system and the workspace implementation.
- Provider validation and provider resolution belong to one provider abstraction only: `OpenAI-compatible chat models`.
- File writes belong only to the run path or snapshot restore path. There is no direct file write API.
- One active run per project must be enforced centrally.
- One conversation per project must be enforced centrally.
- There is no backend boundary for terminal UI, git workflows, arbitrary shell access, or multi-agent orchestration.

## Service Map

### 1. `App API`

Owns:

- authenticated HTTP endpoints
- response shaping for the iOS app
- SSE stream endpoint exposure

Calls:

- `Session Service`
- `Provider Profile Service`
- `Project Service`
- `Run Coordinator`
- `Snapshot Service`
- `Preview Service`
- `Export Service`

Must not own:

- provider validation logic
- workspace execution logic
- run sequencing logic

### 2. `Session Service`

Owns:

- `Sign in with Apple` identity binding
- session lookup
- bootstrap aggregation

Returns:

- current user identity
- `providerSetupRequired`
- recent project summaries

Must not own:

- project creation
- provider validation
- workspace state

### 3. `Provider Profile Service`

Owns:

- `ProviderProfile` records
- explicit validation flow
- default provider selection
- provider and model resolution for future runs

Must enforce:

- `kind = openai_compatible`
- presets limited to `openai`, `openrouter`, and `custom`
- full validation before persistence or update

Must not own:

- workspace access
- preview state
- file changes

### 4. `Project Service`

Owns:

- `Project` records
- starter template enforcement
- one `Conversation` per `Project`
- project metadata updates

Must enforce:

- `templateId` is required on project creation
- one conversation is created automatically with each project
- there is no conversation creation path after project creation

Calls:

- `Workspace Service Adapter` during project bootstrap
- `Snapshot Service` for initial snapshot creation

Must not own:

- provider validation
- run execution
- direct file mutation APIs

### 5. `Run Coordinator`

Owns:

- `Run` records
- run lifecycle transitions
- `Message` creation for user and assistant messages tied to a run
- `FileChange` records
- operation sequencing for one assistant session

Must enforce:

- one active run per project
- sequential use of the `Project Workspace Contract`
- no operation outside the exact contract

Recommended enforcement:

- a database uniqueness rule on `Run.status in (queued, running)` per `projectId`
- a per-project execution lease to avoid duplicate work across workers

Calls:

- `Provider Profile Service` to resolve credentials and model
- `Project Service` to load project metadata
- `Workspace Service Adapter` to invoke contract operations
- `Run Stream Publisher` to emit run events
- `Snapshot Service` after successful runs

Must not own:

- provider persistence
- direct preview URL issuance
- export generation
- multi-agent fan-out

### 6. `Run Stream Publisher`

Owns:

- in-order run event publication
- SSE fan-out for a single run stream

Must enforce:

- monotonically increasing `seq` values
- exactly one terminal run event
- event ordering consistent with [run-events.md](/C:/Users/asher/PROJECTS/bolt.everything/docs/run-events.md)

Must not own:

- run state transitions
- workspace execution

### 7. `Workspace Service Adapter`

Owns:

- all calls to the workspace implementation
- request and response normalization for the exact `Project Workspace Contract`
- path validation
- reserved path handling for `.bolt-everything/`

Must enforce:

- only these operations are callable:
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

Must not expose:

- generic execute endpoints
- arbitrary shell access
- terminal sessions

### 8. `Snapshot Service`

Owns:

- `Snapshot` records
- snapshot archive references
- restore orchestration

Calls:

- `Workspace Service Adapter` for `create_snapshot` and `restore_snapshot`
- `Run Stream Publisher` or project event pipeline to record visible restore activity

Must enforce:

- automatic snapshot after project creation
- automatic snapshot after successful runs
- restore is visible in project history

### 9. `Preview Service`

Owns:

- `PreviewSession` records
- preview status refresh
- private preview URL issuance

Calls:

- `Workspace Service Adapter` for `start_preview`

Must enforce:

- at most one active preview session per project
- preview access remains project-scoped and authenticated

Must not own:

- generic runtime controls
- browser tooling

### 10. `Export Service`

Owns:

- `Export` records
- ZIP generation
- signed download URL issuance

Must not own:

- workspace mutations
- run lifecycle

## Source Of Truth By Resource

Resource ownership should remain unambiguous:

- `User` and session state: `Session Service`
- `ProviderProfile`: `Provider Profile Service`
- `Project` and `Conversation`: `Project Service`
- `Message`, `Run`, and `FileChange`: `Run Coordinator`
- `Workspace` integration details: `Workspace Service Adapter`
- `Snapshot`: `Snapshot Service`
- `PreviewSession`: `Preview Service`
- `Export`: `Export Service`

## Core Flows

### Create Project

1. `App API` receives `POST /projects`.
2. `Project Service` validates `templateId` and creates the `Project` plus its single `Conversation`.
3. `Workspace Service Adapter` materializes the selected starter template.
4. `Snapshot Service` creates the initial snapshot.
5. `App API` returns the project summary.

### Start Run

1. `App API` receives `POST /projects/{projectId}/runs`.
2. `Run Coordinator` checks the active-run guard.
3. `Run Coordinator` creates the user `Message` and `Run`.
4. `Provider Profile Service` resolves the validated provider configuration.
5. `Run Coordinator` invokes only allowed `Project Workspace Contract` operations through the `Workspace Service Adapter`.
6. `Run Stream Publisher` emits ordered events.
7. `Snapshot Service` creates a snapshot if the run succeeds.

### Restore Snapshot

1. `App API` receives snapshot restore request.
2. `Snapshot Service` resolves the snapshot archive reference.
3. `Workspace Service Adapter` restores workspace state.
4. The backend records visible project history for the restore.

### Start Preview

1. `App API` receives preview start request.
2. `Preview Service` invokes `start_preview` through the `Workspace Service Adapter`.
3. `Preview Service` creates or updates the project’s only active `PreviewSession`.
4. `App API` returns preview state and the run stream may emit `preview.updated`.

## Explicit Non-Services

The MVP should not introduce separate services for:

- terminal sessions
- git hosting or git sync
- branch or pull request workflows
- multi-agent orchestration
- provider routing across different vendor abstractions
