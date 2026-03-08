# Turbo And Tooling

- Package-level `apps/*/turbo.json` files must include `extends: ["//"]`. Omitting that root inheritance breaks package-local overrides.
- Package-level Turbo config in this repo is for outputs/persistent task behavior only. Adding unsupported local keys causes parse failures.
- `opensrc --modify deny` behaved inconsistently here. Use `opensrc --modify false` for non-destructive source fetches.
- Linear CLI refuses `--workspace` when `LINEAR_API_KEY` is set. Team/project creation has to match the API key's default workspace unless the env or login context changes.
- `gh repo create` pushed this repo to `master` by default. Set branch naming explicitly if a new repo must start on `main`.
- `rolldown@1.0.0-rc.7` warns on Node `20.18.0`; local builds still succeeded, but the effective floor is `20.19+` or `22.12+`. Keep CI/dev Node versions above that if server builds use direct `rolldown`.
- `next lint` is not a viable package script in this Next 16 workspace shape. Use the ESLint CLI or `oxlint`; otherwise Turbo `lint` can fail with `Invalid project directory .../lint`.
