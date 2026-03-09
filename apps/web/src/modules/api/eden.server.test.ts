import { afterEach, describe, expect, mock, test } from "bun:test"

const originalEnv = { ...process.env }
const originalFetch = globalThis.fetch

const applyServerRuntimeEnv = () => {
  const runtimeEnv = process.env as Record<string, string | undefined>

  runtimeEnv.DATABASE_URL = "postgresql://demo:demo@localhost:5432/reaping"
  runtimeEnv.DATABASE_URL_DIRECT = "postgresql://demo:demo@localhost:5432/reaping"
  runtimeEnv.BETTER_AUTH_SECRET = "12345678901234567890123456789012"
  runtimeEnv.BETTER_AUTH_URL = "http://localhost:3000"
  runtimeEnv.CORS_ORIGIN = "http://localhost:3001"
  runtimeEnv.AI_PROVIDER = "gateway"
  runtimeEnv.AI_GATEWAY_MODEL = "openai/gpt-5.4"
  delete runtimeEnv.AI_OPENAI_API_KEY
  delete runtimeEnv.AI_OPENAI_BASE_URL
  runtimeEnv.AI_OPENAI_MODEL = "gpt-5.4"
  runtimeEnv.NODE_ENV = "test"
}

afterEach(() => {
  process.env = { ...originalEnv }
  globalThis.fetch = originalFetch
})

describe("server Eden transport", () => {
  test("uses the in-process app instead of network fetch", async () => {
    applyServerRuntimeEnv()

    const networkFetch = mock(() => {
      throw new Error("network fetch should not be called")
    })

    globalThis.fetch = networkFetch as unknown as typeof fetch

    const { getDemoServerApiClient } = await import("./eden.server-core")
    const response = await getDemoServerApiClient().api.demo.items({ id: "demo-1" }).get()

    expect(response.error).toBeNull()
    expect(response.data).toEqual({
      id: "demo-1",
      name: "Demo demo-1",
      status: "ready",
    })
    expect(networkFetch).not.toHaveBeenCalled()
  })
})
