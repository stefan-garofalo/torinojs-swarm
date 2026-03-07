## Summary

This PR bootstraps the `torinojs-swarm` monorepo from the Better-T-Stack scaffold into the keynote demo architecture:

- Turborepo-safe workspace normalization
- `Effect` as backend service/runtime layer
- `Elysia` as HTTP layer
- `Eden Treaty` as end-to-end typed client
- `TanStack Query v5` for client-side server state
- Neon-hosted Postgres wired through `Effect SQL + Drizzle`
- shared `AI SDK` foundation package
- two-project Vercel deployment setup for `apps/web` and `apps/server`
- repo-wide source structure normalized to `src/modules` and `src/features`

This is the first real foundation PR for the repo. It replaces most scaffold defaults with the conventions and integration boundaries we want to keep copying in the keynote demo.

## Why

The scaffold gave us the right primitives, but not the runtime boundaries we want:

- backend business logic was not modeled with `Effect`
- HTTP transport and service layer were not separated
- frontend had no typed transport path to the server
- database access was still on the original Better-T-Stack path instead of the `Effect`-first integration we want to showcase
- the repo still had scaffold naming and root-task anti-patterns that weaken a Turborepo
- deployment was not set up for a clean `apps/web` + `apps/server` Vercel split

This PR fixes that and establishes the repo as a real monorepo, not a single app inside a monorepo shell.

## What Changed

### 1. Renamed and normalized the Turborepo workspace

The repo now uses the final workspace identity:

- root package renamed to `torinojs-swarm`
- internal package scope renamed from `@my-better-t-app/*` to `@torinojs-swarm/*`

The task model was cleaned up to follow Turborepo properly:

- root scripts now delegate with `turbo run ...`
- package tasks live in the packages/apps that own them
- app-local `turbo.json` files define app-specific behavior
- root `check` now runs through Turbo instead of shell-chaining package work manually

Files involved include:

- `package.json`
- `turbo.json`
- `tsconfig.json`
- `apps/server/turbo.json`
- `apps/web/turbo.json`
- package manifests in `apps/*` and `packages/*`

### 2. Rebuilt the backend around Effect services + Elysia transport

The server was split into explicit layers:

- `apps/server/src/app.ts`
  - exports the reusable Elysia `app`
  - this is now the source of truth for the Eden client contract
- `apps/server/src/index.ts`
  - local Bun runtime entrypoint
- `apps/server/src/runtime.ts`
  - Effect runtime wiring

HTTP concerns were moved into modules:

- `apps/server/src/modules/http/transport-plugin.ts`
- `apps/server/src/modules/http/auth-plugin.ts`

Business logic was moved into a feature:

- `apps/server/src/features/demo/errors.ts`
- `apps/server/src/features/demo/service.ts`
- `apps/server/src/features/demo/routes.ts`
- `apps/server/src/features/demo/index.ts`

The pattern now is:

- Elysia parses request and exposes typed HTTP responses
- Effect service owns business logic
- domain failures are modeled as typed tagged errors
- handlers adapt Effect results into declared HTTP status/body contracts

The demo feature currently exposes:

- a typed item lookup route with explicit success/error contracts
- a typed DB health route that exercises the DB layer through Effect

### 3. Integrated Neon-hosted Postgres through Effect SQL + Drizzle

`packages/db` was reworked so the database layer is consumable from Effect-based services instead of being configured ad hoc in route code.

Key changes:

- kept Drizzle schema ownership in `packages/db`
- kept a standard Drizzle `db` export for the legacy Better Auth adapter path
- added `Effect`-first DB layers:
  - `DatabaseClientLayer`
  - `DatabaseDrizzleLayer`
  - `DatabaseLayer`
- added DB helpers:
  - `withDatabase(...)`
  - `runDatabase(...)`
  - `pingDatabaseEffect`

Important implementation detail:

- the old runtime path was replaced with `drizzle-orm/node-postgres` + `pg` pool for compatibility where Better Auth still expects the legacy shape
- the Effect integration is handled through `@effect/sql-pg` and `@effect/sql-drizzle`

This gives us:

- one shared schema package
- Effect-aware DB access for services
- no raw DB client creation inside HTTP handlers

### 4. Preserved Better Auth inside the new server structure

Auth was not removed or bypassed.

Instead:

- auth stays in `packages/auth`
- server mounts auth via `apps/server/src/modules/http/auth-plugin.ts`
- the Elysia modularization preserves auth as part of the exported app surface

That means the backend is now modularized without regressing auth integration.

### 5. Added a shared AI SDK foundation package

New package:

- `packages/ai`

This is intentionally infrastructure-only for now. It does not ship a chat route or UI.

It provides:

- provider selection (`gateway` vs `openai`)
- shared model selection helpers
- typed exported AI helper surface
- env-driven configuration

Server hook-up:

- `apps/server/src/ai.ts`

Env contract additions landed in:

- `packages/env/src/server.ts`

This makes the AI provider/model contract reusable from backend now and future clients later, without baking transport or UI assumptions into the package.

### 6. Reorganized the frontend by repo convention: `modules` and `features`

The user-facing source structure was normalized to the repo convention:

- `src/modules`
  - generic app-wide building blocks
- `src/features`
  - actual business logic / implementations built from modules

Concrete moves on the web app:

- former `src/components/ui/*` moved to `src/modules/ui/*`
- `src/lib/auth-client.ts` moved to `src/modules/auth/auth-client.ts`
- auth forms moved under `src/modules/auth/components/*`
- theme/provider pieces moved under `src/modules/theme/*` and `src/modules/app/*`
- the demo domain moved from `src/domains/demo/*` to `src/features/demo/*`

This also included a `shadcn` path fix:

- `apps/web/components.json` now points generated components to `@/modules/ui`
- utils alias points to `@/modules/ui/utils`

That keeps generated primitives aligned with the intended repo structure.

### 7. Added isomorphic Eden Treaty integration for typed frontend/server contracts

New frontend transport entrypoint:

- `apps/web/src/modules/api/eden.ts`

Behavior:

- in server rendering, the web app can import the public `server/app` export and call the Elysia app directly via a custom fetcher
- in the browser, the app uses `NEXT_PUBLIC_SERVER_URL`

Important boundary fix included in this PR:

- `apps/web` does **not** import `server/src/*`
- the server package now exposes a public `server/app` export from `apps/server/package.json`
- the web app consumes only that public export

This matters because importing server internals directly would break the intended two-project Vercel deployment split.

### 8. Added TanStack Query v5 on the frontend

Frontend provider wiring now includes TanStack Query:

- `apps/web/src/modules/app/providers.tsx`

Demo feature query layer:

- `apps/web/src/features/demo/queries.ts`
- `apps/web/src/features/demo/components/demo-item-query.tsx`
- `apps/web/src/features/demo/components/demo-item-server.tsx`

The home page now demonstrates both transport consumption modes:

- server-rendered contract read
- client-side query read

This gives us a concrete keynote example of:

- one typed Elysia contract
- consumed from RSC/server rendering
- consumed again from a client component with TanStack Query
- without duplicating response/error types manually

Important correctness fix included here:

- the client query panel now handles `isPending` and `error` explicitly before checking data
- this avoids masking real query failures as infinite loading states

### 9. Prepared Vercel deployment for the monorepo

Two app-local Vercel projects are now expected:

- `apps/web`
- `apps/server`

Added:

- `apps/web/vercel.json`
- `apps/server/vercel.json`
- `apps/server/api/index.ts` as the Vercel handler shim exporting `app.fetch`
- app-local deploy scripts in both package manifests
- app-local `.env.example` files
- deployment doc: `deployment/vercel.md`

The intended model is:

- local backend runs through Bun via `apps/server/src/index.ts`
- Vercel backend uses the handler shim in `apps/server/api/index.ts`
- linking is done with `vercel link --repo`

This preserves clean local dev ergonomics while keeping deploy concerns isolated to app-specific entrypoints.

### 10. Added planning and source-context artifacts for the swarm/bootstrap work

Added:

- `.agents/torinojs-swarm-bootstrap-plan.md`
- `.agents/source-context-baseline.md`

These capture:

- the bootstrap execution plan
- task dependencies
- Linear issue mapping
- source references used during implementation

This PR also updates shared cross-session notes outside the repo root at:

- `.agents/notes/index.md`

Those notes record the non-obvious repo conventions and gotchas discovered during implementation.

## File/Area Overview

### New backend architecture

- `apps/server/src/app.ts`
- `apps/server/src/runtime.ts`
- `apps/server/src/modules/http/*`
- `apps/server/src/features/demo/*`
- `apps/server/src/ai.ts`
- `apps/server/api/index.ts`

### New frontend architecture

- `apps/web/src/modules/api/eden.ts`
- `apps/web/src/modules/app/providers.tsx`
- `apps/web/src/modules/auth/*`
- `apps/web/src/modules/theme/*`
- `apps/web/src/modules/ui/*`
- `apps/web/src/features/demo/*`

### Shared packages

- `packages/ai/*`
- `packages/db/src/index.ts`
- `packages/env/src/server.ts`

### Deployment/config

- `apps/web/vercel.json`
- `apps/server/vercel.json`
- `apps/web/.env.example`
- `apps/server/.env.example`
- `deployment/vercel.md`

## Validation

Ran:

```bash
bunx turbo run check-types --filter=server --filter=web
```

Result:

- passed

This validates:

- workspace/package graph remains coherent
- public `server/app` export is type-safe for frontend consumption
- server and web packages both typecheck against the new module/feature structure

## Notable Conventions Established By This PR

- `src/modules` = generic app-wide building blocks
- `src/features` = business logic / implementations
- generated `shadcn` UI belongs under `src/modules/ui`
- web must consume the public `server/app` export, never `server/src/*`
- root scripts delegate to `turbo run ...`; task ownership stays in workspaces
- Elysia owns transport, Effect owns service/runtime logic

## Follow-up / Not Included Yet

The only planned area not fully finished as code/docs in this PR is the broader bootstrap contributor documentation task (`TOR-10` / T8). We do have:

- the implementation plan
- deployment documentation
- shared notes

But we do **not** yet have the final polished README/contributor documentation pass that explains the full architecture for a new engineer from scratch.

## Linear Mapping

- `TOR-1` umbrella: bootstrap foundation
- `TOR-2` source context baseline
- `TOR-3` monorepo/Turbo normalization
- `TOR-4` Effect backend foundation
- `TOR-5` Effect SQL + Drizzle DB integration
- `TOR-6` Elysia route contract / Eden export surface
- `TOR-7` frontend Eden + TanStack Query integration
- `TOR-8` AI SDK foundation package
- `TOR-9` Vercel monorepo deployment preparation
- `TOR-10` final architecture/docs handoff

