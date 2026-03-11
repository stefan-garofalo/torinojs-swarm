import { Elysia } from "elysia"

import { authPlugin } from "./modules/http/auth-plugin.js"
import { httpTransportPlugin } from "./modules/http/transport-plugin.js"
import { demoDomain } from "./features/demo/index.js"
import { gameDomain } from "./features/game/index.js"

export interface CreateAppOptions {
  corsOrigin: string
}

export const createApp = ({ corsOrigin }: CreateAppOptions) =>
  new Elysia()
    .use(httpTransportPlugin(corsOrigin))
    .use(authPlugin)
    .use(demoDomain)
    .use(gameDomain)
    .get("/health", () => "OK")

export type App = ReturnType<typeof createApp>
export * from "./features/game/index.js"
export { resetGameSessionsForTests } from "@reaping/redis"
