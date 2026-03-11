import { Effect } from "effect";
import { GameSessionStore, type GameSessionStoreClient } from "@reaping/redis";

import {
  DEFAULT_GAME_SESSION_ID,
  createBettingApi,
  type EconomySnapshot,
  type OpenBettingWindowInput,
  type PlaceBetInput,
  type PlaceBetResult,
  type SettleRoundBetsInput,
  type SettleRoundBetsResult,
} from "./betting.js";
import {
  BetAmountTooLowError,
  BettingWindowClosedError,
  BetQuoteNotFoundError,
  GameRuntimeError,
  GameSessionNotFoundError,
  InsufficientAvailableBalanceError,
  ParticipantIneligibleToBetError,
  ParticipantNotFoundError,
} from "./errors.js";
import {
  createSessionJoinApi,
  type JoinGameSessionInput,
} from "./session-join.js";
import type { ParticipantWalletState } from "./wallet.js";

type GameServiceError =
  | BetAmountTooLowError
  | BettingWindowClosedError
  | BetQuoteNotFoundError
  | GameRuntimeError
  | GameSessionNotFoundError
  | InsufficientAvailableBalanceError
  | ParticipantIneligibleToBetError
  | ParticipantNotFoundError;

export class GameService extends Effect.Service<GameService>()("GameService", {
  accessors: true,
  dependencies: [GameSessionStore.Default],
  effect: Effect.gen(function* () {
    const gameSessionStore = yield* GameSessionStore;
    const sessionStoreClient = createSessionStoreClient(gameSessionStore);
    const bettingApi = createBettingApi(sessionStoreClient);
    const sessionJoinApi = createSessionJoinApi(sessionStoreClient);

    const ensureSession = Effect.fn("GameService.ensureSession")(function* (
      sessionId = DEFAULT_GAME_SESSION_ID,
    ) {
      return yield* tryGamePromise(() => bettingApi.ensureGameSession(sessionId));
    });

    const joinSession = Effect.fn("GameService.joinSession")(function* (
      input: JoinGameSessionInput,
    ) {
      return yield* tryGamePromise(() => sessionJoinApi.joinGameSession(input));
    });

    const getEconomySnapshot = Effect.fn("GameService.getEconomySnapshot")(function* (input: {
      sessionId: string;
      userId: string | null;
    }) {
      return yield* tryGamePromise(() => bettingApi.getEconomySnapshot(input));
    });

    const placeBet = Effect.fn("GameService.placeBet")(function* (input: PlaceBetInput) {
      return yield* tryGamePromise(() => bettingApi.placeBet(input));
    });

    const openBettingWindow = Effect.fn("GameService.openBettingWindow")(function* (
      input: OpenBettingWindowInput,
    ) {
      return yield* tryGamePromise(() => bettingApi.openBettingWindow(input));
    });

    const settleRoundBets = Effect.fn("GameService.settleRoundBets")(function* (
      input: SettleRoundBetsInput,
    ) {
      return yield* tryGamePromise(() => bettingApi.settleRoundBets(input));
    });

    return {
      ensureSession,
      getEconomySnapshot,
      joinSession,
      openBettingWindow,
      placeBet,
      settleRoundBets,
    } satisfies {
      ensureSession: (
        sessionId?: string,
      ) => Effect.Effect<unknown, GameServiceError>;
      getEconomySnapshot: (input: {
        sessionId: string;
        userId: string | null;
      }) => Effect.Effect<EconomySnapshot, GameServiceError>;
      joinSession: (
        input: JoinGameSessionInput,
      ) => Effect.Effect<ParticipantWalletState, GameServiceError>;
      openBettingWindow: (
        input: OpenBettingWindowInput,
      ) => Effect.Effect<unknown, GameServiceError>;
      placeBet: (input: PlaceBetInput) => Effect.Effect<PlaceBetResult, GameServiceError>;
      settleRoundBets: (
        input: SettleRoundBetsInput,
      ) => Effect.Effect<SettleRoundBetsResult, GameServiceError>;
    };
  }),
}) {}

function createSessionStoreClient(gameSessionStore: GameSessionStore): GameSessionStoreClient {
  return {
    getGameSession: (sessionId) => Effect.runPromise(gameSessionStore.getGameSession(sessionId)),
    createGameSession: (envelope) =>
      Effect.runPromise(gameSessionStore.createGameSession(envelope)),
    updateGameSession: (input) =>
      Effect.runPromise(gameSessionStore.updateGameSession(input)),
    resetGameSessionsForTests: () =>
      Effect.runPromise(gameSessionStore.resetGameSessionsForTests()),
  };
}

function tryGamePromise<A>(thunk: () => Promise<A>): Effect.Effect<A, GameServiceError> {
  return Effect.tryPromise({
    try: thunk,
    catch: toGameServiceError,
  });
}

function toGameServiceError(error: unknown): GameServiceError {
  if (
    error instanceof BetAmountTooLowError ||
    error instanceof BettingWindowClosedError ||
    error instanceof BetQuoteNotFoundError ||
    error instanceof GameSessionNotFoundError ||
    error instanceof InsufficientAvailableBalanceError ||
    error instanceof ParticipantIneligibleToBetError ||
    error instanceof ParticipantNotFoundError
  ) {
    return error;
  }

  return new GameRuntimeError({
    message: error instanceof Error ? error.message : "Unhandled game service error",
  });
}
