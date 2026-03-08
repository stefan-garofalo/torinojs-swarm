# Plan: PR Review Fixes For Effect DB And Eden Transport

**Generated**: 2026-03-08

## Overview
Resolve the open PR review issues attached to `stefan-garofalo/torinojs-swarm` PR `#1` without broadening scope beyond the reported problems.

Current issue state:
- `#2` is a real runtime bug in `packages/db/src/index.ts`: `DatabaseDrizzleLayer` is merged next to `DatabaseClientLayer` instead of being provided by it.
- `#5` is a transport/API migration task: the web app still uses `edenTreaty` instead of the current `treaty` API from `@elysiajs/eden`.
- `#4` is an API-surface cleanup task after the DB fix: `runDatabase` and `getAiModel` are currently unused.
- `#3` appears already fixed on the current branch and should be treated as a regression check / merge-close item, not a fresh coding task.

Source context checked before planning:
- `effect@3.19.19` source via `opensrc`
- `elysia@1.4.21` source via `opensrc`
- `@elysiajs/eden@1.4.8` source already present in `opensrc`
- Elysia Treaty v2 docs and Effect layer docs

## Prerequisites
- Bun workspace install is healthy
- GitHub CLI authenticated for issue updates
- Valid local server env exists for runtime smoke checks

## Dependency Graph

```text
T1 ──┐
     ├── T3 ──┐
T2 ──┘        ├── T4
              │
Issue #3 verification ───────┘
```

## Tasks

### T1: Fix DB layer composition
- **depends_on**: []
- **location**: `packages/db/src/index.ts`
- **description**: Replace `Layer.mergeAll(DatabaseClientLayer, DatabaseDrizzleLayer)` with dependency-feeding composition that provides the SQL client to the Drizzle layer. Then tighten `withDatabase` and any related helper signatures so they no longer hide unsatisfied requirements with a broad cast. Keep only the minimum cast still required by current `effect` / `sql-drizzle` typings.
- **validation**: `bun run check-types` passes; local server DB health route returns `200` through the Effect path; no runtime `SqlClient` missing-service failure appears.
- **status**: Planned
- **log**:
- **files edited/created**:
- **backlog_item_id**: `#2`
- **backlog_item_url**: `https://github.com/stefan-garofalo/torinojs-swarm/issues/2`
- **relation_mode**: `body-links`
- **tdd_target**: Make the demo DB health check succeed through `withDatabase(pingDatabaseEffect)` with correct layer composition and no hidden requirement leak.
- **review_mode**: `cli`

### T2: Migrate frontend transport to Treaty v2
- **depends_on**: []
- **location**: `apps/web/src/modules/api/eden.ts`, `apps/web/src/features/demo/queries.ts`, `.agents/notes/frontend-transport.md`
- **description**: Replace `edenTreaty` with `treaty` and update the dynamic route call shape to the Treaty v2 API documented by Elysia. Keep the current server type import boundary (`import type { App } from "server/app"`). Refresh the frontend transport note so repo conventions match the new client shape.
- **validation**: `bun run check-types:web` passes; `bun run build:web` passes; the demo item query still returns the typed item response and keeps typed error handling.
- **status**: Planned
- **log**:
- **files edited/created**:
- **backlog_item_id**: `#5`
- **backlog_item_url**: `https://github.com/stefan-garofalo/torinojs-swarm/issues/5`
- **relation_mode**: `body-links`
- **tdd_target**: Make the demo web client compile and run with `treaty<App>(...)`, including the `/api/demo/items/:id` call through the correct v2 dynamic-param syntax.
- **review_mode**: `cli`

### T3: Remove unused exports after the DB fix
- **depends_on**: [T1]
- **location**: `packages/db/src/index.ts`, `packages/ai/src/index.ts`, `apps/server/src/ai.ts`
- **description**: Remove `runDatabase` once the DB helpers are fixed, and remove `getAiModel` if it remains unused after a final search. Do not remove `getAiModelSelection`, which is still used by the server runtime. Keep the cleanup strictly limited to exports that have zero remaining call sites.
- **validation**: repo-wide search shows no internal usages of removed exports; `bun run check-types` and `bun run build:server` still pass.
- **status**: Planned
- **log**:
- **files edited/created**:
- **backlog_item_id**: `#4`
- **backlog_item_url**: `https://github.com/stefan-garofalo/torinojs-swarm/issues/4`
- **relation_mode**: `body-links`
- **tdd_target**: Remove only the exports with no remaining call sites while preserving the current AI selection and DB call paths.
- **review_mode**: `cli`

### T4: Reconcile regressions and issue state
- **depends_on**: [T1, T2, T3]
- **location**: PR `#1`, issues `#2`, `#3`, `#4`, `#5`
- **description**: Run the full validation matrix after the fixes, confirm that issue `#3` remains fixed, and then update the PR/issues so backlog state matches the branch reality. `#3` should not drive fresh code unless the validation matrix shows a regression.
- **validation**: `bun run lint`, `bun run check-types`, `bun run build`, plus local route smoke checks for `/api/demo/db` and `/api/demo/items/demo-1` all pass.
- **status**: Planned
- **log**:
- **files edited/created**:
- **backlog_item_id**: `#2, #3, #4, #5`
- **backlog_item_url**: `https://github.com/stefan-garofalo/torinojs-swarm/issues/2`, `https://github.com/stefan-garofalo/torinojs-swarm/issues/3`, `https://github.com/stefan-garofalo/torinojs-swarm/issues/4`, `https://github.com/stefan-garofalo/torinojs-swarm/issues/5`
- **relation_mode**: `body-links`
- **tdd_target**: Prove the final branch closes the open review issues without reintroducing the SSR env regression from `#3`.
- **review_mode**: `cli`

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T1, T2 | Immediately |
| 2 | T3 | T1 complete |
| 3 | T4 | T1, T2, T3 complete |

## Testing Strategy
- Prefer vertical slices: make one failing public behavior real, fix it minimally, then re-run the public validation.
- Use existing repo commands first: `bun run check-types`, `bun run build`, `bun run lint`.
- Add or update only the minimum smoke coverage needed to prove the DB Effect path and Treaty v2 client behavior.
- Treat issue `#3` as a regression test, not a redesign task.

## Risks & Mitigations
- **Risk**: `effect` typing still forces a narrow cast after composition is corrected.
  - **Mitigation**: keep only the schema-typing cast if needed; remove requirement-hiding casts.
- **Risk**: Treaty v2 changes the dynamic route access pattern and breaks current demo query code.
  - **Mitigation**: migrate the query call in the same task and validate with `check-types` and `build:web`.
- **Risk**: cleanup removes an export that a future but uncommitted branch expects.
  - **Mitigation**: use repo-wide search immediately before removal and keep cleanup scoped to confirmed zero-call-site exports only.
