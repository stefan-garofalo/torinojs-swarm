import { beforeEach, describe, expect, test } from "bun:test";

import {
  type GameSessionStoreClient,
  createGameSession,
  resetGameSessionsForTests,
  type GameSessionEnvelope,
} from "@reaping/redis";

import {
  createBettingApi,
  getEconomySnapshot,
  MINIMUM_BET_AMOUNT,
  openBettingWindow,
  placeBet,
  settleRoundBets,
} from "./betting.js";
import {
  BetRequestConflictError,
  InsufficientAvailableBalanceError,
  ParticipantIneligibleToBetError,
} from "./errors.js";
import { createSessionJoinApi, joinGameSession } from "./session-join.js";

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

describe("game betting lifecycle", () => {
  beforeEach(async () => {
    await resetGameSessionsForTests();
  });

  test("opens a betting window, places multiple bets, and keeps duplicate request ids idempotent", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-1" }));

    const joined = await joinGameSession({
      sessionId: "session-1",
      userId: "user-1",
      joinedAt: "2026-03-10T12:00:00.000Z",
      random: createRandomSequence([0.75, 0.25]),
    });

    const bettingWindow = await openBettingWindow({
      sessionId: "session-1",
      openedAt: "2026-03-10T12:01:00.000Z",
      playerHp: 4,
      aiHp: 5,
      magazine: {
        liveRounds: 3,
        blankRounds: 2,
      },
    });

    expect(bettingWindow.quotes.map((quote) => quote.id)).toContain("next-shot-live");

    const first = await placeBet({
      sessionId: "session-1",
      userId: "user-1",
      requestId: "req-1",
      betId: "player-survives-round",
      amount: 100,
      placedAt: "2026-03-10T12:01:03.000Z",
    });
    const duplicate = await placeBet({
      sessionId: "session-1",
      userId: "user-1",
      requestId: "req-1",
      betId: "player-survives-round",
      amount: 100,
      placedAt: "2026-03-10T12:01:04.000Z",
    });
    const second = await placeBet({
      sessionId: "session-1",
      userId: "user-1",
      requestId: "req-2",
      betId: "next-shot-live",
      amount: 50,
      placedAt: "2026-03-10T12:01:05.000Z",
    });

    expect(first.placedBet).toEqual(duplicate.placedBet);
    expect(first.placedBet.quoteSnapshotId).toBe(bettingWindow.quoteSnapshotId);
    expect(second.economy.activeBets).toHaveLength(2);
    expect(second.economy.activeBets[0]?.quoteSnapshotId).toBe(bettingWindow.quoteSnapshotId);
    expect(second.economy.participant?.lockedFunds).toBe(150);
    expect(second.economy.participant?.availableBalance).toBe(joined.walletBalance - 150);
    expect(
      second.economy.economyEvents.find((event) => event.type === "bet-placed")?.payload
        .quoteSnapshotId,
    ).toBe(bettingWindow.quoteSnapshotId);
  });

  test("rejects duplicate request ids when the payload changes", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-dup" }));

    await joinGameSession({
      sessionId: "session-dup",
      userId: "user-dup",
      joinedAt: "2026-03-10T12:02:00.000Z",
      random: createRandomSequence([0.75, 0.25]),
    });

    await openBettingWindow({
      sessionId: "session-dup",
      openedAt: "2026-03-10T12:02:10.000Z",
      playerHp: 4,
      aiHp: 4,
      magazine: {
        liveRounds: 2,
        blankRounds: 2,
      },
    });

    await placeBet({
      sessionId: "session-dup",
      userId: "user-dup",
      requestId: "req-dup",
      betId: "player-survives-round",
      amount: 25,
      placedAt: "2026-03-10T12:02:11.000Z",
    });

    await expect(
      placeBet({
        sessionId: "session-dup",
        userId: "user-dup",
        requestId: "req-dup",
        betId: "ai-dies-this-round",
        amount: 50,
        placedAt: "2026-03-10T12:02:12.000Z",
      }),
    ).rejects.toBeInstanceOf(BetRequestConflictError);
  });

  test("rejects bets above available balance", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-2" }));

    const joined = await joinGameSession({
      sessionId: "session-2",
      userId: "user-2",
      joinedAt: "2026-03-10T12:05:00.000Z",
      random: createRandomSequence([0.75, 0.25]),
    });

    await openBettingWindow({
      sessionId: "session-2",
      openedAt: "2026-03-10T12:05:30.000Z",
      playerHp: 5,
      aiHp: 5,
      magazine: {
        liveRounds: 2,
        blankRounds: 4,
      },
    });

    await expect(
      placeBet({
        sessionId: "session-2",
        userId: "user-2",
        requestId: "req-over",
        betId: "player-survives-round",
        amount: joined.walletBalance + 1,
        placedAt: "2026-03-10T12:05:31.000Z",
      }),
    ).rejects.toBeInstanceOf(InsufficientAvailableBalanceError);
  });

  test("blocks mid-round joiners until the next round", async () => {
    await createGameSession(
      createEnvelope({
        sessionId: "session-3",
        status: "in-progress",
        phase: "action",
        round: 4,
      }),
    );

    await joinGameSession({
      sessionId: "session-3",
      userId: "late-user",
      joinedAt: "2026-03-10T12:10:00.000Z",
      random: createRandomSequence([0.5, 0.5]),
    });

    await openBettingWindow({
      sessionId: "session-3",
      openedAt: "2026-03-10T12:10:10.000Z",
      playerHp: 3,
      aiHp: 4,
      magazine: {
        liveRounds: 1,
        blankRounds: 3,
      },
    });

    await expect(
      placeBet({
        sessionId: "session-3",
        userId: "late-user",
        requestId: "req-late",
        betId: "player-survives-round",
        amount: MINIMUM_BET_AMOUNT,
        placedAt: "2026-03-10T12:10:11.000Z",
      }),
    ).rejects.toBeInstanceOf(ParticipantIneligibleToBetError);
  });

  test("treats the exact window close boundary as closed", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-close" }));

    await joinGameSession({
      sessionId: "session-close",
      userId: "user-close",
      joinedAt: "2026-03-10T12:12:00.000Z",
      random: createRandomSequence([0.5, 0.5]),
    });

    await openBettingWindow({
      sessionId: "session-close",
      openedAt: "2026-03-10T12:12:10.000Z",
      playerHp: 4,
      aiHp: 4,
      magazine: {
        liveRounds: 2,
        blankRounds: 3,
      },
    });

    await expect(
      placeBet({
        sessionId: "session-close",
        userId: "user-close",
        requestId: "req-close",
        betId: "player-survives-round",
        amount: MINIMUM_BET_AMOUNT,
        placedAt: "2026-03-10T12:12:20.000Z",
      }),
    ).rejects.toThrow("Betting is closed for round 1");
  });

  test("surfaces session creation failures instead of misreporting missing session", async () => {
    const failingApi = createBettingApi({
      getGameSession: async () => null,
      createGameSession: async () => {
        throw new Error("upstash write failed");
      },
      updateGameSession: async () => {
        throw new Error("unreachable");
      },
    });

    await expect(failingApi.ensureGameSession("session-fail")).rejects.toThrow(
      "upstash write failed",
    );
  });

  test("settles active bets, unlocks funds, and applies only net winnings to wallet balance", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-4" }));

    const joined = await joinGameSession({
      sessionId: "session-4",
      userId: "user-4",
      joinedAt: "2026-03-10T12:20:00.000Z",
      random: createRandomSequence([0.75, 0.25]),
    });

    await openBettingWindow({
      sessionId: "session-4",
      openedAt: "2026-03-10T12:20:10.000Z",
      playerHp: 4,
      aiHp: 5,
      magazine: {
        liveRounds: 3,
        blankRounds: 7,
      },
    });

    await placeBet({
      sessionId: "session-4",
      userId: "user-4",
      requestId: "req-win",
      betId: "player-survives-round",
      amount: 100,
      placedAt: "2026-03-10T12:20:11.000Z",
    });
    await placeBet({
      sessionId: "session-4",
      userId: "user-4",
      requestId: "req-loss",
      betId: "ai-dies-this-round",
      amount: 75,
      placedAt: "2026-03-10T12:20:12.000Z",
    });

    const settled = await settleRoundBets({
      sessionId: "session-4",
      settledAt: "2026-03-10T12:20:30.000Z",
      outcome: {
        playerSurvivedRound: true,
        playerDiedThisRound: false,
        aiSurvivedRound: true,
        aiDiedThisRound: false,
        aiUsedEject: false,
        playerShotSelf: false,
        playerShotOpponent: true,
        nextShotWasLive: true,
        nextShotWasBlank: false,
        playerEndingHp: 3,
        roundTurnCount: 4,
        noDamageOccurred: false,
        bothSidesTookDamage: false,
      },
    });

    const economy = await getEconomySnapshot({
      sessionId: "session-4",
      userId: "user-4",
    });

    expect(settled.summary).toEqual({
      settledBetCount: 2,
      winningBetCount: 1,
      losingBetCount: 1,
    });
    expect(economy.activeBets).toHaveLength(0);
    expect(economy.bettingWindow).toBeNull();
    expect(economy.participant?.lockedFunds).toBe(0);
    expect(economy.participant?.walletBalance).toBe(joined.walletBalance - 75 + 50);
    expect(economy.participant?.availableBalance).toBe(joined.walletBalance - 75 + 50);
    expect(economy.economyEvents.map((event) => event.type)).toContain("round-settled");
  });

  test("keeps settlement summaries accurate when a CAS retry occurs", async () => {
    const sessionId = "session-retry";
    let envelope = createEnvelope({ sessionId });
    let shouldConflict = true;

    const store: Pick<
      GameSessionStoreClient,
      "createGameSession" | "getGameSession" | "updateGameSession"
    > = {
      createGameSession: async (nextEnvelope) => {
        envelope = nextEnvelope;
        return envelope;
      },
      getGameSession: async (requestedSessionId) =>
        requestedSessionId === sessionId ? structuredClone(envelope) : null,
      updateGameSession: async ({ sessionId: requestedSessionId, expectedVersion, update }) => {
        if (requestedSessionId !== sessionId) {
          throw new Error(`unexpected session "${requestedSessionId}"`);
        }

        if (envelope.version !== expectedVersion) {
          throw new Error("version mismatch");
        }

        const nextEnvelope = update(structuredClone(envelope));

        if (shouldConflict) {
          shouldConflict = false;
          envelope = {
            ...envelope,
            version: envelope.version + 1,
          };
          throw new Error("version mismatch");
        }

        envelope = nextEnvelope;
        return structuredClone(envelope);
      },
    };

    const bettingApi = createBettingApi(store);
    const sessionJoinApi = createSessionJoinApi(store);

    await bettingApi.ensureGameSession(sessionId);
    await sessionJoinApi.joinGameSession({
      sessionId,
      userId: "user-retry",
      joinedAt: "2026-03-10T12:30:00.000Z",
      random: createRandomSequence([0.75, 0.25]),
    });
    await bettingApi.openBettingWindow({
      sessionId,
      openedAt: "2026-03-10T12:30:10.000Z",
      playerHp: 4,
      aiHp: 5,
      magazine: {
        liveRounds: 2,
        blankRounds: 3,
      },
    });
    await bettingApi.placeBet({
      sessionId,
      userId: "user-retry",
      requestId: "req-retry-win",
      betId: "player-survives-round",
      amount: 100,
      placedAt: "2026-03-10T12:30:11.000Z",
    });

    const settled = await bettingApi.settleRoundBets({
      sessionId,
      settledAt: "2026-03-10T12:30:20.000Z",
      outcome: {
        playerSurvivedRound: true,
        playerDiedThisRound: false,
        aiSurvivedRound: true,
        aiDiedThisRound: false,
        aiUsedEject: false,
        playerShotSelf: false,
        playerShotOpponent: true,
        nextShotWasLive: true,
        nextShotWasBlank: false,
        playerEndingHp: 4,
        roundTurnCount: 2,
        noDamageOccurred: false,
        bothSidesTookDamage: false,
      },
    });

    expect(settled.summary).toEqual({
      settledBetCount: 1,
      winningBetCount: 1,
      losingBetCount: 0,
    });
  });

  test("preserves participants after fractional payouts", async () => {
    await createGameSession(createEnvelope({ sessionId: "session-fractional" }));

    const joined = await joinGameSession({
      sessionId: "session-fractional",
      userId: "user-fractional",
      joinedAt: "2026-03-10T12:40:00.000Z",
      random: createRandomSequence([0.75, 0.25]),
    });

    await openBettingWindow({
      sessionId: "session-fractional",
      openedAt: "2026-03-10T12:40:10.000Z",
      playerHp: 4,
      aiHp: 5,
      magazine: {
        liveRounds: 2,
        blankRounds: 3,
      },
    });

    await placeBet({
      sessionId: "session-fractional",
      userId: "user-fractional",
      requestId: "req-fractional",
      betId: "player-shoots-opponent",
      amount: 11,
      placedAt: "2026-03-10T12:40:11.000Z",
    });

    await settleRoundBets({
      sessionId: "session-fractional",
      settledAt: "2026-03-10T12:40:20.000Z",
      outcome: {
        playerSurvivedRound: true,
        playerDiedThisRound: false,
        aiSurvivedRound: true,
        aiDiedThisRound: false,
        aiUsedEject: false,
        playerShotSelf: false,
        playerShotOpponent: true,
        nextShotWasLive: false,
        nextShotWasBlank: true,
        playerEndingHp: 4,
        roundTurnCount: 3,
        noDamageOccurred: false,
        bothSidesTookDamage: false,
      },
    });

    const economy = await getEconomySnapshot({
      sessionId: "session-fractional",
      userId: "user-fractional",
    });

    expect(economy.participant).not.toBeNull();

    if (economy.participant === null) {
      throw new Error("participant missing after fractional payout");
    }

    expect(economy.participant.walletBalance).toBe(joined.walletBalance + 3.3);
    expect(economy.participant.availableBalance).toBe(joined.walletBalance + 3.3);
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
