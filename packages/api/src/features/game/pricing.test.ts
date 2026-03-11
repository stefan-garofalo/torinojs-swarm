import { describe, expect, test } from "bun:test";

import { createBetQuoteSnapshot } from "./pricing.js";

describe("game bet pricing", () => {
  test("creates deterministic current-window quotes from a session snapshot", () => {
    const quoteSnapshot = createBetQuoteSnapshot({
      sessionId: "session-42",
      sessionVersion: 7,
      round: 3,
      phase: "betting",
      playerHp: 4,
      aiHp: 5,
      magazine: {
        liveRounds: 3,
        blankRounds: 7,
      },
    });

    expect(quoteSnapshot.quoteSnapshotId).toBe("session-42:3:7");
    expect(quoteSnapshot.source.remainingChambers).toBe(10);
    expect(quoteSnapshot.quotes.map((quote) => quote.id)).toEqual([
      "player-survives-round",
      "player-dies-this-round",
      "ai-survives-round",
      "ai-dies-this-round",
      "ai-uses-eject",
      "player-shoots-self",
      "player-shoots-opponent",
      "next-shot-live",
      "next-shot-blank",
      "player-ending-hp:1",
      "player-ending-hp:2",
      "player-ending-hp:3",
      "player-ending-hp:4",
      "round-ends-in-turns:1",
      "round-ends-in-turns:2",
      "round-ends-in-turns:3",
      "round-ends-in-turns:4",
      "round-ends-in-turns:5",
      "round-ends-in-turns:6",
      "round-ends-in-turns:7",
      "round-ends-in-turns:8",
      "round-ends-in-turns:9",
      "round-ends-in-turns:10",
      "no-damage-this-round",
      "both-sides-took-damage",
    ]);

    expect(quoteSnapshot.quotes.find((quote) => quote.id === "next-shot-live")).toMatchObject({
      pricingMode: "probability-derived",
      impliedProbability: 0.3,
      payoutMultiplier: 3.17,
    });
    expect(quoteSnapshot.quotes.find((quote) => quote.id === "next-shot-blank")).toMatchObject({
      pricingMode: "probability-derived",
      impliedProbability: 0.7,
      payoutMultiplier: 1.36,
    });
    expect(quoteSnapshot.quotes.find((quote) => quote.id === "player-ending-hp:2")).toMatchObject({
      pricingMode: "provisional-fixed",
      payoutMultiplier: 4,
    });
    expect(quoteSnapshot.quotes.find((quote) => quote.id === "player-ending-hp:0")).toBeUndefined();
    expect(quoteSnapshot.quotes.find((quote) => quote.id === "player-ending-hp:5")).toBeUndefined();
  });
});
