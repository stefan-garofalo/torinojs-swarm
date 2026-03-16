import { Effect } from "effect";
import {
  GameSessionStore,
  type GameSessionEnvelope,
  type GameSessionStoreClient,
} from "@reaping/redis";

import {
  buildParticipantWalletState,
  getParticipantWalletState,
  upsertParticipantWalletState,
  type ParticipantWalletState,
  type WalletRandomSource,
} from "./wallet.js";

const MAX_JOIN_RETRIES = 3;

type UpdateGameSessionInput = Parameters<GameSessionStoreClient["updateGameSession"]>[0];

type SessionJoinStore = Pick<GameSessionStoreClient, "getGameSession" | "updateGameSession">;
type SessionJoinEffectStore<R = never> = {
  getGameSession(sessionId: string): Effect.Effect<GameSessionEnvelope | null, unknown, R>;
  updateGameSession(
    input: UpdateGameSessionInput,
  ): Effect.Effect<GameSessionEnvelope, unknown, R>;
};

const defaultGameSessionEffectStore: SessionJoinEffectStore<GameSessionStore> = {
  getGameSession: GameSessionStore.getGameSession,
  updateGameSession: GameSessionStore.updateGameSession,
};

export type JoinGameSessionInput = {
  sessionId: string;
  userId: string;
  joinedAt?: string;
  random?: WalletRandomSource;
};

export async function joinGameSession(input: JoinGameSessionInput): Promise<ParticipantWalletState> {
  return Effect.runPromise(
    createSessionJoinEffectApi(defaultGameSessionEffectStore)
      .joinGameSession(input)
      .pipe(Effect.provide(GameSessionStore.Default)),
  );
}

export async function getParticipantWallet(input: {
  sessionId: string;
  userId: string;
}): Promise<ParticipantWalletState | null> {
  return Effect.runPromise(
    createSessionJoinEffectApi(defaultGameSessionEffectStore)
      .getParticipantWallet(input)
      .pipe(Effect.provide(GameSessionStore.Default)),
  );
}

export function createSessionJoinApi(store: SessionJoinStore) {
  const effectApi = createSessionJoinEffectApi(liftSessionJoinStore(store));

  return {
    joinGameSession: (input: JoinGameSessionInput): Promise<ParticipantWalletState> =>
      Effect.runPromise(effectApi.joinGameSession(input)),
    getParticipantWallet: (input: {
      sessionId: string;
      userId: string;
    }): Promise<ParticipantWalletState | null> =>
      Effect.runPromise(effectApi.getParticipantWallet(input)),
  };
}

export function createSessionJoinEffectApi<R>(store: SessionJoinEffectStore<R>) {
  const joinGameSession = Effect.fn("GameSessionJoin.joinGameSession")(function* (
    input: JoinGameSessionInput,
  ) {
    return yield* attemptJoin(store, input, 0);
  });

  const getParticipantWallet = Effect.fn("GameSessionJoin.getParticipantWallet")(function* (input: {
    sessionId: string;
    userId: string;
  }) {
    const envelope = yield* store.getGameSession(input.sessionId);

    if (envelope === null) {
      return null;
    }

    return getParticipantWalletState(envelope, input.userId);
  });

  return {
    joinGameSession,
    getParticipantWallet,
  };
}

function attemptJoin<R>(
  store: SessionJoinEffectStore<R>,
  input: JoinGameSessionInput,
  attempt: number,
): Effect.Effect<ParticipantWalletState, unknown, R> {
  return Effect.gen(function* () {
    if (attempt >= MAX_JOIN_RETRIES) {
      return yield* Effect.fail(
        new Error("failed to join game session after retrying version conflicts"),
      );
    }

    const envelope = yield* getRequiredSessionEffect(store, input.sessionId);
    const existingWallet = getParticipantWalletState(envelope, input.userId);

    if (existingWallet !== null) {
      return existingWallet;
    }

    const joinedAt = input.joinedAt ?? new Date().toISOString();
    const nextWalletState = buildParticipantWalletState({
      currentRound: envelope.round,
      joinedAt,
      sessionStatus: envelope.status,
      userId: input.userId,
      random: input.random,
    });

    const updated = yield* store
      .updateGameSession({
        sessionId: input.sessionId,
        expectedVersion: envelope.version,
        update: (current) => ({
          ...upsertParticipantWalletState(current, nextWalletState),
          version: current.version + 1,
        }),
      })
      .pipe(
        Effect.map((nextEnvelope) => ({
          kind: "updated" as const,
          envelope: nextEnvelope,
        })),
        Effect.catchIf(isVersionMismatch, () =>
          Effect.succeed({
            kind: "retry" as const,
          }),
        ),
      );

    if (updated.kind === "retry") {
      return yield* attemptJoin(store, input, attempt + 1);
    }

    const persistedWallet = getParticipantWalletState(updated.envelope, input.userId);

    if (persistedWallet === null) {
      return yield* Effect.fail(new Error("joined participant wallet was not persisted"));
    }

    return persistedWallet;
  });
}

function getRequiredSessionEffect<R>(store: SessionJoinEffectStore<R>, sessionId: string) {
  return Effect.gen(function* () {
    const envelope = yield* store.getGameSession(sessionId);

    if (envelope === null) {
      return yield* Effect.fail(new Error("game session not found"));
    }

    return envelope;
  });
}

function isVersionMismatch(error: unknown): boolean {
  return error instanceof Error && error.message === "version mismatch";
}

function liftSessionJoinStore(store: SessionJoinStore): SessionJoinEffectStore {
  return {
    getGameSession: (sessionId) =>
      Effect.tryPromise({
        try: () => store.getGameSession(sessionId),
        catch: (error) => error,
      }),
    updateGameSession: (input) =>
      Effect.tryPromise({
        try: () => store.updateGameSession(input),
        catch: (error) => error,
      }),
  };
}
