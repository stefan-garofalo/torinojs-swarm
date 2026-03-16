import { Elysia, status, t } from "elysia"

import { runAppEffect } from "../../modules/http/run-effect.js"
import {
  DemoDatabaseUnavailableError,
  DemoItemNotFoundError,
} from "./errors.js"
import { DemoService } from "./service.js"

const demoItemSuccess = t.Object({
  id: t.String(),
  name: t.String(),
  status: t.Union([t.Literal("ready"), t.Literal("processing")]),
})

const demoItemNotFound = t.Object({
  _tag: t.Literal("DemoItemNotFound"),
  itemId: t.String(),
  message: t.String(),
})

const demoRuntimeError = t.Object({
  _tag: t.Literal("DemoRuntimeError"),
  message: t.String(),
})

const demoDbStatus = t.Object({
  healthy: t.Boolean(),
})

const demoDbError = t.Object({
  _tag: t.Literal("DemoDatabaseUnavailable"),
  message: t.String(),
})

const toErrorPayload = (error: DemoItemNotFoundError) => ({
  _tag: error._tag,
  itemId: error.itemId,
  message: error.message,
})

const toDatabasePayload = (error: DemoDatabaseUnavailableError) => ({
  _tag: error._tag,
  message: error.message,
})

export const demoRoutes = new Elysia({ prefix: "/api/demo" })
  .get(
    "/items/:id",
    async ({ params }) => {
      const result = await runAppEffect(DemoService.getDemoItem(params.id))

      if (result._tag === "Left") {
        if (result.left._tag === "DemoItemNotFound") {
          return status(404, toErrorPayload(result.left))
        }

        return status(500, {
          _tag: "DemoRuntimeError",
          message: "Unhandled demo error",
        })
      }

      return result.right
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: demoItemSuccess,
        404: demoItemNotFound,
        500: demoRuntimeError,
      },
    },
  )
  .get(
    "/db",
    async () => {
      const result = await runAppEffect(DemoService.checkDatabase())

      if (result._tag === "Left") {
        return status(500, toDatabasePayload(result.left))
      }

      return result.right
    },
    {
      response: {
        200: demoDbStatus,
        500: demoDbError,
      },
    },
  )
