import { beforeEach, describe, expect, test } from "bun:test";

import {
  createGameSession,
  getGameSession,
  resetGameSessionsForTests,
  updateGameSession,
  type GameSessionEnvelope,
} from "./index.js";

const baseEnvelope = (): GameSessionEnvelope => ({
  sessionId: "session-1",
  status: "waiting",
  version: 1,
  round: 1,
  participants: [],
  bettingWindow: {
    opensAt: "2026-03-10T10:00:00.000Z",
    closesAt: "2026-03-10T10:00:10.000Z",
  },
  activeBets: [],
  economyEvents: [],
  phase: "idle",
  activePlayer: null,
  ai: null,
  magazine: null,
  turn: null,
  roundHistory: [],
});

describe("@reaping/redis", () => {
  beforeEach(async () => {
    await resetGameSessionsForTests();
  });

  test("creates a session, reads it back, then rejects stale updates", async () => {
    const created = await createGameSession(baseEnvelope());

    expect(created.version).toBe(1);

    const loaded = await getGameSession("session-1");

    expect(loaded).toEqual(created);

    const updated = await updateGameSession({
      sessionId: "session-1",
      expectedVersion: 1,
      update: (current) => ({
        ...current,
        status: "in-progress",
        version: current.version + 1,
        round: current.round + 1,
        phase: "betting",
      }),
    });

    expect(updated.version).toBe(2);
    expect(updated.phase).toBe("betting");

    await expect(
      updateGameSession({
        sessionId: "session-1",
        expectedVersion: 1,
        update: (current) => ({
          ...current,
          version: current.version + 1,
          phase: "action",
        }),
      }),
    ).rejects.toThrow("version mismatch");
  });
});
