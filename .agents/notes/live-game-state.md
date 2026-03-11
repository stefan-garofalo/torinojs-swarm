# Live Game State

For game features, Postgres is not the live source of truth. Keep auth and future durable stats in Postgres, but keep active game/session state in Redis so wallets, bets, and round state stay server-authoritative and shared across requests/instances.

Frontend should not talk to Redis directly. The server owns Redis reads/writes and exposes a versioned snapshot plus event contract; later realtime transport should patch or invalidate client cache from that contract rather than invent a second source of truth in the browser.

For Next.js frontend work, treat live wallet/session state as dynamic data. Cached shells are fine, but do not put user-specific economy/session reads behind `'use cache'`; use server boundaries for auth/session lookup and TanStack Query for client-side server-state caching.
