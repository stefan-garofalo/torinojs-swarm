# Workspace Installs

After rebases or branch switches that introduce or rewire workspace package deps, Bun can leave one package hydrated and another missing its local workspace install view. In this repo that showed up as `packages/api` resolving `effect` while `packages/redis` could not, even though `package.json` was correct.

If a package suddenly reports `Cannot find module` for a normal dependency while sibling packages resolve it, run `bun install` from the repo root before chasing type-level fixes. Treat that as environment repair first, not immediate evidence of bad source code.
