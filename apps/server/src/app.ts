import { createApp, type App } from "@reaping/api"
import { env } from "@reaping/env/server"

export const app = createApp({
  corsOrigin: env.CORS_ORIGIN,
})

export default app

export type { App }
