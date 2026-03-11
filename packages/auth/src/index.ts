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
