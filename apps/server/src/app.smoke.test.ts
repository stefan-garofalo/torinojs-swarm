import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { treaty } from "@elysiajs/eden";

import { app, type App } from "./app";

describe("app smoke", () => {
  let server: Bun.Server<undefined>;
  let api: ReturnType<typeof treaty<App>>;

  beforeAll(() => {
    server = Bun.serve({
      fetch: app.fetch,
      port: 0,
    });

    api = treaty<App>(`http://127.0.0.1:${server.port}`);
  });

  afterAll(() => {
    server.stop(true);
  });

  test("serves demo item through Treaty", async () => {
    const response = await api.api.demo.items({ id: "demo-1" }).get();

    expect(response.error).toBeNull();
    expect(response.data).toEqual({
      id: "demo-1",
      name: "Demo demo-1",
      status: "ready",
    });
  });

  test("returns typed 404 payload for missing demo item", async () => {
    const response = await api.api.demo.items({ id: "missing" }).get();

    expect(response.data).toBeNull();
    expect(response.error?.status).toBe(404);
    expect(response.error?.value).toEqual({
      _tag: "DemoItemNotFound",
      itemId: "missing",
      message: 'No item found for id "missing"',
    });
  });

  test("reports database health with the configured environment", async () => {
    const response = await api.api.demo.db.get();

    expect(response.error).toBeNull();
    expect(response.data).toEqual({
      healthy: true,
    });
  });
});
