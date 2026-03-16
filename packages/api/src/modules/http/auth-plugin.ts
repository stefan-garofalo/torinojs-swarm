import { Elysia, type Context } from "elysia"
import { auth, getAuthSessionFromHeaders } from "@reaping/auth"

import { mapHttpMethodError } from "./transport-plugin.js"

export type AuthPluginOptions = {
  allowTestAuthHeaders?: boolean
}

export const createAuthPlugin = ({ allowTestAuthHeaders = false }: AuthPluginOptions = {}) =>
  new Elysia({ name: "auth" }).all(
    "/api/auth/*",
    async (context: Context) => {
      const methodError = mapHttpMethodError(context)

      if (methodError !== null) {
        return methodError
      }

      return auth.handler(context.request)
    },
  )
    .decorate("authOptions", {
      allowTestAuthHeaders,
    })

export async function resolveAuthUserFromRequest(
  request: Request,
  { allowTestAuthHeaders = false }: AuthPluginOptions = {},
) {
  if (allowTestAuthHeaders) {
    const testUserId = request.headers.get("x-test-user-id")

    if (testUserId !== null && testUserId.length > 0) {
      return {
        id: testUserId,
        email: `${testUserId}@example.com`,
        name: testUserId,
      }
    }
  }

  const session = await getAuthSessionFromHeaders(request.headers);

  return session?.user ?? null;
}
