# Docs Index

All source-of-truth product, architecture, API, and UX docs live in this `docs/` directory.

Use the reading order below when you are new to the repo or need to re-load the locked MVP quickly.

## Recommended Reading Order

1. [product-definition.md](./product-definition.md)
   Defines what `bolt.everything` is, who it is for, and the core project-first workflow.
2. [mvp-scope.md](./mvp-scope.md)
   Locks the MVP scope, explicit constraints, release bar, and out-of-scope features.
3. [architecture.md](./architecture.md)
   Defines the authoritative system shape and the `Project Workspace Contract` boundary.
4. [project-model.md](./project-model.md)
   Defines the core entities, lifecycle states, persistence split, and one-project-one-conversation model.
5. [provider-strategy.md](./provider-strategy.md)
   Defines the only MVP provider abstraction and the validation and resolution rules around it.
6. [onboarding.md](./onboarding.md)
   Defines the first-run and returning-user flows that get a user to the first successful project change.
7. [swiftui-screen-map.md](./swiftui-screen-map.md)
   Maps the locked MVP into concrete SwiftUI screens, panes, sheets, and state rules.
8. [backend-service-boundaries.md](./backend-service-boundaries.md)
   Defines backend ownership, service seams, and the allowed execution boundary.
9. [workspace-contract-schema.md](./workspace-contract-schema.md)
   Defines the exact workspace operation schema and execution invariants for MVP.
10. [api-contracts.md](./api-contracts.md)
    Defines the app-facing HTTP API that preserves the locked MVP behavior.
11. [run-events.md](./run-events.md)
    Defines the ordered SSE run event stream used to render active assistant runs.

## Canonical Source Rule

- Treat files under `docs/` as the only authoritative product and implementation docs for this repo.
- `docs/architecture.md` is the only authoritative architecture document.
- The root `README.md` is orientation only and does not override the docs in this directory.
