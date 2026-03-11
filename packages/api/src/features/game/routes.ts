import { Effect } from "effect";
import { Elysia, status, t } from "elysia";

import { resolveAuthUserFromRequest } from "../../modules/http/auth-plugin.js";
import { AppRuntime } from "../../runtime.js";
import { DEFAULT_GAME_SESSION_ID } from "./betting.js";
import {
  BetAmountTooLowError,
  BetQuoteNotFoundError,
  BettingWindowClosedError,
  GameRuntimeError,
  GameSessionNotFoundError,
  InsufficientAvailableBalanceError,
  ParticipantIneligibleToBetError,
  ParticipantNotFoundError,
} from "./errors.js";
import { GameService } from "./service.js";

const walletSchema = t.Object({
  userId: t.String(),
  role: t.Literal("spectator"),
  walletBalance: t.Number(),
  lockedFunds: t.Number(),
  availableBalance: t.Number(),
  joinedAt: t.String(),
  eligibleFromRound: t.Number(),
  isDead: t.Boolean(),
  isExited: t.Boolean(),
});

const betQuoteTargetSchema = t.Union([
  t.Object({
    type: t.Literal("none"),
  }),
  t.Object({
    type: t.Literal("next-shot"),
    outcome: t.Union([t.Literal("live"), t.Literal("blank")]),
  }),
  t.Object({
    type: t.Literal("player-ending-hp"),
    hp: t.Number(),
  }),
  t.Object({
    type: t.Literal("round-turn-count"),
    turnCount: t.Number(),
  }),
]);

const betQuoteSchema = t.Object({
  id: t.String(),
  family: t.String(),
  kind: t.String(),
  name: t.String(),
  description: t.String(),
  pricingMode: t.String(),
  payoutMultiplier: t.Number(),
  impliedProbability: t.Nullable(t.Number()),
  target: betQuoteTargetSchema,
});

const placedBetSchema = t.Object({
  requestId: t.String(),
  betId: t.String(),
  userId: t.String(),
  round: t.Number(),
  amount: t.Number(),
  payoutMultiplier: t.Number(),
  quoteSnapshotId: t.String(),
  pricingMode: t.String(),
  placedAt: t.String(),
});

const economyEventSchema = t.Object({
  id: t.String(),
  type: t.String(),
  userId: t.Nullable(t.String()),
  round: t.Number(),
  createdAt: t.String(),
  payload: t.Record(t.String(), t.Unknown()),
});

const bettingWindowSchema = t.Nullable(
  t.Object({
    round: t.Number(),
    opensAt: t.String(),
    closesAt: t.String(),
    quoteSnapshotId: t.String(),
    quotes: t.Array(betQuoteSchema),
  }),
);

const economySnapshotSchema = t.Object({
  sessionId: t.String(),
  sessionVersion: t.Number(),
  status: t.String(),
  round: t.Number(),
  phase: t.String(),
  participant: t.Nullable(walletSchema),
  bettingWindow: bettingWindowSchema,
  availableQuotes: t.Array(betQuoteSchema),
  activeBets: t.Array(placedBetSchema),
  economyEvents: t.Array(economyEventSchema),
});

const unauthorizedSchema = t.Object({
  _tag: t.Literal("Unauthorized"),
  message: t.String(),
});

const notFoundSchema = t.Object({
  _tag: t.String(),
  message: t.String(),
});

const betValidationSchema = t.Object({
  _tag: t.String(),
  message: t.String(),
});

const runtimeErrorSchema = t.Object({
  _tag: t.Literal("GameRuntimeError"),
  message: t.String(),
});

export const gameRoutes = new Elysia({ prefix: "/api/game" })
  .post(
    "/session/join",
    async ({ request }) => {
      const authUser = await resolveAuthUserFromRequest(request);

      if (authUser === null) {
        return status(401, {
          _tag: "Unauthorized",
          message: "Authentication required",
        });
      }

      const result = await runGameEffect(
        Effect.gen(function* () {
          yield* GameService.ensureSession(DEFAULT_GAME_SESSION_ID);
          yield* GameService.joinSession({
            sessionId: DEFAULT_GAME_SESSION_ID,
            userId: authUser.id,
          });

          return yield* GameService.getEconomySnapshot({
            sessionId: DEFAULT_GAME_SESSION_ID,
            userId: authUser.id,
          });
        }),
      );

      if (result._tag === "Left") {
        return mapGameError(result.left);
      }

      return result.right;
    },
    {
      response: {
        200: economySnapshotSchema,
        400: betValidationSchema,
        401: unauthorizedSchema,
        404: notFoundSchema,
        409: betValidationSchema,
        500: runtimeErrorSchema,
      },
    },
  )
  .get(
    "/economy",
    async ({ request }) => {
      const authUser = await resolveAuthUserFromRequest(request);

      if (authUser === null) {
        return status(401, {
          _tag: "Unauthorized",
          message: "Authentication required",
        });
      }

      const result = await runGameEffect(
        Effect.gen(function* () {
          yield* GameService.ensureSession(DEFAULT_GAME_SESSION_ID);

          return yield* GameService.getEconomySnapshot({
            sessionId: DEFAULT_GAME_SESSION_ID,
            userId: authUser.id,
          });
        }),
      );

      if (result._tag === "Left") {
        return mapGameError(result.left);
      }

      const economy = result.right;

      if (economy.participant === null) {
        return status(404, {
          _tag: "ParticipantNotFound",
          message: `No participant wallet found for "${authUser.id}"`,
        });
      }

      return economy;
    },
    {
      response: {
        200: economySnapshotSchema,
        400: betValidationSchema,
        401: unauthorizedSchema,
        404: notFoundSchema,
        409: betValidationSchema,
        500: runtimeErrorSchema,
      },
    },
  )
  .post(
    "/bets",
    async ({ body, request }) => {
      const authUser = await resolveAuthUserFromRequest(request);

      if (authUser === null) {
        return status(401, {
          _tag: "Unauthorized",
          message: "Authentication required",
        });
      }

      const result = await runGameEffect(
        GameService.placeBet({
          sessionId: DEFAULT_GAME_SESSION_ID,
          userId: authUser.id,
          requestId: body.requestId,
          betId: body.betId,
          amount: body.amount,
        }),
      );

      if (result._tag === "Left") {
        return mapGameError(result.left);
      }

      return result.right.economy;
    },
    {
      body: t.Object({
        requestId: t.String(),
        betId: t.String(),
        amount: t.Number(),
      }),
      response: {
        200: economySnapshotSchema,
        400: betValidationSchema,
        401: unauthorizedSchema,
        404: notFoundSchema,
        409: betValidationSchema,
        500: runtimeErrorSchema,
      },
    },
  );

function mapGameError(
  error:
    | BetAmountTooLowError
    | BettingWindowClosedError
    | BetQuoteNotFoundError
    | GameRuntimeError
    | GameSessionNotFoundError
    | InsufficientAvailableBalanceError
    | ParticipantIneligibleToBetError
    | ParticipantNotFoundError,
) {
  if (
    error instanceof BetAmountTooLowError ||
    error instanceof BetQuoteNotFoundError
  ) {
    return status(400, {
      _tag: error._tag,
      message: error.message,
    });
  }

  if (
    error instanceof BettingWindowClosedError ||
    error instanceof InsufficientAvailableBalanceError ||
    error instanceof ParticipantIneligibleToBetError
  ) {
    return status(409, {
      _tag: error._tag,
      message: error.message,
    });
  }

  if (error instanceof GameSessionNotFoundError || error instanceof ParticipantNotFoundError) {
    return status(404, {
      _tag: error._tag,
      message: error.message,
    });
  }

  if (error instanceof GameRuntimeError) {
    return status(500, {
      _tag: error._tag,
      message: error.message,
    });
  }

  throw error;
}

function runGameEffect<A, E>(
  effect: Effect.Effect<A, E, GameService>,
) {
  return Effect.runPromise(
    effect.pipe(
      Effect.either,
      Effect.provide(AppRuntime),
    ),
  );
}
