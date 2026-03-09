# Vercel Monorepo Deployment

This repo is linked with `vercel link --repo`.

## Project roots

- `apps/web` for the Next frontend
- `apps/server` for the Elysia API

## One-time linking

From repository root:

```bash
cd demo
vercel link --repo
```

Then bind each project from its folder:

```bash
cd apps/web
vercel link --yes --project reaping-web

cd ../server
vercel link --yes --project reaping-server
```

## Build and deploy commands

### Web (`apps/web`)

- Build command: `bun run build`
- Vercel config file: `apps/web/vercel.json`
- Deploy scripts:
  - `bun run deploy`
  - `bun run deploy:prod`
- Required env:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SERVER_URL`
  - `DATABASE_URL`
  - `DATABASE_URL_DIRECT`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `CORS_ORIGIN`
  - `AI_PROVIDER`
  - `AI_GATEWAY_MODEL`
  - `AI_OPENAI_API_KEY`
  - `AI_OPENAI_BASE_URL`
  - `AI_OPENAI_MODEL`
  - `NODE_ENV`

The web project now performs in-process Eden calls during server rendering. That means its server runtime must be able to instantiate the same API app/runtime stack as `apps/server`, even though browser calls still use `NEXT_PUBLIC_SERVER_URL`.

### Server (`apps/server`)

- Build command: `bun run build`
- Vercel config file: `apps/server/vercel.json`
- API handler shim: `apps/server/api/index.ts` exports `app.fetch`
- Local Bun entrypoint remains `apps/server/src/index.ts` (`app.listen(...)`) and is unchanged.
- Deploy scripts:
  - `bun run deploy`
  - `bun run deploy:prod`
- Required env:
  - `DATABASE_URL`
  - `DATABASE_URL_DIRECT`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `CORS_ORIGIN`
  - `AI_PROVIDER`
  - `AI_GATEWAY_MODEL`
  - `AI_OPENAI_API_KEY`
  - `AI_OPENAI_BASE_URL`
  - `AI_OPENAI_MODEL`
  - `NODE_ENV`

## Determinism notes

- Build/cache boundaries are app-local via package `turbo.json` overrides.
- Deploys run from app-local scripts; no root-level custom orchestration is required.
