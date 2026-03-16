import "server-only"

import { treaty } from "@elysiajs/eden"
import { createApp } from "@reaping/api"
import { env } from "@reaping/env/server"

import type { DemoApiClient } from "./eden"

const app = createApp({
  corsOrigin: env.CORS_ORIGIN,
})

export const getDemoServerApiClient = (): DemoApiClient => treaty(app)
