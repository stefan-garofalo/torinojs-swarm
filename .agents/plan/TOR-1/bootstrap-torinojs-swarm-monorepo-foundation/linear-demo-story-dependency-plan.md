# Plan: Linear Demo Story Dependency Analysis

**Generated**: 2026-03-09

## Overview

Initial situation:
- The bootstrap foundation for the demo repo was already delivered through `TOR-1` and child issues `TOR-2` through `TOR-10`.
- The remaining demo implementation stories are `TOR-33`, `TOR-36` to `TOR-50`.
- Live Linear inspection on 2026-03-09 shows every remaining story is currently in `Backlog`.
- The issue bodies encode intended dependencies in prose, but Linear native blocker relations do not appear to be set on these issues yet.

Issue:
- The story set is only partially dependency-modeled. Some dependencies are explicit in descriptions, some are only implied by acceptance criteria, and some UI stories currently depend on business stories but not on the transport/story slices required to make their acceptance criteria finishable.

Solution:
- Treat the story descriptions as the baseline dependency graph.
- Add a second layer of execution-critical dependencies for swarm planning, so agents do not start stories that will immediately block on missing transport, lifecycle, AI trigger coverage, or UI foundations.
- Split infra sequencing into scaffold-first then contract-freeze, because transport cannot define final event payloads before gameplay/economy stories define the domain events.
- Schedule work in parallel waves around actual architectural seams in this repo:
  - `apps/server/src/features/*` for game/economy/flow server logic
  - `apps/server/src/modules/http/*` for transport and streaming
  - `apps/web/src/features/*` for domain UI
  - `apps/web/src/modules/*` for shared client/UI primitives
  - `packages/auth`, `packages/ai`, `packages/db` only where story scope crosses package boundaries

## Sources Used

- Live Linear issue inspection on 2026-03-09:
  - `TOR-33`, `TOR-36` to `TOR-50` via `linear issue view ... --json`
- Story creation source of truth:
  - `scripts/create-linear-stories.ts`
- Existing bootstrap execution/handoff context:
  - `.agents/torinojs-swarm-bootstrap-plan.md`
  - `.agents/notes/linear-cli.md`
  - `README.md`

## Prerequisites

- Linear team `TOR`
- Linear issues `TOR-33`, `TOR-36` to `TOR-50`
- Bootstrap foundation already completed:
  - `TOR-3` monorepo/task model
  - `TOR-5` db/persistence
  - `TOR-6` typed Elysia/Eden contract
  - `TOR-7` frontend contract consumption
  - `TOR-8` shared AI foundation
  - `TOR-9` deployment shape

## Current Story Inventory

| Issue | Priority | State | Current explicit dependency baseline |
|------|------|------|------|
| TOR-33 | 1 | Backlog | TOR-5 |
| TOR-36 | 2 | Backlog | TOR-5 |
| TOR-37 | 2 | Backlog | TOR-8, TOR-36 |
| TOR-38 | 2 | Backlog | TOR-36 |
| TOR-39 | 2 | Backlog | TOR-5 |
| TOR-40 | 3 | Backlog | TOR-36, TOR-39 |
| TOR-41 | 2 | Backlog | TOR-39 |
| TOR-42 | 2 | Backlog | TOR-33, TOR-39 |
| TOR-43 | 2 | Backlog | TOR-36, TOR-42 |
| TOR-44 | 3 | Backlog | TOR-42, TOR-43 |
| TOR-45 | 3 | Backlog | TOR-8, TOR-36 |
| TOR-46 | 3 | Backlog | TOR-43, TOR-45 |
| TOR-47 | 2 | Backlog | TOR-5 |
| TOR-48 | 2 | Backlog | TOR-3 |
| TOR-49 | 3 | Backlog | TOR-39, TOR-41, TOR-48 |
| TOR-50 | 3 | Backlog | TOR-36, TOR-38, TOR-48 |

## Execution-Critical Dependency Overrides

These are the additional blocker relations I would enforce for swarm execution even though several are not encoded explicitly in the original story text.

| Issue | Add blocker(s) | Why |
|------|------|------|
| TOR-38 | TOR-47 | Story acceptance includes event broadcasting and action feed delivery |
| TOR-40 | TOR-42 | "Richest spectator" and offer timing require lobby/reaping roles |
| TOR-41 | TOR-42, TOR-47 | "Next reaping target" is lifecycle-owned; live updates need transport |
| TOR-42 | TOR-47 | Countdown, announcement, and smooth shared transition are cross-client behaviors |
| TOR-45 | TOR-39, TOR-42 | Story acceptance includes betting/economic/reaping/lobby taunt triggers |
| TOR-49 | TOR-40, TOR-42, TOR-47 | Story includes freedom-pass offer UI, reaping target, and live wallet/countdown updates |
| TOR-50 | TOR-43, TOR-47 | Story includes death-state visuals and live action/event display |

## Dependency Graph

```text
TOR-33 ──┐
         ├── TOR-42 ──┐
TOR-39 ──┬────────────┘            ├── TOR-44
         ├── TOR-40 ───────────────┘
         ├── TOR-41
         ├── TOR-45 ───────────────┐
         └── TOR-49                ├── TOR-46
                                   │
TOR-43 ────────────────────────────┘

TOR-36 ──┬── TOR-37
         ├── TOR-38 ───────────┐
         ├── TOR-40            │
         ├── TOR-43            │
         └── TOR-45            ├── TOR-50
                               │
TOR-47a ── TOR-47b ────────────┘

TOR-47b ──┬── TOR-38
          ├── TOR-41
          ├── TOR-42
          ├── TOR-49
          └── TOR-50

TOR-48 ──┬── TOR-49
         └── TOR-50
```

## Tasks

### TOR-33: Authentication System
- **depends_on**: []
- **location**: `packages/auth/**`, `apps/server/src/modules/http/auth-plugin.ts`, `apps/web/src/modules/auth/**`
- **description**: Replace current email/password flow with GitHub OAuth so the rest of the multiplayer/lobby stories can assume authenticated, named users and no anonymous entry path.
- **validation**: GitHub OAuth login/logout works end-to-end; protected routes reject anonymous access; cookie/CORS/session policy is finalized before streaming work extends the same HTTP surface.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-36: Russian Roulette Core Loop
- **depends_on**: []
- **location**: `apps/server/src/features/**`, `packages/db/**` if persistence contract expansion is needed
- **description**: Build the authoritative combat state machine first. This is the root mechanic for AI, timing, death, and the main game display.
- **validation**: Server-side state machine supports turns, magazine lifecycle, HP, actions, and persistence; downstream stories can consume stable state/events instead of redefining rules.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-39: Wallet & Betting System
- **depends_on**: []
- **location**: `apps/server/src/features/**`, `packages/db/**` if wallet persistence contracts expand
- **description**: Build the authoritative economy in parallel with the combat loop. This unlocks lobby selection, leaderboard, betting UI, and freedom pass.
- **validation**: Wallet assignment, bet validation, payout resolution, and per-session reset rules are server-authoritative.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-47: Real-time State Synchronization
- **depends_on**: []
- **location**: `apps/server/src/modules/http/**`, `apps/web/src/modules/api/**`
- **description**: Start with transport scaffold only: connection model, auth compatibility, subscription lifecycle, reconnect behavior, and snapshot strategy. Do not freeze final domain event payloads yet; gameplay/economy stories still need to define them.
- **validation**: A client can connect, authenticate, reconnect, and receive snapshot-plus-stream plumbing without polling-only fallbacks; auth/cookie/CORS behavior does not conflict with `TOR-33`.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-48: 8bitcn Pixel Art Foundation & Aesthetic
- **depends_on**: []
- **location**: `apps/web/src/index.css`, `apps/web/src/modules/ui/**`, `apps/web/src/app/layout.tsx`
- **description**: Build the visual system in parallel with backend work. This is a pure frontend foundation that later UI stories can compose instead of rebuilding styling piecemeal.
- **validation**: Shared UI shell, palette, typography, effects, and responsive rules exist and can be reused by story-specific screens.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-37: AI Opponent System
- **depends_on**: [TOR-36]
- **location**: `apps/server/src/features/**`, `packages/ai/**` only if shared AI helpers need extension
- **description**: Layer AI decisions onto the already-stable combat rules. Keep this server-first and deterministic around the game state contract.
- **validation**: AI selects legal actions against the core loop state machine; no UI dependency required for functional completeness.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-38: Game Timing & Action History
- **depends_on**: [TOR-36, TOR-47]
- **location**: `apps/server/src/features/**`, `apps/server/src/modules/http/**`, `apps/web/src/features/**`
- **description**: Add timing constants, event history, and paced resolution only after both the core state machine and streaming transport exist. Story text names event broadcasting; transport absence would leave the story half-done.
- **validation**: Trigger, hit/miss, reload, and transition events are timed, persisted/broadcast, and visible to connected clients using the finalized event contract from `TOR-47` after combat events are defined.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-41: Leaderboard & Economic Pressure
- **depends_on**: [TOR-39, TOR-42, TOR-47]
- **location**: `apps/server/src/features/**`, `apps/web/src/features/**`
- **description**: Compute ranking from wallet state and expose it through the real-time channel, because the acceptance criteria require always-visible live updates.
- **validation**: Top/bottom rankings and next reaping target update live during betting, not only after manual refresh; lifecycle ownership of the current/next reaping target is not duplicated inside wallet logic.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-42: Lobby & Reaping System
- **depends_on**: [TOR-33, TOR-39, TOR-47]
- **location**: `apps/server/src/features/**`, `apps/web/src/app/**`, `apps/web/src/features/**`
- **description**: Build entry gating, player threshold, countdown, and poorest-player selection after auth and wallet rules exist. This is the hub story for game lifecycle.
- **validation**: Authenticated users join lobby, get wallets, are eligible for reaping, and game start selection behaves deterministically across clients with synchronized countdown/announcement behavior and reconnect-safe snapshot recovery.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-45: AI Taunt & Personality System
- **depends_on**: [TOR-36, TOR-39, TOR-42]
- **location**: `apps/server/src/features/**`, `packages/ai/**`, `apps/web/src/features/**`
- **description**: Attach narrative/LLM behavior only after combat, economy, and lobby/reaping events exist, because the story explicitly includes betting, economic shifts, and reaping/lobby triggers.
- **validation**: Taunts trigger from concrete combat, betting, economic, and reaping events with bounded frequency and safe fallback behavior.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-40: Freedom Pass Mechanism
- **depends_on**: [TOR-36, TOR-39, TOR-42]
- **location**: `apps/server/src/features/**`, `apps/web/src/features/**`
- **description**: Implement the first-death economic branch once both death-capable combat and wallet rules exist.
- **validation**: First death triggers richest-spectator offer exactly once using actual spectator/lobby roles; purchase rewrites wallet state and grants exit capability.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-43: Victory, Death & Eternal Spectator States
- **depends_on**: [TOR-36, TOR-42]
- **location**: `apps/server/src/features/**`, `apps/web/src/features/**`
- **description**: Finish the lifecycle transitions after combat and lobby/reaping both exist. This is the hard gate for all post-death/session narratives.
- **validation**: Death, spectator conversion, next reaping, AI defeat, and game-end conditions all execute from authoritative state.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-49: Betting Window & Economic Display UI
- **depends_on**: [TOR-39, TOR-40, TOR-41, TOR-42, TOR-47, TOR-48]
- **location**: `apps/web/src/features/**`, `apps/web/src/modules/ui/**`
- **description**: Build the public economy surface only after betting logic, freedom-pass mechanics, lobby/reaping lifecycle data, leaderboard data, streaming transport, and design system all exist.
- **validation**: Countdown, wallet, leaderboard, reaping target, freedom-pass offer, and bet submission UI render and update live against real backend data.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-50: Game State Display & Animations
- **depends_on**: [TOR-36, TOR-38, TOR-43, TOR-47, TOR-48]
- **location**: `apps/web/src/features/**`, `apps/web/src/modules/ui/**`
- **description**: Build the core game presentation after combat state, timing/history, death-state semantics, streaming transport, and visual foundation are stable.
- **validation**: HP bars, turn state, magazine state, action history, death-state visuals, and dramatic effects stay in sync with real game events.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-44: Session & Mid-Game Arrival Management
- **depends_on**: [TOR-42, TOR-43]
- **location**: `apps/server/src/features/**`, `apps/web/src/app/**`, `apps/web/src/features/**`
- **description**: Close lifecycle gaps only after basic lobby/reaping and death/end-state logic are correct.
- **validation**: Mid-game arrivals join safely, cannot bet early, become eligible at the correct time, and game cleanup prevents stale sessions.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### TOR-46: Narrative Framing & Thematic Integration
- **depends_on**: [TOR-43, TOR-45]
- **location**: `apps/web/src/app/**`, `apps/web/src/features/**`, copy/content assets as needed
- **description**: Apply thematic framing only after death/spectatorship mechanics and taunt voice both exist, otherwise the theme stays decorative rather than systemic.
- **validation**: Lobby, active play, death, and spectatorship all consistently express the intended narrative.
- **status**: Not Completed
- **log**:
- **files edited/created**:

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | TOR-33, TOR-36, TOR-39, TOR-48 | Immediately |
| 2 | TOR-47 | TOR-33 policy finalized; TOR-36 and TOR-39 event vocabulary available for contract freeze |
| 3 | TOR-37, TOR-38, TOR-42 | Relevant Wave 1 and Wave 2 dependencies complete |
| 4 | TOR-40, TOR-41, TOR-43, TOR-45 | Relevant Wave 3 dependencies complete |
| 5 | TOR-49, TOR-50 | Relevant Wave 4 dependencies complete |
| 6 | TOR-44, TOR-46 | Relevant Wave 5 dependencies complete |

## Wave Notes

- `TOR-33` and `TOR-47` should not be owned by separate agents at the same time if both touch `apps/server/src/modules/http/*`. Final auth/cookie/CORS policy must land before streaming extends the same surface.
- `TOR-47` should be treated as two internal sub-phases even if kept as one Linear story:
  - scaffold: connection/auth/reconnect/snapshot plumbing
  - contract freeze: event payloads finalized after `TOR-36` and `TOR-39` define canonical domain events
- `TOR-41` must not invent reaping-target logic independently. That data belongs to lifecycle state from `TOR-42` and later `TOR-43`.
- `TOR-50` should not implement death visuals from mocks. It should consume the finalized lifecycle/death semantics from `TOR-43`.

## Recommended Swarm Slices

| Slice | Primary stories | Why these belong together |
|------|------|------|
| Auth/entry | TOR-33 | Isolated package/server/web auth boundary |
| Core game backend | TOR-36, TOR-37, TOR-38 | Shared combat state/event model |
| Economy backend | TOR-39, TOR-40, TOR-41 | Shared wallet, bet, payout, ranking logic |
| Lifecycle/backend orchestration | TOR-42, TOR-43, TOR-44 | Shared lobby, reaping, death, session state |
| AI narrative backend | TOR-45 | Mostly independent once combat events exist |
| Realtime transport | TOR-47 | Cross-cutting infra enabling multiple slices |
| Design system/UI foundation | TOR-48 | Frontend-only reusable base |
| Economy frontend | TOR-49 | Depends on economy + realtime + design system |
| Core game frontend | TOR-50 | Depends on combat + timing/history + realtime + design system |
| Final thematic pass | TOR-46 | Best done after lifecycle and taunt system stabilize |

## Dependency Corrections I Recommend In Linear

1. Add `TOR-47` as a blocker for `TOR-38`.
   Reason: the story acceptance explicitly includes event broadcasting.
2. Add `TOR-42` and `TOR-47` as blockers for `TOR-41`.
   Reason: live "next reaping target" is lifecycle-owned, not wallet-owned.
3. Add `TOR-42` as a blocker for `TOR-40`.
   Reason: spectator identity and offer timing require lobby/reaping roles.
4. Add `TOR-47` as a blocker for `TOR-42`.
   Reason: synchronized countdown, announcement, and transition behavior are transport-dependent.
5. Add `TOR-39` and `TOR-42` as blockers for `TOR-45`.
   Reason: the story explicitly includes betting/economic/reaping/lobby taunt triggers.
6. Add `TOR-40`, `TOR-42`, and `TOR-47` as blockers for `TOR-49`.
   Reason: the story includes freedom-pass UI, reaping target, and live countdown/wallet updates.
7. Add `TOR-43` and `TOR-47` as blockers for `TOR-50`.
   Reason: death-state visuals and live event display need finalized lifecycle semantics and streaming.

## Testing Strategy

- Validate each backend wave with server-side state tests before UI agents consume it.
- Freeze event payloads only after `TOR-36` and `TOR-39` define canonical domain events, because `TOR-47` is transport infra and should not guess gameplay/economy vocabulary.
- Keep UI waves dependent on real transport/data contracts, not mocks, otherwise integration debt gets pushed to the end.
- Prefer one agent family per architectural seam to minimize collisions:
  - server gameplay/economy/lifecycle
  - server transport
  - web design system
  - web feature surfaces
- Add explicit validation for:
  - reconnect with snapshot recovery
  - duplicate event suppression
  - stale subscription teardown on game end
  - late joiner snapshot correctness
  - reconnect during betting-window closure
  - idempotent session cleanup for `TOR-44`

## Risks & Mitigations

- Risk: Too many Wave 1 stories start at once and define competing event/data contracts.
  Mitigation: Do not let `TOR-47` freeze domain payloads before `TOR-36` and `TOR-39` define them; treat transport as scaffold-first, contract-freeze second.
- Risk: Auth and streaming work collide in the same server HTTP module surface.
  Mitigation: Sequence `TOR-33` before `TOR-47`, or assign one owner to `apps/server/src/modules/http/*`.
- Risk: UI stories start from mocks because backend stories are nominally "dependent" but not behaviorally complete.
  Mitigation: Gate `TOR-49` and `TOR-50` on transport + real data contracts, not only on domain logic stories.
- Risk: `TOR-42` closes with fake/non-final taunt behavior.
  Mitigation: Default decision for execution: deterministic reaping announcement is acceptable in `TOR-42`; keep `TOR-45` independent and do not block lobby on LLM taunts.
- Risk: `TOR-49` absorbs freedom-pass UI scope before the mechanic exists.
  Mitigation: Default decision for execution: make `TOR-40` a hard blocker because the story scope explicitly includes freedom-pass offer UI.
