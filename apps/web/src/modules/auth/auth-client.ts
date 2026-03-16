import { env } from "@reaping/env/web";
import { createAuthClient } from "better-auth/react";

export const authClientBaseURL = new URL("/api/auth", env.NEXT_PUBLIC_APP_URL).toString();

export const authClient = createAuthClient({
  baseURL: authClientBaseURL,
});
