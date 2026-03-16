import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { treaty } from "@elysiajs/eden"
import { config } from "dotenv"
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

import type { App, EconomySnapshot } from "@reaping/api"

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
  runtimeEnv.UPSTASH_REDIS_REST_URL ??= "https://example.upstash.io"
  runtimeEnv.UPSTASH_REDIS_REST_TOKEN ??= "test-upstash-token"
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
    server?.stop(true)
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

  test("requires auth before a user can join a game session", async () => {
    const response = await fetch(`${getBaseUrl(server)}/api/game/session/join`, {
      method: "POST",
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      _tag: "Unauthorized",
      message: "Authentication required",
    })
  })

  test("returns participant not found before an authenticated user joins", async () => {
    const userId = "smoke-economy-before-join"
    const response = await fetch(`${getBaseUrl(server)}/api/game/economy`, {
      headers: createTestUserHeaders(userId),
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      _tag: "ParticipantNotFound",
      message: `No participant wallet found for "${userId}"`,
    })
  })

  test("creates a spectator wallet on join and exposes it through the economy endpoint", async () => {
    const userId = "smoke-joined-user"
    const joinResponse = await fetch(`${getBaseUrl(server)}/api/game/session/join`, {
      method: "POST",
      headers: createTestUserHeaders(userId),
    })

    expect(joinResponse.status).toBe(200)

    const joinedEconomy = (await joinResponse.json()) as EconomySnapshot
    const joinedParticipant = joinedEconomy.participant

    expect(joinedParticipant).not.toBeNull()

    if (joinedParticipant === null) {
      throw new Error("joined participant missing from economy snapshot")
    }

    expect(joinedParticipant.userId).toBe(userId)
    expect(joinedParticipant.role).toBe("spectator")
    expect(joinedParticipant.availableBalance).toBe(joinedParticipant.walletBalance)
    expect(joinedEconomy.activeBets).toHaveLength(0)

    const economyResponse = await fetch(`${getBaseUrl(server)}/api/game/economy`, {
      headers: createTestUserHeaders(userId),
    })

    expect(economyResponse.status).toBe(200)

    const economy = (await economyResponse.json()) as EconomySnapshot
    const participant = economy.participant

    expect(participant).not.toBeNull()

    if (participant === null) {
      throw new Error("participant missing from economy response")
    }

    expect(participant).toEqual(joinedParticipant)
  })

  test("rejects bets when no betting window is open", async () => {
    const userId = "smoke-bet-without-window"

    const joinResponse = await fetch(`${getBaseUrl(server)}/api/game/session/join`, {
      method: "POST",
      headers: createTestUserHeaders(userId),
    })

    expect(joinResponse.status).toBe(200)

    const betResponse = await fetch(`${getBaseUrl(server)}/api/game/bets`, {
      method: "POST",
      headers: {
        ...createTestUserHeaders(userId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: "smoke-bet-without-window",
        betId: "player-survives-round",
        amount: 100,
      }),
    })

    expect(betResponse.status).toBe(409)
    expect(await betResponse.json()).toEqual({
      _tag: "BettingWindowClosed",
      message: "Betting is closed for round 1",
    })
  })
})

function getBaseUrl(server: Bun.Server<undefined>): string {
  return `http://127.0.0.1:${server.port ?? 0}`
}

function createTestUserHeaders(userId: string): Record<string, string> {
  return {
    "x-test-user-id": userId,
  }
}
