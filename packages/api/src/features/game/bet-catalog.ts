export type BetFamily =
  | "round-outcome"
  | "action"
  | "next-shot"
  | "exact-hp"
  | "meta";

export type BetKind =
  | "player-survives-round"
  | "player-dies-this-round"
  | "ai-survives-round"
  | "ai-dies-this-round"
  | "ai-uses-eject"
  | "player-shoots-self"
  | "player-shoots-opponent"
  | "next-shot-live"
  | "next-shot-blank"
  | "player-ending-hp"
  | "round-ends-in-turns"
  | "no-damage-this-round"
  | "both-sides-took-damage";

export type BetPricingMode = "fixed" | "probability-derived" | "provisional-fixed";
export type BetVariantType = "none" | "next-shot" | "player-ending-hp" | "round-turn-count";
export type ShotOutcome = "live" | "blank";

export type BetDefinition = {
  family: BetFamily;
  kind: BetKind;
  name: string;
  description: string;
  pricingMode: BetPricingMode;
  variantType: BetVariantType;
  payoutMultiplier?: number;
};

export type BetQuoteTarget =
  | {
      type: "none";
    }
  | {
      type: "next-shot";
      outcome: ShotOutcome;
    }
  | {
      type: "player-ending-hp";
      hp: number;
    }
  | {
      type: "round-turn-count";
      turnCount: number;
    };

export type BetQuote = {
  id: string;
  family: BetFamily;
  kind: BetKind;
  name: string;
  description: string;
  pricingMode: BetPricingMode;
  payoutMultiplier: number;
  impliedProbability: number | null;
  target: BetQuoteTarget;
};

export type RoundSettlementInput = {
  playerSurvivedRound: boolean;
  playerDiedThisRound: boolean;
  aiSurvivedRound: boolean;
  aiDiedThisRound: boolean;
  aiUsedEject: boolean;
  playerShotSelf: boolean;
  playerShotOpponent: boolean;
  nextShotWasLive: boolean;
  nextShotWasBlank: boolean;
  playerEndingHp: number;
  roundTurnCount: number;
  noDamageOccurred: boolean;
  bothSidesTookDamage: boolean;
};

type BetResolver = (quote: BetQuote, outcome: RoundSettlementInput) => boolean;

const ROUND_OUTCOME_DEFINITIONS: readonly BetDefinition[] = [
  {
    family: "round-outcome",
    kind: "player-survives-round",
    name: "Player Survives Round",
    description: "Wins if the player has HP remaining at round end.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 1.5,
  },
  {
    family: "round-outcome",
    kind: "player-dies-this-round",
    name: "Player Dies This Round",
    description: "Wins if the player reaches 0 HP by round end.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 3,
  },
  {
    family: "round-outcome",
    kind: "ai-survives-round",
    name: "AI Survives Round",
    description: "Wins if the AI has HP remaining at round end.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 1.5,
  },
  {
    family: "round-outcome",
    kind: "ai-dies-this-round",
    name: "AI Dies This Round",
    description: "Wins if the AI reaches 0 HP by round end.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 3.5,
  },
];

const ACTION_BET_DEFINITIONS: readonly BetDefinition[] = [
  {
    family: "action",
    kind: "ai-uses-eject",
    name: "AI Uses Eject",
    description: "Wins if the AI ejects the current magazine this round.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 2.5,
  },
  {
    family: "action",
    kind: "player-shoots-self",
    name: "Player Shoots Self",
    description: "Wins if the player targets themself at least once this round.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 1.8,
  },
  {
    family: "action",
    kind: "player-shoots-opponent",
    name: "Player Shoots Opponent",
    description: "Wins if the player targets the AI at least once this round.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 1.3,
  },
];

const NEXT_SHOT_DEFINITIONS: readonly BetDefinition[] = [
  {
    family: "next-shot",
    kind: "next-shot-live",
    name: "Next Shot Is Live",
    description: "Wins if the next fired chamber is live.",
    pricingMode: "probability-derived",
    variantType: "next-shot",
  },
  {
    family: "next-shot",
    kind: "next-shot-blank",
    name: "Next Shot Is Blank",
    description: "Wins if the next fired chamber is blank.",
    pricingMode: "probability-derived",
    variantType: "next-shot",
  },
];

const EXACT_HP_DEFINITION: BetDefinition = {
  family: "exact-hp",
  kind: "player-ending-hp",
  name: "Exact Player HP",
  description: "Wins if the player ends the round on the selected HP value.",
  pricingMode: "provisional-fixed",
  variantType: "player-ending-hp",
};

const META_BET_DEFINITIONS = [
  {
    family: "meta",
    kind: "round-ends-in-turns",
    name: "Round Ends In X Turns",
    description: "Wins if the round resolves in exactly the selected turn count.",
    pricingMode: "fixed",
    variantType: "round-turn-count",
    payoutMultiplier: 3.5,
  },
  {
    family: "meta",
    kind: "no-damage-this-round",
    name: "No Damage This Round",
    description: "Wins if neither side loses HP during the round.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 5,
  },
  {
    family: "meta",
    kind: "both-sides-took-damage",
    name: "Both Take Damage",
    description: "Wins if both the player and AI lose HP this round.",
    pricingMode: "fixed",
    variantType: "none",
    payoutMultiplier: 2.5,
  },
] as const satisfies readonly [BetDefinition, BetDefinition, BetDefinition];

const BET_RESOLVERS: Record<BetKind, BetResolver> = {
  "player-survives-round": (_quote, outcome) => outcome.playerSurvivedRound,
  "player-dies-this-round": (_quote, outcome) => outcome.playerDiedThisRound,
  "ai-survives-round": (_quote, outcome) => outcome.aiSurvivedRound,
  "ai-dies-this-round": (_quote, outcome) => outcome.aiDiedThisRound,
  "ai-uses-eject": (_quote, outcome) => outcome.aiUsedEject,
  "player-shoots-self": (_quote, outcome) => outcome.playerShotSelf,
  "player-shoots-opponent": (_quote, outcome) => outcome.playerShotOpponent,
  "next-shot-live": (_quote, outcome) => outcome.nextShotWasLive,
  "next-shot-blank": (_quote, outcome) => outcome.nextShotWasBlank,
  "player-ending-hp": (quote, outcome) =>
    quote.target.type === "player-ending-hp" && outcome.playerEndingHp === quote.target.hp,
  "round-ends-in-turns": (quote, outcome) =>
    quote.target.type === "round-turn-count" && outcome.roundTurnCount === quote.target.turnCount,
  "no-damage-this-round": (_quote, outcome) => outcome.noDamageOccurred,
  "both-sides-took-damage": (_quote, outcome) => outcome.bothSidesTookDamage,
};

export function listBetDefinitions(): readonly BetDefinition[] {
  return [
    ...ROUND_OUTCOME_DEFINITIONS,
    ...ACTION_BET_DEFINITIONS,
    ...NEXT_SHOT_DEFINITIONS,
    EXACT_HP_DEFINITION,
    ...META_BET_DEFINITIONS,
  ];
}

export function listRoundOutcomeDefinitions(): readonly BetDefinition[] {
  return ROUND_OUTCOME_DEFINITIONS;
}

export function listActionBetDefinitions(): readonly BetDefinition[] {
  return ACTION_BET_DEFINITIONS;
}

export function listNextShotDefinitions(): readonly BetDefinition[] {
  return NEXT_SHOT_DEFINITIONS;
}

export function getExactHpDefinition(): BetDefinition {
  return EXACT_HP_DEFINITION;
}

export function getRoundEndsInTurnsDefinition(): BetDefinition {
  const definition = META_BET_DEFINITIONS[0];

  if (definition === undefined) {
    throw new Error("round-ends-in-turns definition is missing");
  }

  return definition;
}

export function listMetaBetDefinitions(): readonly BetDefinition[] {
  const noDamageDefinition = META_BET_DEFINITIONS[1];
  const bothSidesDefinition = META_BET_DEFINITIONS[2];

  if (noDamageDefinition === undefined || bothSidesDefinition === undefined) {
    throw new Error("meta bet definitions are missing");
  }

  return [noDamageDefinition, bothSidesDefinition];
}

export function getProvisionalPlayerEndingHpMultiplier(endingHp: number): number {
  return Math.max(2, roundToTwoDecimals(5 - endingHp * 0.5));
}

export function resolveBetQuote(quote: BetQuote, outcome: RoundSettlementInput): boolean {
  return BET_RESOLVERS[quote.kind](quote, outcome);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
