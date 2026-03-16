import { Effect } from "effect";

import {
  DEFAULT_GAME_SESSION_ID,
  ensureGameSession,
  getEconomySnapshot as getEconomySnapshotAsync,
  type EconomySnapshot,
  type OpenBettingWindowInput,
  openBettingWindow as openBettingWindowAsync,
  type PlaceBetInput,
  type PlaceBetResult,
  placeBet as placeBetAsync,
  type SettleRoundBetsInput,
  type SettleRoundBetsResult,
  settleRoundBets as settleRoundBetsAsync,
} from "./betting.js";
import {
  BetAmountTooLowError,
  BetRequestConflictError,
  BettingWindowClosedError,
  BetQuoteNotFoundError,
  GameRuntimeError,
  GameSessionNotFoundError,
  InsufficientAvailableBalanceError,
  ParticipantIneligibleToBetError,
  ParticipantNotFoundError,
} from "./errors.js";
import {
  joinGameSession,
  type JoinGameSessionInput,
} from "./session-join.js";
import type { ParticipantWalletState } from "./wallet.js";

type GameServiceError =
  | BetAmountTooLowError
  | BetRequestConflictError
  | BettingWindowClosedError
  | BetQuoteNotFoundError
  | GameRuntimeError
  | GameSessionNotFoundError
  | InsufficientAvailableBalanceError
  | ParticipantIneligibleToBetError
  | ParticipantNotFoundError;

export class GameService extends Effect.Service<GameService>()("GameService", {
  accessors: true,
  effect: Effect.gen(function* () {
    const ensureSession = Effect.fn("GameService.ensureSession")(function* (
      sessionId = DEFAULT_GAME_SESSION_ID,
    ) {
      return yield* tryGamePromise(() => ensureGameSession(sessionId));
    });

    const joinSession = Effect.fn("GameService.joinSession")(function* (
      input: JoinGameSessionInput,
    ) {
      return yield* tryGamePromise(() => joinGameSession(input));
    });

    const getEconomySnapshot = Effect.fn("GameService.getEconomySnapshot")(function* (input: {
      sessionId: string;
      userId: string | null;
    }) {
      return yield* tryGamePromise(() => getEconomySnapshotAsync(input));
    });

    const placeBet = Effect.fn("GameService.placeBet")(function* (input: PlaceBetInput) {
      return yield* tryGamePromise(() => placeBetAsync(input));
    });

    const openBettingWindow = Effect.fn("GameService.openBettingWindow")(function* (
      input: OpenBettingWindowInput,
    ) {
      return yield* tryGamePromise(() => openBettingWindowAsync(input));
    });

    const settleRoundBets = Effect.fn("GameService.settleRoundBets")(function* (
      input: SettleRoundBetsInput,
    ) {
      return yield* tryGamePromise(() => settleRoundBetsAsync(input));
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

function tryGamePromise<A>(thunk: () => Promise<A>): Effect.Effect<A, GameServiceError> {
  return Effect.tryPromise({
    try: thunk,
    catch: (error) => toGameServiceError(error),
  });
}

function toGameServiceError(error: unknown): GameServiceError {
  if (
    error instanceof BetAmountTooLowError ||
    error instanceof BetRequestConflictError ||
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
