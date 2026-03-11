# Plan: TOR-39 Redis Handoff For TOR-36

**Generated**: 2026-03-09
**Audience**: parallel Codex on `TOR-36`
**Purpose**: explain the Redis/session layer TOR-39 is about to deliver so TOR-36 can align and avoid inventing conflicting persistence.

## Situation

`TOR-36` needs Redis-backed state persistence, but the repo has no Redis layer yet. `TOR-5` already made `packages/db` the Postgres/Drizzle boundary, so Redis must not be added there.

## What TOR-39 Is About To Do

1. Create `packages/redis` as a new workspace package.
2. Add Upstash env validation through `@reaping/env/server`.
3. Add Turbo env wiring for new Upstash vars in root `turbo.json`.
4. Expose an Effect-backed Redis/session layer from `@reaping/redis`.
5. Lock a small public surface:
   - `GameSessionEnvelope`
   - `getGameSession(sessionId)`
   - `createGameSession(envelope)`
   - `updateGameSession({ sessionId, expectedVersion, update })`
   - optional delete/reset helper for tests
6. Define the shared `GameSessionEnvelope` used by wallet/betting now and combat loop later.
7. Lock canonical key namespace + TTL inside `@reaping/redis`.

## What TOR-36 Should Assume

- live game state will live in Redis, not Postgres
- `packages/db` stays SQL-only
- `packages/api/src/features/game` should consume `@reaping/redis`, not raw Upstash clients
- one active shared demo session only
- server is the only writer
- browser never talks to Redis directly

## Session Shape TOR-36 Must Align To

Base envelope TOR-39 will establish:

- `sessionId`
- `status`
- `version`
- `round`
- `participants`
- `bettingWindow`
- `activeBets`
- `economyEvents`
- `phase`

Combat fields TOR-36 should plan to fill on the same envelope, not in a second store:

- `activePlayer`
- `ai`
- `magazine`
- `turn`
- `phase`
- `roundHistory`

Phase enum is locked exactly to:

- `idle`
- `betting`
- `action`
- `resolution`
- `ended`

## Contract TOR-36 Must Produce For TOR-39

At round end, TOR-36 should be able to emit a settlement payload compatible with TOR-39 bet resolution:

- `playerSurvivedRound`
- `playerDiedThisRound`
- `aiSurvivedRound`
- `aiDiedThisRound`
- `aiUsedEject`
- `playerShotSelf`
- `playerShotOpponent`
- `nextShotWasLive`
- `nextShotWasBlank`
- `playerEndingHp`
- `roundTurnCount`
- `noDamageOccurred`
- `bothSidesTookDamage`

If TOR-36 names or models these differently, bet settlement coupling will get worse later.

## Hard Requirements For TOR-36

- do not create a second Redis abstraction
- do not put Redis code in `packages/db`
- do not persist combat state in process memory as authority
- do not create a separate game-state schema disconnected from the wallet/betting envelope
- keep all combat mutations versioned so they can share the same session document/update flow
- preserve an explicit `betting -> action -> resolution` boundary, because TOR-39 depends on that phase split

## Safe Parallelization Boundary

TOR-36 can keep working on:

- combat state machine shape
- magazine model
- HP / turn rules
- action history model
- round-end payload mapping

TOR-36 should avoid finalizing:

- Redis client package shape
- session persistence primitives
- envelope ownership/package boundary
- final phase names if they diverge from above

## Expected Deliverable From TOR-39

Once TOR-39 lands, TOR-36 should get:

- `@reaping/redis` package
- validated Upstash env contract
- shared session envelope type
- small stable helper surface
- versioned Redis update primitives
- canonical key namespace + TTL policy
- clear package boundary for game services

That is the unblocker. After that, TOR-36 should plug combat fields into the shared envelope instead of designing storage from scratch.

## Shortest Unblocker

The minimum handoff TOR-36 needs is:

- `@reaping/redis` package exists
- Upstash env validated in `@reaping/env/server` and Turbo env wiring updated
- shared `GameSessionEnvelope` exported
- versioned `updateGameSession` primitive exported
