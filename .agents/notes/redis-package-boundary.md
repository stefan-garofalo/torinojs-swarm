# Redis Package Boundary

TOR-5 established `packages/db` as the Neon/Postgres Effect SQL + Drizzle boundary. Do not extend that package with Redis or Upstash concerns. Live session/state infrastructure should be a separate workspace package so SQL schema ownership, Redis client/runtime code, and game-domain services stay independently composable.

In this repo's Turborepo setup, new infra like Redis should follow normal package rules: package-local scripts in its own `package.json`, root `package.json` only delegating via `turbo run ...`, and strict-mode env vars added to `turbo.json` so cache/runtime hashing stays correct.
