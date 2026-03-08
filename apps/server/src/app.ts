import { env } from "@reaping/env/server";
import { Elysia } from "elysia";
import { authPlugin } from "./modules/http/auth-plugin.js";
import { httpTransportPlugin } from "./modules/http/transport-plugin.js";
import { demoDomain } from "./features/demo/index.js";

export const createApp = (corsOrigin: string) =>
  new Elysia()
    .use(httpTransportPlugin(corsOrigin))
    .use(demoDomain)
    .use(authPlugin)
    .get("/health", () => "OK")

export const app = createApp(env.CORS_ORIGIN)

export default app;

export type App = typeof app;
