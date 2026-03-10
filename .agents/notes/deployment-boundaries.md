# Deployment Boundaries

- This monorepo expects `vercel link --repo` because `apps/web` and `apps/server` each own their own Vercel config and deploy flow.
- App deploy scripts belong in the app packages, not the root. That keeps Vercel builds deterministic per project root.
- If `apps/web` needs server contract access, consume the public package export `server/app`. Do not import `server/src/*` or point web `tsconfig` paths into server internals; that breaks the intended two-project Vercel split.
- Vercel serverless packaging did not include workspace package source trees when runtime exports pointed at `src/*.ts`. Runtime-consumed internal packages (`@torinojs-swarm/env`, `@torinojs-swarm/db`, `@torinojs-swarm/auth`, `@torinojs-swarm/ai`) need real `build` scripts plus exports to compiled `dist/src/*.js`.
- For ESM code that is emitted with `tsc` and executed directly on Vercel Node, relative imports must use explicit `.js` specifiers in the TypeScript source. Extensionless relative imports passed local bundler-oriented checks but failed in production with `ERR_MODULE_NOT_FOUND`.
- Switching the workspace from Bun lockfiles to `pnpm-lock.yaml` let Vercel resolve the monorepo correctly, but it did not fix runtime bootstrap by itself; the actual blocker was `src/*.ts` runtime exports plus extensionless ESM imports.
- For the `apps/server` Vercel deployment, do not add manual `apps/server/api/*` shims for Elysia routes. Vercel already detects the Elysia app from `src/index.ts`; extra `api/*` files intercept `/api/*` as plain Vercel functions, which broke `/api/demo/*` while `/health` still worked. Let the framework integration own routing end-to-end.
- `@reaping/env/web` should not require a manually managed `NEXT_PUBLIC_APP_URL` in Vercel previews. Derive it from `VERCEL_BRANCH_URL`, then `VERCEL_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`; keep `NEXT_PUBLIC_SERVER_URL` strict because the web app cannot infer the separate API deploy origin.
