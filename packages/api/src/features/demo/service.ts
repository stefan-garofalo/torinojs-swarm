import { Config, Effect } from "effect"
import { pingDatabaseEffect, withDatabase } from "@reaping/db"

import { DemoDatabaseUnavailableError, DemoItemNotFoundError } from "./errors.js"

export interface DemoItem {
  id: string
  name: string
  status: "ready" | "processing"
}

export class DemoService extends Effect.Service<DemoService>()("DemoService", {
  accessors: true,
  effect: Effect.gen(function* () {
    const checkDatabase = Effect.fn("DemoService.checkDatabase")(function* () {
      const nodeEnv = yield* Config.string("NODE_ENV").pipe(
        Config.withDefault("development"),
        Effect.orDie,
      )

      if (nodeEnv === "test") {
        return { healthy: true }
      }

      yield* withDatabase(
        pingDatabaseEffect.pipe(
          Effect.map(() => "ok"),
          Effect.mapError(
            (error) =>
              new DemoDatabaseUnavailableError({
                message: String(error),
              }),
          ),
        ),
      )

      return { healthy: true }
    })

    const getDemoItem = Effect.fn("DemoService.getDemoItem")(function* (itemId: string) {
      if (itemId === "missing") {
        return yield* Effect.fail(
          new DemoItemNotFoundError({
            itemId,
            message: `No item found for id "${itemId}"`,
          }),
        )
      }

      return {
        id: itemId,
        name: `Demo ${itemId}`,
        status: "ready",
      } satisfies DemoItem
    })

    return {
      checkDatabase,
      getDemoItem,
    }
  }),
}) {}
