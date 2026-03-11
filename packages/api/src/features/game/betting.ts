import {
  type GameSessionStoreClient,
  createGameSession,
  getGameSession,
  updateGameSession,
  type GameSessionEnvelope,
  type JsonObject,
  type JsonValue,
} from "@reaping/redis";

import {
  createBetQuoteSnapshot,
  type BetQuoteSnapshot,
} from "./pricing.js";
import {
  resolveBetQuote,
  type BetQuote,
  type RoundSettlementInput,
} from "./bet-catalog.js";
import {
  BetAmountTooLowError,
  BetRequestConflictError,
  BettingWindowClosedError,
  BetQuoteNotFoundError,
  GameSessionNotFoundError,
  InsufficientAvailableBalanceError,
  ParticipantIneligibleToBetError,
  ParticipantNotFoundError,
} from "./errors.js";
import {
  getParticipantWalletState,
  type ParticipantWalletState,
  upsertParticipantWalletState,
} from "./wallet.js";

const BETTING_WINDOW_DURATION_SECONDS = 10;
const MAX_SESSION_UPDATE_RETRIES = 5;
export const DEFAULT_GAME_SESSION_ID = "main";
export const MINIMUM_BET_AMOUNT = 10;
const defaultGameSessionStore: BettingStore = {
  createGameSession,
  getGameSession,
  updateGameSession,
};

export type BettingWindowState = JsonObject & {
  round: number;
  opensAt: string;
  closesAt: string;
  quoteSnapshotId: string;
  quotes: BetQuote[];
};

export type PlacedBet = JsonObject & {
  requestId: string;
  betId: string;
  userId: string;
  round: number;
  amount: number;
  payoutMultiplier: number;
  quoteSnapshotId: string;
  pricingMode: BetQuote["pricingMode"];
  placedAt: string;
};

export type EconomyEvent = JsonObject & {
  id: string;
  type: string;
  userId: string | null;
  round: number;
  createdAt: string;
  payload: JsonObject;
};

export type EconomySnapshot = {
  sessionId: string;
  sessionVersion: number;
  status: GameSessionEnvelope["status"];
  round: number;
  phase: GameSessionEnvelope["phase"];
  participant: ParticipantWalletState | null;
  bettingWindow: BettingWindowState | null;
  availableQuotes: BetQuote[];
  activeBets: PlacedBet[];
  economyEvents: EconomyEvent[];
};

export type OpenBettingWindowInput = {
  sessionId: string;
  openedAt?: string;
  durationSeconds?: number;
  playerHp: number;
  aiHp: number;
  magazine: {
    liveRounds: number;
    blankRounds: number;
  };
};

export type PlaceBetInput = {
  sessionId: string;
  userId: string;
  requestId: string;
  betId: string;
  amount: number;
  placedAt?: string;
};

export type PlaceBetResult = {
  placedBet: PlacedBet;
  economy: EconomySnapshot;
};

export type SettleRoundBetsInput = {
  sessionId: string;
  settledAt?: string;
  outcome: RoundSettlementInput;
};

export type SettlementSummary = {
  settledBetCount: number;
  winningBetCount: number;
  losingBetCount: number;
};

export type SettleRoundBetsResult = {
  economy: EconomySnapshot;
  summary: SettlementSummary;
};

export async function ensureGameSession(
  sessionId = DEFAULT_GAME_SESSION_ID,
): Promise<GameSessionEnvelope> {
  return createBettingApi(defaultGameSessionStore).ensureGameSession(sessionId);
}

export async function openBettingWindow(
  input: OpenBettingWindowInput,
): Promise<BettingWindowState> {
  return createBettingApi(defaultGameSessionStore).openBettingWindow(input);
}

export async function placeBet(input: PlaceBetInput): Promise<PlaceBetResult> {
  return createBettingApi(defaultGameSessionStore).placeBet(input);
}

export async function settleRoundBets(
  input: SettleRoundBetsInput,
): Promise<SettleRoundBetsResult> {
  return createBettingApi(defaultGameSessionStore).settleRoundBets(input);
}

export async function getEconomySnapshot(input: {
  sessionId: string;
  userId: string | null;
}): Promise<EconomySnapshot> {
  return createBettingApi(defaultGameSessionStore).getEconomySnapshot(input);
}

type BettingStore = Pick<
  GameSessionStoreClient,
  "createGameSession" | "getGameSession" | "updateGameSession"
>;

export function createBettingApi(store: BettingStore) {
  return {
    ensureGameSession: async (
      sessionId = DEFAULT_GAME_SESSION_ID,
    ): Promise<GameSessionEnvelope> => {
      const existing = await store.getGameSession(sessionId);

      if (existing !== null) {
        return existing;
      }

      try {
        return await store.createGameSession(createEmptyGameSession(sessionId));
      } catch (error) {
        const raced = await store.getGameSession(sessionId);

        if (raced !== null) {
          return raced;
        }

        throw error;
      }
    },
    openBettingWindow: async (input: OpenBettingWindowInput): Promise<BettingWindowState> => {
      const openedAt = input.openedAt ?? new Date().toISOString();
      const durationSeconds = input.durationSeconds ?? BETTING_WINDOW_DURATION_SECONDS;

      const envelope = await updateEnvelopeWithRetries(store, input.sessionId, (current) => {
        const quoteSnapshot = createBetQuoteSnapshot({
          sessionId: current.sessionId,
          sessionVersion: current.version,
          round: current.round,
          phase: "betting",
          playerHp: input.playerHp,
          aiHp: input.aiHp,
          magazine: input.magazine,
        });
        const bettingWindow = createBettingWindowState({
          round: current.round,
          openedAt,
          durationSeconds,
          quoteSnapshot,
        });

        return {
          ...current,
          status: "in-progress",
          phase: "betting",
          bettingWindow,
          version: current.version + 1,
          economyEvents: [
            ...current.economyEvents,
            createEconomyEvent({
              createdAt: openedAt,
              round: current.round,
              type: "betting-window-opened",
              userId: null,
              payload: {
                quoteSnapshotId: bettingWindow.quoteSnapshotId,
                closesAt: bettingWindow.closesAt,
              },
            }),
          ],
        };
      });

      return getRequiredBettingWindow(envelope);
    },
    placeBet: async (input: PlaceBetInput): Promise<PlaceBetResult> => {
      const placedAt = input.placedAt ?? new Date().toISOString();
      let persistedBet: PlacedBet | null = null;

      const envelope = await updateEnvelopeWithRetries(store, input.sessionId, (current) => {
        const participant = getRequiredParticipant(current, input.userId);
        const existingPlacedBet = findPlacedBetByRequestId(
          current.activeBets,
          input.userId,
          input.requestId,
        );

        if (existingPlacedBet !== null) {
          if (
            existingPlacedBet.betId !== input.betId ||
            existingPlacedBet.amount !== input.amount
          ) {
            throw new BetRequestConflictError({
              requestId: input.requestId,
              existingBetId: existingPlacedBet.betId,
              requestedBetId: input.betId,
              existingAmount: existingPlacedBet.amount,
              requestedAmount: input.amount,
              message: `Request "${input.requestId}" was already used for a different bet payload`,
            });
          }

          persistedBet = existingPlacedBet;
          return current;
        }

        const bettingWindow = getRequiredOpenBettingWindow(current, placedAt);
        assertParticipantEligibility(participant, current, input.userId);
        assertBetAmount(participant, input.userId, input.amount);

        const quote = findQuote(bettingWindow, input.betId);

        if (quote === null) {
          throw new BetQuoteNotFoundError({
            betId: input.betId,
            round: current.round,
            message: `No active quote found for bet "${input.betId}"`,
          });
        }

        const placedBet = createPlacedBet({
          amount: input.amount,
          placedAt,
          quote,
          quoteSnapshotId: bettingWindow.quoteSnapshotId,
          requestId: input.requestId,
          round: current.round,
          userId: input.userId,
        });
        const nextParticipant = {
          ...participant,
          lockedFunds: participant.lockedFunds + input.amount,
        };

        persistedBet = placedBet;

        return {
          ...upsertParticipantWalletState(current, nextParticipant),
          activeBets: [...current.activeBets, placedBet],
          economyEvents: [
            ...current.economyEvents,
            createEconomyEvent({
              createdAt: placedAt,
              round: current.round,
              type: "bet-placed",
              userId: input.userId,
              payload: {
                requestId: input.requestId,
                betId: input.betId,
                amount: input.amount,
                quoteSnapshotId: bettingWindow.quoteSnapshotId,
              },
            }),
          ],
          version: current.version + 1,
        };
      });

      if (persistedBet === null) {
        throw new Error("placed bet was not persisted");
      }

      return {
        placedBet: persistedBet,
        economy: buildEconomySnapshot(envelope, input.userId),
      };
    },
    settleRoundBets: async (input: SettleRoundBetsInput): Promise<SettleRoundBetsResult> => {
      const settledAt = input.settledAt ?? new Date().toISOString();
      let summary: SettlementSummary = {
        settledBetCount: 0,
        winningBetCount: 0,
        losingBetCount: 0,
      };

      const current = await getRequiredSession(store, input.sessionId);

      if (current.activeBets.length === 0) {
        return {
          economy: buildEconomySnapshot(current, null),
          summary,
        };
      }

      const envelope = await updateEnvelopeWithRetries(store, input.sessionId, (session) => {
        const activeBets = parsePlacedBets(session.activeBets);

        if (activeBets.length === 0) {
          return session;
        }

        const participantMap = new Map<string, ParticipantWalletState>();

        for (const participantValue of session.participants) {
          const participant = getParticipantWalletState(
            {
              ...session,
              participants: [participantValue],
            },
            String(participantValue.userId ?? ""),
          );

          if (participant !== null) {
            participantMap.set(participant.userId, participant);
          }
        }

        const nextEvents = [...session.economyEvents];

        for (const placedBet of activeBets) {
          const participant = participantMap.get(placedBet.userId);

          if (participant === undefined) {
            continue;
          }

          participant.lockedFunds -= placedBet.amount;

          if (resolveBetQuote(getQuoteForSettlement(placedBet), input.outcome)) {
            participant.walletBalance += roundToTwoDecimals(
              placedBet.amount * (placedBet.payoutMultiplier - 1),
            );
            summary.winningBetCount += 1;
            nextEvents.push(
              createEconomyEvent({
                createdAt: settledAt,
                round: placedBet.round,
                type: "bet-won",
                userId: placedBet.userId,
                payload: {
                  requestId: placedBet.requestId,
                  betId: placedBet.betId,
                  amount: placedBet.amount,
                  payoutMultiplier: placedBet.payoutMultiplier,
                },
              }),
            );
          } else {
            participant.walletBalance -= placedBet.amount;
            summary.losingBetCount += 1;
            nextEvents.push(
              createEconomyEvent({
                createdAt: settledAt,
                round: placedBet.round,
                type: "bet-lost",
                userId: placedBet.userId,
                payload: {
                  requestId: placedBet.requestId,
                  betId: placedBet.betId,
                  amount: placedBet.amount,
                },
              }),
            );
          }

          participantMap.set(placedBet.userId, participant);
        }

        summary.settledBetCount = activeBets.length;

        const nextParticipants = session.participants.map((participantValue) => {
          const userId = typeof participantValue.userId === "string" ? participantValue.userId : null;

          if (userId === null) {
            return participantValue;
          }

          const participant = participantMap.get(userId);

          return participant === undefined ? participantValue : participant;
        });

        nextEvents.push(
          createEconomyEvent({
            createdAt: settledAt,
            round: session.round,
            type: "round-settled",
            userId: null,
            payload: {
              settledBetCount: summary.settledBetCount,
              winningBetCount: summary.winningBetCount,
              losingBetCount: summary.losingBetCount,
            },
          }),
        );

        return {
          ...session,
          participants: nextParticipants,
          activeBets: [],
          bettingWindow: null,
          phase: session.status === "ended" ? "ended" : "resolution",
          economyEvents: nextEvents,
          version: session.version + 1,
        };
      });

      return {
        economy: buildEconomySnapshot(envelope, null),
        summary,
      };
    },
    getEconomySnapshot: async (input: {
      sessionId: string;
      userId: string | null;
    }): Promise<EconomySnapshot> => {
      const envelope = await getRequiredSession(store, input.sessionId);

      return buildEconomySnapshot(envelope, input.userId);
    },
  };
}

function buildEconomySnapshot(
  envelope: GameSessionEnvelope,
  userId: string | null,
): EconomySnapshot {
  const bettingWindow = parseBettingWindowState(envelope.bettingWindow);
  const activeBets = parsePlacedBets(envelope.activeBets);
  const economyEvents = parseEconomyEvents(envelope.economyEvents);

  return {
    sessionId: envelope.sessionId,
    sessionVersion: envelope.version,
    status: envelope.status,
    round: envelope.round,
    phase: envelope.phase,
    participant: userId === null ? null : getParticipantWalletState(envelope, userId),
    bettingWindow,
    availableQuotes: bettingWindow?.quotes ?? [],
    activeBets: userId === null ? activeBets : activeBets.filter((bet) => bet.userId === userId),
    economyEvents,
  };
}

function createEmptyGameSession(sessionId: string): GameSessionEnvelope {
  return {
    sessionId,
    status: "waiting",
    version: 1,
    round: 1,
    participants: [],
    bettingWindow: null,
    activeBets: [],
    economyEvents: [],
    phase: "idle",
    activePlayer: null,
    ai: null,
    magazine: null,
    turn: null,
    roundHistory: [],
  };
}

async function updateEnvelopeWithRetries(
  store: BettingStore,
  sessionId: string,
  transform: (current: GameSessionEnvelope) => GameSessionEnvelope,
): Promise<GameSessionEnvelope> {
  for (let attempt = 0; attempt < MAX_SESSION_UPDATE_RETRIES; attempt += 1) {
    const current = await getRequiredSession(store, sessionId);

    try {
      const next = transform(current);

      if (next.version === current.version) {
        return current;
      }

      return await store.updateGameSession({
        sessionId,
        expectedVersion: current.version,
        update: () => next,
      });
    } catch (error) {
      if (isVersionMismatch(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(`failed to update game session "${sessionId}" after retrying version conflicts`);
}

async function getRequiredSession(store: BettingStore, sessionId: string): Promise<GameSessionEnvelope> {
  const envelope = await store.getGameSession(sessionId);

  if (envelope === null) {
    throw new GameSessionNotFoundError({
      sessionId,
      message: `No game session found for "${sessionId}"`,
    });
  }

  return envelope;
}

function isVersionMismatch(error: unknown): boolean {
  return error instanceof Error && error.message === "version mismatch";
}

function getRequiredParticipant(
  envelope: GameSessionEnvelope,
  userId: string,
): ParticipantWalletState {
  const participant = getParticipantWalletState(envelope, userId);

  if (participant === null) {
    throw new ParticipantNotFoundError({
      sessionId: envelope.sessionId,
      userId,
      message: `No participant wallet found for "${userId}"`,
    });
  }

  return participant;
}

function assertParticipantEligibility(
  participant: ParticipantWalletState,
  envelope: GameSessionEnvelope,
  userId: string,
): void {
  if (participant.isDead || participant.isExited || participant.eligibleFromRound > envelope.round) {
    throw new ParticipantIneligibleToBetError({
      sessionId: envelope.sessionId,
      userId,
      round: envelope.round,
      eligibleFromRound: participant.eligibleFromRound,
      message: `Participant "${userId}" cannot bet in round ${envelope.round}`,
    });
  }
}

function assertBetAmount(
  participant: ParticipantWalletState,
  userId: string,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < MINIMUM_BET_AMOUNT) {
    throw new BetAmountTooLowError({
      amount,
      minimumAmount: MINIMUM_BET_AMOUNT,
      message: `Bet amount must be at least ${MINIMUM_BET_AMOUNT}`,
    });
  }

  if (amount > participant.availableBalance) {
    throw new InsufficientAvailableBalanceError({
      userId,
      amount,
      availableBalance: participant.availableBalance,
      message: `Bet amount ${amount} exceeds available balance ${participant.availableBalance}`,
    });
  }
}

function getRequiredOpenBettingWindow(
  envelope: GameSessionEnvelope,
  nowIso: string,
): BettingWindowState {
  const bettingWindow = parseBettingWindowState(envelope.bettingWindow);

  if (
    bettingWindow === null ||
    envelope.phase !== "betting" ||
    Date.parse(nowIso) >= Date.parse(bettingWindow.closesAt)
  ) {
    throw new BettingWindowClosedError({
      sessionId: envelope.sessionId,
      round: envelope.round,
      message: `Betting is closed for round ${envelope.round}`,
    });
  }

  return bettingWindow;
}

function getRequiredBettingWindow(envelope: GameSessionEnvelope): BettingWindowState {
  const bettingWindow = parseBettingWindowState(envelope.bettingWindow);

  if (bettingWindow === null) {
    throw new BettingWindowClosedError({
      sessionId: envelope.sessionId,
      round: envelope.round,
      message: `Betting is closed for round ${envelope.round}`,
    });
  }

  return bettingWindow;
}

function findQuote(bettingWindow: BettingWindowState, betId: string): BetQuote | null {
  return bettingWindow.quotes.find((quote) => quote.id === betId) ?? null;
}

function createBettingWindowState(input: {
  round: number;
  openedAt: string;
  durationSeconds: number;
  quoteSnapshot: BetQuoteSnapshot;
}): BettingWindowState {
  const closesAt = new Date(
    Date.parse(input.openedAt) + input.durationSeconds * 1000,
  ).toISOString();

  return {
    round: input.round,
    opensAt: input.openedAt,
    closesAt,
    quoteSnapshotId: input.quoteSnapshot.quoteSnapshotId,
    quotes: input.quoteSnapshot.quotes,
  };
}

function createPlacedBet(input: {
  requestId: string;
  userId: string;
  round: number;
  amount: number;
  placedAt: string;
  quote: BetQuote;
  quoteSnapshotId: string;
}): PlacedBet {
  return {
    requestId: input.requestId,
    betId: input.quote.id,
    userId: input.userId,
    round: input.round,
    amount: input.amount,
    payoutMultiplier: input.quote.payoutMultiplier,
    quoteSnapshotId: input.quoteSnapshotId,
    pricingMode: input.quote.pricingMode,
    placedAt: input.placedAt,
  };
}

function findPlacedBetByRequestId(
  activeBets: JsonObject[],
  userId: string,
  requestId: string,
): PlacedBet | null {
  return (
    parsePlacedBets(activeBets).find(
      (placedBet) => placedBet.userId === userId && placedBet.requestId === requestId,
    ) ?? null
  );
}

function parseBettingWindowState(value: JsonObject | null): BettingWindowState | null {
  if (value === null) {
    return null;
  }

  const round = getInteger(value.round);
  const opensAt = getString(value.opensAt);
  const closesAt = getString(value.closesAt);
  const quoteSnapshotId = getString(value.quoteSnapshotId);
  const quotes = Array.isArray(value.quotes) ? value.quotes.filter(isJsonObject) : null;

  if (
    round === null ||
    opensAt === null ||
    closesAt === null ||
    quoteSnapshotId === null ||
    quotes === null
  ) {
    return null;
  }

  return {
    ...value,
    round,
    opensAt,
    closesAt,
    quoteSnapshotId,
    quotes: quotes as BetQuote[],
  };
}

function parsePlacedBets(values: JsonObject[]): PlacedBet[] {
  const placedBets: PlacedBet[] = [];

  for (const value of values) {
    const requestId = getString(value.requestId);
    const betId = getString(value.betId);
    const userId = getString(value.userId);
    const round = getInteger(value.round);
    const amount = getInteger(value.amount);
    const payoutMultiplier = getNumber(value.payoutMultiplier);
    const quoteSnapshotId = getString(value.quoteSnapshotId);
    const placedAt = getString(value.placedAt);
    const pricingMode = getPricingMode(value.pricingMode);

    if (
      requestId === null ||
      betId === null ||
      userId === null ||
      round === null ||
      amount === null ||
      payoutMultiplier === null ||
      quoteSnapshotId === null ||
      placedAt === null ||
      pricingMode === null
    ) {
      continue;
    }

    placedBets.push({
      ...value,
      requestId,
      betId,
      userId,
      round,
      amount,
      payoutMultiplier,
      quoteSnapshotId,
      pricingMode,
      placedAt,
    });
  }

  return placedBets;
}

function parseEconomyEvents(values: JsonObject[]): EconomyEvent[] {
  const events: EconomyEvent[] = [];

  for (const value of values) {
    const id = getString(value.id);
    const type = getString(value.type);
    const round = getInteger(value.round);
    const createdAt = getString(value.createdAt);
    const userIdValue = value.userId;
    const payload = isJsonObject(value.payload) ? value.payload : null;

    if (
      id === null ||
      type === null ||
      round === null ||
      createdAt === null ||
      payload === null ||
      (userIdValue !== null && typeof userIdValue !== "string")
    ) {
      continue;
    }

    events.push({
      ...value,
      id,
      type,
      round,
      createdAt,
      userId: userIdValue,
      payload,
    });
  }

  return events;
}

function createEconomyEvent(input: {
  type: string;
  userId: string | null;
  round: number;
  createdAt: string;
  payload: JsonObject;
}): EconomyEvent {
  return {
    id: `${input.type}:${input.round}:${input.createdAt}:${input.userId ?? "system"}`,
    type: input.type,
    userId: input.userId,
    round: input.round,
    createdAt: input.createdAt,
    payload: input.payload,
  };
}

function getQuoteForSettlement(placedBet: PlacedBet): BetQuote {
  if (placedBet.betId.startsWith("player-ending-hp:")) {
    const hp = Number(placedBet.betId.split(":")[1]);

    return {
      id: placedBet.betId,
      family: "exact-hp",
      kind: "player-ending-hp",
      name: `Exact Player HP ${hp}`,
      description: "Wins if the player ends the round on the selected HP value.",
      pricingMode: placedBet.pricingMode,
      payoutMultiplier: placedBet.payoutMultiplier,
      impliedProbability: null,
      target: {
        type: "player-ending-hp",
        hp,
      },
    };
  }

  if (placedBet.betId.startsWith("round-ends-in-turns:")) {
    const turnCount = Number(placedBet.betId.split(":")[1]);

    return {
      id: placedBet.betId,
      family: "meta",
      kind: "round-ends-in-turns",
      name: `Round Ends In ${turnCount} Turns`,
      description: "Wins if the round resolves in exactly the selected turn count.",
      pricingMode: placedBet.pricingMode,
      payoutMultiplier: placedBet.payoutMultiplier,
      impliedProbability: null,
      target: {
        type: "round-turn-count",
        turnCount,
      },
    };
  }

  if (placedBet.betId === "next-shot-live" || placedBet.betId === "next-shot-blank") {
    const outcome = placedBet.betId === "next-shot-live" ? "live" : "blank";

    return {
      id: placedBet.betId,
      family: "next-shot",
      kind: placedBet.betId,
      name: outcome === "live" ? "Next Shot Is Live" : "Next Shot Is Blank",
      description:
        outcome === "live"
          ? "Wins if the next fired chamber is live."
          : "Wins if the next fired chamber is blank.",
      pricingMode: placedBet.pricingMode,
      payoutMultiplier: placedBet.payoutMultiplier,
      impliedProbability: null,
      target: {
        type: "next-shot",
        outcome,
      },
    };
  }

  return {
    id: placedBet.betId,
    family: getStaticBetFamily(placedBet.betId),
    kind: getStaticBetKind(placedBet.betId),
    name: placedBet.betId,
    description: placedBet.betId,
    pricingMode: placedBet.pricingMode,
    payoutMultiplier: placedBet.payoutMultiplier,
    impliedProbability: null,
    target: {
      type: "none",
    },
  };
}

function getStaticBetFamily(betId: string): BetQuote["family"] {
  switch (betId) {
    case "player-survives-round":
    case "player-dies-this-round":
    case "ai-survives-round":
    case "ai-dies-this-round":
      return "round-outcome";
    case "ai-uses-eject":
    case "player-shoots-self":
    case "player-shoots-opponent":
      return "action";
    case "no-damage-this-round":
    case "both-sides-took-damage":
      return "meta";
    default:
      return "meta";
  }
}

function getStaticBetKind(betId: string): BetQuote["kind"] {
  switch (betId) {
    case "player-survives-round":
    case "player-dies-this-round":
    case "ai-survives-round":
    case "ai-dies-this-round":
    case "ai-uses-eject":
    case "player-shoots-self":
    case "player-shoots-opponent":
    case "no-damage-this-round":
    case "both-sides-took-damage":
      return betId;
    default:
      return "no-damage-this-round";
  }
}

function getString(value: JsonValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function getInteger(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function getNumber(value: JsonValue | undefined): number | null {
  return typeof value === "number" ? value : null;
}

function getPricingMode(value: JsonValue | undefined): BetQuote["pricingMode"] | null {
  return value === "fixed" || value === "probability-derived" || value === "provisional-fixed"
    ? value
    : null;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
