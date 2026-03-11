import { beforeEach, describe, expect, test } from "bun:test";

import {
  createGameSession,
  resetGameSessionsForTests,
  type GameSessionEnvelope,
} from "@reaping/redis";

import {
  getEconomySnapshot,
  MINIMUM_BET_AMOUNT,
  openBettingWindow,
  placeBet,
  settleRoundBets,
} from "./betting.js";
import {
  InsufficientAvailableBalanceError,
  ParticipantIneligibleToBetError,
} from "./errors.js";
import { joinGameSession } from "./session-join.js";

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
    expect(second.economy.activeBets).toHaveLength(2);
    expect(second.economy.participant?.lockedFunds).toBe(150);
    expect(second.economy.participant?.availableBalance).toBe(joined.walletBalance - 150);
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
