# Plan: TOR-33 Authentication System

**Generated**: 2026-03-09

## Overview
Replace the current Better Auth email/password flow with GitHub OAuth, enforce a hard auth gate for the app surface, and make auth/session behavior work in this repo's split-deployment topology.

Current issue state:
- `packages/auth` already mounts Better Auth through `packages/api` at `/api/auth/*`, but `emailAndPassword.enabled` is still `true`.
- `apps/web` uses `createAuthClient({ baseURL: env.NEXT_PUBLIC_SERVER_URL })`, so browser auth calls go directly to the separate server host.
- `/dashboard` is the only guarded page today. `/` is public, `/login` renders sign-in/sign-up password forms, and the header still links to `/dashboard`.
- The repo deploys `apps/web` and `apps/server` as separate Vercel projects, while `apps/web` SSR imports the server runtime stack in-process. Auth env changes therefore affect both deploy targets.

Chosen implementation defaults for this task:
- Execution branch name: `stefangarofalo/tor-33-authentication-system`
- Public routes after this story: `/login` plus the Better Auth callback/error endpoints under `/api/auth/*`
- Authenticated app entrypoint: `/`
- `/dashboard` is removed in this story
- Existing email/password accounts are not migrated; this demo assumes no production credential users that need continuity
- OAuth support is guaranteed for local and the canonical deployed app host. Preview-host OAuth is explicitly out of scope for TOR-33 unless the deploy topology is widened later with Better Auth's OAuth proxy

Source context checked before planning:
- Local repo auth/runtime/deploy files
- Better Auth `v1.5.4` source via `opensrc --modify false`
- Better Auth docs for GitHub auth, rate limiting, cookies, dynamic base URL, and OAuth proxy
- Linear issue `TOR-33`

## Prerequisites
- GitHub OAuth app credentials available before execution
- Local Postgres available for schema/migration validation
- Linear child-task sync can happen after this plan is written

## Important Interface Changes
- Server env:
  - add `GITHUB_CLIENT_ID`
  - add `GITHUB_CLIENT_SECRET`
  - add `BETTER_AUTH_TRUSTED_ORIGINS` as optional comma-separated extra origins for trusted-origin expansion
- DB auth schema:
  - add Better Auth `rateLimit` model with `key`, `count`, `lastRequest`
  - generate Drizzle migration under `packages/db/src/migrations`
- Web auth transport:
  - `authClient` stops using `NEXT_PUBLIC_SERVER_URL`
  - auth browser traffic becomes same-origin to the web app (`NEXT_PUBLIC_APP_URL` or relative `/api/auth`) through a web-side proxy route that forwards to the server app
- Routing:
  - `/` becomes protected
  - `/login` becomes GitHub-only
  - `/dashboard` is deleted

## Dependency Graph

```text
T2 ──> T1 ──┬──> T3 ──┐
            └──> T4 ──┴──> T5
```

## Tasks

### T2: Add durable auth throttling schema and migration
- **depends_on**: []
- **location**: `packages/db/src/schema/auth.ts`, `packages/db/src/schema/index.ts`, `packages/db/src/migrations/**`, `packages/db/drizzle.config.ts`
- **description**: Add the Better Auth `rateLimit` table shape before enabling DB-backed rate limiting anywhere else. Use the Better Auth core schema contract exactly: `key` string primary key, `count` numeric/int, `lastRequest` numeric/bigint-compatible timestamp-in-ms field. Export it through the existing schema barrel and generate the Drizzle migration artifact in `packages/db/src/migrations`. Execution must validate both generated SQL and application to a local/dev database so the auth runtime does not boot against a missing table.
- **validation**: `bun run db:generate` produces a migration under `packages/db/src/migrations`; local schema apply (`bun run db:push` or the repo-approved migration step) creates the `rateLimit` table; repo typecheck still passes with the new schema export.
- **status**: Completed
- **log**: Added Better Auth `rateLimit` schema (`key` PK, `count`, `lastRequest`) in `packages/db/src/schema/auth.ts`, updated `packages/db/src/schema/index.ts` for TS barrel import compatibility, and generated `packages/db/src/migrations/0000_large_corsair.sql` (+ drizzle metadata) via `bun run db:generate`.
- **files edited/created**: `packages/db/src/schema/auth.ts`, `packages/db/src/schema/index.ts`, `packages/db/src/migrations/0000_large_corsair.sql`, `packages/db/src/migrations/meta/0000_snapshot.json`, `packages/db/src/migrations/meta/_journal.json`
- **backlog_item_id**: `TOR-57`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-57/tor-33-t2-add-durable-auth-throttling-schema-and-migration`
- **relation_mode**: native
- **tdd_target**: Make a failing auth/server integration test stop crashing on DB-backed rate limiting because the `rateLimit` table now exists and matches Better Auth storage expectations.
- **review_mode**: cli

### T1: Reconfigure Better Auth for GitHub-only login
- **depends_on**: [T2]
- **location**: `packages/auth/src/index.ts`, `packages/env/src/server.ts`, `apps/server/.env.example`, `apps/web/.env.example`, `turbo.json`, `apps/server/turbo.json`, `apps/web/turbo.json`, auth test env helpers
- **description**: Reconfigure `packages/auth` to remove credential login and enable GitHub social auth. Add `socialProviders.github` with `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, disable `emailAndPassword`, keep `httpOnly` cookies, and keep CSRF/origin checks enabled. Force Better Auth `rateLimit.enabled` on for runtime and tests, with `storage: "database"`. Expand trusted origins from `BETTER_AUTH_URL`, `CORS_ORIGIN`, and optional `BETTER_AUTH_TRUSTED_ORIGINS` entries so local and canonical deployed hosts are valid without turning off security checks. Update central env parsing, both app env examples, Turbo env allowlists, and test fixtures so both `apps/server` and `apps/web` SSR can boot with the new contract.
- **validation**: Missing GitHub credentials fail fast during env parsing; auth initialization compiles with DB-backed rate limiting; trusted-origin config is explicit and does not require `disableCSRFCheck` or `disableOriginCheck`; build/test envs include the new vars.
- **status**: Completed
- **log**: Reconfigured `packages/auth` for GitHub-only login with DB-backed Better Auth rate limiting and explicit trusted-origin expansion via `BETTER_AUTH_TRUSTED_ORIGINS`. Extended the shared server env contract, both app `.env.example` files, Turbo env allowlists, and the SSR test helper env in `apps/web/src/modules/api/eden.server.test.ts`. Validation passed for `bun run --cwd packages/auth check-types`, `bun run --cwd packages/env check-types`, and `bun run --cwd apps/web check-types`. `bun test apps/web/src/modules/api/eden.server.test.ts` still fails on the pre-existing in-process runtime resolution issue for `@reaping/env/server`.
- **files edited/created**: `packages/auth/src/index.ts`, `packages/env/src/server.ts`, `apps/server/.env.example`, `apps/web/.env.example`, `turbo.json`, `apps/server/turbo.json`, `apps/web/turbo.json`, `apps/web/src/modules/api/eden.server.test.ts`
- **backlog_item_id**: `TOR-58`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-58/tor-33-t1-reconfigure-better-auth-for-github-only-login`
- **relation_mode**: native
- **tdd_target**: Make a failing auth runtime test pass where GitHub sign-in is configured, password auth is disabled, and repeated sign-in attempts are rate-limited in `test` mode via DB storage.
- **review_mode**: cli

### T3: Make auth same-origin on the web host and verify server auth transport
- **depends_on**: [T1]
- **location**: `apps/web/src/modules/auth/auth-client.ts`, `apps/web/src/app/api/auth/**`, `packages/api/src/modules/http/auth-plugin.ts`, `apps/server/src/**/*.test.ts`, optionally `apps/web/src/**/*.test.ts`
- **description**: Resolve the split-host cookie problem by moving browser auth requests to the web host. Add a Next route handler under `apps/web` that proxies `/api/auth/*` to the server auth mount, preserving method, headers, body, redirect behavior, and `set-cookie` passthrough. Update `authClient` to use the web origin/same-origin auth base instead of `NEXT_PUBLIC_SERVER_URL`. Keep the Better Auth server mount unchanged on the API side. Add integration tests that cover: GitHub sign-in initiation redirect, mocked callback/session establishment through the mounted auth surface, unauthenticated session fetch, sign-out, explicit CSRF/origin rejection, and `429` on repeated sign-in initiation. Automated tests must mock the OAuth callback path; real GitHub credentials are manual-only.
- **validation**: Browser/SSR auth traffic targets same-origin `/api/auth`; session cookies are readable by the web host; CSRF/origin checks still reject untrusted requests; DB-backed sign-in throttling returns `429`; sign-out clears the effective session.
- **status**: Completed
- **log**: Added web-host auth proxy under `apps/web/src/app/api/auth/[...path]/route.ts` so browser auth traffic is sent to same-origin `/api/auth/*` and proxied to `NEXT_PUBLIC_SERVER_URL`. Updated `apps/web/src/modules/auth/auth-client.ts` to use relative auth base (`/api/auth`) and avoid split-host cookies. Added transport tests in `apps/web/src/app/api/auth/[...path]/route.test.ts` for sign-in redirect, callback/session cookie passthrough, unauthenticated session fetch, sign-out cookie clearing, origin-forwarding rejection behavior, and repeated sign-in throttling returning `429`. Validation run: `bun run --cwd apps/web check-types` and `bun run --cwd apps/web test src/app/api/auth/'[...path]'/route.test.ts`.
- **files edited/created**: `apps/web/src/modules/auth/auth-client.ts`, `apps/web/src/app/api/auth/[...path]/route.ts`, `apps/web/src/app/api/auth/[...path]/route.test.ts`
- **backlog_item_id**: `TOR-60`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-60/tor-33-t3-make-auth-same-origin-on-the-web-host-and-verify-server-auth`
- **relation_mode**: native
- **tdd_target**: Make a failing end-to-end auth transport test pass where `/api/auth/sign-in/social` redirects through the web-host proxy, a mocked callback yields a session cookie, and repeated initiations return `429`.
- **review_mode**: cli

### T4: Replace password UI and enforce the hard route gate
- **depends_on**: [T1, T3]
- **location**: `apps/web/src/app/**`, `apps/web/src/modules/auth/components/**`, `apps/web/src/modules/ui/header.tsx`
- **description**: Replace the `/login` sign-in/sign-up toggle with a single GitHub entrypoint. Delete the password forms and all `/dashboard` references. Implement route groups, not global root-layout gating and not Next Edge middleware, because the shared auth/db stack is Node-only. Create:
  - a public auth route group containing `/login`
  - a protected route group with a shared server-side layout that requires a session and redirects anonymous users to `/login`
  - an auth-layout guard that redirects already-authenticated users away from `/login` back to `/`
Move the current protected placeholder experience to `/`, update header links to remove `/dashboard`, and make sign-out redirect to `/login` instead of `/`.
- **validation**: Anonymous requests to `/` redirect to `/login`; authenticated requests to `/login` redirect to `/`; `/login` exposes GitHub only; no stale `/dashboard` navigation remains; sign-out lands on `/login`.
- **status**: In Progress
- **log**:
- **files edited/created**:
- **backlog_item_id**: `TOR-59`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-59/tor-33-t4-replace-password-ui-and-enforce-the-hard-route-gate`
- **relation_mode**: native
- **tdd_target**: Make a failing web auth-gate test pass where an anonymous request to the protected root redirects to `/login`, while an authenticated request renders the protected root and `/login` redirects away.
- **review_mode**: mixed

### T5: Full validation, branch/backlog sync, and manual OAuth verification
- **depends_on**: [T3, T4]
- **location**: repo-wide validation commands, Linear `TOR-33`, git branch metadata
- **description**: Run the final validation matrix end-to-end, then perform the non-code coordination steps for this task. Validation must include repo typechecks, targeted server/web auth tests, and a manual OAuth run with real GitHub credentials. Manual verification scope: GitHub login, logout, user persistence in `user`/`account`/`session`, rate-limit persistence in `rateLimit`, and no anonymous access outside the auth surface. After code work passes, rename the branch to `stefangarofalo/tor-33-authentication-system` and sync one child backlog item per task under `TOR-33`, carrying forward dependencies and TDD targets from this plan.
- **validation**: `bun run check-types`, targeted auth tests, and manual GitHub auth verification succeed; branch name matches the required convention; Linear contains child tasks aligned with T1-T5.
- **status**: Planned
- **log**:
- **files edited/created**:
- **backlog_item_id**: `TOR-61`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-61/tor-33-t5-full-validation-branch-sync-and-manual-oauth-verification`
- **relation_mode**: native
- **tdd_target**: Prove the final branch can log in with GitHub, set a first-party session cookie on the web host, reject anonymous access, and sustain DB-backed auth throttling without disabling CSRF.
- **review_mode**: mixed

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T2 | Immediately |
| 2 | T1 | T2 complete |
| 3 | T3, T4 | T1 complete; T4 should consume T3's same-origin auth client contract before final merge |
| 4 | T5 | T3, T4 complete |

## Testing Strategy
- Use vertical slices only. Do not write all auth tests first and then all implementation.
- Put the first failing automated auth tests where repo tooling already exists:
  - Bun integration tests under `apps/server/src/**` for auth mount, CSRF, and throttling
  - focused web-side tests only for route/auth helper logic if needed
- Prefer mocked OAuth callback tests for automation; reserve real GitHub browser login for manual verification only.
- Validate migration presence and application before enabling DB-backed rate limiting.
- Validate same-origin cookie behavior from the web host, not only direct calls to the server host.

## Risks & Mitigations
- **Risk**: Split web/server hosts cause cookies to land on the server host instead of the web host.
  - **Mitigation**: auth browser traffic must go through a web-host `/api/auth/*` proxy; do not keep `authClient` pointed at `NEXT_PUBLIC_SERVER_URL`.
- **Risk**: Better Auth DB-backed rate limiting is enabled before the table exists.
  - **Mitigation**: keep `T2` first and include migration generation plus schema application in the gate.
- **Risk**: Executor interprets "protected route middleware" as Next Edge middleware and imports Node-only auth/db code there.
  - **Mitigation**: explicitly use App Router route groups + server-side layout guards; no Edge middleware in TOR-33.
- **Risk**: Preview deployments need OAuth callbacks on variable hosts.
  - **Mitigation**: TOR-33 supports local + canonical deployed host only. If preview-host OAuth becomes required, plan a follow-up using Better Auth OAuth proxy.
- **Risk**: Old `/dashboard` links and redirects linger after the route is removed.
  - **Mitigation**: treat link/redirect cleanup as part of T4 acceptance, not incidental cleanup.

## Open Questions
- None for implementation. The plan assumes local + canonical-host GitHub OAuth only, no credential-user migration, and same-origin auth proxying on the web host.
