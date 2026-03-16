# Turbo And Tooling

- Package-level `apps/*/turbo.json` files must include `extends: ["//"]`. Omitting that root inheritance breaks package-local overrides.
- Package-level Turbo config in this repo is for outputs/persistent task behavior only. Adding unsupported local keys causes parse failures.
- When an app-level `turbo.json` sets `tasks.<name>.env`, that array becomes the effective allowlist for that task. Root `turbo.json` env additions do not automatically flow into those app task definitions, so infra env rollouts like Upstash need both layers kept aligned.
- Workspace packages here export runtime code from `dist/**`, not `src/**`. If an app test executes workspace packages directly, Turbo `test` must depend on `^build` or the test can silently run stale package output even when local source changed.
- `opensrc --modify deny` behaved inconsistently here. Use `opensrc --modify false` for non-destructive source fetches.
- Linear CLI refuses `--workspace` when `LINEAR_API_KEY` is set. Team/project creation has to match the API key's default workspace unless the env or login context changes.
- `gh repo create` pushed this repo to `master` by default. Set branch naming explicitly if a new repo must start on `main`.
- `rolldown@1.0.0-rc.7` warns on Node `20.18.0`; local builds still succeeded, but the effective floor is `20.19+` or `22.12+`. Keep CI/dev Node versions above that if server builds use direct `rolldown`.
- The server `start` script expects a runnable built artifact, not a bundle plus transitive package-manager magic. In this repo, leaving non-node dependencies external caused `dist/index.mjs` to fail on `@t3-oss/env-core`, so the Rolldown config now bundles runtime deps and only leaves `node:` builtins external.
- `next lint` is not a viable package script in this Next 16 workspace shape. Use the ESLint CLI or `oxlint`; otherwise Turbo `lint` can fail with `Invalid project directory .../lint`.
- `next build` from a `.dmux/worktrees/*` checkout can panic under Turbopack with `apps/web/node_modules/next ... points out of the filesystem root`. That is a worktree/symlink limitation, not an app regression. Use targeted tests plus env-backed module evaluation to validate auth/build fixes from the worktree, or build from the root checkout if full Next production output is required.
