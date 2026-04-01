# MVP Scope

## Scope Summary

The MVP should prove one narrow loop end to end:

1. configure a model provider
2. create a project
3. ask for changes through chat
4. apply those changes to a persistent project workspace
5. review the result and resume later

If a feature does not strengthen that loop, it is probably post-MVP.

## In Scope

- Native iOS app built for iPhone-first usage, with iPad support as a follow-on layout concern.
- Account-based project persistence, with `Sign in with Apple` as the only end-user auth path in MVP.
- A project list, project detail view, and a single conversation thread per project.
- A small starter catalog:
  - React + Vite app
  - Next.js app
  - Empty Node + TypeScript project
- Every new project in MVP starts from one of these starter templates. There is no project import or template-free creation flow.
- Persistent project workspaces tied one-to-one with projects through a workspace abstraction.
- MVP compatibility with platform-hosted persistent workspaces as an implementation choice, without treating that infrastructure shape as the product itself.
- Read-only file browsing in the app. File creation and file modification are chat-mediated through assistant runs.
- Assistant runs that can:
  - read files
  - create files
  - update files
  - rename files
  - delete files
  - invoke allowlisted `install_dependencies`, `build_project`, and `start_preview` operations
- Streaming run events in the app:
  - current step
  - file changes
  - execution output
  - preview status
  - operation error summary when an operation fails
- Diff review at the run level.
- Automatic snapshots on project creation and after successful runs.
- Snapshot restore for the whole workspace.
- One preview session per project when the active workspace implementation exposes an HTTP preview endpoint.
- ZIP export of the current project state.
- Provider setup for a single provider interface: `OpenAI-compatible chat models`, with presets for `OpenAI`, `OpenRouter`, and `Custom`.

## Deliberate Constraints

- One active run per project at a time.
- One conversation thread per project in MVP.
- No arbitrary shell execution. The system only exposes named workspace operations backed by template metadata or server policy.
- No direct local code execution on the iPhone.
- No direct file editing surface in the app. The file browser is read-only and edits are chat-mediated.
- No hidden agent behavior. The app always shows the current run state and resulting file changes.
- No "infinite provider matrix." One clear provider abstraction beats many partial integrations.

## Out Of Scope

- WebContainers, browser-based terminals, or browser-hosted project execution.
- Electron or desktop-first packaging.
- Web app or Android client.
- Git import, Git push, branch management, or pull request workflows.
- Multi-user collaboration or shared project editing.
- Plugin systems, custom tools, or user-authored agent actions.
- Voice chat, camera-to-code, or image-driven generation.
- Native iOS, Android, or Flutter project build pipelines.
- Background autonomous agents that keep editing after the user leaves.
- Per-message provider switching, provider failover, or model routing graphs.
- Billing, quotas, team workspaces, or enterprise admin controls.

## Release Bar

The MVP is ready only when all of the following are true:

- A new user can complete onboarding and validate a provider in under five minutes.
- A user can create a starter project and receive a successful first assistant run.
- The system persists projects, messages, and snapshots across app relaunch.
- The user can understand what changed without leaving the app.
- A broken preview or operation failure surfaces as a clear run error, not a silent failure.
- Export produces a usable project archive.

## Explicit "No" Decisions

To keep this buildable, the MVP does not try to match `bolt.diy` feature-for-feature. It intentionally avoids:

- browser execution infrastructure
- provider sprawl
- repository syncing
- desktop parity
- autonomous background behavior
