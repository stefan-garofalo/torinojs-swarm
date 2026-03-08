import { treaty } from "@elysiajs/eden";
import { env } from "@reaping/env/web";

import type { App as ServerApp } from "@reaping/server/app";

type DemoApiClient = ReturnType<typeof treaty<DemoServerApp>>;
type DemoServerApp = ServerApp;

export const getDemoApiClient = (): DemoApiClient =>
  treaty<DemoServerApp>(env.NEXT_PUBLIC_SERVER_URL);
