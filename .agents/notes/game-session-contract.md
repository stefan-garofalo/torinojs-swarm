# Game Session Contract

The shared Redis game session document is a coupling point across TOR-39 and TOR-36, so keep the exported surface small and stable. `@reaping/redis` should expose the envelope plus a few helpers (`getGameSession`, `createGameSession`, CAS-style `updateGameSession`) instead of leaking raw Upstash clients or ad-hoc storage primitives into feature code.

Keep session key namespace and TTL policy inside `@reaping/redis`, not duplicated in features. Keep the phase enum exact (`idle | betting | action | resolution | ended`) once another issue has aligned to it, or coordinated merges become painful.
