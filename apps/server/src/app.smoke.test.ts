import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { treaty } from "@elysiajs/eden"
import type { App } from "@reaping/api"
import { config } from "dotenv"
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

const localEnvPath = fileURLToPath(new URL("../.env", import.meta.url))
const gitCommonDir = execFileSync("git", ["rev-parse", "--git-common-dir"], {
  encoding: "utf8",
}).trim()
const sharedEnvPath = fileURLToPath(new URL("../apps/server/.env", `file://${gitCommonDir}/`))
const envPath = existsSync(localEnvPath) ? localEnvPath : sharedEnvPath

config({ path: envPath, override: false })

const originalEnv = { ...process.env }

const applyServerRuntimeEnv = () => {
  const runtimeEnv = process.env as Record<string, string | undefined>

  runtimeEnv.DATABASE_URL ??= "postgresql://demo:demo@localhost:5432/reaping"
  runtimeEnv.DATABASE_URL_DIRECT ??= runtimeEnv.DATABASE_URL
  runtimeEnv.BETTER_AUTH_SECRET ??= "12345678901234567890123456789012"
  runtimeEnv.BETTER_AUTH_URL ??= "http://localhost:3000"
  runtimeEnv.CORS_ORIGIN ??= "http://localhost:3001"
  runtimeEnv.BETTER_AUTH_TRUSTED_ORIGINS ??=
    "http://localhost:3001,https://trusted-preview.example.com"
  runtimeEnv.GITHUB_CLIENT_ID ??= "github-client-id"
  runtimeEnv.GITHUB_CLIENT_SECRET ??= "github-client-secret"
  runtimeEnv.AI_PROVIDER ??= "gateway"
  runtimeEnv.AI_GATEWAY_MODEL ??= "openai/gpt-5.4"
  runtimeEnv.AI_OPENAI_MODEL ??= "gpt-5.4"
  runtimeEnv.NODE_ENV = "test"
}

describe("app smoke", () => {
  let server: Bun.Server<undefined>
  let api: ReturnType<typeof treaty<App>>

  beforeAll(async () => {
    applyServerRuntimeEnv()

    const { app } = await import("./app.js")

    server = Bun.serve({
      fetch: app.fetch,
      port: 0,
    })

    api = treaty<App>(`http://127.0.0.1:${server.port}`)
  })

  afterAll(() => {
    server.stop(true)
    process.env = { ...originalEnv }
  })

  test("serves demo item through Treaty", async () => {
    const response = await api.api.demo.items({ id: "demo-1" }).get()

    expect(response.error).toBeNull()
    expect(response.data).toEqual({
      id: "demo-1",
      name: "Demo demo-1",
      status: "ready",
    })
  })

  test("returns typed 404 payload for missing demo item", async () => {
    const response = await api.api.demo.items({ id: "missing" }).get()

    expect(response.data).toBeNull()
    expect(response.error?.status).toBe(404)
    expect(response.error?.value).toEqual({
      _tag: "DemoItemNotFound",
      itemId: "missing",
      message: 'No item found for id "missing"',
    })
  })

  test("reports database health with the configured environment", async () => {
    const response = await api.api.demo.db.get()

    expect(response.error).toBeNull()
    expect(response.data).toEqual({
      healthy: true,
    })
  })
})
