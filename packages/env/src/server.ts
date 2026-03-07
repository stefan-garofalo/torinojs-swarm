import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    AI_PROVIDER: z
      .enum(["gateway", "openai"])
      .default("gateway"),
    AI_GATEWAY_MODEL: z.string().default("openai/gpt-5.4"),
    AI_OPENAI_API_KEY: z.string().optional(),
    AI_OPENAI_BASE_URL: z.url().optional(),
    AI_OPENAI_MODEL: z.string().default("gpt-5.4"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
