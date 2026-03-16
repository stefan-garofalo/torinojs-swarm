import type { GameSessionEnvelope, JsonObject, JsonValue } from "@reaping/redis";

export const DEFAULT_WALLET_MEAN = 1000;
export const DEFAULT_WALLET_STD_DEV = 300;

export type ParticipantRole = "spectator";

export type ParticipantWalletState = JsonObject & {
  userId: string;
  role: ParticipantRole;
  walletBalance: number;
  lockedFunds: number;
  availableBalance: number;
  joinedAt: string;
  eligibleFromRound: number;
  isDead: boolean;
  isExited: boolean;
};

export type WalletRandomSource = () => number;

export function buildParticipantWalletState(input: {
  currentRound: number;
  joinedAt: string;
  sessionStatus: GameSessionEnvelope["status"];
  userId: string;
  random?: WalletRandomSource;
}): ParticipantWalletState {
  const walletBalance = createStartingWalletBalance(input.random ?? Math.random);

  return {
    userId: input.userId,
    role: "spectator",
    walletBalance,
    lockedFunds: 0,
    availableBalance: walletBalance,
    joinedAt: input.joinedAt,
    eligibleFromRound:
      input.sessionStatus === "in-progress" ? input.currentRound + 1 : input.currentRound,
    isDead: false,
    isExited: false,
  };
}

export function createStartingWalletBalance(random: WalletRandomSource): number {
  const first = normalizeRandom(random());
  const second = normalizeRandom(random());
  const gaussianUnit = Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
  const sampledBalance = Math.round(DEFAULT_WALLET_MEAN + DEFAULT_WALLET_STD_DEV * gaussianUnit);

  return Math.max(0, sampledBalance);
}

export function getParticipantWalletState(
  envelope: GameSessionEnvelope,
  userId: string,
): ParticipantWalletState | null {
  for (const participant of envelope.participants) {
    const walletState = parseParticipantWalletState(participant);

    if (walletState !== null && walletState.userId === userId) {
      return ensureAvailableBalance(walletState);
    }
  }

  return null;
}

export function upsertParticipantWalletState(
  envelope: GameSessionEnvelope,
  walletState: ParticipantWalletState,
): GameSessionEnvelope {
  const nextParticipants: JsonObject[] = [];
  let replaced = false;

  for (const participant of envelope.participants) {
    const existingWalletState = parseParticipantWalletState(participant);

    if (existingWalletState !== null && existingWalletState.userId === walletState.userId) {
      nextParticipants.push(ensureAvailableBalance(walletState));
      replaced = true;
      continue;
    }

    nextParticipants.push(participant);
  }

  if (!replaced) {
    nextParticipants.push(ensureAvailableBalance(walletState));
  }

  return {
    ...envelope,
    participants: nextParticipants,
  };
}

export function parseParticipantWalletState(value: JsonObject): ParticipantWalletState | null {
  const userId = getString(value.userId);
  const role = value.role === "spectator" ? value.role : null;
  const walletBalance = getNumber(value.walletBalance);
  const lockedFunds = getNumber(value.lockedFunds);
  const availableBalance = getNumber(value.availableBalance);
  const joinedAt = getString(value.joinedAt);
  const eligibleFromRound = getInteger(value.eligibleFromRound);
  const isDead = getBoolean(value.isDead);
  const isExited = getBoolean(value.isExited);

  if (
    userId === null ||
    role === null ||
    walletBalance === null ||
    lockedFunds === null ||
    availableBalance === null ||
    joinedAt === null ||
    eligibleFromRound === null ||
    isDead === null ||
    isExited === null
  ) {
    return null;
  }

  return ensureAvailableBalance({
    ...value,
    userId,
    role,
    walletBalance,
    lockedFunds,
    availableBalance,
    joinedAt,
    eligibleFromRound,
    isDead,
    isExited,
  });
}

function ensureAvailableBalance(walletState: ParticipantWalletState): ParticipantWalletState {
  const safeWalletBalance = Math.max(0, walletState.walletBalance);
  const safeLockedFunds = clampLockedFunds(walletState.lockedFunds, safeWalletBalance);

  return {
    ...walletState,
    walletBalance: safeWalletBalance,
    lockedFunds: safeLockedFunds,
    availableBalance: safeWalletBalance - safeLockedFunds,
  };
}

function clampLockedFunds(lockedFunds: number, walletBalance: number): number {
  if (lockedFunds < 0) {
    return 0;
  }

  if (lockedFunds > walletBalance) {
    return walletBalance;
  }

  return lockedFunds;
}

function normalizeRandom(value: number): number {
  if (value <= 0) {
    return Number.MIN_VALUE;
  }

  if (value >= 1) {
    return 1 - Number.EPSILON;
  }

  return value;
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

function getBoolean(value: JsonValue | undefined): boolean | null {
  return typeof value === "boolean" ? value : null;
}
