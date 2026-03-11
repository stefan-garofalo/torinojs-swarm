import { Effect } from "effect";

import { importUpstashRedisModule } from "./upstash-loader.js";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = {
  [key: string]: JsonValue;
};

export type GameSessionPhase = "idle" | "betting" | "action" | "resolution" | "ended";
export type GameSessionStatus = "waiting" | "in-progress" | "ended";
export type GameSessionTurn = "player" | "ai";

export type GameSessionEnvelope = {
  sessionId: string;
  status: GameSessionStatus;
  version: number;
  round: number;
  participants: JsonObject[];
  bettingWindow: JsonObject | null;
  activeBets: JsonObject[];
  economyEvents: JsonObject[];
  phase: GameSessionPhase;
  activePlayer?: JsonObject | null;
  ai?: JsonObject | null;
  magazine?: JsonObject | null;
  turn?: GameSessionTurn | null;
  roundHistory?: JsonObject[];
};

type UpdateGameSessionInput = {
  sessionId: string;
  expectedVersion: number;
  update: (current: GameSessionEnvelope) => GameSessionEnvelope;
};

export type GameSessionStoreClient = {
  getGameSession(sessionId: string): Promise<GameSessionEnvelope | null>;
  createGameSession(envelope: GameSessionEnvelope): Promise<GameSessionEnvelope>;
  updateGameSession(input: UpdateGameSessionInput): Promise<GameSessionEnvelope>;
  resetGameSessionsForTests(): Promise<void>;
};

type SessionStorage = {
  get(sessionId: string): Promise<GameSessionEnvelope | null>;
  create(envelope: GameSessionEnvelope): Promise<GameSessionEnvelope>;
  compareAndSwap(input: {
    sessionId: string;
    expectedVersion: number;
    next: GameSessionEnvelope;
  }): Promise<GameSessionEnvelope>;
  reset(): Promise<void>;
};

type UpstashRedisClient = {
  get<TValue>(key: string): Promise<TValue | null>;
  set(
    key: string,
    value: string,
    options?: {
      ex?: number;
      nx?: boolean;
    },
  ): Promise<unknown>;
  eval<TResult>(script: string, keys: string[], args: string[]): Promise<TResult>;
};

const GAME_SESSION_TTL_SECONDS = 60 * 60 * 6;
const VERSION_MISMATCH_MESSAGE = "version mismatch";
const SESSION_NOT_FOUND_MESSAGE = "game session not found";
const SESSION_EXISTS_MESSAGE = "game session already exists";
const VERSION_MISMATCH_SENTINEL = "__VERSION_MISMATCH__";

let testStorage: SessionStorage | null = null;
let runtimeStoragePromise: Promise<SessionStorage> | null = null;

export class GameSessionStore extends Effect.Service<GameSessionStore>()("GameSessionStore", {
  accessors: true,
  effect: Effect.gen(function* () {
    const getGameSessionEffect = Effect.fn("GameSessionStore.getGameSession")(function* (
      sessionId: string,
    ) {
      const storage = yield* getStorageEffect();

      return yield* Effect.tryPromise({
        try: () => storage.get(sessionId),
        catch: toSessionStoreError,
      });
    });

    const createGameSessionEffect = Effect.fn("GameSessionStore.createGameSession")(function* (
      envelope: GameSessionEnvelope,
    ) {
      const storage = yield* getStorageEffect();

      validateEnvelope(envelope, envelope.sessionId);

      return yield* Effect.tryPromise({
        try: () => storage.create(normalizeEnvelope(envelope)),
        catch: toSessionStoreError,
      });
    });

    const updateGameSessionEffect = Effect.fn("GameSessionStore.updateGameSession")(function* (
      input: UpdateGameSessionInput,
    ) {
      const storage = yield* getStorageEffect();
      const current = yield* Effect.tryPromise({
        try: () => storage.get(input.sessionId),
        catch: toSessionStoreError,
      });

      if (current === null) {
        return yield* Effect.fail(new Error(SESSION_NOT_FOUND_MESSAGE));
      }

      if (current.version !== input.expectedVersion) {
        return yield* Effect.fail(new Error(VERSION_MISMATCH_MESSAGE));
      }

      const next = normalizeEnvelope(input.update(current));

      validateEnvelope(next, input.sessionId);

      if (next.version <= current.version) {
        return yield* Effect.fail(new Error("updated session version must increase"));
      }

      return yield* Effect.tryPromise({
        try: () =>
          storage.compareAndSwap({
            sessionId: input.sessionId,
            expectedVersion: input.expectedVersion,
            next,
          }),
        catch: toSessionStoreError,
      });
    });

    const resetGameSessionsForTestsEffect = Effect.fn(
      "GameSessionStore.resetGameSessionsForTests",
    )(function* () {
      if (testStorage === null) {
        testStorage = createMemoryStorage();
      }

      const storage = testStorage;

      yield* Effect.tryPromise({
        try: () => storage.reset(),
        catch: toSessionStoreError,
      });
    });

    return {
      getGameSession: getGameSessionEffect,
      createGameSession: createGameSessionEffect,
      updateGameSession: updateGameSessionEffect,
      resetGameSessionsForTests: resetGameSessionsForTestsEffect,
    };
  }),
}) {}

export async function getGameSession(sessionId: string): Promise<GameSessionEnvelope | null> {
  return Effect.runPromise(
    GameSessionStore.getGameSession(sessionId).pipe(Effect.provide(GameSessionStore.Default)),
  );
}

export async function createGameSession(
  envelope: GameSessionEnvelope,
): Promise<GameSessionEnvelope> {
  return Effect.runPromise(
    GameSessionStore.createGameSession(envelope).pipe(Effect.provide(GameSessionStore.Default)),
  );
}

export async function updateGameSession(
  input: UpdateGameSessionInput,
): Promise<GameSessionEnvelope> {
  return Effect.runPromise(
    GameSessionStore.updateGameSession(input).pipe(Effect.provide(GameSessionStore.Default)),
  );
}

export async function resetGameSessionsForTests(): Promise<void> {
  await Effect.runPromise(
    GameSessionStore.resetGameSessionsForTests().pipe(Effect.provide(GameSessionStore.Default)),
  );
}

async function getStorage(): Promise<SessionStorage> {
  if (testStorage !== null) {
    return testStorage;
  }

  runtimeStoragePromise ??= createRuntimeStorage();

  return runtimeStoragePromise;
}

async function createRuntimeStorage(): Promise<SessionStorage> {
  if (process.env.NODE_ENV === "test") {
    testStorage = createMemoryStorage();
    return testStorage;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for @reaping/redis runtime usage",
    );
  }

  await import("@reaping/env/server");

  const { Redis } = await importUpstashRedisModule();
  const client = Redis.fromEnv() as UpstashRedisClient;

  return createUpstashStorage(client);
}

function createMemoryStorage(): SessionStorage {
  const store = new Map<string, string>();

  return {
    async get(sessionId) {
      const value = store.get(getGameSessionKey(sessionId));

      return value === undefined ? null : deserializeEnvelope(value);
    },
    async create(envelope) {
      const key = getGameSessionKey(envelope.sessionId);

      if (store.has(key)) {
        throw new Error(SESSION_EXISTS_MESSAGE);
      }

      store.set(key, serializeEnvelope(envelope));

      return envelope;
    },
    async compareAndSwap({ sessionId, expectedVersion, next }) {
      const key = getGameSessionKey(sessionId);
      const current = store.get(key);

      if (current === undefined) {
        throw new Error(SESSION_NOT_FOUND_MESSAGE);
      }

      const currentEnvelope = deserializeEnvelope(current);

      if (currentEnvelope.version !== expectedVersion) {
        throw new Error(VERSION_MISMATCH_MESSAGE);
      }

      store.set(key, serializeEnvelope(next));

      return next;
    },
    async reset() {
      store.clear();
    },
  };
}

function createUpstashStorage(client: UpstashRedisClient): SessionStorage {
  return {
    async get(sessionId) {
      const value = await client.get<string>(getGameSessionKey(sessionId));

      return value === null ? null : deserializeEnvelope(value);
    },
    async create(envelope) {
      const created = await client.set(getGameSessionKey(envelope.sessionId), serializeEnvelope(envelope), {
        ex: GAME_SESSION_TTL_SECONDS,
        nx: true,
      });

      if (created !== "OK") {
        throw new Error(SESSION_EXISTS_MESSAGE);
      }

      return envelope;
    },
    async compareAndSwap({ sessionId, expectedVersion, next }) {
      const result = await client.eval<string | null>(
        `
local key = KEYS[1]
local expected = tonumber(ARGV[1])
local payload = ARGV[2]
local ttl = tonumber(ARGV[3])
local current = redis.call("GET", key)

if not current then
  return nil
end

local decoded = cjson.decode(current)

if tonumber(decoded["version"]) ~= expected then
  return "__VERSION_MISMATCH__"
end

redis.call("SET", key, payload, "EX", ttl)

return payload
        `,
        [getGameSessionKey(sessionId)],
        [String(expectedVersion), serializeEnvelope(next), String(GAME_SESSION_TTL_SECONDS)],
      );

      if (result === null) {
        throw new Error(SESSION_NOT_FOUND_MESSAGE);
      }

      if (result === VERSION_MISMATCH_SENTINEL) {
        throw new Error(VERSION_MISMATCH_MESSAGE);
      }

      return deserializeEnvelope(result);
    },
    async reset() {
      throw new Error("resetGameSessionsForTests is only available with the test storage backend");
    },
  };
}

function getGameSessionKey(sessionId: string): string {
  return `game:session:${sessionId}`;
}

function serializeEnvelope(envelope: GameSessionEnvelope): string {
  return JSON.stringify(envelope);
}

function deserializeEnvelope(value: string): GameSessionEnvelope {
  return validateEnvelopeShape(JSON.parse(value) as JsonValue);
}

function normalizeEnvelope(envelope: GameSessionEnvelope): GameSessionEnvelope {
  return {
    ...envelope,
    activePlayer: envelope.activePlayer ?? null,
    ai: envelope.ai ?? null,
    magazine: envelope.magazine ?? null,
    turn: envelope.turn ?? null,
    roundHistory: envelope.roundHistory ?? [],
  };
}

function validateEnvelope(envelope: GameSessionEnvelope, sessionId: string): void {
  if (envelope.sessionId !== sessionId) {
    throw new Error("sessionId cannot change");
  }

  if (!Number.isInteger(envelope.version) || envelope.version < 1) {
    throw new Error("version must be a positive integer");
  }

  if (!Number.isInteger(envelope.round) || envelope.round < 0) {
    throw new Error("round must be a non-negative integer");
  }

  if (!isPhase(envelope.phase)) {
    throw new Error("invalid game session phase");
  }
}

function validateEnvelopeShape(value: JsonValue): GameSessionEnvelope {
  if (!isJsonObject(value)) {
    throw new Error("invalid game session envelope");
  }

  const {
    sessionId,
    status,
    version,
    round,
    participants,
    bettingWindow,
    activeBets,
    economyEvents,
    phase,
    activePlayer,
    ai,
    magazine,
    turn,
    roundHistory,
  } = value;

  const parsedStatus = isStatus(status) ? status : null;
  const parsedVersion = typeof version === "number" ? version : null;
  const parsedRound = typeof round === "number" ? round : null;
  const parsedPhase = isPhase(phase) ? phase : null;
  const parsedTurn = isOptionalTurn(turn) ? turn : null;

  if (
    typeof sessionId !== "string" ||
    parsedStatus === null ||
    parsedVersion === null ||
    !Number.isInteger(parsedVersion) ||
    parsedRound === null ||
    !Number.isInteger(parsedRound) ||
    !isJsonObjectArray(participants) ||
    !(bettingWindow === null || (bettingWindow !== undefined && isJsonObject(bettingWindow))) ||
    !isJsonObjectArray(activeBets) ||
    !isJsonObjectArray(economyEvents) ||
    parsedPhase === null ||
    !isOptionalJsonObject(activePlayer) ||
    !isOptionalJsonObject(ai) ||
    !isOptionalJsonObject(magazine) ||
    (parsedTurn === null && turn !== null && turn !== undefined) ||
    !isOptionalJsonObjectArray(roundHistory)
  ) {
    throw new Error("invalid game session envelope");
  }

  return {
    sessionId,
    status: parsedStatus,
    version: parsedVersion,
    round: parsedRound,
    participants,
    bettingWindow,
    activeBets,
    economyEvents,
    phase: parsedPhase,
    activePlayer,
    ai,
    magazine,
    turn: parsedTurn,
    roundHistory,
  };
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonObjectArray(value: JsonValue | undefined): value is JsonObject[] {
  return Array.isArray(value) && value.every((entry): entry is JsonObject => isJsonObject(entry));
}

function isOptionalJsonObject(value: JsonValue | undefined): value is JsonObject | null | undefined {
  return value === undefined || value === null || isJsonObject(value);
}

function isOptionalJsonObjectArray(value: JsonValue | undefined): value is JsonObject[] | undefined {
  return value === undefined || isJsonObjectArray(value);
}

function isPhase(value: JsonValue | undefined): value is GameSessionPhase {
  return (
    value === "idle" ||
    value === "betting" ||
    value === "action" ||
    value === "resolution" ||
    value === "ended"
  );
}

function isStatus(value: JsonValue | undefined): value is GameSessionStatus {
  return value === "waiting" || value === "in-progress" || value === "ended";
}

function isOptionalTurn(value: JsonValue | undefined): value is GameSessionTurn | null | undefined {
  return value === undefined || value === null || value === "player" || value === "ai";
}

function toSessionStoreError(error: unknown): Error {
  return error instanceof Error ? error : new Error("game session store failure");
}

function getStorageEffect(): Effect.Effect<SessionStorage, Error> {
  return Effect.tryPromise({
    try: getStorage,
    catch: toSessionStoreError,
  });
}
