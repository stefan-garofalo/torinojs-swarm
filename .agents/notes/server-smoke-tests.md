# Server Smoke Tests

Keep `apps/server/src/app.smoke.test.ts` on HTTP-visible behavior only. It is the server contract smoke suite, not the place to drive deep game-state setup through internal betting helpers.

The richer game lifecycle already has better coverage in `packages/api/src/features/game/*.test.ts`, where opening windows, placing bets, idempotency, and settlement can be exercised directly. Duplicating that setup in the server smoke test makes rebases brittle because route/auth/env changes can break helper-based setup even when the public HTTP contract still works.
