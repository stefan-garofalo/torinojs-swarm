import { Schema } from "effect";

export class GameSessionNotFoundError extends Schema.TaggedError<GameSessionNotFoundError>()(
  "GameSessionNotFound",
  {
    sessionId: Schema.String,
    message: Schema.String,
  },
) {}

export class ParticipantNotFoundError extends Schema.TaggedError<ParticipantNotFoundError>()(
  "ParticipantNotFound",
  {
    sessionId: Schema.String,
    userId: Schema.String,
    message: Schema.String,
  },
) {}

export class ParticipantIneligibleToBetError extends Schema.TaggedError<ParticipantIneligibleToBetError>()(
  "ParticipantIneligibleToBet",
  {
    sessionId: Schema.String,
    userId: Schema.String,
    round: Schema.Number,
    eligibleFromRound: Schema.Number,
    message: Schema.String,
  },
) {}

export class BettingWindowClosedError extends Schema.TaggedError<BettingWindowClosedError>()(
  "BettingWindowClosed",
  {
    sessionId: Schema.String,
    round: Schema.Number,
    message: Schema.String,
  },
) {}

export class BetAmountTooLowError extends Schema.TaggedError<BetAmountTooLowError>()(
  "BetAmountTooLow",
  {
    amount: Schema.Number,
    minimumAmount: Schema.Number,
    message: Schema.String,
  },
) {}

export class InsufficientAvailableBalanceError extends Schema.TaggedError<InsufficientAvailableBalanceError>()(
  "InsufficientAvailableBalance",
  {
    userId: Schema.String,
    amount: Schema.Number,
    availableBalance: Schema.Number,
    message: Schema.String,
  },
) {}

export class BetQuoteNotFoundError extends Schema.TaggedError<BetQuoteNotFoundError>()(
  "BetQuoteNotFound",
  {
    betId: Schema.String,
    round: Schema.Number,
    message: Schema.String,
  },
) {}

export class GameRuntimeError extends Schema.TaggedError<GameRuntimeError>()(
  "GameRuntimeError",
  {
    message: Schema.String,
  },
) {}
