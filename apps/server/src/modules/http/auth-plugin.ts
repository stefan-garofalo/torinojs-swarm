import { Elysia, type Context } from "elysia"
import { auth } from "@reaping/auth"
import { mapHttpMethodError } from "./transport-plugin.js"

export const authPlugin = new Elysia({ name: "auth" }).all(
  "/api/auth/*",
  async (context: Context) => {
    const methodError = mapHttpMethodError(context)
    if (methodError !== null) {
      return methodError
    }

    return auth.handler(context.request)
  },
)
