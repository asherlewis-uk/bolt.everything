# Onboarding

## Onboarding Goal

The first-run experience should get a new user from install to first successful project change with as little ambiguity as possible.

The onboarding flow exists to answer three questions clearly:

- who is the user
- which provider can the app use
- what project should the assistant start with

## First-Run Flow

### 1. Welcome

The first screen explains the product in one sentence:

`Build and modify real projects from your iPhone through chat.`

It should also state two important facts:

- projects are persistent
- a model provider is required before the first run

### 2. Account Setup

MVP uses `Sign in with Apple` as the only end-user authentication path.

Reason:

- native iOS fit
- lower UI and backend scope
- stable identity for project persistence

### 3. Provider Setup

Immediately after sign-in, the user is taken to a provider setup wizard.

The wizard steps:

1. choose `OpenAI`, `OpenRouter`, or `Custom`
2. enter API key and, if needed, base URL
3. choose a default model
4. run validation
5. confirm success before continuing

The user should not land in an empty chat with a broken composer because provider setup was skipped.

### 4. Create First Project

Once provider validation succeeds, the user creates a first project.

Required fields:

- project name
- starter template
- short project goal

Starter templates in MVP:

- React + Vite app
- Next.js app
- Empty Node + TypeScript project

In MVP, every new project starts from one of these starter templates. There is no project import path and no template-free creation flow.

### 5. Seed Prompt

After project creation, the app opens the project conversation and prompts the user for the first task.

Good seed examples:

- "Create a premium landing page for a travel startup."
- "Turn this into a note-taking app with search."
- "Add auth and a profile page."

The first run should be framed as a real project action, not as a demo chat.

### 6. Review Result

After the first run, the app should guide the user to three places:

- run summary
- diff view
- read-only file browser
- preview or logs

This is the moment where the product has to prove that it is operating on a real project, not just generating text.

## Returning User Flow

For a returning user:

1. show the project list immediately from local cache
2. refresh project state from the backend
3. let the user reopen the last project with one tap
4. restore preview state lazily when needed

The app should feel resumable even before remote refresh completes.

## Empty And Error States

### Missing Provider

If the user has no validated provider:

- disable the project composer
- explain why the app is blocked
- route directly to provider setup

### Network Unavailable

If the device is offline:

- show cached projects and messages
- block new runs
- explain that project services cannot be reached

### Validation Failure

If provider validation fails:

- keep the user in the wizard
- show the exact failure reason
- never pretend setup succeeded

### Project Environment Delay

If project execution takes time to become ready:

- show a visible `Preparing project` state
- keep the current screen stable
- stream progress instead of showing a spinner without context

## UX Rules For MVP

- No unconfigured blank slate.
- No hidden provider assumptions.
- No background actions without visible status.
- No detached sample chats that are not tied to a project.
- No requirement to understand desktop concepts before the first successful run.

## Completion Criteria

Onboarding is successful when a new user can:

- sign in
- validate a provider
- create a project
- send a first prompt
- understand what the assistant changed
- return to that same project later
