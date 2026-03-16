process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3001";
process.env.NEXT_PUBLIC_SERVER_URL ??= "http://localhost:3000";

import { describe, expect, test } from "bun:test";

describe("auth client", () => {
  test("uses an absolute auth base URL for SSR and build-time evaluation", async () => {
    const { authClientBaseURL } = await import("./auth-client");

    expect(authClientBaseURL).toBe("http://localhost:3001/api/auth");
  });
});
