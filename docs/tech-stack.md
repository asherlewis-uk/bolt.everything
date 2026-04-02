# Tech Stack

This document locks the remaining implementation decisions for the current MVP so scaffolding and code generation do not drift beyond the authoritative docs in this directory.

It complements the existing product, architecture, API, and implementation docs. It does not expand or override the locked MVP scope in [mvp-scope.md](./mvp-scope.md).

## 1. Repo / Tooling

- Repository shape: `monorepo`
- Top-level directories:
  - `apps/ios`
  - `apps/api`
  - `packages/contracts`
  - `packages/workspace-contract`
- Package manager: `pnpm`
- Workspace strategy: `pnpm workspaces`
- Node version target: `Node.js 22 LTS`
- Formatting/linting baseline for TypeScript: `Biome`
- Do not introduce `Turborepo`, `Nx`, `Bun`, `Yarn`, or `npm workspaces` unless explicitly requested later

## 2. iOS Client Stack

- Language: `Swift`
- UI framework: `SwiftUI`
- Preview surface: `WKWebView`
- Networking: `URLSession`
- State approach: `MVVM` with small feature-scoped `Observable` view models; do not introduce `TCA`, `Redux`, or a custom global store
- Swift concurrency: `async/await`
- File browsing remains read-only in MVP
- Do not introduce UIKit-first patterns unless strictly necessary

## 3. Backend Stack

- Language/runtime: `TypeScript` on `Node.js`
- API framework: `Fastify`
- Database: `PostgreSQL`
- ORM/query layer: `Drizzle ORM`
- Validation/schema library: `Zod`
- SSE implementation: native `Fastify` and `Node.js` streaming for Server-Sent Events
- Do not introduce `Express`, `NestJS`, `Hono`, `Prisma`, `MongoDB`, `Redis`-first architecture, serverless-first architecture, or microservices

## 4. Shared Contracts Strategy

- Source of truth in code: TypeScript schemas and types inside `packages/contracts`
- Backend uses `packages/contracts` directly
- `packages/workspace-contract` contains the typed `Project Workspace Contract` only
- iOS consumes documented API contracts and matching DTOs generated or hand-authored from the locked API docs; do not try to share TypeScript runtime code with iOS
- Do not switch to `OpenAPI`-first, `GraphQL`, or JSON-schema-first as the primary contract source unless explicitly requested later

## 5. Authentication Implementation Direction

- End-user auth path: `Sign in with Apple` only in MVP
- Backend auth model: session-based backend-authenticated API for the iOS client
- The backend owns session validation and user bootstrap
- Do not introduce third-party auth products, browser-centric auth flows, social login expansion, or multi-provider auth

## 6. Local Development / Runtime Assumptions

- `apps/api` runs as a single backend service in MVP
- No serverless-first deployment assumptions
- No queue or multi-worker distributed architecture unless explicitly needed later
- Development should support local Postgres-backed execution
- Workspace execution remains behind the `Project Workspace Contract` and must not expose arbitrary shell access

## 7. Testing Baseline

- Backend tests: `Vitest`
- iOS tests: `XCTest`
- Minimum expectation:
  - contract and schema validation tests
  - API route smoke tests
  - run-event serialization tests
  - basic SwiftUI screen and view-model tests where practical
- Do not add `Playwright`, `Cypress`, snapshot-heavy UI testing, or end-to-end browser tooling at this stage

## 8. Non-Goals / Anti-Drift Rules

- Do not broaden scope beyond the locked MVP
- Do not add terminal UI, arbitrary shell access, `WebContainers`, `Electron`, git workflows, multi-agent orchestration, editable in-app files, Android or web clients, or extra provider abstractions
- `docs/` remains the only authoritative source of product and system truth
- `docs/tech-stack.md` must complement the locked docs, not override product scope
