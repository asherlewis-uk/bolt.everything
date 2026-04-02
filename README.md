# bolt.everything

`bolt.everything` is a mobile-first iOS app and backend control plane for creating and modifying real software projects through chat.

## Start Here

Read [docs/INDEX.md](./docs/INDEX.md) first.

That file is the entry point for the locked MVP and the only source of truth for product, API, architecture, and UX behavior. The root README is orientation only.

Recommended doc path:

1. `docs/INDEX.md`
2. `docs/implementation-plan.md`
3. `docs/tech-stack.md`

## Repo Structure

```text
apps/
  api/                  Fastify + TypeScript + Drizzle backend skeleton
  ios/                  SwiftUI Phase 1 screen/package skeleton
packages/
  contracts/            Shared Zod schemas and app-facing HTTP DTO contracts
  workspace-contract/   Typed Project Workspace Contract and manifest schema
docs/                   Locked product and implementation docs
```

## Current Scaffold Status

Only Phase 1 from `docs/implementation-plan.md` is scaffolded right now.

Included in this scaffold:

- monorepo workspace setup with `pnpm workspaces`
- locked TypeScript tooling with Biome and a backend/package base tsconfig
- shared typed contracts for the locked core entities and Phase 1 HTTP surfaces
- backend route and service skeletons for bootstrap, provider profile setup, and project bootstrap
- SwiftUI Phase 1 onboarding and project-creation screens

Not implemented yet:

- real `Sign in with Apple` credential exchange and backend session persistence
- real PostgreSQL-backed repositories and migrations beyond schema scaffolding
- actual starter-template materialization into a persistent workspace
- run orchestration, chat execution, diffs, files, preview, snapshot restore, and export flows from later phases

## Notes

- Scope is intentionally locked to the MVP described in `docs/`.
- The in-app file browser remains read-only in the MVP.
- One project maps to one conversation, and later phases preserve one active run per project.
