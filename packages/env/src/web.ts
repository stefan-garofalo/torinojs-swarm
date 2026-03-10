import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const firstDefined = (...values: Array<string | undefined>) => values.find((value) => value && value.length > 0);

const vercelAppUrl = firstDefined(
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
);

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_SERVER_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL:
      firstDefined(process.env.NEXT_PUBLIC_APP_URL, vercelAppUrl && `https://${vercelAppUrl}`),
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  },
  emptyStringAsUndefined: true,
});
