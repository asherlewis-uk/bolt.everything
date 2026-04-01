# SwiftUI Screen Map

## Purpose

This document maps the locked MVP into concrete SwiftUI screens and navigation. It preserves the chat-first interaction model while keeping files read-only and all file changes chat-mediated.

## Navigation Shape

Recommended MVP structure:

```text
AppRoot
  AuthBootstrapScreen
  WelcomeScreen
  SignInWithAppleScreen
  ProviderSetupFlow
    ProviderPresetScreen
    ProviderCredentialsScreen
    ProviderModelScreen
    ProviderValidationScreen
  CreateProjectScreen
  ProjectsListScreen
  ProjectScreen
    ChatPane
    DiffPane
    FilesPane
    PreviewPane
    RunDetailSheet
    SnapshotSheet
    ProjectSettingsSheet
  ExportShareSheet
```

There is no conversation list screen because each project has exactly one conversation in MVP.

## Screen Inventory

### `AuthBootstrapScreen`

Purpose:

- load `GET /v1/bootstrap`
- route to the correct first screen

Primary outcomes:

- show cached project list if available
- route to sign-in if unauthenticated
- route to provider setup if `providerSetupRequired = true`
- route to `ProjectsListScreen` otherwise

### `WelcomeScreen`

Purpose:

- explain the product in one sentence
- send the user into account setup

Primary actions:

- continue to `SignInWithAppleScreen`

### `SignInWithAppleScreen`

Purpose:

- complete the only MVP auth flow

Primary actions:

- sign in
- retry on auth failure

### `ProviderSetupFlow`

Purpose:

- collect and validate one `OpenAI-compatible chat models` provider profile

Screens:

- `ProviderPresetScreen`
- `ProviderCredentialsScreen`
- `ProviderModelScreen`
- `ProviderValidationScreen`

Rules:

- the user cannot skip validation
- the composer remains inaccessible until at least one validated provider exists
- the flow supports only `OpenAI`, `OpenRouter`, and `Custom`

### `CreateProjectScreen`

Purpose:

- create a new project from a supported starter template

Required fields:

- `name`
- `templateId`
- `goal`

Rules:

- every project starts from a starter template
- there is no import flow
- there is no template-free project creation path

### `ProjectsListScreen`

Purpose:

- list and open existing projects
- create a new project

Primary UI:

- project rows
- last updated timestamp
- project status chip
- create project button

Primary actions:

- open project
- create project
- open archived project if included in the list filter

### `ProjectScreen`

Purpose:

- host the entire project workspace experience

Recommended structure:

- header with project name, provider/model chip, and run status
- segmented content area with `Chat`, `Diffs`, `Files`, and `Preview`
- bottom composer anchored to the single project conversation

Rules:

- this screen is the default destination after project creation
- there is no conversation switcher
- the composer is disabled while a run is `queued` or `running`

## Project Panes

### `ChatPane`

Purpose:

- render the single conversation thread
- stream run events inline

Primary UI:

- user and assistant messages
- run status banner
- operation timeline summary
- composer

Primary actions:

- send message
- tap into `RunDetailSheet`
- open related diff/file/preview context from a run summary

Explicit non-actions:

- no branch conversations
- no direct file editing
- no terminal UI

### `DiffPane`

Purpose:

- review file changes produced by runs

Primary UI:

- run selector or run-grouped list
- file change list
- diff content view

Rules:

- diffs are read-only
- diffs are sourced from `FileChange` records and current file snapshots

### `FilesPane`

Purpose:

- browse the current project filesystem

Primary UI:

- directory tree
- file content viewer

Rules:

- the file browser is read-only in MVP
- there are no buttons for create, edit, rename, or delete
- file changes occur only through chat-triggered runs
- `.bolt-everything/` should be hidden from normal browsing

### `PreviewPane`

Purpose:

- show preview output when the project exposes an HTTP preview endpoint

Primary UI:

- `WKWebView` when preview is available
- structured execution output when preview is unavailable or failed

Primary actions:

- start or restart preview

Explicit non-actions:

- no devtools UI
- no browser console UI
- no terminal surface

## Sheets And Secondary Surfaces

### `RunDetailSheet`

Purpose:

- show one run in more detail without leaving `ProjectScreen`

Contents:

- run status
- ordered operation list
- execution output summary
- failure reason, if failed
- links to affected diffs and files

### `SnapshotSheet`

Purpose:

- list snapshots
- restore one snapshot

Rules:

- restoring a snapshot should surface as a visible project event
- the sheet does not expose raw archive internals

### `ProjectSettingsSheet`

Purpose:

- show project metadata
- show active provider and model
- allow provider/model changes for future runs

Allowed editable fields:

- project name
- project goal
- provider profile
- model

Explicit non-actions:

- no conversation management
- no workspace command editing
- no git settings

### `ExportShareSheet`

Purpose:

- present the finished ZIP export using the native share flow

## State Rules

### Missing Provider

- disable composer
- show inline explanation
- route to provider setup

### Active Run

- show run status in the project header
- disable composer until the active run reaches a terminal state
- keep all panes navigable in read-only mode

### Offline

- allow cached project browsing
- block new runs
- show stale-state messaging

### Preparing Project

- show a stable loading state when project execution is becoming ready
- stream run or preview progress instead of showing an unexplained spinner

## Deliberate Absences

The screen map does not include:

- terminal screens
- editable code editor screens
- git screens
- desktop-only navigation patterns
- multi-agent monitoring surfaces
