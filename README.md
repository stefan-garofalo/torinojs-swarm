# torinojs-swarm

Keynote demo monorepo. Better-T-Stack scaffold, then rebuilt around:

- `apps/server`: `Elysia` HTTP layer + `Effect` service/runtime layer
- `apps/web`: `Next.js` App Router + `Eden Treaty` + `TanStack Query`
- `packages/db`: Drizzle schema + Effect SQL integration for Neon-hosted Postgres
- `packages/auth`: Better Auth shared setup
- `packages/ai`: shared AI SDK foundation
- `Turborepo`: task orchestration and app/package boundaries

## Why This Shape

Initial scaffold was fine for package choice, not for architecture. This repo wants:

- thin HTTP handlers
- typed service logic in `Effect`
- typed client/server contracts from the exported Elysia app
- frontend/server split that still works as a real monorepo
- deployable `apps/web` and `apps/server` as separate Vercel projects

So the rule is:

- `Effect` owns business logic, config, failures, layers
- `Elysia` owns HTTP transport
- `Eden` consumes the Elysia contract
- `TanStack Query` is only for client-side interactive server state

## Repo Layout

```text
demo/
├── apps/
│   ├── server/
│   │   ├── api/                  # Vercel adapter entrypoint
│   │   └── src/
│   │       ├── modules/          # generic backend transport/infrastructure pieces
│   │       └── features/         # backend business features
│   └── web/
│       └── src/
│           ├── app/              # Next App Router entrypoints
│           ├── modules/          # generic frontend building blocks
│           └── features/         # frontend business features
├── packages/
│   ├── ai/                       # shared AI SDK foundation
│   ├── auth/                     # Better Auth setup
│   ├── config/                   # shared TS config
│   ├── db/                       # Drizzle schema + Effect DB helpers
│   └── env/                      # validated env contracts
└── .agents/
    ├── notes/                    # repo-local institutional memory
    └── *.md                      # planning / source-context artifacts
```

## Source Convention

Inside app code:

- `src/modules`
  - generic app-wide building blocks
  - UI primitives, providers, transport adapters, auth client, theme, HTTP plugins
- `src/features`
  - business logic and concrete implementations
  - routes, services, query definitions, domain components

Do not reintroduce `components/lib/domains` as the main organizing pattern.

In `apps/web`, generated `shadcn` components belong under `src/modules/ui`. `components.json` is already aligned to that.

## Backend Architecture

Core files:

- `apps/server/src/app.ts`
  - exports the reusable Elysia `app`
- `apps/server/src/index.ts`
  - local Bun entrypoint
- `apps/server/api/index.ts`
  - Vercel handler shim
- `apps/server/src/runtime.ts`
  - Effect runtime composition

### Request flow

1. Elysia route receives request.
2. Route calls an `Effect` service.
3. Service returns success or typed tagged failure.
4. Route maps domain failure to explicit HTTP status/body.
5. Those declared HTTP response shapes become the Eden client contract.

### Current backend example

The demo feature lives in:

- `apps/server/src/features/demo/errors.ts`
- `apps/server/src/features/demo/service.ts`
- `apps/server/src/features/demo/routes.ts`

It demonstrates:

- typed `Effect.Service`
- tagged domain errors
- typed `200/404/500` route contracts
- DB health check through the shared DB layer

## Database Architecture

`packages/db` owns:

- Drizzle schema
- legacy Drizzle client path for Better Auth compatibility
- Effect SQL layer wiring for service consumption

Exports worth knowing:

- `db`
- `DatabaseLayer`
- `withDatabase(...)`
- `runDatabase(...)`
- `pingDatabaseEffect`

Current runtime strategy:

- Neon is still the hosted Postgres provider
- Drizzle runtime compatibility path uses `drizzle-orm/node-postgres` + `pg`
- Effect integration uses `@effect/sql-pg` + `@effect/sql-drizzle`

Rule: route code should not create DB clients inline.

## Frontend Architecture

Core files:

- `apps/web/src/modules/api/eden.ts`
  - isomorphic Eden client entrypoint
- `apps/web/src/modules/app/providers.tsx`
  - app-level providers including TanStack Query
- `apps/web/src/features/demo/queries.ts`
  - query option factories / typed route consumption

### Contract flow

- On the server, `apps/web` can consume the public package export `server/app` and call the Elysia app directly through a custom fetcher.
- In the browser, Eden calls `NEXT_PUBLIC_SERVER_URL`.

Important boundary:

- `apps/web` must only consume `server/app`
- never import `server/src/*`
- never point frontend TS paths into server internals

That boundary is required for the two-project Vercel deployment model.

### Query rule

Use TanStack Query for interactive client-side server state only. Query components must branch on:

- `isPending`
- `error`
- then response payload

Do not treat `!data` as the loading state. That hides real failures.

## AI Foundation

`packages/ai` is infra only for now.

It provides:

- AI provider selection
- model selection helpers
- env-driven gateway/openai configuration

It does not yet define user-facing chat UI or API routes.

## Turborepo Rules

This repo should behave like a real Turborepo:

- root scripts delegate with `turbo run ...`
- package tasks live in the package that owns them
- app-specific build outputs live in package-level `turbo.json`
- no root `.env`
- env files stay with the consuming app/package

Main commands:

```bash
bun install
bun run dev
bun run dev:web
bun run dev:server
bun run check-types
bun run lint
bun run check
```

Database commands:

```bash
bun run db:push
bun run db:generate
bun run db:migrate
bun run db:studio
```

## Environment

### Server

Create `apps/server/.env` from `apps/server/.env.example`.

Required values:

```bash
DATABASE_URL=
DATABASE_URL_DIRECT=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
AI_PROVIDER=gateway
AI_GATEWAY_MODEL=openai/gpt-5.4
AI_OPENAI_API_KEY=
AI_OPENAI_BASE_URL=
AI_OPENAI_MODEL=gpt-5.4
NODE_ENV=development
```

### Web

Create `apps/web/.env` from `apps/web/.env.example`.

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

## Local Development

1. Install dependencies:

```bash
bun install
```

2. Configure env files:

- `apps/server/.env`
- `apps/web/.env`

3. Push DB schema if needed:

```bash
bun run db:push
```

4. Start the repo:

```bash
bun run dev
```

Default local URLs:

- web: `http://localhost:3001`
- server: `http://localhost:3000`

## Deployment

This repo is set up for two Vercel projects:

- `apps/web`
- `apps/server`

Use:

```bash
vercel link --repo
```

Then link each app to its project from its own directory.

More detail:

- `deployment/vercel.md`

## Adding A New Backend Feature

1. Create a feature folder under `apps/server/src/features/<feature>`.
2. Define domain errors there.
3. Define an `Effect.Service` for business logic.
4. Add Elysia routes that call the service.
5. Declare explicit response schemas for success and non-success statuses.
6. Mount the feature plugin from `apps/server/src/app.ts`.

Rule: transport stays in route/plugin code; business logic stays in Effect services.

## Adding A New Frontend Feature

1. Create `apps/web/src/features/<feature>`.
2. Put typed contract reads/query factories there.
3. Use `apps/web/src/modules/api/eden.ts` for server/client transport access.
4. Keep generic primitives in `src/modules`, not inside the feature unless they are truly feature-specific.
5. Use TanStack Query only if the interaction actually benefits from client caching/refetching.

## Institutional Memory

Repo-local notes live in:

- `.agents/notes/index.md`

Read the index first, then only the notes relevant to the task.

## Current Bootstrap Artifacts

If you need the full foundation context:

- `.agents/torinojs-swarm-bootstrap-plan.md`
- `.agents/source-context-baseline.md`
- GitHub PR `#1`

