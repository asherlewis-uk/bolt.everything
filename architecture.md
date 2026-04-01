# Architecture

## System Shape

`bolt.everything` is a native iOS client connected to a backend control plane that manages persistent remote workspaces. The mobile app is the user interface. The backend owns orchestration, provider access, workspace scheduling, snapshots, and preview proxying.

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
          |                 |  Workspace Runtime      |
          |                 | isolated container/VM   |
          |                 | persistent filesystem   |
          |                 +-----------+-------------+
          |                             |
          |                +------------+------------+
          |                | DB | Object Store | KMS |
          |                +-------------------------+
```

## Major Components

### 1. iOS Client

Responsibilities:

- sign-in and session handling
- project list and project creation
- project-scoped chat UI
- run event rendering
- diff viewing
- file browsing
- embedded preview via `WKWebView`
- local cache for recent projects, drafts, and run summaries

The iOS client never executes project code locally. It is a viewer and controller for remote state.

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
- enforce command policy
- translate tool calls into workspace actions
- persist run steps, logs, and file change summaries

This is where the assistant becomes operational. It is not allowed to execute arbitrary actions outside the project workspace contract.

### 4. Workspace Runtime

Responsibilities:

- host the project filesystem
- run install/build/preview commands
- apply file mutations
- report command output and process state
- expose preview ports through the control plane

The runtime is project-scoped and persistent. In MVP, each project maps to one remote workspace volume and one runtime image selected from the starter template.

## Persistence Model

Persistence is split intentionally:

- `Device cache`: fast local storage for recent projects, drafts, and last-known run state.
- `Metadata store`: authoritative record for users, projects, conversations, runs, snapshots, and provider references.
- `Workspace volume`: authoritative project filesystem.
- `Object storage`: logs, exports, and snapshot archives when needed.
- `Key management`: encrypted storage for provider secrets.

The project filesystem is the source of truth for user code. The metadata database is the source of truth for everything around that code.

## Explicit Runtime Behavior

### Project Creation

1. The user picks a starter template and enters a project name plus goal.
2. The control plane creates a `Project` record and a persistent workspace.
3. The selected template is written into the workspace.
4. The system writes a small workspace manifest at `.bolt-everything/project.json`.
5. The system creates the initial snapshot.

### Chat Run

1. The user sends a message in a project conversation.
2. The control plane resolves the project's provider profile and model.
3. The orchestrator loads project context and starts a run.
4. The model can call constrained tools such as `read_file`, `write_file`, `list_files`, `run_command`, and `start_preview`.
5. Every tool result is persisted and streamed back to the app.
6. On success, the system stores a snapshot and a run summary.
7. On failure, the run is marked failed with an explicit reason and the workspace remains available for retry.

### Preview

1. The runtime starts the template's configured preview command.
2. If the command exposes an HTTP port, the control plane binds it to a private HTTPS preview URL.
3. The app opens that preview inside a `WKWebView`.
4. If no HTTP port is exposed, the app shows logs only.

### Resume

1. When a user reopens a project, the app loads cached metadata immediately.
2. The app then refreshes project state from the control plane.
3. The workspace is resumed lazily on the next run or explicit preview request.

## Tooling Policy

The assistant can only act through explicit tools. MVP tools should be small and inspectable:

- list files
- read file
- create file
- update file
- rename file
- delete file
- install dependencies
- run build command
- run preview command
- create snapshot
- restore snapshot

Arbitrary terminal access is not part of the architecture.

## Security And Trust Boundaries

- Provider API keys are never stored in plaintext on device.
- The runtime does not receive raw provider credentials.
- Previews are private and bound to authenticated project access.
- Workspaces are isolated per project.
- One project can have only one active run in MVP, which avoids conflicting writes.

## Architecture Decisions This Repo Should Assume

- Native iOS app, not a browser shell.
- Remote execution, not local mobile execution.
- Persistent project workspaces, not throwaway chat sandboxes.
- Preview proxying over HTTPS, not direct container port exposure.
- Explicit events and diffs, not opaque background agent behavior.
