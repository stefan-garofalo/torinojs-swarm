import "dotenv/config";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CORS_ORIGIN: z.url(),
  AI_PROVIDER: z.enum(["gateway", "openai"]).default("gateway"),
  AI_GATEWAY_MODEL: z.string().default("openai/gpt-5.4"),
  AI_OPENAI_API_KEY: z.string().optional(),
  AI_OPENAI_BASE_URL: z.url().optional(),
  AI_OPENAI_MODEL: z.string().default("gpt-5.4"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = serverEnvSchema.parse(process.env);
