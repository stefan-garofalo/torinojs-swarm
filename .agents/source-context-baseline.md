# Source Context Baseline — Task T0

Date: 2026-03-07
Task: T0 Source Context Baseline (`demo/.agents/source-context-baseline.md`)
Backlog: TOR-2

Purpose
- Record exact source references and reproducible steps for effect, elysia/eden, drizzle, tanstack-query, vercel, and ai-sdk before implementation begins.
- Capture non-destructive `opensrc` behavior and validation checks so implementation can start from a stable baseline.

Local capture summary
- `opensrc` metadata is stored in `demo/opensrc/sources.json` (source versions and fetched paths).
- `opensrc` command was run in read mode via `--modify false` (see gotcha).
- Packages fetched:
  - `effect` v`3.19.19` → `demo/opensrc/repos/github.com/Effect-TS/effect`
  - `elysia` v`1.4.27` → `demo/opensrc/repos/github.com/elysiajs/elysia`
  - `@elysiajs/eden` v`1.4.8` → `demo/opensrc/repos/github.com/elysiajs/eden`
  - `drizzle-orm` v`0.45.1` → `demo/opensrc/repos/github.com/drizzle-team/drizzle-orm`
  - `@tanstack/react-query` v`5.90.21` → `demo/opensrc/repos/github.com/TanStack/query/packages/react-query`
  - `vercel` v`50.28.0` → `demo/opensrc/repos/github.com/vercel/vercel/packages/cli`
  - `ai` v`6.0.116` → `demo/opensrc/repos/github.com/vercel/ai`
  - `@ai-sdk/openai` v`3.0.41` → `demo/opensrc/repos/github.com/vercel/ai`

Recommended baseline commands
- `opensrc --help`
- `opensrc --modify false effect`
- `opensrc --modify false elysia`
- `opensrc --modify false @elysiajs/eden`
- `opensrc --modify false drizzle-orm`
- `opensrc --modify false @tanstack/react-query`
- `opensrc --modify false vercel`
- `opensrc --modify false ai`
- `opensrc --modify false @ai-sdk/openai`
- If `--modify false` is accepted, all fetched packages stay non-mutating to workspace.

Effect / Effect docs
- Canonical source docs:
  - `https://effect.website/llms.txt`
  - `https://effect.website/docs`
- Locally captured source:
  - `demo/opensrc/repos/github.com/Effect-TS/effect/packages/effect/README.md`
  - `demo/opensrc/repos/github.com/Effect-TS/effect/packages/sql-drizzle/README.md`
- Note: `@effect/sql-drizzle` docs explicitly point to `https://effect-ts.github.io/effect/docs/sql-drizzle`.

Elysia / Eden / Next / Vercel / AI SDK integration
- `https://elysiajs.com/eden/overview.md`
- `https://elysiajs.com/integrations/nextjs.md`
  - Includes isomorphic pattern for exported Elysia app + `treaty` client.
- `https://elysiajs.com/integrations/vercel.md`
- `https://elysiajs.com/integrations/ai-sdk.md`
- Locally captured source:
  - `demo/opensrc/repos/github.com/elysiajs/elysia/README.md`
  - `demo/opensrc/repos/github.com/elysiajs/eden/README.md`

Drizzle Neon + Effect SQL
- Postgres setup:
  - `https://orm.drizzle.team/docs/connect-neon`
  - `https://orm.drizzle.team/docs/connect-effect-postgres`
- Locally captured source:
  - `demo/opensrc/repos/github.com/drizzle-team/drizzle-orm/README.md`
  - `demo/opensrc/repos/github.com/Effect-TS/effect/packages/sql-drizzle/README.md`

TanStack Query v5
- `https://tanstack.com/query/latest/docs/framework/react/overview`
- `https://tanstack.com/query/latest/docs/framework/react/overview.md`
- `https://tanstack.com/query/latest/docs/framework/react/reference/useQuery.md`
- Locally captured source:
  - `demo/opensrc/repos/github.com/TanStack/query/README.md`
  - `demo/opensrc/repos/github.com/TanStack/query/packages/react-query/README.md`

Vercel monorepo + project linking
- Project/deploy docs:
  - `https://vercel.com/docs/monorepos.md`
- CLI reference:
  - `https://vercel.com/docs/cli.md`
  - `https://vercel.com/docs/cli/link.md`
  - Relevant options:
    - `vercel link --repo`
    - `vercel link --yes`
    - `vercel link --project <name|id>`

AI SDK current local/docs state
- Official docs and install/state entrypoints:
  - `https://ai-sdk.dev/docs`
  - `https://ai-sdk.dev/docs/introduction` (known to resolve via docs site)
  - Provider docs: `https://ai-sdk.dev/providers/ai-sdk-providers/openai`
- Locally captured source:
  - `demo/opensrc/repos/github.com/vercel/ai/packages/ai/README.md`
  - `demo/opensrc/repos/github.com/vercel/ai/packages/openai/README.md`
  - `demo/opensrc/repos/github.com/vercel/vercel/packages/cli/README.md` (CLI packaging context if needed)

Validation performed
- `curl -I -L` checks returned HTTP `200` for all required docs links above.
- Confirmed `demo/opensrc/sources.json` contains package versions and fetched paths.
- Confirmed `demo/opensrc` exists and contains fetched repositories for all required packages.

Unresolved questions
- None for bootstrap source context; implementation can begin immediately from this file plus `demo/opensrc`.
