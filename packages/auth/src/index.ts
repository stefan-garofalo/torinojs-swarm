import { db } from "@reaping/db";
import * as schema from "@reaping/db/schema/auth";
import { env } from "@reaping/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [],
});

export async function getAuthSessionFromHeaders(headers: Headers) {
  return auth.api.getSession({
    headers,
  });
}

export type AuthSession = NonNullable<Awaited<ReturnType<typeof getAuthSessionFromHeaders>>>;
export type AuthUser = AuthSession["user"];
