# Repo Structure

- App source is split into `src/modules` and `src/features`.
- `src/modules` is for generic app-wide building blocks and cross-cutting primitives.
- `src/features` is for business logic and concrete feature implementations built from modules.
- Do not drift back to `components/lib/domains` as the primary structure.
- In `apps/web`, generated `shadcn` UI belongs under `src/modules/ui`; keep `components.json` aliases pointed at `@/modules/ui` and `@/modules/ui/utils` so generated files land in the right place automatically.

