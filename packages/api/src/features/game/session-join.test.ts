import { beforeEach, describe, expect, test } from "bun:test";

import {
  createGameSession,
  resetGameSessionsForTests,
  type GameSessionEnvelope,
} from "@reaping/redis";

import { getParticipantWallet, joinGameSession } from "./session-join.js";

function createEnvelope(input: {
  sessionId: string;
  status?: GameSessionEnvelope["status"];
  phase?: GameSessionEnvelope["phase"];
  round?: number;
}): GameSessionEnvelope {
  return {
    sessionId: input.sessionId,
    status: input.status ?? "waiting",
    version: 1,
    round: input.round ?? 1,
    participants: [],
    bettingWindow: null,
    activeBets: [],
    economyEvents: [],
    phase: input.phase ?? "idle",
    activePlayer: null,
    ai: null,
    magazine: null,
    turn: null,
    roundHistory: [],
  };
}

describe("session join wallet lifecycle", () => {
  beforeEach(async () => {
    await resetGameSessionsForTests();
  });

  test("join creates one persisted spectator wallet, re-read returns it unchanged, and available balance never goes negative", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-1" }));

    const firstJoin = await joinGameSession({
      sessionId: "session-1",
      userId: "user-1",
      joinedAt: "2026-03-10T10:00:00.000Z",
      random: createRandomSequence([0, 0.5]),
    });

    const reread = await getParticipantWallet({
      sessionId: "session-1",
      userId: "user-1",
    });

    const secondJoin = await joinGameSession({
      sessionId: "session-1",
      userId: "user-1",
      joinedAt: "2026-03-10T10:05:00.000Z",
      random: createRandomSequence([0.99, 0.99]),
    });

    expect(firstJoin.walletBalance).toBe(0);
    expect(firstJoin.lockedFunds).toBe(0);
    expect(firstJoin.availableBalance).toBe(0);
    expect(reread).toEqual(firstJoin);
    expect(secondJoin).toEqual(firstJoin);
  });

  test("mid-game join delays eligibility until the next round", async () => {
    await createGameSession(
      createEnvelope({
        sessionId: "session-2",
        status: "in-progress",
        phase: "action",
        round: 4,
      }),
    );

    const joined = await joinGameSession({
      sessionId: "session-2",
      userId: "late-user",
      joinedAt: "2026-03-10T10:10:00.000Z",
      random: createRandomSequence([0.5, 0.25]),
    });

    expect(joined.eligibleFromRound).toBe(5);
    expect(joined.role).toBe("spectator");
  });

  test("a new session does not reuse wallet state from a prior session", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-a" }));

    const sessionAJoin = await joinGameSession({
      sessionId: "session-a",
      userId: "user-2",
      joinedAt: "2026-03-10T10:15:00.000Z",
      random: createRandomSequence([0.75, 0.25]),
    });

    await createGameSession(createEnvelope({ sessionId: "session-b" }));

    const sessionBJoin = await joinGameSession({
      sessionId: "session-b",
      userId: "user-2",
      joinedAt: "2026-03-10T10:20:00.000Z",
      random: createRandomSequence([0.25, 0.75]),
    });

    expect(sessionAJoin).not.toEqual(sessionBJoin);
    expect(sessionBJoin.availableBalance).toBe(sessionBJoin.walletBalance);
  });
});

function createRandomSequence(values: number[]): () => number {
  const fallbackValue = values.at(-1) ?? 0.5;
  let index = 0;

  return () => {
    const nextValue = values[index] ?? fallbackValue;

    index += 1;

    return nextValue;
  };
}
