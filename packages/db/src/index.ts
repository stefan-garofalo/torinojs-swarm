import { Effect, Layer, Redacted } from "effect";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { env } from "@torinojs-swarm/env/server";

import * as schema from "./schema/auth";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const DatabaseClientLayer = PgClient.layer({
  url: Redacted.make(env.DATABASE_URL),
});

const drizzleSchema = schema as unknown as Record<string, never>;

export const DatabaseDrizzleLayer = PgDrizzle.layerWithConfig({
  schema: drizzleSchema,
});

export const DatabaseLayer = Layer.mergeAll(
  DatabaseClientLayer,
  DatabaseDrizzleLayer,
);

export const withDatabase = <A, E>(
  program: Effect.Effect<A, E, unknown>
): Effect.Effect<A, E, never> =>
  program.pipe(Effect.provide(DatabaseLayer)) as Effect.Effect<A, E, never>;

export const runDatabase = <A, E>(
  program: Effect.Effect<A, E, unknown>
): Promise<A> =>
  Effect.runPromise(withDatabase(program));

export const pingDatabaseEffect = Effect.gen(function* () {
  const queryDb = yield* PgDrizzle.PgDrizzle;
  const rows = yield* queryDb.select({ id: schema.user.id }).from(schema.user).limit(1);
  return rows.length;
});
