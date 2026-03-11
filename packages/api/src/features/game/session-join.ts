import {
  getGameSession,
  updateGameSession,
} from "@reaping/redis";

import {
  buildParticipantWalletState,
  getParticipantWalletState,
  upsertParticipantWalletState,
  type ParticipantWalletState,
  type WalletRandomSource,
} from "./wallet.js";

const MAX_JOIN_RETRIES = 3;

export type JoinGameSessionInput = {
  sessionId: string;
  userId: string;
  joinedAt?: string;
  random?: WalletRandomSource;
};

export async function joinGameSession(input: JoinGameSessionInput): Promise<ParticipantWalletState> {
  for (let attempt = 0; attempt < MAX_JOIN_RETRIES; attempt += 1) {
    const envelope = await getRequiredSession(input.sessionId);
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

    try {
      const updated = await updateGameSession({
        sessionId: input.sessionId,
        expectedVersion: envelope.version,
        update: (current) => ({
          ...upsertParticipantWalletState(current, nextWalletState),
          version: current.version + 1,
        }),
      });
      const persistedWallet = getParticipantWalletState(updated, input.userId);

      if (persistedWallet === null) {
        throw new Error("joined participant wallet was not persisted");
      }

      return persistedWallet;
    } catch (error) {
      if (isVersionMismatch(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("failed to join game session after retrying version conflicts");
}

export async function getParticipantWallet(input: {
  sessionId: string;
  userId: string;
}): Promise<ParticipantWalletState | null> {
  const envelope = await getGameSession(input.sessionId);

  if (envelope === null) {
    return null;
  }

  return getParticipantWalletState(envelope, input.userId);
}

async function getRequiredSession(sessionId: string) {
  const envelope = await getGameSession(sessionId);

  if (envelope === null) {
    throw new Error("game session not found");
  }

  return envelope;
}

function isVersionMismatch(error: unknown): boolean {
  return error instanceof Error && error.message === "version mismatch";
}
