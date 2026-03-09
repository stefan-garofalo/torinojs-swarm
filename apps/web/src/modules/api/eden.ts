import { treaty } from "@elysiajs/eden"
import { env } from "@reaping/env/web"
import type { App as DemoApiApp } from "@reaping/api"

export type DemoApiClient = ReturnType<typeof treaty<DemoApiApp>>

export const getDemoApiClient = (): DemoApiClient =>
  treaty<DemoApiApp>(env.NEXT_PUBLIC_SERVER_URL)
