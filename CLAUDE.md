# CLAUDE.md — bolt.everything

This file orients AI assistants working in this repository. Read `docs/INDEX.md` for the authoritative product and architecture documentation before making changes.

---

## Repository Overview

**bolt.everything** is a monorepo for an iOS-native app that lets users create and modify software projects through LLM-powered chat. The backend serves a REST API; the iOS client is the primary user interface.

```
bolt.everything/
├── apps/
│   ├── api/               Fastify + TypeScript backend
│   └── ios/               SwiftUI native iOS client
├── packages/
│   ├── contracts/         Shared Zod schemas and HTTP DTOs
│   └── workspace-contract/ Typed Project Workspace Contract
├── docs/                  Authoritative product & architecture docs
├── biome.json             Formatter/linter config
├── tsconfig.base.json     Shared TypeScript config
└── pnpm-workspace.yaml    Monorepo workspace config
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Backend | Fastify v5, TypeScript, Zod, Drizzle ORM |
| Database | PostgreSQL (Drizzle schema in `apps/api/src/db/schema.ts`) |
| iOS | SwiftUI (iOS 17+), URLSession, async/await |
| Package manager | pnpm v10 workspaces |
| Linting/Formatting | Biome v1.9 |
| Testing | Vitest (TypeScript), XCTest (iOS) |

---

## Common Commands

Run from the repository root unless noted.

```bash
# Install dependencies
pnpm install

# Development server (from apps/api)
pnpm dev                   # tsx watch src/index.ts

# Check all TypeScript
pnpm typecheck

# Lint
pnpm lint                  # Biome check (read-only)
pnpm format                # Biome format --write

# Tests
pnpm test                  # All packages

# Database migrations (from apps/api)
pnpm db:generate           # drizzle-kit generate
```

---

## Architecture

### Backend (`apps/api`)

Entry: `src/index.ts` → `src/app.ts` (builds Fastify instance)

Services are instantiated in `buildApp()` and injected into route handlers:

- **SessionService** — user session bootstrap
- **ProviderProfileService** — LLM provider credential management
- **ProjectService** — project CRUD + orchestration
- **SnapshotService** — project snapshot management
- **WorkspaceServiceAdapter** — workspace contract + template handling

Current Phase 1 uses **DevMemoryStore** (in-memory). Drizzle ORM tables are scaffolded in `src/db/schema.ts` but not yet connected.

**Routes (prefix `/v1`):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/bootstrap` | Session + recent projects |
| POST | `/v1/provider-profiles/validate` | Validate provider credentials |
| POST | `/v1/provider-profiles` | Create provider profile |
| PATCH | `/v1/provider-profiles/{id}` | Update provider |
| POST | `/v1/provider-profiles/{id}/make-default` | Set default |
| GET | `/v1/projects` | List projects |
| POST | `/v1/projects` | Create project |
| GET | `/v1/projects/{id}` | Get project details |

### Shared Packages

- **`packages/contracts`** — Zod schemas for all domain entities and HTTP DTOs. All types are inferred from Zod (`z.infer<typeof schema>`), never manually declared.
- **`packages/workspace-contract`** — Schemas for workspace operations (`list_files`, `read_file`, `create_file`, `update_file`, `rename_file`, `delete_file`, `install_dependencies`, `build_project`, `start_preview`, `create_snapshot`, `restore_snapshot`) and per-template execution profiles.

### iOS (`apps/ios`)

Architecture: MVVM with feature-scoped `@Observable` view models (no TCA, no Redux).

Navigation: Route state machine in `Phase1AppRoot.swift` — `AuthBootstrap → Welcome → SignIn → ProviderSetup → CreateProject → ProjectsList`

Key directories:
- `Screens/` — SwiftUI views
- `ViewModels/` — `@Observable` view models, one per screen
- `Services/` — HTTP service layer (`BootstrapService`, `ProjectService`, `ProviderProfileService`)
- `Networking/APIClient.swift` — URLSession HTTP client
- `Models/APIModels.swift` — `Decodable` DTOs matching backend contracts

---

## Code Conventions

### TypeScript

- **Strict mode:** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` are on. Index access always returns `T | undefined`.
- **Zod-first:** Schemas are the source of truth. Infer types with `z.infer<>`, never duplicate type definitions.
- **Formatting:** Biome enforces 100-char line width, 2-space indent, double quotes, semicolons always, trailing commas.
- **No barrel files:** Import directly from the source module.

### ID Generation

Prefix-based IDs are generated in `apps/api/src/lib/id.ts`:

```
usr_<12 hex chars>    prj_<12>    cnv_<12>    ws_<12>    snp_<12>
```

Always use the `makeId(prefix)` utility — never raw `randomUUID()`.

### Error Handling

Use `AppError` from `apps/api/src/lib/app-error.ts`. The central error handler in `app.ts` transforms it to the standard API shape:

```json
{ "error": { "code": "...", "message": "...", "details": {...} } }
```

Throw `AppError` for business-logic failures; let unexpected errors bubble to the default handler.

### Dependency Injection

Pass services as constructor arguments or function parameters — never use global singletons. Routes receive services through the registration function signature.

### Swift / iOS

- Use `async/await` and Swift Concurrency throughout; no completion-handler callbacks.
- State lives in the feature's `@Observable` view model, not in the view struct.
- No shared mutable global state; use `AppEnvironment` for DI.

---

## Docs Structure

All authoritative decisions live in `docs/`. Read these before changing architecture:

| File | Contents |
|------|---------|
| `docs/INDEX.md` | Reading order and overview |
| `docs/architecture.md` | Canonical system architecture |
| `docs/mvp-scope.md` | Locked scope — what is and is not in MVP |
| `docs/tech-stack.md` | Tooling decisions and rationale |
| `docs/project-model.md` | Core entities (User, Project, Conversation, Run, etc.) |
| `docs/api-contracts.md` | HTTP request/response shapes |
| `docs/workspace-contract-schema.md` | Workspace operation definitions |
| `docs/swiftui-screen-map.md` | iOS screen map, navigation rules |
| `docs/backend-service-boundaries.md` | Service responsibilities |
| `docs/implementation-plan.md` | Phase breakdown |

---

## What NOT to Do

These are explicitly out of scope for MVP:

- Do **not** add Turborepo, Nx, Bun, Yarn, or npm workspaces — pnpm workspaces only.
- Do **not** add TCA, Redux, or Combine for iOS state — `@Observable` MVVM only.
- Do **not** add Express, NestJS, Hono, Prisma, MongoDB, or serverless — Fastify + PostgreSQL + Drizzle.
- Do **not** add a `run_command` workspace operation or arbitrary shell access.
- Do **not** expand auth beyond Sign in with Apple.
- Do **not** add OpenAPI or GraphQL — Zod schemas are the contract layer.
- Do **not** make the in-app file browser editable (read-only in MVP).
- Do **not** add multi-provider auth.

---

## Development Phase

**Current phase: Phase 1** — onboarding, provider setup, and project scaffolding skeleton.

- Backend uses `DevMemoryStore` (in-memory). Migration to Drizzle + PostgreSQL is the next persistence step.
- iOS screens through `ProjectsListScreen` are implemented. Project workspace shell is Phase 2+.
- Run orchestration, chat execution, diffs, and SSE streaming are Phase 2+.

---

## Environment Setup

Copy `.env.example` to `.env` in `apps/api` and fill in values:

```
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bolt_everything
SESSION_COOKIE_NAME=bolt_session
APPLE_SERVICES_ID=<your Apple services ID>
```
