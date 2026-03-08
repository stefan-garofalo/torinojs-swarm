# Effect DB Integration

- `effect` in `apps/server` currently surfaces `@effect/sql` typing friction in `packages/db`; failures around `SqlClient` symbol mismatch and schema compatibility belong to the DB integration layer, not the server feature layer.
- `PgDrizzle.layerWithConfig` had to receive a casted schema (`Record<string, never>`) in this repo to satisfy current library typings.
- The Drizzle layer must be composed with `Layer.provideMerge(DatabaseClientLayer)`. Side-by-side `Layer.mergeAll(...)` leaves `SqlClient` unsatisfied at runtime even though the layer type looks close enough to compile.
- `withDatabase` can hide the DB requirement cleanly by providing `Layer.orDie(DatabaseLayer)`. The old exported `runDatabase` helper added no value and encouraged a second execution path, so it was removed.
