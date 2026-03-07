# Deployment Boundaries

- This monorepo expects `vercel link --repo` because `apps/web` and `apps/server` each own their own Vercel config and deploy flow.
- App deploy scripts belong in the app packages, not the root. That keeps Vercel builds deterministic per project root.
- If `apps/web` needs server contract access, consume the public package export `server/app`. Do not import `server/src/*` or point web `tsconfig` paths into server internals; that breaks the intended two-project Vercel split.

