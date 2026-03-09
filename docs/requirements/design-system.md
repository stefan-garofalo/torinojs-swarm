# Design System Contract

## Purpose

`TOR-48` establishes the shared visual contract for the Reaping web app:

- dark-only palette
- local `8bit` primitives under `apps/web/src/modules/ui/8bit`
- CRT / terminal atmosphere
- responsive cabinet-style layout

Later UI stories should extend this system rather than replace it.

## Reuse Rules

- `TOR-49` and `TOR-50` should compose from the local `8bit` primitives first.
- Reuse the token set from `apps/web/src/index.css`; do not introduce a second palette.
- Use motion as a state cue:
  - pulse for urgency
  - soft flicker for ambient tension
  - leave gameplay-specific transitions to the stories that own them
- Keep the app dark-only unless a later issue explicitly changes theme policy.

## Boundary

`TOR-48` owns:

- tokens
- typography
- shell styling
- auth reskin
- design-system showcase
- primitive layer

`TOR-48` does not own:

- betting widgets
- HP bars
- countdown displays
- action logs
- combat or death-scene animation logic

Those belong to `TOR-49` and `TOR-50`.
