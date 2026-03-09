import { cors } from "@elysiajs/cors"
import { Elysia, type Context, status } from "elysia"

const isAllowedAuthMethod = (method: string): boolean =>
  method === "POST" || method === "GET"

export const mapHttpMethodError = (context: Context) => {
  const { request } = context

  if (!isAllowedAuthMethod(request.method)) {
    return status(405, "Method not allowed")
  }

  return null
}

const DEFAULT_HTTP_ERROR_STATUS = 500

export const httpTransportPlugin = (corsOrigin: string) =>
  new Elysia({ name: "transport" })
    .use(
      cors({
        origin: corsOrigin,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      }),
    )
    .onError(({ error, set }) => {
      console.error(error)
      set.status = DEFAULT_HTTP_ERROR_STATUS

      return {
        _tag: "UnhandledError",
        message: "Internal server error",
      }
    })
