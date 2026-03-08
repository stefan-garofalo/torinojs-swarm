import { SqlClient } from "@effect/sql";
import { Effect, Layer, Redacted } from "effect";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { env } from "@reaping/env/server";

import * as schema from "./schema/auth.js";

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
}).pipe(Layer.provideMerge(DatabaseClientLayer));

export const DatabaseLayer = DatabaseDrizzleLayer;

type DatabaseRequirement = PgDrizzle.PgDrizzle | SqlClient.SqlClient;

export const withDatabase = <A, E, R>(
  program: Effect.Effect<A, E, R | DatabaseRequirement>
): Effect.Effect<A, E, Exclude<R, DatabaseRequirement>> =>
  program.pipe(Effect.provide(Layer.orDie(DatabaseLayer)));

export const pingDatabaseEffect = Effect.gen(function* () {
  const queryDb = yield* PgDrizzle.PgDrizzle;
  const rows = yield* queryDb.select({ id: schema.user.id }).from(schema.user).limit(1);
  return rows.length;
});
