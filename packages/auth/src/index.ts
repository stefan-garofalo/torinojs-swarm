import { db } from "@reaping/db";
import * as schema from "@reaping/db/schema/auth";
import { env } from "@reaping/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const trustedOrigins = [
  env.BETTER_AUTH_URL,
  env.CORS_ORIGIN,
  ...env.BETTER_AUTH_TRUSTED_ORIGINS,
];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),
  trustedOrigins,
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
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
