# The Reaping - Project Requirements

**A dystopian AI vs human Russian roulette game with forced spectatorship and economic consequences.**

---

## Overview

The Reaping is a web-based multiplayer game where players are forced into a deadly game of Russian roulette against an AI opponent. Spectators must watch and bet on the outcome, with the poorest spectator being "reaped" to play next. The game explores themes of AI dominance, economic inequality, and forced participation through a darkly cynical lens.

---

## Documentation Structure

This requirements documentation is organized into focused sections. Read them in order for full context:

### 1. [Concept & Theme](./concept.md)
The dystopian vision, narrative framing, aesthetic direction, and AI personality.

### 2. [Game Structure](./game-structure.md)
Core gameplay definitions: sets, rounds, magazines, HP system, and AI mechanics.

### 3. [Economy System](./economy.md)
Wallet distribution, betting mechanics, freedom pass, and leaderboard rules.

### 4. [Game Flow](./game-flow.md)
Complete player journey: lobby, reaping, gameplay, victory/death states, and session lifecycle.

### 5. [Technical Stack](./technical-stack.md)
Technology choices, architecture approach, and persistence layers.

### 6. [Magic Numbers](./magic-numbers.md)
Game balance values to be defined and tracked (placeholders for future tuning).

### 7. [Future Considerations](./future-considerations.md)
Open questions, bet types catalog, taunt examples, and iteration areas.

---

## Quick Reference

**Tech Stack:**
- Frontend: React, Effect.ts, 8bitcn (shadcn pixel art)
- Backend: Effect.ts, AI SDK (LLM integration)
- Persistence: Neon Postgres (auth), Redis (game state)
- Auth: GitHub OAuth

**Core Mechanics:**
- 5 HP each (player & AI)
- Random magazine size & live/blank ratio
- AI can eject one round per magazine
- 10-second betting window per round
- Minimum 4 players to start

**Economic System:**
- Random starting wallets (bell curve)
- Poorest spectator gets reaped
- Richest can buy freedom (end of game only)
- Wallets ephemeral (reset each game session)

---

## Project Status

**Current Phase:** Requirements definition
**Next Steps:** Define magic numbers, bet types catalog, implement foundation
