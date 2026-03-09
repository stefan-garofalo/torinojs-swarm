import { Elysia } from "elysia"

import { authPlugin } from "./modules/http/auth-plugin.js"
import { httpTransportPlugin } from "./modules/http/transport-plugin.js"
import { demoDomain } from "./features/demo/index.js"

export interface CreateAppOptions {
  corsOrigin: string
}

export const createApp = ({ corsOrigin }: CreateAppOptions) =>
  new Elysia()
    .use(httpTransportPlugin(corsOrigin))
    .use(demoDomain)
    .use(authPlugin)
    .get("/health", () => "OK")

export type App = ReturnType<typeof createApp>
