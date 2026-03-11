import type { GameSessionPhase } from "@reaping/redis";

import {
  getExactHpDefinition,
  getProvisionalPlayerEndingHpMultiplier,
  getRoundEndsInTurnsDefinition,
  listActionBetDefinitions,
  listMetaBetDefinitions,
  listNextShotDefinitions,
  listRoundOutcomeDefinitions,
  type BetDefinition,
  type BetQuote,
  type ShotOutcome,
} from "./bet-catalog.js";

const NEXT_SHOT_HOUSE_EDGE_FACTOR = 0.95;

export type BetQuoteSnapshotInput = {
  sessionId: string;
  sessionVersion: number;
  round: number;
  phase: GameSessionPhase;
  playerHp: number;
  aiHp: number;
  magazine: {
    liveRounds: number;
    blankRounds: number;
  };
};

export type BetQuoteSnapshot = {
  quoteSnapshotId: string;
  sessionId: string;
  sessionVersion: number;
  round: number;
  phase: GameSessionPhase;
  source: {
    playerHp: number;
    aiHp: number;
    liveRounds: number;
    blankRounds: number;
    remainingChambers: number;
  };
  quotes: BetQuote[];
};

export function createBetQuoteSnapshot(input: BetQuoteSnapshotInput): BetQuoteSnapshot {
  validateBetQuoteSnapshotInput(input);

  const remainingChambers = input.magazine.liveRounds + input.magazine.blankRounds;
  const quotes =
    input.phase === "betting"
      ? [
          ...listRoundOutcomeDefinitions().map((definition) => createStaticQuote(definition)),
          ...listActionBetDefinitions().map((definition) => createStaticQuote(definition)),
          ...createNextShotQuotes(
            input.magazine.liveRounds,
            input.magazine.blankRounds,
            remainingChambers,
          ),
          ...createExactHpQuotes(input.playerHp, input.magazine.liveRounds),
          ...createRoundEndsInTurnsQuotes(remainingChambers),
          ...listMetaBetDefinitions().map((definition) => createStaticQuote(definition)),
        ]
      : [];

  return {
    quoteSnapshotId: `${input.sessionId}:${input.round}:${input.sessionVersion}`,
    sessionId: input.sessionId,
    sessionVersion: input.sessionVersion,
    round: input.round,
    phase: input.phase,
    source: {
      playerHp: input.playerHp,
      aiHp: input.aiHp,
      liveRounds: input.magazine.liveRounds,
      blankRounds: input.magazine.blankRounds,
      remainingChambers,
    },
    quotes,
  };
}

function createStaticQuote(definition: BetDefinition): BetQuote {
  return {
    id: definition.kind,
    family: definition.family,
    kind: definition.kind,
    name: definition.name,
    description: definition.description,
    pricingMode: definition.pricingMode,
    payoutMultiplier: getRequiredPayoutMultiplier(definition),
    impliedProbability: null,
    target: {
      type: "none",
    },
  };
}

function createNextShotQuotes(
  liveRounds: number,
  blankRounds: number,
  remainingChambers: number,
): BetQuote[] {
  if (remainingChambers === 0) {
    return [];
  }

  const quotes: BetQuote[] = [];

  for (const definition of listNextShotDefinitions()) {
    const outcome: ShotOutcome = definition.kind === "next-shot-live" ? "live" : "blank";
    const numerator = outcome === "live" ? liveRounds : blankRounds;

    if (numerator === 0) {
      continue;
    }

    const rawProbability = numerator / remainingChambers;

    quotes.push({
        id: definition.kind,
        family: definition.family,
        kind: definition.kind,
        name: definition.name,
        description: definition.description,
        pricingMode: definition.pricingMode,
        payoutMultiplier: roundToTwoDecimals((1 / rawProbability) * NEXT_SHOT_HOUSE_EDGE_FACTOR),
        impliedProbability: roundToTwoDecimals(rawProbability),
        target: {
          type: "next-shot",
          outcome,
        },
      });
  }

  return quotes;
}

function createExactHpQuotes(playerHp: number, liveRounds: number): BetQuote[] {
  const definition = getExactHpDefinition();
  const lowestReachableHp = Math.max(1, playerHp - liveRounds);
  const quotes: BetQuote[] = [];

  for (let hp = lowestReachableHp; hp <= playerHp; hp += 1) {
    quotes.push({
      id: `${definition.kind}:${hp}`,
      family: definition.family,
      kind: definition.kind,
      name: `${definition.name} ${hp}`,
      description: definition.description,
      pricingMode: definition.pricingMode,
      payoutMultiplier: getProvisionalPlayerEndingHpMultiplier(hp),
      impliedProbability: null,
      target: {
        type: "player-ending-hp",
        hp,
      },
    });
  }

  return quotes;
}

function createRoundEndsInTurnsQuotes(remainingChambers: number): BetQuote[] {
  const definition = getRoundEndsInTurnsDefinition();
  const quotes: BetQuote[] = [];

  for (let turnCount = 1; turnCount <= remainingChambers; turnCount += 1) {
    quotes.push({
      id: `${definition.kind}:${turnCount}`,
      family: definition.family,
      kind: definition.kind,
      name: `${definition.name} ${turnCount}`,
      description: definition.description,
      pricingMode: definition.pricingMode,
      payoutMultiplier: getRequiredPayoutMultiplier(definition),
      impliedProbability: null,
      target: {
        type: "round-turn-count",
        turnCount,
      },
    });
  }

  return quotes;
}

function getRequiredPayoutMultiplier(definition: BetDefinition): number {
  if (definition.payoutMultiplier === undefined) {
    throw new Error(`bet definition ${definition.kind} is missing a fixed payout multiplier`);
  }

  return definition.payoutMultiplier;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateBetQuoteSnapshotInput(input: BetQuoteSnapshotInput): void {
  if (input.sessionId.length === 0) {
    throw new Error("sessionId is required");
  }

  if (!Number.isInteger(input.sessionVersion) || input.sessionVersion < 1) {
    throw new Error("sessionVersion must be a positive integer");
  }

  if (!Number.isInteger(input.round) || input.round < 1) {
    throw new Error("round must be a positive integer");
  }

  validateNonNegativeInteger("playerHp", input.playerHp);
  validateNonNegativeInteger("aiHp", input.aiHp);
  validateNonNegativeInteger("magazine.liveRounds", input.magazine.liveRounds);
  validateNonNegativeInteger("magazine.blankRounds", input.magazine.blankRounds);

  if (input.magazine.liveRounds + input.magazine.blankRounds === 0) {
    throw new Error("magazine must contain at least one chamber");
  }
}

function validateNonNegativeInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
}
