# Plan: Turborepo-Safe Bootstrap For `torinojs-swarm`

## Summary

Initial state:
- `demo/` is a Better-T-Stack monorepo with `apps/web`, `apps/server`, `packages/db`, `packages/auth`, `packages/env`, `packages/config`.
- Root `turbo.json` exists, but the repo still carries scaffold naming, thin server/web implementations, and no Effect/Eden/AI/Vercel integration.
- Current root `check` script bypasses Turborepo package-task orchestration.

Target state:
- Keep the repo as a real Turborepo, not a monolith hidden in a monorepo shell.
- Apps stay in `apps/*`; reusable cross-app code stays in `packages/*`; domain code stays inside each app unless it is genuinely shared.
- Root scripts only delegate with `turbo run ...`.
- Package tasks live in package `package.json` files; package-specific task behavior uses package `turbo.json` where needed.
- Backend becomes `Elysia HTTP` + `Effect service/runtime` + `Neon-hosted Postgres via Effect SQL + Drizzle`.
- Frontend becomes `Next App Router/RSC shell` + `isomorphic Eden Treaty` + `TanStack Query v5` for client interactivity.
- AI SDK is added as shared foundation only.
- Deployment targets two Vercel projects from the same repo: `apps/web` and `apps/server`.

## Turborepo Rules Locked For Execution

- No new root task logic. Root `package.json` only delegates to `turbo run`.
- Every reusable task must exist in each relevant workspace `package.json`.
- Use package-level `turbo.json` overrides for app-specific outputs and persistent dev behavior instead of cluttering root `turbo.json`.
- Keep internal shared packages JIT-style by default unless they need emitted artifacts. Apps remain the primary build outputs.
- Do not create a root `.env`; env files live with the consuming app/package, and Turbo inputs/env settings reflect that.
- Do not create a separate "shared domain" package for convenience. Shared packages are only for true infrastructure or cross-runtime utilities.

## Structural Decisions

- Final workspace scope is renamed now from `@my-better-t-app/*` to a `@torinojs-swarm/*`-style scope.
- Package responsibilities:
  - `apps/server`: Elysia app, Effect runtime, backend domains
  - `apps/web`: Next App Router app, frontend domains, Eden/TanStack consumption
  - `packages/db`: Drizzle schema + Effect SQL DB layer
  - `packages/auth`: Better Auth integration shared with server
  - `packages/env`: validated env contracts
  - `packages/config`: shared TS/tooling config
  - `packages/ai`: shared AI SDK foundation
- No separate API-contract package in v1. Source of truth is the exported Elysia app/type from `apps/server`.
- Frontend code is domain-based under app-local folders; truly generic UI stays in a narrow shared area, not a dumping-ground `lib/components` pattern.

## Dependency Graph

```text
T1 ──┬── T2 ──┐
     │        ├── T4 ──┬── T5 ──┐
     │        │        │        │
     ├── T3 ──┘        │        ├── T7 ── T8
     │                 │        │
     └── T6 ───────────┘        │
                                │
T0 ─────────────────────────────┘
```

## Tasks

### T0: Source Context Baseline
- **depends_on**: []
- **location**: repo root, `opensrc/`, planning notes
- **description**: Fetch source context for core libraries with `opensrc` in read-only mode and capture the exact external references used for execution: Effect LLM docs, Elysia Eden/Next/Vercel/AI SDK docs, Drizzle Neon + Effect integration docs, TanStack Query v5 docs, and Vercel monorepo/project-linking docs. Record the commands and URLs in the plan artifact so implementers do not re-derive them.
- **validation**: Execution agent can start with a concrete source list and no ambiguity about official references or library entrypoints.
- **status**: Completed
- **log**: Captured source baseline in `.agents/source-context-baseline.md`; fetched opensrc package source metadata in safe mode with `--modify false`; verified docs endpoints and recorded the opensrc flag gotcha in shared notes.
- **files edited/created**: `demo/.agents/source-context-baseline.md`, `/Users/stefan/Desktop/personale/keynotes/torinojs/.agents/notes/index.md`
- **backlog_item_id**: TOR-2
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-2/t0-source-context-baseline
- **relation_mode**: native
- **tdd_target**: N/A; this is research scaffolding for implementation tasks.
- **review_mode**: cli

### T1: Normalize monorepo identity and Turbo task model
- **depends_on**: []
- **location**: root `package.json`, root `turbo.json`, workspace `package.json` files, workspace imports, package `turbo.json` files where needed
- **description**: Rename workspace scope and imports, remove root task anti-patterns, and standardize package-level scripts for `build`, `check-types`, `lint`, and `dev` only where relevant. Root scripts become pure `turbo run ...` delegates. Add package `turbo.json` overrides for `apps/web` and `apps/server` outputs/persistence instead of broad root overrides.
- **validation**: Every relevant workspace owns its own tasks; root delegates only; Turbo graph expresses build order through workspace dependencies, not shell chaining.
- **status**: Completed
- **log**: Renamed workspace scope to `@torinojs-swarm/*`; converted root scripts to `turbo run ...` delegates; added package-level `lint`/`check-types` coverage and app-level `turbo.json` overrides; validated with `bunx turbo run check-types --filter=server`.
- **files edited/created**: `package.json`, `turbo.json`, `tsconfig.json`, `apps/server/package.json`, `apps/web/package.json`, `packages/db/package.json`, `packages/auth/package.json`, `packages/env/package.json`, `packages/config/package.json`, `packages/db/tsconfig.json`, `packages/auth/tsconfig.json`, `packages/env/tsconfig.json`, `apps/server/tsconfig.json`, `apps/server/src/index.ts`, `apps/server/tsdown.config.ts`, `apps/web/next.config.ts`, `apps/web/src/lib/auth-client.ts`, `apps/web/src/app/layout.tsx`, `packages/db/src/index.ts`, `packages/auth/src/index.ts`, `apps/server/turbo.json`, `apps/web/turbo.json`, `bun.lock`, `/Users/stefan/Desktop/personale/keynotes/torinojs/.agents/notes/index.md`
- **backlog_item_id**: TOR-3
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-3/t1-normalize-monorepo-identity-and-turbo-task-model
- **relation_mode**: native
- **tdd_target**: `turbo run check-types --filter=server` resolves workspace dependencies through package graph, not root shell logic.
- **review_mode**: cli

### T2: Establish Effect-first backend runtime inside `apps/server`
- **depends_on**: [T1]
- **location**: `apps/server/src/**`, `packages/env/**`, shared config files
- **description**: Split the server into exported app module plus runtime entrypoint, introduce Effect config/layers/services/errors, and organize backend code by domain. HTTP handlers remain thin adapters; Effect services own business logic. Use `Effect.Service`, `Schema.TaggedError`, and layer composition consistently.
- **validation**: Server exports a reusable typed Elysia app; one sample route is backed by an Effect service with tagged domain errors mapped to declared HTTP responses.
- **status**: Completed
- **log**: Split the server into `app.ts` + `index.ts`; introduced `AppRuntime`; added `DemoService` as an `Effect.Service` plus tagged domain error and typed Elysia route contract under `apps/server/src/domains/demo`; wave validation now passes after T3 landed.
- **files edited/created**: `apps/server/src/app.ts`, `apps/server/src/index.ts`, `apps/server/src/runtime.ts`, `apps/server/src/domains/demo/service.ts`, `apps/server/src/domains/demo/errors.ts`, `apps/server/src/domains/demo/routes.ts`, `apps/server/package.json`, `package.json`, `bun.lock`, `/Users/stefan/Desktop/personale/keynotes/torinojs/.agents/notes/index.md`
- **backlog_item_id**: TOR-4
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-4/t2-establish-effect-first-backend-runtime-inside-appsserver
- **relation_mode**: native
- **tdd_target**: A failing test proves an Effect service error becomes a typed HTTP error payload instead of an untyped thrown exception.
- **review_mode**: cli

### T3: Replace current Neon HTTP DB path with Neon-hosted Effect SQL + Drizzle
- **depends_on**: [T1]
- **location**: `packages/db/**`, env contracts, server DB wiring
- **description**: Rework `packages/db` so Neon remains the hosted database, but runtime access moves to the official Effect SQL + Drizzle path rather than the current `drizzle-orm/neon-http` client. Keep schema ownership in `packages/db`; expose DB layers and repo-facing helpers for server domains.
- **validation**: Backend services can depend on a DB Effect layer without creating raw clients inline; Drizzle schema remains authoritative.
- **status**: Completed
- **log**: Replaced the runtime DB path with `drizzle-orm/node-postgres` + `pg` pool for the legacy auth adapter, and added the Effect-first SQL stack via `@effect/sql-pg` and `@effect/sql-drizzle`; exposed `DatabaseLayer`, `withDatabase`, `runDatabase`, and `pingDatabaseEffect`.
- **files edited/created**: `packages/db/src/index.ts`, `packages/db/package.json`, `/Users/stefan/Desktop/personale/keynotes/torinojs/.agents/notes/index.md`
- **backlog_item_id**: TOR-5
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-5/t3-replace-neon-http-db-path-with-neon-hosted-effect-sql-drizzle
- **relation_mode**: native
- **tdd_target**: A minimal repository effect can execute a simple query against the Neon-backed connection through the new Effect SQL layer.
- **review_mode**: cli

### T4: Build Elysia route contract for Eden consumption
- **depends_on**: [T2, T3]
- **location**: `apps/server/src/**`, `packages/auth/**`
- **description**: Modularize Elysia by domain/plugin, preserve Better Auth mount, and expose typed route schemas per status for Eden Treaty. Centralize transport concerns such as CORS, auth mount, and domain error mapping. Keep the Elysia app export reusable for direct server-side consumption.
- **validation**: Eden can infer success and error payloads from the exported server app type; Better Auth still works inside the new modular structure.
- **status**: Completed
- **log**: Modularized the server contract into transport plugins plus a demo domain plugin; preserved Better Auth mount; exported a stable `app` from `apps/server/src/app.ts` for Eden consumption; added typed `200/404/500` contracts for `/api/demo/items/:id` and typed DB health contract for `/api/demo/db`.
- **files edited/created**: `apps/server/src/app.ts`, `apps/server/src/plugins/http.ts`, `apps/server/src/plugins/auth.ts`, `apps/server/src/domains/demo/index.ts`, `apps/server/src/domains/demo/errors.ts`, `apps/server/src/domains/demo/service.ts`, `apps/server/src/domains/demo/routes.ts`
- **backlog_item_id**: TOR-6
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-6/t4-build-elysia-route-contract-for-eden-consumption
- **relation_mode**: native
- **tdd_target**: A route with `200` and `404` schemas produces typed client narrowing through Eden Treaty.
- **review_mode**: cli

### T5: Build the frontend around App Router + isomorphic Eden + TanStack Query
- **depends_on**: [T1, T4]
- **location**: `apps/web/src/app/**`, `apps/web/src/domains/**`, `apps/web/src/components/providers.tsx`, `apps/web/src/lib/**`, `apps/web/next.config.ts`
- **description**: Reorganize frontend by domain, add an isomorphic Eden client so server components can call the exported Elysia app directly and client components can call the deployed backend over HTTP, and add TanStack Query v5 providers/query option factories for interactive flows. Keep RSC for shell and low-friction reads; use Query only where caching/refetching/client interactivity matters.
- **validation**: One server component reads a route through direct Eden app access; one client component reads the same contract through `useQuery`; both remain fully typed.
- **status**: Completed
- **log**: Added an isomorphic Eden client in `apps/web/src/lib/eden.ts`; introduced a domain-scoped demo query layer plus server/client demo panels; updated providers to support TanStack Query v5; validated the frontend contract path with `bunx turbo run check-types --filter=web`.
- **files edited/created**: `apps/web/src/lib/eden.ts`, `apps/web/src/domains/demo/queries.ts`, `apps/web/src/domains/demo/components/demo-item-server.tsx`, `apps/web/src/domains/demo/components/demo-item-query.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/components/providers.tsx`, `apps/web/tsconfig.json`, `apps/web/package.json`
- **backlog_item_id**: TOR-7
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-7/t5-build-frontend-around-app-router-isomorphic-eden-tanstack-query
- **relation_mode**: native
- **tdd_target**: A domain page renders the same typed route result from an RSC path and a client Query path without duplicating contract types.
- **review_mode**: mixed

### T6: Add shared AI SDK foundation as a Turborepo package
- **depends_on**: [T1]
- **location**: `packages/ai/**`, `packages/env/**`, server/web import surfaces
- **description**: Create a dedicated shared package for AI foundation only: AI SDK install, provider/gateway wiring, env schema, model selection helpers, and typed utility exports. Keep it package-local and reusable by server now and mobile/web later. No chat route or UI yet.
- **validation**: `packages/ai` can be imported by `apps/server` without framework leakage and without introducing route/UI assumptions.
- **status**: Completed
- **log**: Added `packages/ai` as a reusable foundation package; wired gateway/openai provider selection, shared AI env contracts, and a server-side import surface without adding any route/UI concerns; wave validation passes.
- **files edited/created**: `packages/ai/package.json`, `packages/ai/tsconfig.json`, `packages/ai/src/index.ts`, `packages/env/src/server.ts`, `apps/server/src/ai.ts`, `apps/server/src/index.ts`, `apps/server/package.json`, `bun.lock`
- **backlog_item_id**: TOR-8
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-8/t6-add-shared-ai-sdk-foundation-as-a-turborepo-package
- **relation_mode**: native
- **tdd_target**: A server module imports `@torinojs-swarm/ai` and resolves a typed provider/model helper with validated env.
- **review_mode**: cli

### T7: Prepare Vercel deployment as a real monorepo, not a root app
- **depends_on**: [T4, T5, T6]
- **location**: repo Vercel config, app deployment config, docs/env templates
- **description**: Set up the repo for `vercel link --repo` with two Vercel projects rooted at `apps/web` and `apps/server`. Keep deploy commands/package ownership local to each app. Align Turbo outputs/env inputs with Vercel expectations, document required envs per project, and isolate any Vercel-specific server entrypoint differences from local Bun dev.
- **validation**: Web and server can be built/deployed as separate Vercel projects from one repo without root-level custom shell orchestration.
- **status**: Completed
- **log**: Added app-local Vercel deployment configuration for `apps/web` and `apps/server`; introduced `apps/server/api/index.ts` as the Vercel adapter entrypoint while preserving Bun local runtime; added per-app `.env.example` files plus `deployment/vercel.md`; validated with `bunx turbo run check-types --filter=server --filter=web`.
- **files edited/created**: `apps/web/package.json`, `apps/server/package.json`, `apps/web/vercel.json`, `apps/server/vercel.json`, `apps/server/api/index.ts`, `apps/server/turbo.json`, `apps/web/turbo.json`, `apps/server/.env.example`, `apps/web/.env.example`, `deployment/vercel.md`, `/Users/stefan/Desktop/personale/keynotes/torinojs/.agents/notes/index.md`
- **backlog_item_id**: TOR-9
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-9/t7-prepare-vercel-deployment-as-a-real-monorepo
- **relation_mode**: native
- **tdd_target**: Each Vercel project has a deterministic app root and build flow that does not depend on manual root scripts.
- **review_mode**: cli

### T8: Document package boundaries, dev flows, and keynote-safe conventions
- **depends_on**: [T0, T4, T5, T6, T7]
- **location**: root docs, README, contributor/bootstrap docs, notes
- **description**: Write the bootstrap documentation around the final monorepo shape: what belongs in apps vs packages, how to add a backend domain, how to add a frontend domain, how Eden/Effect/Query/DB/AI connect, how Turbo tasks are expected to work, and how Vercel project mapping works. Record any non-obvious gotchas in shared notes.
- **validation**: Another engineer can extend the repo without re-deciding package boundaries or Turbo task structure.
- **status**: Planned
- **log**:
- **files edited/created**:
- **backlog_item_id**: TOR-10
- **backlog_item_url**: https://linear.app/stefan-projects/issue/TOR-10/t8-document-package-boundaries-dev-flows-and-keynote-safe-conventions
- **relation_mode**: native
- **tdd_target**: N/A; completion is proven by accurate architecture/bootstrap docs.
- **review_mode**: cli

## Parallel Execution Waves

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T0, T1 | Immediately |
| 2 | T2, T3, T6 | T1 complete |
| 3 | T4 | T2 and T3 complete |
| 4 | T5 | T4 complete |
| 5 | T7 | T4, T5, T6 complete |
| 6 | T8 | T0, T4, T5, T6, T7 complete |

## Test Plan

- Turbo graph:
  - Root scripts only call `turbo run`.
  - Workspace tasks exist where Turbo expects them.
  - Package-specific outputs live in package `turbo.json` when behavior differs by app.
- Backend:
  - Elysia app is exported separately from the listener.
  - Effect service failures map to typed HTTP responses.
  - Better Auth still mounts correctly.
- Database:
  - DB access runs through the new Effect SQL layer while Neon remains the provider.
  - No route or service creates ad hoc DB clients.
- Frontend:
  - RSC path uses direct Eden app access.
  - Client path uses TanStack Query v5 object syntax and query option factories.
  - No duplicated transport type declarations on the frontend.
- Deployment:
  - `apps/web` and `apps/server` are independently deployable Vercel projects from one repo.
  - No custom root build script is required to deploy either app.

## Assumptions

- Internal packages remain mostly JIT-style; apps are the primary compiled artifacts.
- A root `.env` will not be introduced; env files stay with the relevant app/package.
- Backlog sync is complete in Linear project `DEMO` under team `TOR`, using umbrella issue `TOR-1` plus child issues `TOR-2` through `TOR-10`.
- `opensrc --modify deny` behaved unexpectedly in this environment, so execution should verify its safe flag usage before relying on it again.
