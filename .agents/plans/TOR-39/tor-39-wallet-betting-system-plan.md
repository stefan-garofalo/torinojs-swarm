# Plan: TOR-39 Wallet & Betting System

**Generated**: 2026-03-09
**Issue**: `TOR-39` - Wallet & Betting System
**Branch**: `stefangarofalo/tor-39-wallet-betting-system`
**Estimated Complexity**: High

## Initial Situation

Current repo state:

- monorepo shape already established
- backend is `Elysia` transport over `Effect` services
- web is `Next.js` + `Eden Treaty` + `TanStack Query`
- auth exists via `better-auth`
- persistence today is effectively Postgres-only for auth/demo checks
- no game feature exists yet
- no Redis env contract exists yet
- no live session state model exists yet
- no wallet, betting, or leaderboard domain code exists yet
- TOR-5 already established `packages/db` as the Neon/Postgres Effect SQL + Drizzle layer only

Relevant repo context gathered before planning:

- `packages/api/src/features/demo/*` is the only current backend feature example
- `packages/api/src/index.ts` mounts feature plugins into the shared Elysia app
- `packages/api/src/runtime.ts` currently wires only `DemoService`
- `packages/env/src/server.ts` validates current server env; no Redis keys yet
- `packages/db` already owns Postgres schema/runtime access from TOR-5 and should not absorb Redis concerns
- `apps/server/src/app.smoke.test.ts` is current contract/smoke pattern
- `docs/requirements/economy.md` defines wallet, betting, freedom-pass, leaderboard behavior
- `docs/requirements/game-flow.md` defines join timing, spectator eligibility, and reset semantics
- `docs/requirements/future-considerations.md` defines the full bet catalog and provisional multipliers
- `docs/requirements/magic-numbers.md` suggests wallet and bet defaults
- `docs/requirements/technical-stack.md` already points at Redis for ephemeral game state and Postgres for auth/stats only

Linear issue `TOR-39` currently asks for:

- bell-curve wallet distribution on lobby join
- ephemeral per-game wallets
- server-authoritative wallet rules
- 10-second betting window
- multiple bets per round
- validation against min/max/wallet balance
- bet types catalog
- dynamic payout calculation
- batch round-end resolution
- real-time wallet updates

## Issue And Solution

Problem:

- Postgres is wrong as live source of truth for this feature
- wallet/betting state is ephemeral, high-churn, shared, and latency-sensitive
- frontend sync becomes awkward if writes land in one system and live reads/push state come from another
- repo has no game-session contract yet, so later issues would otherwise invent conflicting shapes

Chosen solution:

- Postgres remains durable truth for auth and later long-lived player stats only
- Upstash Redis becomes authoritative truth for live game-session state
- Redis implementation is a new workspace package, not an expansion of `packages/db`
- server remains single writer and arbiter through `Elysia` routes + `Effect` services
- frontend does **not** talk to Redis directly
- TOR-39 defines versioned snapshot + event contracts now
- actual SSE/live transport wiring remains TOR-47, not TOR-39

Why this split:

- keeps all authoritative live state in one place
- avoids in-memory state tied to one process
- gives atomic bet placement / fund locking
- gives later realtime work a stable contract without redesign
- preserves clean backend ownership boundaries already used in repo
- respects TOR-5: SQL persistence stays in `packages/db`; live session state gets its own package boundary

## Scope

In scope for TOR-39:

- Upstash-backed shared session envelope
- wallet assignment and lifecycle
- full bet catalog definitions
- pricing/quote engine
- bet placement, locking, and settlement
- authenticated API surface for join/read/place-bet
- versioned economy snapshot + event payload design
- tests for service behavior and HTTP contract

Out of scope for TOR-39:

- combat loop and magazine execution details from TOR-36
- freedom-pass behavior from TOR-40
- leaderboard rendering/social UI from TOR-41
- betting UI from TOR-49
- SSE/WebSocket transport implementation from TOR-47
- crash recovery beyond basic persisted session state
- multi-lobby or multi-session support

## Hard Decisions Locked For Execution

- single active shared game session for demo scope
- branch name is fixed: `stefangarofalo/tor-39-wallet-betting-system`
- Redis provider is Upstash
- Redis workspace package name: `@reaping/redis`
- browser never reads/writes Upstash directly
- public Redis package surface is intentionally small:
  - `GameSessionEnvelope`
  - `getGameSession(sessionId)`
  - `createGameSession(envelope)`
  - `updateGameSession({ sessionId, expectedVersion, update })`
  - optional test-only delete/reset helper
- full catalog ships in TOR-39:
  - round outcome bets
  - action bets
  - next-shot bets
  - exact-HP bets
  - meta bets
- pricing model is hybrid:
  - fixed documented multipliers for round/action/meta bets
  - probability-derived quotes for next-shot bets
  - exact-HP bets supported now with fixed provisional multipliers until combat-loop probability inputs exist
- all-in betting allowed
- minimum bet: `10`
- maximum bet: current `availableBalance`
- betting window duration: `10s`
- crash/restart continuity is not a TOR-39 acceptance requirement

## Architecture

### Source of Truth

- `Postgres`: auth, users, optional future aggregate stats
- `Upstash Redis`: active session, participants, wallets, locked funds, current betting window, active bets, economy event log, monotonic session version
- canonical Redis namespace: `game:session:{sessionId}`
- session TTL: one shared default applied by `@reaping/redis`; long enough for a demo session, refreshed on successful writes, and never guessed independently by consuming features

### Package Boundaries

- `packages/db`
  - remains Postgres-only
  - keeps Drizzle schema ownership
  - keeps Effect SQL + Drizzle composition from TOR-5
  - does **not** receive Redis clients, Upstash envs, session-store types, or game-state helpers
- `packages/redis`
  - new internal package for Upstash integration
  - owns raw Upstash client creation, Effect layer, serialization helpers, versioned update primitives, and repo-facing Redis helpers
  - exposes only typed layer/helpers to consuming domains
  - exports the shared envelope plus a minimal session CRUD/CAS surface
- `packages/api/src/features/game`
  - owns wallet/betting business rules
  - consumes `@reaping/redis` rather than instantiating Upstash clients inline
- `packages/env`
  - remains the shared env-contract package
  - owns Upstash env validation used by `@reaping/redis`

### Backend Ownership

- `packages/api/src/features/game/*` owns this new domain
- `Effect` services own business rules and store interaction
- `Elysia` routes stay thin and map typed failures to explicit HTTP responses
- `packages/env/src/server.ts` expands to carry Upstash config

### Turborepo Structure

- do not add Redis task logic to root `package.json`
- create a real workspace package at `packages/redis`
- add package-local scripts in `packages/redis/package.json`:
  - `build`
  - `check-types`
  - `test` if package-level tests exist
- rely on existing root delegation via `turbo run ...`
- update root `turbo.json` env list for Upstash vars because this repo uses strict env filtering
- keep env files app-local (`apps/server/.env`, `apps/web/.env`) rather than introducing a root `.env`
- do not create a package-local `turbo.json` unless `packages/redis` truly needs package-specific overrides; root task defaults already fit a compiled internal package with `dist/**`

### Frontend Sync Contract

TOR-39 must define contracts that support later live sync:

- `GET /api/game/economy`
  - full caller-facing snapshot
  - includes `sessionVersion`
  - includes current wallet/locked funds/available funds
  - includes current window info
  - includes currently allowed quotes for the caller
  - includes unresolved caller bets
  - includes recent economy events
- `POST /api/game/bets`
  - validates and commits atomically
  - returns updated caller-facing economy state plus new `sessionVersion`
- later TOR-47 will add server-side SSE using the same versioned event shapes
- frontend cache strategy later will be `TanStack Query` snapshot + server push invalidation/patching

### Frontend Guardrails For Later Issues

Use these rules when TOR-47 / TOR-49 / later frontend work consumes TOR-39:

- apply `vercel-react-best-practices`
  - avoid waterfalls
  - keep server shells async in parallel where possible
  - pass minimal serialized data into client components
- apply `next-best-practices`
  - default to Node runtime
  - keep auth/session reads in server components or route handlers
  - use explicit RSC/client boundaries instead of pushing all game UI client-side by default
- apply `next-cache-components` carefully
  - current `apps/web/next.config.ts` does **not** enable `cacheComponents`
  - only enable it if a later frontend issue actually needs Cache Components
  - do **not** put live user wallet/betting state behind `'use cache'`
  - cached shells are fine; versioned economy reads and session-dependent data stay dynamic
- apply `tanstack-query`
  - use v5 object syntax only
  - use `queryOptions` factories for reusable economy queries
  - use `isPending`, not legacy loading semantics
  - invalidate/refetch by query key after mutations
  - use TanStack Query for client-side live state caching; do not invent a parallel client store for server state

### Planned Domain Types

Define these in the game feature from the start:

- `GameSessionEnvelope`
- `ParticipantEconomyState`
- `BetDefinition`
- `BetQuote`
- `PlacedBet`
- `BetPlacementRequest`
- `BetPlacementError`
- `BettingWindowState`
- `EconomyEvent`
- `RoundSettlementInput`
- `RoundSettlementResult`

Required shape expectations:

- `GameSessionEnvelope`
  - `sessionId`
  - `status`
  - `version`
  - `round`
  - `participants`
  - `bettingWindow`
  - `activeBets`
  - `economyEvents`
  - `phase`
  - room on the same envelope for:
    - `activePlayer`
    - `ai`
    - `magazine`
    - `turn`
    - `roundHistory`
- `phase`
  - exact enum:
    - `idle`
    - `betting`
    - `action`
    - `resolution`
    - `ended`
- `ParticipantEconomyState`
  - `userId`
  - `role`
  - `walletBalance`
  - `lockedFunds`
  - `availableBalance`
  - `joinedAt`
  - `eligibleFromRound`
  - `isDead`
  - `isExited`
- `RoundSettlementInput`
  - enough information to resolve all catalog bets without reaching into future game-loop internals
  - include flags/outcomes such as:
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

## Phase Plan

### Phase 1: Session Foundation

**Goal**: introduce the game feature root, Upstash env contract, and authoritative session store.

**Expected outcome**:

- repo has a typed game-domain home
- repo has a dedicated Redis workspace package aligned with TOR-5 boundaries
- Upstash config is validated at startup
- session state can be created, loaded, and updated without in-memory coupling

**Tasks**:

1. Create `packages/redis` as a first-class workspace package with package-local scripts and exports.
2. Add Upstash env keys to `packages/env/src/server.ts` and update app-local `.env.example` files.
3. Update root `turbo.json` `env` declarations so Upstash vars participate in strict-mode hashing for build/test tasks.
4. Add an Effect-backed Redis layer and session-store primitives in `packages/redis`.
5. Lock the public Redis API to `getGameSession`, `createGameSession`, and CAS-style `updateGameSession`.
6. Lock the canonical session key namespace and TTL policy in the package, not in feature code.
7. Add `game` feature folder under `packages/api/src/features/game`.
8. Model the shared session envelope with versioned updates.
9. Reserve future game-loop fields now so later issues extend the same envelope instead of fork it.

**Validation gate**:

- `bun run check-types`
- `bun run check-types --filter=@reaping/redis --filter=@reaping/api --filter=@reaping/server`
- focused store tests prove create/load/update works
- version conflicts are detectable and rejected
- key namespace and TTL are defined in one place

**Assertions**:

- no repo code relies on process-local mutable state for game session
- all state needed for wallet/betting lives inside the session envelope

### Phase 2: Wallet Lifecycle

**Goal**: implement session-scoped wallet behavior tied to join flow.

**Expected outcome**:

- joining a session assigns a bell-curve wallet
- wallet is session-only
- no negative balances possible
- late joiners are marked ineligible for already-open windows

**Tasks**:

1. Implement wallet assignment using bell-curve defaults:
   - mean `1000`
   - std dev `300`
   - clamp to `>= 0`
2. Persist wallet, locked funds, and available balance in participant state.
3. Implement join semantics for:
   - lobby join
   - mid-game spectator join
4. Mark mid-round arrivals with `eligibleFromRound = currentRound + 1`.
5. Add explicit reset/discard semantics for next game session.

**Validation gate**:

- focused wallet service tests
- repeated read returns same wallet within same session
- new session resets wallet state

**Assertions**:

- `availableBalance === walletBalance - lockedFunds`
- wallet never drops below `0`
- join is idempotent per session/user

### Phase 3: Bet Catalog And Pricing

**Goal**: define every required bet type and generate safe quotes for open windows.

**Expected outcome**:

- full catalog exists in code
- caller sees only valid current-window quote options
- pricing rules are deterministic from session snapshot

**Tasks**:

1. Encode full catalog from requirements docs:
   - round outcomes
   - action bets
   - next-shot bets
   - exact-HP bets
   - meta bets
2. Implement quote generation at betting-window open.
3. Lock quote snapshot for the window so payouts do not drift mid-window.
4. Use hybrid pricing:
   - fixed multipliers for round/action/meta bets
   - probability-based next-shot quotes using current live/blank odds
   - fixed provisional exact-HP multipliers until combat-loop probability inputs exist
5. Exclude impossible/unreachable quote variants from current window output.

**Validation gate**:

- catalog/pricing tests
- next-shot quotes match known live/blank ratios
- invalid exact-HP options are absent

**Assertions**:

- every in-scope bet family has a stable id and resolver
- quote generation depends only on snapshot inputs, not mutable client state

### Phase 4: Bet Placement, Locking, Settlement

**Goal**: allow validated multiple bets per round and settle them in batch safely.

**Expected outcome**:

- server validates bets atomically
- funds lock immediately
- multiple bets per spectator work
- round-end settlement resolves once and updates wallets correctly

**Tasks**:

1. Implement betting-window state with open/close timestamps.
2. Accept multiple bets per user within one window.
3. Validate:
   - authenticated caller
   - user eligibility for current round
   - open window
   - min bet `10`
   - max bet `availableBalance`
   - all-in allowed
4. Lock funds immediately on accepted bet.
5. Make placement idempotent for duplicate request ids.
6. Add batch settlement using `RoundSettlementInput`.
7. Append economy events for later sync consumption.

**Validation gate**:

- betting service tests
- insufficient-funds path covered
- duplicate-request path covered
- settlement runs exactly once for same round snapshot

**Assertions**:

- losing bets do not deduct twice
- winning bets unlock and pay exactly once
- `lockedFunds` equals sum of unresolved active bets

### Phase 5: HTTP Contract And Runtime Wiring

**Goal**: expose the domain through the shared app contract with typed failures.

**Expected outcome**:

- game routes mounted in shared app
- runtime wires required services
- server smoke tests prove contract shape

**Tasks**:

1. Add authenticated routes:
   - `POST /api/game/session/join`
   - `GET /api/game/economy`
   - `POST /api/game/bets`
2. Define typed success and failure payloads.
3. Wire game services into `AppRuntime`.
4. Mount the feature in `packages/api/src/index.ts`.
5. Extend server smoke coverage for auth failure, join flow, and bet placement.

**Validation gate**:

- `bun run check-types`
- `bun run test:server`

**Assertions**:

- unauthenticated caller cannot join or bet
- authenticated join returns wallet snapshot
- successful bet returns updated caller-facing state and new session version

## Execution Tasks

### T1: Create game session foundation
- **Location**: `packages/redis/**`, `packages/env/src/server.ts`, `packages/api/src/features/game`, `turbo.json`, app env examples
- **Description**: create the dedicated Redis workspace package, env contract, strict-mode Turbo env wiring, Upstash-backed session store, and base session envelope with versioning. Keep `packages/db` unchanged except as an existing precedent to mirror architecturally.
- **Description**: create the dedicated Redis workspace package, env contract, strict-mode Turbo env wiring, Upstash-backed session store, and base session envelope with versioning. The exported surface must stay minimal: shared envelope type, load/create helpers, and CAS-style update helper. Keep `packages/db` unchanged except as an existing precedent to mirror architecturally.
- **Dependencies**: none
- **Status**: Completed
- **Backlog Item**: `TOR-62` <https://linear.app/stefan-projects/issue/TOR-62/t1-session-foundation>
- **Relation Mode**: native
- **Review Mode**: cli
- **TDD Target**: start with a failing public-interface test that proves `@reaping/redis` can create a session, read it back, then reject `updateGameSession` when `expectedVersion` mismatches.
- **Log**:
  - Created `@reaping/redis` workspace package with CAS-style session helpers and shared envelope types.
  - Added Upstash env validation and Turbo strict-env wiring.
  - Added minimal `packages/api/src/features/game` root and `@reaping/redis` workspace dependency.
  - Validation passed: `bun test packages/redis/src/index.test.ts`
  - Validation passed: `bun run check-types --filter=@reaping/redis --filter=@reaping/api --filter=@reaping/server`
- **Files Edited/Created**:
  - `packages/redis/package.json`
  - `packages/redis/tsconfig.json`
  - `packages/redis/src/index.ts`
  - `packages/redis/src/index.test.ts`
  - `packages/redis/src/upstash-loader.ts`
  - `packages/redis/src/upstash-redis.d.ts`
  - `packages/env/src/server.ts`
  - `apps/server/.env.example`
  - `apps/web/.env.example`
  - `turbo.json`
  - `packages/api/package.json`
  - `packages/api/src/features/game/index.ts`
  - `apps/server/package.json`
- **Acceptance Criteria**:
  - `packages/db` remains Postgres-only
  - `packages/redis` exists as its own workspace package
  - Redis package has package-local scripts and exports
  - root Turbo config knows the Upstash env vars
  - `@reaping/redis` exports `GameSessionEnvelope`, `getGameSession`, `createGameSession`, `updateGameSession`
  - `updateGameSession` uses `expectedVersion` semantics, not blind overwrite
  - canonical key namespace and TTL are package-owned
  - game feature root exists
  - Upstash env keys validated
  - session store supports create/load/update
  - no in-memory authority for live state
- **Validation**:
  - `bun run check-types --filter=@reaping/redis --filter=@reaping/api --filter=@reaping/server`
  - focused store tests

### T2: Implement wallet lifecycle
- **Location**: `packages/api/src/features/game`
- **Description**: add join-time wallet assignment, per-session persistence, available/locked balance accounting, and next-session reset behavior.
- **Dependencies**: `T1`
- **Status**: Completed
- **Backlog Item**: `TOR-63` <https://linear.app/stefan-projects/issue/TOR-63/t2-wallet-lifecycle>
- **Relation Mode**: native
- **Review Mode**: cli
- **TDD Target**: start with a failing public-interface test that proves joining creates one persisted spectator wallet, returns the same wallet on re-read in the same session, and never yields a negative available balance.
- **Log**:
  - added wallet parsing/upsert helpers and bell-curve initialization in `wallet.ts`
  - added CAS-retried idempotent join flow in `session-join.ts`
  - proved persisted join, mid-round eligibility delay, and session reset behavior in focused tests
- **Files Edited/Created**:
  - `packages/api/src/features/game/wallet.ts`
  - `packages/api/src/features/game/session-join.ts`
  - `packages/api/src/features/game/session-join.test.ts`
- **Acceptance Criteria**:
  - wallet assigned on join
  - wallet persisted per session
  - wallet reset on new session
  - no negative wallet states
  - late joiners cannot enter already-open betting window
- **Validation**:
  - `bun test packages/api/src/features/game/session-join.test.ts`

### T3: Implement catalog and pricing engine
- **Location**: `packages/api/src/features/game`
- **Description**: encode full catalog and current-window quote generation rules.
- **Dependencies**: `T1`
- **Status**: Completed
- **Backlog Item**: `TOR-64` <https://linear.app/stefan-projects/issue/TOR-64/t3-bet-catalog-and-pricing>
- **Relation Mode**: native
- **Review Mode**: cli
- **TDD Target**: start with a failing public-interface test that proves a known session snapshot produces deterministic bet quotes, including probability-based next-shot odds and exclusion of impossible exact-HP options.
- **Log**:
  - encoded the full fixed/probability/provisional bet catalog in `bet-catalog.ts`
  - added deterministic quote snapshot generation in `pricing.ts`
  - kept quote ids and settlement payload names aligned with TOR-36 handoff requirements
- **Files Edited/Created**:
  - `packages/api/src/features/game/bet-catalog.ts`
  - `packages/api/src/features/game/pricing.ts`
  - `packages/api/src/features/game/pricing.test.ts`
- **Acceptance Criteria**:
  - every required bet family exists
  - quotes are deterministic from session snapshot
  - next-shot odds are probability-based
  - impossible quote options excluded
- **Validation**:
  - `bun test packages/api/src/features/game/pricing.test.ts`

### T4: Implement placement and settlement
- **Location**: `packages/api/src/features/game`
- **Description**: add open-window validation, multiple bets, atomic fund locking, idempotent placement, and batch settlement.
- **Dependencies**: `T2`, `T3`
- **Status**: Completed
- **Backlog Item**: `TOR-65` <https://linear.app/stefan-projects/issue/TOR-65/t4-placement-and-settlement>
- **Relation Mode**: native
- **Review Mode**: cli
- **TDD Target**: start with a failing public-interface test that proves a spectator can place multiple bets in one open window, locked funds update atomically, and one batch settlement updates balances exactly once.
- **Log**:
  - added default-session bootstrap, window-open helper, caller-facing economy snapshots, and idempotent bet placement in `betting.ts`
  - added typed domain errors for closed-window, funds, quote, and eligibility failures
  - settled round bets in batch with net wallet deltas, locked-fund release, and economy event append
- **Files Edited/Created**:
  - `packages/api/src/features/game/betting.ts`
  - `packages/api/src/features/game/errors.ts`
  - `packages/api/src/features/game/betting.test.ts`
- **Acceptance Criteria**:
  - multiple bets per round work
  - min/max/funds validation enforced
  - all-in works
  - settlement resolves active bets exactly once
  - economy events appended
- **Validation**:
  - `bun test packages/api/src/features/game/betting.test.ts`

### T5: Expose HTTP contract
- **Location**: `packages/api/src/features/game/routes.ts`, `packages/api/src/index.ts`, `packages/api/src/runtime.ts`, `apps/server/src/app.smoke.test.ts`
- **Description**: expose authenticated join/read/place-bet routes and wire runtime/services.
- **Dependencies**: `T1`, `T2`, `T3`, `T4`
- **Status**: Completed
- **Backlog Item**: `TOR-66` <https://linear.app/stefan-projects/issue/TOR-66/t5-http-contract-and-runtime-wiring>
- **Relation Mode**: native
- **Review Mode**: cli
- **TDD Target**: start with a failing public-interface test that proves an authenticated user can join the session, receive a typed economy snapshot, place a valid bet, and observe reduced available balance through the HTTP contract.
- **Log**:
  - mounted `/api/game/session/join`, `/api/game/economy`, and `/api/game/bets` with typed `401/404/409` behavior
  - added a shared request-level auth resolver and test-only auth shortcut for server smoke coverage
  - updated smoke coverage to verify auth rejection plus join/place-bet happy path against the exported app contract
  - left `AppRuntime` unchanged because the current game slice is pure domain/helpers over Redis rather than an `Effect.Service` layer yet
- **Files Edited/Created**:
  - `packages/auth/src/index.ts`
  - `packages/api/src/modules/http/auth-plugin.ts`
  - `packages/api/src/features/game/routes.ts`
  - `packages/api/src/features/game/index.ts`
  - `packages/api/src/index.ts`
  - `packages/api/src/features/demo/service.ts`
  - `apps/server/src/app.smoke.test.ts`
  - `turbo.json`
  - `apps/server/turbo.json`
- **Acceptance Criteria**:
  - routes mounted in shared app
  - runtime provides game services
  - typed failure payloads exist
  - server smoke tests cover happy path and auth failure
- **Validation**:
  - `bun run check-types --filter=@reaping/api --filter=@reaping/server`
  - `bun run test:server`

## API Contract Decisions

### `POST /api/game/session/join`

Purpose:

- create caller participation in current session if absent
- return caller-facing economy snapshot

Must return:

- `sessionId`
- `sessionVersion`
- caller participant economy state
- betting-window summary
- caller-visible quotes if window open
- caller unresolved bets
- recent economy events

### `GET /api/game/economy`

Purpose:

- authoritative refetch path for frontend cache recovery

Must return:

- same snapshot shape as join
- enough data for later leaderboard computation without reworking server shape

### `POST /api/game/bets`

Purpose:

- place exactly one bet request atomically

Must validate:

- auth present
- caller exists in session
- current round eligibility
- betting window open
- quote id valid for current window snapshot
- amount within min/max/available balance
- request id idempotency

Must return:

- accepted bet
- updated caller economy state
- new `sessionVersion`
- recent economy events

## Testing Strategy

Unit/service coverage:

- session create/load/update
- wallet assignment and clamping
- idempotent join
- late-join eligibility
- quote generation across all bet families
- next-shot dynamic pricing
- invalid quote exclusion
- multi-bet placement
- insufficient funds
- closed-window rejection
- duplicate request handling
- settlement idempotency
- wallet update correctness

Contract/smoke coverage:

- unauthenticated access rejected
- join returns typed payload
- bet placement mutates wallet state
- snapshot refetch returns latest version

Repo-level validation after full implementation:

- `bun run check-types`
- `bun run test:server`

Package-boundary validation:

- `packages/api` imports Redis helpers from `@reaping/redis`, not from inline Upstash clients
- `packages/db` exports remain Postgres/Drizzle-only
- no root task logic is added outside `turbo run ...` delegation
- Upstash env vars are declared in `turbo.json` task env so strict-mode hashing stays correct
- no feature code invents its own session key or TTL policy

## Risks And Gotchas

- it is tempting to put Redis next to Postgres in `packages/db`
  - do not; TOR-5 already made `packages/db` the SQL boundary, so Redis must live in `packages/redis`
- Turborepo strict env filtering will silently bite if Upstash vars are omitted from `turbo.json`
  - add them when introducing Redis-backed build/test paths
- exact-HP dynamic probability is under-specified without combat-loop math
  - keep exact-HP support but fixed provisional multipliers in TOR-39
- realtime acceptance could creep into transport work
  - keep TOR-39 to snapshot/event contract only; transport belongs to TOR-47
- later issues might need more session fields
  - reserve extension points in the envelope now
- Upstash conflict handling can be subtle
  - use explicit versioned updates, not blind overwrite
- if helper names or envelope field names drift after TOR-36 aligned to them, merge pain rises immediately
  - keep exported helper names and the phase enum exact unless both issues are updated together

## Rollback Plan

- remove game feature mount from `packages/api/src/index.ts`
- remove `packages/redis`
- remove runtime wiring from `packages/api/src/runtime.ts`
- remove Upstash env additions from examples, env schema, and `turbo.json`
- delete issue branch `stefangarofalo/tor-39-wallet-betting-system` if implementation is abandoned before merge

## Backlog Sync Intent

When syncing execution tasks into Linear under `TOR-39`, create native child issues matching:

- `T1 Session Foundation`
- `T2 Wallet Lifecycle`
- `T3 Bet Catalog And Pricing`
- `T4 Placement And Settlement`
- `T5 HTTP Contract And Runtime Wiring`

These child issues should inherit the same branch root and keep dependency order `T1 -> T2/T3 -> T4 -> T5`.

## Unresolved Questions

None blocking for execution.
