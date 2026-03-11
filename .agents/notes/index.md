[frontend-transport.md](./frontend-transport.md) Eden/TanStack contract gotchas and frontend transport conventions.
[ssr-api-runtime.md](./ssr-api-runtime.md) In-process Eden SSR requires the web deploy to carry the server runtime env contract.
[repo-structure.md](./repo-structure.md) `modules` vs `features` repo convention and `shadcn` placement.
[turbo-tooling.md](./turbo-tooling.md) Turborepo/task config gotchas plus CLI setup quirks.
[effect-db.md](./effect-db.md) Effect SQL + Drizzle integration quirks in this repo.
[deployment-boundaries.md](./deployment-boundaries.md) Vercel monorepo deploy rules and package-boundary constraints.
[bootstrap-handoff.md](./bootstrap-handoff.md) Where to resume the bootstrap initiative without re-deriving context.
[linear-cli.md](./linear-cli.md) Linear CLI story creation patterns, team/project/label gotchas, dependency structure for TOR-31 to TOR-50.
[live-game-state.md](./live-game-state.md) Live game/session state stays in Redis; frontend sync goes through server-owned versioned snapshot/event contracts, not direct browser Redis access.
[redis-package-boundary.md](./redis-package-boundary.md) Keep Redis/Upstash in its own workspace package; `packages/db` stays Postgres-only per TOR-5 and Turbo strict env must be updated for new infra vars.
[game-session-contract.md](./game-session-contract.md) Keep `@reaping/redis` surface minimal, own key/TTL policy there, and preserve the shared phase enum once TOR-36 aligns to it.
[bun-optional-runtime-imports.md](./bun-optional-runtime-imports.md) Hide optional runtime-only imports behind an extra indirection in Bun tests or the module can still resolve too early and break test overrides.
[bun-optional-runtime-imports.md](./bun-optional-runtime-imports.md) Bun can eagerly resolve optional runtime imports during test loading; hide them behind an extra indirection for hermetic tests.
