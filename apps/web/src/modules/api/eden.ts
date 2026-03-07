import { edenTreaty } from "@elysiajs/eden";
import { env } from "@torinojs-swarm/env/web";

import type { app as serverApp } from "server/app";

type DemoServerApp = typeof serverApp;
type DemoApiClient = ReturnType<typeof edenTreaty<DemoServerApp>>;

const createBrowserClient = () => edenTreaty<DemoServerApp>(env.NEXT_PUBLIC_SERVER_URL);

const createServerClient = async () => {
  const { app: serverAppInstance } = await import("server/app");

  return edenTreaty<DemoServerApp>("http://localhost", {
    fetcher: ((input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input.toString(), init);
      return serverAppInstance.fetch(request);
    }) as typeof fetch,
  });
};

export const getDemoApiClient = async (): Promise<DemoApiClient> => {
  if (typeof window === "undefined") {
    return createServerClient() as Promise<DemoApiClient>;
  }

  return createBrowserClient();
};
