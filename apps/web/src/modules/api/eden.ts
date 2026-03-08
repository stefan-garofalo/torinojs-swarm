import { edenTreaty } from "@elysiajs/eden";
import { env } from "@torinojs-swarm/env/web";

import type { App as ServerApp } from "server/app";

type DemoApiClient = ReturnType<typeof edenTreaty<DemoServerApp>>;
type DemoServerApp = ServerApp;

export const getDemoApiClient = (): DemoApiClient =>
  edenTreaty<DemoServerApp>(env.NEXT_PUBLIC_SERVER_URL);
