import { Elysia, type Context } from "elysia"
import { auth, getAuthSessionFromHeaders } from "@reaping/auth"

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

export async function resolveAuthUserFromRequest(request: Request) {
  if (process.env.NODE_ENV === "test") {
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
