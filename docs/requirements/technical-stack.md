# Technical Stack

## Technology Choices

### Frontend

**React + Effect.ts**
- React for UI components
- Effect.ts for state management, data flow, and functional patterns
- Type-safe, composable architecture

**UI Framework: 8bitcn**
- Pixel art variant of shadcn/ui
- Based on: https://www.8bitcn.com/
- Provides dungeon/retro aesthetic out of box
- Further customizable for dark dystopian theme

**Styling:**
- CSS-based pixel art animations
- Retro terminal aesthetic
- CRT effects (scan lines, glow)
- Dark color palette

### Backend

**Effect.ts Services**
- Game state management
- Betting resolution logic
- Reaping selection
- Wallet operations
- Layered architecture (Auth → Game Logic → AI → Persistence)

**AI SDK (Vercel AI SDK)**
- LLM integration for AI opponent
- Structured output for game decisions
- Taunt generation
- Natural language processing for taunts

**Runtime:**
- Node.js backend
- Effect runtime for service orchestration

### Persistence

**Neon Postgres**
- User authentication data (GitHub OAuth)
- Optional: Player statistics (games played, deaths, victories)
- **Not used for:** Wallets (ephemeral), game state (Redis)

**Redis**
- Active game state (current game instance)
- Player/spectator wallets (session-only)
- Magazine state, HP, turn order
- Bets (locked during round, cleared after resolution)
- Purged on game end

### Authentication

**GitHub OAuth**
- Access gate for application
- Provider: GitHub (familiar to tech audience)
- No password management
- User data: ID, username, avatar URL

---

## Architecture Approach

### Effect.ts Service Layers

**Proposed structure** (to be refined during implementation):

```typescript
// Layer 1: Persistence
- PostgresService (user auth, optional stats)
- RedisService (game state, wallets, bets)

// Layer 2: Core Domain
- WalletService (assign, update, query)
- GameStateService (HP, magazines, turns)
- BettingService (place, lock, resolve)
- ReapingService (select poorest, trigger)

// Layer 3: AI Integration
- AIOpponentService (decision-making via LLM)
- TauntService (generate contextual taunts)

// Layer 4: Game Orchestration
- GameLoopService (coordinate rounds, turns)
- LobbyService (player joins, auto-start)

// Layer 5: Real-time Sync
- StreamService (push updates to frontend)
```

**Benefits of Effect.ts:**
- Service dependencies explicit
- Error handling built-in (fallible operations)
- Retries for AI calls (transient failures)
- Testable layers
- Type-safe throughout

---

## Real-Time State Sync

### Paradigm (To Be Decided)

**Options under consideration:**

**1. Server-Sent Events (SSE)**
- Simpler than WebSockets
- One-way server → client (sufficient for spectators)
- Effect streams can expose SSE endpoints
- Client receives updates, renders

**2. WebSockets**
- Bidirectional (betting requires client → server)
- More complex setup
- Enables instant bet placement feedback

**3. Hybrid**
- SSE for game state updates
- HTTP POST for betting
- Polling for leaderboard (if needed)

**Decision criteria:**
- Betting requires low-latency client → server (POST or WebSocket)
- Game updates are high-frequency (SSE or WebSocket)
- Effect.ts Stream compatibility

**Current lean:** Decide during implementation based on Effect patterns

---

## Data Models

### User (Postgres)

```typescript
{
  id: string              // GitHub user ID
  username: string        // Display name
  avatarUrl: string       // Profile picture
  createdAt: timestamp
  // Optional stats:
  gamesPlayed?: number
  timesReaped?: number
  victories?: number
}
```

### Game State (Redis)

```typescript
{
  gameId: string
  status: 'lobby' | 'active' | 'ended'

  // Participants
  activePlayer: {
    userId: string
    hp: number
    isDead: boolean
  }

  ai: {
    hp: number
    ejectUsedThisMagazine: boolean
  }

  spectators: Array<{
    userId: string
    wallet: number
    isDead: boolean
    isExited: boolean
  }>

  // Current round
  magazine: {
    totalChambers: number
    livesRemaining: number
    blanksRemaining: number
    currentChamber: number
  }

  turn: 'player' | 'ai'

  // Economy
  freedomPassUsed: boolean

  // Betting
  activeBets: Array<{
    userId: string
    betType: string
    amount: number
    round: number
  }>

  roundHistory: Array<{
    round: number
    action: string
    result: string
  }>
}
```

### Wallet State (Redis, per-user)

```typescript
{
  userId: string
  gameId: string
  balance: number
  lockedFunds: number  // Sum of active bets
  availableBalance: number  // balance - lockedFunds
}
```

---

## AI Integration

### LLM Provider

**To be decided:**
- OpenAI (GPT-4, structured output support)
- Anthropic Claude (strong at following constraints)
- Other (Gemini, Mistral, etc.)

**Selection criteria:**
- Structured output support (game decisions)
- Latency (turns should be responsive)
- Cost (demo context, not production scale)
- AI SDK compatibility

### AI Decision Pipeline

**Turn decisions:**
1. Game state sent to LLM (HP, magazine composition, probabilities)
2. System prompt: AI personality, goals, strategies
3. Structured output: `{ action: 'shoot_opponent' | 'shoot_self' | 'eject', reasoning: string }`
4. Action executed in game
5. Optional: Reasoning logged for debugging

**Taunt generation:**
1. Event trigger (hit, miss, bet resolution, etc.)
2. Context sent to LLM (event type, participants, economic state)
3. System prompt: Cynical tone, gaslighting style
4. Response: Short taunt string
5. Display in UI

**Frequency control:**
- LLM self-regulates via system prompt
- Fallback: Rate limiting in backend (max taunts per minute)

---

## Deployment Considerations

**Target environment:**
- Demo for TorinoJS conference
- Not production-grade initially
- Scalability not primary concern

**Hosting options (TBD):**
- Vercel (frontend + serverless backend)
- Railway (Postgres, Redis, backend)
- Neon Postgres (managed)
- Upstash Redis (serverless)

**Secrets management:**
- GitHub OAuth credentials
- LLM API keys
- Database connection strings
- Environment variables

---

## Development Workflow

### Monorepo Structure

Based on current project context:
- `apps/web` - Frontend (React + Effect.ts)
- `apps/api` - Backend (Effect.ts services)
- `packages/shared` - Shared types, schemas
- `docs/requirements` - This documentation

### Tooling

**Package manager:** pnpm (monorepo support)
**Build tool:** TBD (Vite, Next.js, etc.)
**Type checking:** TypeScript strict mode
**Linting:** ESLint + Effect.ts rules
**Testing:** Vitest (Effect.ts compatible)

---

## Performance Considerations

### State Updates

**Optimize for:**
- Fast leaderboard updates (frequent wallet changes)
- Low-latency betting (10s window is tight)
- Smooth UI transitions (HP changes, magazine updates)

**Strategies:**
- Redis for ephemeral state (fast reads/writes)
- Effect streams for efficient push updates
- Minimal Postgres queries (auth only)
- Client-side optimistic updates (bets)

### Scaling (Future)

Currently single-game instance (4-20 players estimated).

**If scaling to multiple concurrent games:**
- Redis pub/sub for game-specific channels
- Game instance sharding
- Load balancer for WebSocket/SSE connections

Not required for MVP/demo.

---

## Security Considerations

### Authentication

- GitHub OAuth only (no password storage)
- Session tokens (HTTP-only cookies)
- CSRF protection

### Input Validation

- Bet amounts: min/max, wallet balance check
- Action validation: turn order, action legality
- Rate limiting: prevent bet spam

### Wallet Integrity

- Server-authoritative (no client-side wallet manipulation)
- Atomic operations (Effect transactions)
- Audit trail (optional: log all wallet changes)

### LLM Safety

- System prompts sanitized (no user input injection)
- Output validation (structured output schema)
- Fallback responses if LLM fails/times out

---

## Open Technical Decisions

To be resolved during implementation:

1. **Real-time paradigm:** SSE, WebSocket, or hybrid?
2. **LLM provider:** OpenAI, Anthropic, other?
3. **Frontend framework:** Plain React, Next.js, Remix?
4. **Build tool:** Vite, Next.js, other?
5. **Hosting:** Vercel, Railway, self-hosted?
6. **Redis provider:** Upstash, Railway, self-hosted?
7. **Animation library:** Pure CSS, Framer Motion, other?
8. **Testing strategy:** Unit tests, integration tests, E2E?

**Decide based on:**
- Effect.ts compatibility
- Development speed (demo timeline)
- Team familiarity
- Cost constraints
