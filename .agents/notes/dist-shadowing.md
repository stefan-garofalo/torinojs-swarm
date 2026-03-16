# Dist Shadowing

- Built `dist/**` artifacts can mask missing or stale `src/**` modules during Bun-driven test runs and package builds. In this repo, `packages/api/src/features/game/session-join.ts` was missing from source while imports still resolved against an old `packages/api/dist/src/features/game/session-join.js`.
- This matters because refactors can appear to work until typecheck or a clean build touches the source graph. When a source import behaves impossibly, check for a stale compiled twin under `dist/**` before assuming TypeScript or Bun path resolution is wrong.
- After moving or recreating source modules, rerun focused tests plus `check-types` so the source tree, not the compiled residue, is what keeps the build green.
