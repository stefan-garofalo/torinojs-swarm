process.env.NEXT_PUBLIC_SERVER_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3001";

import { afterEach, describe, expect, mock, test } from "bun:test";

import { GET, POST } from "./route";

type RouteContext = {
  params: { path: string[] } | Promise<{ path: string[] }>;
};

const createRequest = ({
  path,
  method,
  headers,
  search,
  body,
}: {
  path: string[];
  method: "GET" | "POST";
  headers?: HeadersInit;
  search?: string;
  body?: string;
}) =>
  new Request(
    `http://localhost:3001/api/auth/${path.join("/")}${search ?? ""}`,
    {
      method,
      headers,
      body,
    },
  );

const context = (path: string[]): RouteContext => ({
  params: { path },
});

const originalFetch = globalThis.fetch;
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const setMockFetch = (value: FetchLike) => {
  globalThis.fetch = (value as unknown) as typeof globalThis.fetch;
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("web auth proxy", () => {
  test("forwards social sign-in initiation to the server host through /api/auth and preserves redirect", async () => {
    const upstream = mock(
      async (input: string | URL | Request, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const payload = await request.text();

        expect(request.method).toBe("POST");
        expect(request.url).toBe("http://localhost:3000/api/auth/sign-in/social");
      expect(request.headers.get("origin")).toBe("http://localhost:3001");
        expect(request.headers.get("content-type")).toBe("application/json");
        expect(payload).toBe(
          JSON.stringify({
            provider: "github",
            callbackURL: "http://localhost:3001/api/auth/callback/github",
          }),
        );

        return new Response(null, {
          status: 302,
          headers: {
            Location: "https://github.com/login/oauth/authorize",
            "Set-Cookie": "auth=proxy-pass; Path=/; HttpOnly",
          },
        });
      },
    );

    setMockFetch(upstream);

    const request = createRequest({
      method: "POST",
      path: ["sign-in", "social"],
      headers: {
        "Content-Type": "application/json",
        origin: "http://localhost:3001",
      },
      body: JSON.stringify({
        provider: "github",
        callbackURL: "http://localhost:3001/api/auth/callback/github",
      }),
    });

    const response = await POST(request, context(["sign-in", "social"]));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(response.headers.get("set-cookie")).toBe("auth=proxy-pass; Path=/; HttpOnly");
  });

  test("proxies callback-style requests and forwards session cookie headers", async () => {
    const upstream = mock(async () =>
      new Response(
        JSON.stringify({
          session: { id: "mock-session-id" },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie":
              "better-auth.session=abc; Path=/; HttpOnly; Secure",
          },
        },
      ),
    );
    setMockFetch(upstream);

    const request = createRequest({
      method: "GET",
      path: ["callback", "github"],
      search: "?code=mock",
        headers: { origin: "http://localhost:3001" },
    });

    const response = await GET(request, context(["callback", "github"]));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBe(
      "better-auth.session=abc; Path=/; HttpOnly; Secure",
    );
    expect(body.session.id).toBe("mock-session-id");
  });

  test("proxies unauthenticated session lookup", async () => {
    const upstream = mock(async () =>
      new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    setMockFetch(upstream);

    const request = createRequest({
      method: "GET",
      path: ["get-session"],
        headers: { origin: "http://localhost:3001" },
    });

    const response = await GET(request, context(["get-session"]));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("unauthorized");
  });

  test("proxies sign-out and returns clear-session cookie", async () => {
    const upstream = mock(async () =>
      new Response(null, {
        status: 200,
        headers: {
          "Set-Cookie":
            "better-auth.session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
        },
      }),
    );
    setMockFetch(upstream);

    const request = createRequest({
      method: "POST",
      path: ["sign-out"],
        headers: { origin: "http://localhost:3001" },
      body: JSON.stringify({}),
    });

    const response = await POST(request, context(["sign-out"]));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("better-auth.session=");
  });

  test("forwards origin header so origin checks still reject untrusted callers", async () => {
    const upstream = mock(async (input: string | URL | Request, init?: RequestInit) => {
      const requestHeaders = new Headers(init?.headers);

      expect(requestHeaders.get("origin")).toBe("https://evil.example");

      return new Response(JSON.stringify({ error: "Bad origin" }), {
        status: 403,
      });
    });
    setMockFetch(upstream);

      const request = createRequest({
      method: "GET",
      path: ["session"],
      headers: { origin: "https://evil.example" },
    });

    const response = await GET(request, context(["session"]));

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Bad origin");
  });

  test("returns 429 on repeated social sign-in initiation", async () => {
    let tries = 0;

    const upstream = mock(async (input: string | URL | Request, init?: RequestInit) => {
      if (tries++ === 0) {
        return new Response(null, { status: 302, headers: { Location: "/api/auth/next" } });
      }

      expect(await new Request(input as string | URL, init).text()).toBe(
        JSON.stringify({ provider: "github" }),
      );

      return new Response(null, { status: 429 });
    });

    setMockFetch(upstream);

    const request = createRequest({
      method: "POST",
      path: ["sign-in", "social"],
      headers: { origin: "http://localhost:3001" },
      body: JSON.stringify({ provider: "github" }),
    });

    const first = await POST(request, context(["sign-in", "social"]));
    const second = await POST(request, context(["sign-in", "social"]));

    expect(first.status).toBe(302);
    expect(second.status).toBe(429);
  });
});
