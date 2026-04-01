# Architecture

## System Shape

`bolt.everything` is a native iOS client connected to a backend control plane that manages persistent project state and coordinates execution through the `Project Workspace Contract` and a workspace service abstraction. The mobile app is the user interface. The backend owns orchestration, provider access, workspace coordination, snapshots, and preview delivery.

The product contract is a persistent project workspace with files, runs, snapshots, and previews. How that workspace is implemented is an infrastructure decision, not the product identity. The `Project Workspace Contract` is the stable boundary between the control plane and the active workspace implementation.

```text
+------------------+        +-------------------------+
|   iOS Client     | <----> |   API / Control Plane   |
| SwiftUI          |        | auth, projects, runs    |
| chat, files,     |        | provider access, events |
| diffs, preview   |        +-----------+-------------+
+---------+--------+                    |
          |                             |
          |                             v
          |                 +-------------------------+
          |                 |   Run Orchestrator      |
          |                 | prompt assembly, tools, |
          |                 | policy, step execution  |
          |                 +-----------+-------------+
          |                             |
          |                             v
          |                 +-------------------------+
          |                 |   Workspace Service     |
          |                 | file ops, project ops,  |
          |                 | preview, lifecycle      |
          |                 +-----------+-------------+
          |                             |
          |                +------------+------------+
          |                | DB | Object Store | KMS |
          |                +-------------------------+
```

## Project Workspace Contract

The `Project Workspace Contract` is the named interface between the run orchestrator and the workspace service. It defines the only operations the assistant may trigger against a project workspace in MVP.

MVP operations:

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

The contract does not include a generic `run_command` operation, arbitrary shell access, or a general-purpose terminal surface.

## Major Components

### 1. iOS Client

Responsibilities:

- sign-in and session handling
- project list and project creation
- project-scoped chat UI
- run event rendering
- diff viewing
- read-only file browsing
- embedded preview via `WKWebView`
- local cache for recent projects, drafts, and run summaries

The iOS client never executes project code locally. It is a viewer and controller for service-backed project state.

### 2. API / Control Plane

Responsibilities:

- authenticate the user
- create and list projects
- store project metadata and conversation history
- resolve the provider and model for each run
- stream run events back to the app
- manage snapshot metadata
- issue private preview URLs

This layer is the trust boundary for credentials and project ownership.

### 3. Run Orchestrator

Responsibilities:

- build the model input from project context
- expose a constrained tool set to the model
- enforce operation policy
- translate tool calls into workspace actions
- persist run steps, logs, and file change summaries

This is where the assistant becomes operational. It is not allowed to execute arbitrary actions outside the project workspace contract.

### 4. Workspace Service

Responsibilities:

- host the project filesystem
- apply named file operations from the `Project Workspace Contract`
- execute allowlisted `install_dependencies`, `build_project`, and `start_preview` operations
- apply file mutations
- report execution output and process state
- surface preview endpoints through the control plane

This component is an abstraction, not a permanent claim about product shape. In MVP it must be compatible with platform-hosted persistent workspaces, because the product needs durable files, resumable runs, and previews. The app and control plane should still depend on the workspace contract rather than a specific infrastructure implementation.

Possible implementations can change over time as long as they preserve the same contract:

- persistent project filesystem
- constrained operation execution
- preview support when available
- snapshot and resume behavior
- isolated per-project state

## Persistence Model

Persistence is split intentionally:

- `Device cache`: fast local storage for recent projects, drafts, and last-known run state.
- `Metadata store`: authoritative record for users, projects, conversations, runs, snapshots, and provider references.
- `Workspace backing store`: authoritative project filesystem and execution state for the active workspace implementation.
- `Object storage`: logs, exports, and snapshot archives when needed.
- `Key management`: encrypted storage for provider secrets.

The project filesystem is the source of truth for user code. The metadata database is the source of truth for everything around that code.

## Execution Behavior

### Project Creation

1. The user picks a starter template and enters a project name plus goal.
2. The control plane creates a `Project` record and resolves a persistent workspace through the workspace service.
3. The selected template is written into that project's workspace.
4. The system writes a small workspace manifest at `.bolt-everything/project.json`.
5. The system creates the initial snapshot.

In MVP, every project begins from one supported starter template. There is no template-free project creation path.

### Chat Run

1. The user sends a message in a project conversation.
2. The control plane resolves the project's provider profile and model.
3. The orchestrator loads project context and starts a run.
4. The model can call constrained tools mapped to the `Project Workspace Contract`, such as `list_files`, `read_file`, `create_file`, `update_file`, `rename_file`, `delete_file`, `install_dependencies`, `build_project`, `start_preview`, `create_snapshot`, and `restore_snapshot`.
5. Every tool result is persisted and streamed back to the app.
6. On success, the system stores a snapshot and a run summary.
7. On failure, the run is marked failed with an explicit reason and the project workspace remains available for retry.

### Preview

1. The workspace service starts the template's configured `start_preview` operation.
2. If the active workspace implementation exposes an HTTP endpoint, the control plane binds it to a private HTTPS preview URL.
3. The app opens that preview inside a `WKWebView`.
4. If no preview endpoint is available, the app shows logs only.

### Resume

1. When a user reopens a project, the app loads cached metadata immediately.
2. The app then refreshes project state from the control plane.
3. The workspace service resolves active project state lazily on the next run or explicit preview request.

## Tooling Policy

The assistant can only act through explicit tools mapped to the `Project Workspace Contract`. MVP tools should be small and inspectable:

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

There is no generic `run_command` tool and no arbitrary terminal access.

## Security And Trust Boundaries

- Provider API keys are never stored in plaintext on device.
- The workspace implementation does not receive raw provider credentials.
- Previews are private and bound to authenticated project access.
- Workspaces are isolated per project.
- One project can have only one active run in MVP, which avoids conflicting writes.

## Architecture Decisions This Repo Should Assume

- Native iOS app, not a browser shell.
- Service-managed execution, not local mobile execution.
- Persistent project workspaces, not throwaway chat sandboxes.
- Preview delivery over HTTPS when previews are available.
- Workspace execution is an abstraction, with platform-hosted persistent workspaces as an MVP-compatible implementation rather than a permanent product assumption.
- Explicit events and diffs, not opaque background agent behavior.
