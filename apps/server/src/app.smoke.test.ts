import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { treaty } from "@elysiajs/eden"

import type { App, EconomySnapshot } from "@reaping/api"

const originalEnv = { ...process.env }
const hasDatabaseEnv = Boolean(originalEnv.DATABASE_URL)

const applyServerRuntimeEnv = () => {
  const runtimeEnv = process.env as Record<string, string | undefined>

  runtimeEnv.DATABASE_URL ??= "postgresql://demo:demo@localhost:5432/reaping"
  runtimeEnv.DATABASE_URL_DIRECT ??= runtimeEnv.DATABASE_URL
  runtimeEnv.UPSTASH_REDIS_REST_URL ??= "https://example.upstash.io"
  runtimeEnv.UPSTASH_REDIS_REST_TOKEN ??= "test-upstash-token"
  runtimeEnv.BETTER_AUTH_SECRET ??= "12345678901234567890123456789012"
  runtimeEnv.BETTER_AUTH_URL ??= "http://127.0.0.1:3001"
  runtimeEnv.CORS_ORIGIN ??= "http://127.0.0.1:3000"
  runtimeEnv.BETTER_AUTH_TRUSTED_ORIGINS ??=
    "http://127.0.0.1:3000,https://trusted-preview.example.com"
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
  let openBettingWindow: typeof import("@reaping/api").openBettingWindow
  let resetGameSessionsForTests: typeof import("@reaping/api").resetGameSessionsForTests
  let defaultGameSessionId: string

  beforeAll(async () => {
    applyServerRuntimeEnv()

    const [{ app }, apiModule] = await Promise.all([import("./app.js"), import("@reaping/api")])
    const { DEFAULT_GAME_SESSION_ID, openBettingWindow: openWindow } = apiModule

    openBettingWindow = openWindow
    resetGameSessionsForTests = apiModule.resetGameSessionsForTests
    defaultGameSessionId = DEFAULT_GAME_SESSION_ID

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

  test.if(hasDatabaseEnv)("reports database health with the configured environment", async () => {
    const response = await api.api.demo.db.get()

    expect(response.error).toBeNull()
    expect(response.data).toEqual({
      healthy: true,
    })
  })

  test("rejects unauthenticated game access", async () => {
    const response = await fetch(`${getBaseUrl(server)}/api/game/economy`)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      _tag: "Unauthorized",
      message: "Authentication required",
    })
  })

  test("joins the game session and places a bet through the HTTP contract", async () => {
    await resetGameSessionsForTests()

    const joinResponse = await fetch(`${getBaseUrl(server)}/api/game/session/join`, {
      method: "POST",
      headers: {
        "x-test-user-id": "tor39-smoke-user",
      },
    })

    expect(joinResponse.status).toBe(200)

    const joinedEconomy = (await joinResponse.json()) as EconomySnapshot
    const joinedParticipant = joinedEconomy.participant

    expect(joinedParticipant).not.toBeNull()

    if (joinedParticipant === null) {
      throw new Error("joined participant missing from economy snapshot")
    }

    expect(joinedParticipant.userId).toBeDefined()
    expect(joinedParticipant.availableBalance).toBe(joinedParticipant.walletBalance)

    const openedAt = new Date(Date.now() - 1_000).toISOString()

    await openBettingWindow({
      sessionId: defaultGameSessionId,
      openedAt,
      playerHp: 5,
      aiHp: 5,
      magazine: {
        liveRounds: 3,
        blankRounds: 7,
      },
    })

    const placeBetResponse = await fetch(`${getBaseUrl(server)}/api/game/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "tor39-smoke-user",
      },
      body: JSON.stringify({
        requestId: "smoke-bet-1",
        betId: "player-survives-round",
        amount: 100,
      }),
    })

    expect(placeBetResponse.status).toBe(200)

    const placedEconomy = (await placeBetResponse.json()) as EconomySnapshot
    const placedParticipant = placedEconomy.participant

    expect(placedParticipant).not.toBeNull()

    if (placedParticipant === null) {
      throw new Error("placed participant missing from economy snapshot")
    }

    expect(placedEconomy.activeBets).toHaveLength(1)
    expect(placedParticipant.lockedFunds).toBe(100)
    expect(placedParticipant.availableBalance).toBe(
      placedParticipant.walletBalance - 100,
    )
  })
})

function getBaseUrl(server: Bun.Server<undefined>): string {
  return `http://127.0.0.1:${server.port ?? 0}`
}
