# Product Definition

## Product Statement

`bolt.everything` is a native iOS app that lets a user create, inspect, and modify real software projects through chat. Each conversation is attached to a persistent project workspace abstraction, so the assistant operates on files, workspace operations, and previews instead of producing disconnected code snippets.

This is a clean rebuild inspired by `bolt.diy`, but it does not inherit `bolt.diy`'s browser-first assumptions. The product is designed for iPhone first, iPad second, and treats mobile interaction as the primary experience rather than a reduced companion client.

## Problem

People can already ask an LLM for code, but they still lose continuity. The prompt is separate from the project, the files are separate from the conversation, and mobile usage is usually an afterthought.

`bolt.everything` solves a narrower problem:

- start a project from a phone
- ask for changes in normal language
- see exactly what changed
- run a preview when possible
- return later to the same project state

## Product Principles

- `Project-first, not chat-first in storage`: every chat belongs to a project, never the other way around.
- `Chat-first in interaction`: the primary control surface is the conversation, with files and previews as supporting views.
- `iOS-native`: the app should feel correct on iPhone, including fast load, clear gestures, and focused flows.
- `Explicit system behavior`: the user can see the active provider, selected model, project state, workspace status, file changes, and run status.
- `Persistence by default`: projects, messages, snapshots, and preview metadata survive app restarts and can be resumed.
- `Constrained automation`: the assistant can act, but only through well-defined tools and allowlisted project operations.

## Target User

The initial user is a solo builder, founder, product-minded developer, or technical operator who wants to start or continue a software project from an iPhone without needing a desktop IDE open at the same moment.

The MVP is not optimized for large teams, enterprise governance, or long-running autonomous agents.

## Core User Jobs

- Create a new project from one of the supported starter templates and a short idea prompt.
- Ask the assistant to implement features, fix bugs, or restructure files.
- Inspect files in a read-only browser and review diffs produced by each run.
- Review diffs and understand what happened in each run.
- Start or restart a preview and inspect the result inside the app.
- Leave and come back later without losing project context.
- Export the project when they want to continue elsewhere.

In MVP, every new project starts from a starter template. The `Empty Node + TypeScript project` template is the minimal starting point; there is no template-free project creation flow.

## Core Workflow

1. The user opens the app and selects or creates a project.
2. The user sends a prompt such as "make this landing page feel premium" or "add auth and a profile screen."
3. The backend runs an orchestrated assistant session against that project's persistent workspace through the `Project Workspace Contract`.
4. The app streams status, file changes, logs, and preview updates in a mobile-friendly format.
5. The user inspects the result, follows up in chat, restores a snapshot, or exports the project.

## What "Real Project" Means

For this product, a real project is not just a transcript or generated ZIP. It has:

- a persistent project filesystem
- a starter template selected at project creation
- tracked file changes by run
- allowlisted install, build, and preview operations when supported
- resumable history across sessions
- a read-only in-app file browser, with file changes applied through chat-mediated runs

The product depends on that contract, not on a specific hosted runtime shape.

## Initial Success Criteria

The first shippable version proves these outcomes:

- a user can configure a provider without confusion
- a user can create a project from the phone in minutes
- the assistant can modify actual files in that project
- the user can inspect diffs and run state clearly
- the project is still there when the user returns later

## Non-Goals For The Initial Product

- a general-purpose desktop IDE replacement
- arbitrary terminal access from the phone
- browser sandbox execution such as WebContainers
- Electron packaging or browser-first architecture
- a broad provider marketplace at launch
- multi-user collaboration, comments, or shared editing
- native iOS project generation and simulator execution in the MVP
