import { env } from "@torinojs-swarm/env/server";
import { Elysia } from "elysia";
import { authPlugin } from "./modules/http/auth-plugin";
import { httpTransportPlugin } from "./modules/http/transport-plugin";
import { demoDomain } from "./features/demo";

export const createApp = (corsOrigin: string) =>
  new Elysia()
    .use(httpTransportPlugin(corsOrigin))
    .use(demoDomain)
    .use(authPlugin)
    .get("/", () => "OK")

export const app = createApp(env.CORS_ORIGIN)

export type App = typeof app;
