# Effect DB Integration

- `effect` in `apps/server` currently surfaces `@effect/sql` typing friction in `packages/db`; failures around `SqlClient` symbol mismatch and schema compatibility belong to the DB integration layer, not the server feature layer.
- `PgDrizzle.layerWithConfig` had to receive a casted schema (`Record<string, never>`) in this repo to satisfy current library typings.
- `withDatabase` and `runDatabase` also required casts because `Effect.provide` inference kept `SqlClient` in the environment on the current Effect version.

