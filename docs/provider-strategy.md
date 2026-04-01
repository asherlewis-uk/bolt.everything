# Provider Strategy

## Strategy Summary

The MVP should not attempt to support every model vendor directly. The goal is a provider setup flow that is clear, debuggable, and secure.

The initial strategy is:

- support one provider interface: `OpenAI-compatible chat models`
- ship preset forms for `OpenAI`, `OpenRouter`, and `Custom`
- run all model calls through the backend control plane
- keep provider selection explicit at the project level

This keeps the user experience understandable while still allowing flexibility.

## Why This Constraint Exists

`bolt.diy` supports many providers because it is a broad browser-first tool. `bolt.everything` does not need that breadth in MVP.

The first release needs provider behavior that is:

- easy to explain during onboarding
- easy to validate before the first run
- consistent for streaming and tool use
- simple to debug when a request fails

## Supported Provider Modes In MVP

### 1. OpenAI Preset

Fields:

- API key
- default model

Behavior:

- fixed base URL
- guided validation
- recommended default for users who want the simplest setup

### 2. OpenRouter Preset

Fields:

- API key
- default model

Behavior:

- fixed base URL
- model choice comes from OpenRouter's catalog, but the app stores only the selected default model

### 3. Custom OpenAI-Compatible

Fields:

- display name
- base URL
- API key
- default model

Behavior:

- intended for advanced users
- requires explicit validation against a known test request

## Capability Requirements

A provider or model is considered usable for MVP only if it supports:

- streaming responses
- structured tool calls or reliable structured output
- enough context window for project prompts
- stable authentication over HTTPS

If a configured model fails these requirements, the app should reject it during validation rather than fail deep inside a run.

## Resolution Rules

Provider resolution should be deterministic:

1. use the project's `providerProfileId` if present
2. otherwise use the user's `defaultProviderProfileId`
3. otherwise block run creation and route the user to provider setup

Model resolution should follow the same pattern:

1. project-specific `modelId` if set
2. provider profile `defaultModel`
3. validation error if neither exists

## Credential Handling

- The iOS app sends secrets only to the backend over authenticated TLS.
- The backend stores provider credentials encrypted at rest.
- The backend resolves credentials at run start.
- The workspace implementation never receives raw provider keys.
- Preview servers and generated apps never inherit provider credentials automatically.

This separation is required. Inference credentials and project execution must remain different trust domains.

## Validation Flow

Every provider profile should go through the same validation path:

1. confirm required fields are present
2. perform a lightweight authenticated API check
3. verify the selected model is reachable
4. run a minimal streamed test request
5. store the profile only if validation succeeds

Validation must produce actionable errors:

- invalid key
- invalid base URL
- unknown model
- quota or billing issue
- incompatible response format

## UX Rules

- Fresh users should not reach the main composer without at least one validated provider profile.
- The active provider and model should always be visible in project settings.
- Changing the provider affects future runs only.
- Provider failure should surface as a first-class run error, not a silent fallback.
- The app should not auto-switch providers in MVP.

## Explicit Non-Goals For MVP

- Anthropic-specific or Gemini-specific native integrations
- local Ollama or LM Studio connections on the same network
- provider failover chains
- per-message provider switching
- provider cost optimization or routing graphs
- managed first-party inference service

Those can come later, but they would make the first release harder to reason about.
