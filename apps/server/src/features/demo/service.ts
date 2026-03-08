import { Effect } from "effect"
import { pingDatabaseEffect, withDatabase } from "@torinojs-swarm/db"
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
      yield* withDatabase(
        pingDatabaseEffect.pipe(
          Effect.map(() => "ok"),
          Effect.catchAll((error) =>
            Effect.fail(
              new DemoDatabaseUnavailableError({
                message: String(error),
              }),
            ),
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
