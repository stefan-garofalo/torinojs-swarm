# Plan: TOR-48 8bitcn Pixel Art Foundation & Aesthetic

**Generated**: 2026-03-09
**Issue**: `TOR-48`
**Issue URL**: `https://linear.app/stefan-projects/issue/TOR-48/8bitcn-pixel-art-foundation-and-aesthetic`
**Branch**: `stefangarofalo/tor-48-8bitcn-pixel-art-foundation-aesthetic`

## Overview

Initial situation:
- `apps/web` is still base shadcn with neutral/light-capable tokens, Geist fonts, and no `8bitcn` integration.
- Current visible surfaces are minimal: shell/header, home demo page, login/auth pages.
- `TOR-49` and `TOR-50` both depend on `TOR-48`, so this story must establish reusable UI foundation only.

Issue:
- The issue requires `8bitcn` integration, a dark palette, CRT scan lines, terminal effects, CSS animation, a documented design system, and responsive foundations.
- None of that is present in the current repo state.

Solution:
- Build a dark-only retro UI foundation for `apps/web`.
- Add a dedicated in-app design-system showcase route.
- Vendor a minimal local set of `8bitcn`-style primitives under repo conventions.
- Apply the foundation to existing shell/auth surfaces so later stories reuse proven primitives instead of re-styling from scratch.

Source context checked before planning:
- `README.md`
- `docs/requirements/index.md`
- `docs/requirements/concept.md`
- `docs/requirements/technical-stack.md`
- `apps/web/src/index.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/modules/ui/header.tsx`
- `apps/web/src/modules/app/providers.tsx`
- `opensrc/repos/github.com/TheOrcDev/8bitcn-ui`

Chosen defaults:
- Theme policy: dark-only
- Documentation surface: dedicated in-app showcase route
- `8bitcn` usage model: copy/adapt a minimal local primitive set into repo-owned modules, do not make feature code depend on upstream demo import paths

## Prerequisites

- Bun workspace install is healthy
- `apps/web` remains the owner of UI foundation work
- Existing shadcn alias convention stays intact:
  - `@/modules/ui`
  - `@/modules/ui/utils`
- Later issue work for `TOR-49` and `TOR-50` is not started inside this story

## Dependency Graph

```text
T1 ──┐
T2 ──┼── T4 ── T5
T3 ──┘
```

Phase gates:
- Phase 1 complete when T1 and T2 compile and the showcase route renders.
- Phase 2 complete when T3 and T4 pass CLI checks and browser review on current app surfaces.
- Phase 3 complete when T5 documents the reusable contract for downstream UI stories.

## Tasks

### T1: Create the design-system showcase route
- **depends_on**: []
- **location**: `apps/web/src/app/design-system/*`, `apps/web/src/modules/ui/header.tsx`, `apps/web/src/app/page.tsx`
- **description**: Add a dedicated `/design-system` route and a shell nav entry. The route should be a living UI contract for palette, typography, controls, surfaces, overlays, motion, and responsive examples. Keep this route framework-level and reusable; do not add betting, HP, timer, or action-log product features.
- **validation**: `/design-system` renders successfully, is reachable from the shared shell, and contains visible sections for `Palette`, `Typography`, `Controls`, `Surfaces`, `Motion`, and `Responsive`.
- **status**: Completed
- **log**: Added `/design-system` as a living showcase route, exposed it in the shared header nav, and validated the route headings with a dedicated render test plus browser review.
- **files edited/created**: `apps/web/src/app/design-system/page.tsx`, `apps/web/src/app/design-system/page.test.tsx`, `apps/web/src/modules/ui/header.tsx`
- **backlog_item_id**: `TOR-52`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-52/tor-48-t1-design-system-showcase-route`
- **relation_mode**: native
- **tdd_target**: First failing test renders the route and expects visible headings for `Palette`, `Controls`, and `Motion`.
- **review_mode**: mixed

### T2: Integrate a minimal local 8bitcn primitive set
- **depends_on**: []
- **location**: `apps/web/components.json`, `apps/web/src/modules/ui/8bit/*`, `apps/web/src/modules/ui/utils.ts`, `apps/web/package.json`
- **description**: Pull only the primitives required for foundation work from the `8bitcn` registry model, then normalize them into repo-local modules under `src/modules/ui/8bit`. Initial primitive scope should cover panel/card, button, input, label, and one compact status/display primitive. Preserve repo aliases and naming so later UI stories import from local modules only.
- **validation**: Local `8bit` primitives compile, can be imported from app code, and do not require upstream import paths such as `@/components/ui/8bit`.
- **status**: Completed
- **log**: Wired the `@8bitcn` registry into `components.json`, created repo-local `8bit` primitives plus retro styles, and added local import tests to prove the foundation compiles without upstream paths.
- **files edited/created**: `apps/web/components.json`, `apps/web/src/modules/ui/8bit/button.tsx`, `apps/web/src/modules/ui/8bit/card.tsx`, `apps/web/src/modules/ui/8bit/input.tsx`, `apps/web/src/modules/ui/8bit/label.tsx`, `apps/web/src/modules/ui/8bit/badge.tsx`, `apps/web/src/modules/ui/8bit/index.ts`, `apps/web/src/modules/ui/8bit/styles/retro.css`, `apps/web/src/modules/ui/8bit/8bit.test.tsx`, `apps/web/src/modules/ui/8bit/primitives.test.tsx`
- **backlog_item_id**: `TOR-53`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-53/tor-48-t2-local-8bitcn-primitive-import`
- **relation_mode**: native
- **tdd_target**: First failing test imports one local `8bit` primitive and proves it renders via the repo-local path without runtime error.
- **review_mode**: cli

### T3: Establish the dark-only Reaping theme contract
- **depends_on**: []
- **location**: `apps/web/src/index.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/modules/app/providers.tsx`, `apps/web/src/modules/theme/*`
- **description**: Replace the current neutral/light-capable token setup with a dark-only palette centered on blacks, grays, and deep reds. Switch typography to a retro/monospace-forward stack compatible with the `8bitcn` feel. Add shared CSS utilities for scanlines, glow, noise, terminal text treatment, and restrained flicker/motion. Remove the light/dark/system toggle and any theme behavior that keeps light mode alive.
- **validation**: The app loads in dark mode by default, the theme selector is gone, and global retro effects are present without blocking input or making text illegible.
- **status**: Completed
- **log**: Converted the shell to dark-only, removed theme-provider usage, updated layout typography/tokens/effects, and made the toaster match the new theme contract. Verified with scoped tests and browser review.
- **files edited/created**: `apps/web/src/index.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/modules/app/providers.tsx`, `apps/web/src/modules/ui/sonner.tsx`, `apps/web/src/modules/theme/theme-contract.test.tsx`, `apps/web/src/modules/ui/header.test.tsx`
- **backlog_item_id**: `TOR-54`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-54/tor-48-t3-dark-only-retro-theme-contract`
- **relation_mode**: native
- **tdd_target**: First failing test verifies the shared shell no longer renders the theme selector and that the app defaults to the dark theme contract.
- **review_mode**: mixed

### T4: Apply the foundation to existing visible surfaces
- **depends_on**: [T1, T2, T3]
- **location**: `apps/web/src/modules/ui/header.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/login/page.tsx`, `apps/web/src/modules/auth/components/*`
- **description**: Reskin the existing shell, home page, and auth pages using the new primitives and theme utilities. Keep current navigation and auth behavior intact. Shift copy/layout toward the dystopian-retro tone only where needed to prove the foundation works on real screens.
- **validation**: Home, login, and header all use the shared retro foundation, remain functional, and are responsive without overflow or broken interaction states.
- **status**: Completed
- **log**: Reskinned the header, home screen, login route, sign-in/sign-up forms, and user menu to use the new retro foundation. Fixed the TanStack Form subscribe runtime bug found during mobile browser validation.
- **files edited/created**: `apps/web/src/modules/ui/header.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/login/page.tsx`, `apps/web/src/modules/auth/components/sign-in-form.tsx`, `apps/web/src/modules/auth/components/sign-up-form.tsx`, `apps/web/src/modules/auth/components/user-menu.tsx`
- **backlog_item_id**: `TOR-55`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-55/tor-48-t4-shared-shell-and-auth-reskin`
- **relation_mode**: native
- **tdd_target**: First failing render test proves the landing page and auth shell consume shared retro panel/control primitives while preserving the current sign-in/sign-up toggle behavior.
- **review_mode**: mixed

### T5: Finalize design-system documentation and downstream handoff
- **depends_on**: [T1, T4]
- **location**: `apps/web/src/app/design-system/*`, `docs/requirements/*` or a focused web design-system note
- **description**: Finish the showcase with token examples, component states, overlay treatments, motion rules, and mobile behavior. Add explicit downstream guidance so `TOR-49` and `TOR-50` know what to reuse, what not to rebuild, and where the foundation boundary ends.
- **validation**: `/design-system` demonstrates palette, typography, controls, surfaces, overlays, motion, and responsive behavior, and the accompanying note clearly states the reuse contract for later UI stories.
- **status**: Completed
- **log**: Filled the showcase with palette, typography, controls, surfaces, motion, and responsive examples, then added a downstream design-system note for TOR-49 and TOR-50 reuse boundaries.
- **files edited/created**: `apps/web/src/app/design-system/page.tsx`, `docs/requirements/design-system.md`
- **backlog_item_id**: `TOR-56`
- **backlog_item_url**: `https://linear.app/stefan-projects/issue/TOR-56/tor-48-t5-design-system-documentation-and-downstream-handoff`
- **relation_mode**: native
- **tdd_target**: First failing test expects the showcase to expose sections for `Typography`, `Surfaces`, `Overlays`, `Motion`, and `Responsive`.
- **review_mode**: mixed

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T1, T2, T3 | Immediately |
| 2 | T4 | T1, T2, T3 complete |
| 3 | T5 | T1, T4 complete |

## Validation Gates

### Phase 1 gate
- Route render tests for `/design-system` pass
- Local `8bit` primitives compile through repo-local imports
- `bun run check-types:web` passes

### Phase 2 gate
- `bun run check-types:web` passes
- `bun run lint:web` passes
- Browser review passes on `/design-system`, `/`, and `/login`
- Desktop and mobile widths show no horizontal overflow or clipped pixel borders

### Phase 3 gate
- The showcase fully demonstrates the foundation contract
- The downstream reuse note is explicit enough that `TOR-49` and `TOR-50` can start without re-deciding tokens, primitive imports, or motion language

## Testing Strategy

- Prefer vertical slices:
  - one failing render/behavior test
  - minimal implementation to green
  - then move to the next public behavior
- Use Bun test for render/spec coverage where feasible
- Use repo commands:
  - `bun run check-types:web`
  - `bun run lint:web`
- Use browser review for visual/interactive validation:
  - `/design-system`
  - `/`
  - `/login`
- Check both desktop and narrow mobile viewport behavior
- Specifically verify:
  - dark-only policy is enforced
  - theme toggle removed
  - CRT/scanline layers do not block interaction
  - retro styles remain readable and accessible enough for demo use

## Scope Guards

- In scope:
  - visual tokens
  - typography
  - shared primitives
  - shell/auth reskin
  - CRT/terminal effects
  - responsive foundation
  - living design-system documentation
- Out of scope:
  - betting window UI
  - wallet UI
  - leaderboard UI
  - HP bars
  - countdown widgets
  - action log feed
  - combat state animations specific to gameplay
  - any `TOR-49` or `TOR-50` domain feature implementation

## Backlog Sync Plan

- Backlog target: Linear team `TOR`, parent issue `TOR-48`
- Child issues to create when syncing:
  - `TOR-48 / T1 Design-system showcase route`
  - `TOR-48 / T2 Local 8bitcn primitive import`
  - `TOR-48 / T3 Dark-only retro theme contract`
  - `TOR-48 / T4 Shared shell and auth reskin`
  - `TOR-48 / T5 Design-system documentation and downstream handoff`
- Preferred sync command shape:
  - `linear issue create --team TOR --parent TOR-48 ...`
- Dependency tracking:
  - use native parent/child hierarchy in Linear
  - if blocker relations are required, add them separately via GraphQL because CLI `1.9.1` does not expose issue relation creation

## Risks & Mitigations

- **Risk**: Upstream `8bitcn` examples assume different import paths and broader registry adoption.
- **Mitigation**: Keep all adopted primitives local and minimal; normalize imports to repo conventions immediately.

- **Risk**: CRT effects degrade readability or interfere with clicks.
- **Mitigation**: Keep scanlines/noise as non-interactive overlays and verify readable contrast on real app screens.

- **Risk**: Theme removal breaks assumptions in provider or toaster code.
- **Mitigation**: Treat theme-policy change as a public behavior slice and validate shell rendering before broader reskin work.

- **Risk**: The showcase route drifts into product UI.
- **Mitigation**: Keep showcase sections foundation-only and explicitly defer domain widgets to `TOR-49` and `TOR-50`.

## Assumptions

- Dark-only is the intended final theme policy for this story.
- The required "design system documented" acceptance criterion is satisfied by a dedicated in-app showcase, optionally with a short supplemental repo note.
- `TOR-48` is complete once the foundation is reusable and validated on existing surfaces; later game-specific UI stories will build on it rather than extend its scope.
