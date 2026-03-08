#!/usr/bin/env tsx
/**
 * Create Linear Stories for The Reaping Project
 *
 * This script creates 20 consolidated high-level stories in Linear
 * from the requirements documentation.
 *
 * Usage: pnpm tsx scripts/create-linear-stories.ts
 */

import { execSync } from 'child_process';

const PROJECT_ID = '22c63845669e';

interface Story {
  title: string;
  description: string;
  labels: string[];
  priority?: number;
}

const stories: Story[] = [
  // Foundation & Infrastructure (5 stories)
  {
    title: 'Monorepo Setup & Package Architecture',
    labels: ['foundation', 'infrastructure'],
    priority: 1,
    description: `Configure pnpm workspace with apps/packages structure, TypeScript strict mode, shared configs, and turbo build pipeline. Establish project foundation for all subsequent work.

**Dependencies**: None (foundational)

## Acceptance Criteria
- [ ] pnpm workspace configured with \`apps/\` and \`packages/\` structure
- [ ] TypeScript strict mode enabled with shared tsconfig
- [ ] Turbo build pipeline working for all packages
- [ ] ESLint + Effect.ts rules configured
- [ ] Development scripts (\`dev\`, \`build\`, \`check-types\`) functional`,
  },
  {
    title: 'Database & Persistence Layer',
    labels: ['foundation', 'infrastructure'],
    priority: 1,
    description: `Set up Neon Postgres for auth/user data and Redis for ephemeral game state. Create Effect.ts service layer (PostgresService, RedisService) following established patterns.

**Dependencies**: Story 1 (Monorepo Setup)

## Acceptance Criteria
- [ ] Neon Postgres database provisioned and connected
- [ ] Redis instance (Upstash/Railway) provisioned and connected
- [ ] PostgresService implemented as Effect.Service
- [ ] RedisService implemented as Effect.Service
- [ ] Connection health checks working
- [ ] Database schema migrations set up`,
  },
  {
    title: 'Authentication System',
    labels: ['foundation', 'auth'],
    priority: 1,
    description: `Implement GitHub OAuth with better-auth, session management via HTTP-only cookies, CSRF protection, and rate limiting. No anonymous access allowed.

**Dependencies**: Story 2 (Database Layer)

## Acceptance Criteria
- [ ] GitHub OAuth flow working (login/logout)
- [ ] Session management with HTTP-only cookies
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] User persistence in Postgres
- [ ] Protected route middleware functional`,
  },
  {
    title: 'Deployment & Hosting Infrastructure',
    labels: ['foundation', 'devops'],
    priority: 1,
    description: `Configure hosting platform (Vercel/Railway/self-hosted), environment secrets management, and CI/CD pipeline. Ensure production-ready deployment.

**Dependencies**: Stories 1-3 (Full foundation stack)

## Acceptance Criteria
- [ ] Hosting platform configured
- [ ] Environment secrets properly managed
- [ ] CI/CD pipeline for automated deployments
- [ ] Production database connections working
- [ ] Health check endpoints functional
- [ ] Monitoring/logging set up`,
  },
  {
    title: 'AI SDK Integration Foundation',
    labels: ['foundation', 'ai'],
    priority: 1,
    description: `Configure LLM provider (OpenAI/Anthropic), set up structured output schema validation with Zod, create AIService layer with Effect.ts, and implement LLM output validation/error handling.

**Dependencies**: Story 1 (Monorepo Setup)

## Acceptance Criteria
- [ ] LLM provider configured with API keys
- [ ] Structured output schema defined (Zod)
- [ ] AIService implemented as Effect.Service
- [ ] LLM output validation working
- [ ] Error handling for API failures
- [ ] Test endpoint for LLM connectivity`,
  },

  // Core Game Mechanics (3 stories)
  {
    title: 'Russian Roulette Core Loop',
    labels: ['game', 'core-mechanics'],
    priority: 2,
    description: `Implement turn-based alternating shots (player/AI), magazine-driven rounds with random size and live/blank ratio, HP system (5 each, 1 damage per live round), three action types (shoot opponent, shoot self, AI-eject), self-shot blank bonus turn, continuous reload until 0 HP, and game state machine.

**Dependencies**: Story 2 (Database Layer for state persistence)

## Acceptance Criteria
- [ ] Turn-based system alternating between player and AI
- [ ] Magazine generation (random size/ratio, TBD bounds)
- [ ] HP tracking (5 each, damage on hit, victory/defeat detection)
- [ ] Three actions implemented (shoot opponent, shoot self, eject)
- [ ] Self-shot blank grants extra turn
- [ ] Magazine reload triggers correctly
- [ ] Game state machine (idle → betting → action → resolution)
- [ ] State persisted in Redis`,
  },
  {
    title: 'AI Opponent System',
    labels: ['game', 'ai'],
    priority: 2,
    description: `Implement AI decision-making logic, eject ability (1 per magazine, visible to all), strategic vs random behavior balance, and integration with game state machine.

**Dependencies**: Stories 5 (AI SDK), 6 (Core Loop)

## Acceptance Criteria
- [ ] AI makes decisions each turn (shoot opponent/self/eject)
- [ ] Eject ability working (1 use per magazine)
- [ ] Eject visibility broadcast to all players
- [ ] Strategic behavior balanced with unpredictability
- [ ] AI state tracked in game state
- [ ] AI respects game rules (HP, magazine, turns)`,
  },
  {
    title: 'Game Timing & Action History',
    labels: ['game', 'ux'],
    priority: 2,
    description: `Implement dramatic pauses (trigger pull, hit/miss, death, turn transition), configurable timing constants (magic numbers), smooth state transitions, and real-time action feed (hits, misses, ejects, reloads, turn order).

**Dependencies**: Story 6 (Core Loop)

## Acceptance Criteria
- [ ] Dramatic pauses implemented for all actions
- [ ] Timing constants configurable (magic numbers file)
- [ ] Smooth state transitions between game phases
- [ ] Action feed displays hits, misses, ejects, reloads
- [ ] Turn order visible
- [ ] Magazine reload announcements
- [ ] Event broadcasting to all connected clients`,
  },

  // Economic Systems (3 stories)
  {
    title: 'Wallet & Betting System',
    labels: ['economy', 'core-mechanics'],
    priority: 2,
    description: `Implement wallet bell curve distribution on lobby join, ephemeral per-game wallets (reset on next lobby), 10-second betting window before each round, multiple bets per round, bet validation (min/max, wallet checks), bet types catalog (round outcomes, actions, HP-specific, meta), dynamic payout calculation, and batch resolution at round end.

**Dependencies**: Story 2 (Database Layer for wallet state)

## Acceptance Criteria
- [ ] Wallet distribution on join (bell curve, mean/std dev TBD)
- [ ] Ephemeral wallets reset on new game session
- [ ] Wallet floor at 0 (no negatives)
- [ ] Server-authoritative wallet (anti-cheat)
- [ ] 10-second betting window before each round
- [ ] Multiple bets per round allowed
- [ ] Bet validation (amount, wallet balance)
- [ ] Bet types defined and implemented
- [ ] Dynamic payout calculation (probability-based)
- [ ] Batch resolution at round end
- [ ] Real-time wallet updates`,
  },
  {
    title: 'Freedom Pass Mechanism',
    labels: ['economy', 'narrative'],
    priority: 3,
    description: `Implement one-time offer to richest spectator on first death (can decline), costs entire wallet, consequence of multiplying all other wallets by random 0.1-1.0x, and EXIT button for purchaser.

**Dependencies**: Stories 6 (Core Loop), 9 (Wallet System)

## Acceptance Criteria
- [ ] Freedom pass offered to richest spectator on first death
- [ ] Offer can be declined
- [ ] Purchase deducts entire wallet
- [ ] Other wallets multiplied by random 0.1-1.0x on purchase
- [ ] Purchaser gets EXIT button
- [ ] One-time per game enforcement
- [ ] UI for offer and acceptance`,
  },
  {
    title: 'Leaderboard & Economic Pressure',
    labels: ['economy', 'ui'],
    priority: 2,
    description: `Implement top 5 richest + bottom 5 poorest display (always visible), real-time updates during betting, next reaping target highlighted, and social economic pressure visualization.

**Dependencies**: Story 9 (Wallet System)

## Acceptance Criteria
- [ ] Leaderboard displays top 5 richest
- [ ] Leaderboard displays bottom 5 poorest
- [ ] Real-time updates during betting window
- [ ] Next reaping target clearly highlighted
- [ ] Visual design creates social pressure
- [ ] Leaderboard position updates immediately on wallet changes`,
  },

  // Game Flow & Lifecycle (3 stories)
  {
    title: 'Lobby & Reaping System',
    labels: ['flow', 'core-mechanics'],
    priority: 2,
    description: `Implement GitHub OAuth gate (no anonymous), wallet assignment on join, minimum 4 players to start, auto-start countdown after threshold, poorest spectator selection (forced participation) at game start and after each death, and AI announcement of selection.

**Dependencies**: Stories 3 (Auth), 9 (Wallet System)

## Acceptance Criteria
- [ ] GitHub OAuth gate (no anonymous access)
- [ ] Wallet assigned on lobby join
- [ ] Minimum 4 players enforced
- [ ] Auto-start countdown after threshold (duration TBD)
- [ ] Poorest spectator selected at game start
- [ ] Poorest spectator selected after each death
- [ ] Reaping cannot be refused
- [ ] AI announces selection with taunt
- [ ] Smooth transition to active player state`,
  },
  {
    title: 'Victory, Death & Eternal Spectator States',
    labels: ['flow', 'narrative'],
    priority: 2,
    description: `Implement victory condition (AI reaches 0 HP → all exit via window.close()), death flow (dead players become eternal red-tinted spectators, cannot leave/interact), next poorest becomes new player, and game end when fewer than 4 participants.

**Dependencies**: Stories 6 (Core Loop), 12 (Reaping System)

## Acceptance Criteria
- [ ] Victory: AI reaches 0 HP → all players offered EXIT
- [ ] Death: player becomes red-tinted spectator
- [ ] Eternal spectators cannot leave or interact
- [ ] Next poorest reaped after death
- [ ] Game ends if fewer than 4 participants
- [ ] \`window.close()\` implementation for exit
- [ ] Game instance destroyed on exit
- [ ] Wallets discarded on game end`,
  },
  {
    title: 'Session & Mid-Game Arrival Management',
    labels: ['flow', 'infrastructure'],
    priority: 3,
    description: `Implement mid-game arrivals (new users join as spectators anytime, wallet assigned, cannot bet in current round, eligible for reaping), game instance lifecycle (creation, active, ended), state cleanup on exit, and fresh lobby on next visit.

**Dependencies**: Stories 12 (Lobby), 13 (Victory/Death)

## Acceptance Criteria
- [ ] New users can join mid-game as spectators
- [ ] Mid-game arrivals receive wallet
- [ ] Cannot bet in current round (next round only)
- [ ] Eligible for reaping at next opportunity
- [ ] Game instance lifecycle managed (create/active/end)
- [ ] State cleanup on game end
- [ ] Fresh lobby on next visit (no state carryover)`,
  },

  // AI & Narrative Layer (2 stories)
  {
    title: 'AI Taunt & Personality System',
    labels: ['ai', 'narrative'],
    priority: 3,
    description: `Implement LLM-generated contextual taunts with triggers (game events, betting, economic shifts, reaping, lobby state), cynical/cold GLaDOS-inspired tone, system prompt engineering, structured output schema, personality consistency, self-regulated frequency, and rate limit fallback.

**Dependencies**: Stories 5 (AI SDK), 6 (Core Loop)

## Acceptance Criteria
- [ ] LLM-generated taunts working
- [ ] Taunt triggers for all game events
- [ ] GLaDOS-inspired tone consistent
- [ ] System prompt engineered for personality
- [ ] Structured output schema (Zod validation)
- [ ] Self-regulated frequency (not spammy)
- [ ] Rate limit fallback protection
- [ ] Taunt display integration with UI`,
  },
  {
    title: 'Narrative Framing & Thematic Integration',
    labels: ['narrative', 'ui'],
    priority: 3,
    description: `Integrate dystopian AI oppressor vs human victims theme, economic violence as core mechanic, forced spectatorship (can't look away), satire on AI dominance/inequality/gamification of suffering, and ensure thematic clarity across all game elements.

**Dependencies**: Stories 13 (Victory/Death), 15 (Taunting)

## Acceptance Criteria
- [ ] Dystopian theme clear in all UI elements
- [ ] AI oppressor narrative reinforced
- [ ] Economic violence integrated into mechanics
- [ ] Forced spectatorship mechanics enforced
- [ ] Satire understood (not offensive/unclear)
- [ ] Thematic consistency across game flow
- [ ] Narrative framing in lobby, game, death states`,
  },

  // Real-time & UI (4 stories)
  {
    title: 'Real-time State Synchronization',
    labels: ['ui', 'infrastructure'],
    priority: 2,
    description: `Choose real-time paradigm (SSE vs WebSocket vs hybrid), implement StreamService with Effect.ts, high-frequency leaderboard updates during betting, magazine composition revelation, HP changes with dramatic pauses, bet resolution announcements, and action logs.

**Dependencies**: Story 2 (Database Layer)

## Acceptance Criteria
- [ ] Real-time paradigm chosen and implemented
- [ ] StreamService implemented as Effect.Service
- [ ] High-frequency leaderboard updates working
- [ ] Magazine composition revealed in real-time
- [ ] HP changes broadcast with dramatic pauses
- [ ] Bet resolution announcements working
- [ ] Action logs streamed to all clients
- [ ] Connection resilience (reconnect logic)`,
  },
  {
    title: '8bitcn Pixel Art Foundation & Aesthetic',
    labels: ['ui', 'design'],
    priority: 2,
    description: `Integrate 8bitcn (shadcn pixel art variant), dark palette (blacks, grays, deep reds), CRT scan lines and terminal effects, retro-dark criminal vibes, CSS-based animations, and establish visual design system.

**Dependencies**: Story 1 (Monorepo Setup)

## Acceptance Criteria
- [ ] 8bitcn components integrated
- [ ] Dark palette applied (blacks, grays, deep reds)
- [ ] CRT scan lines effect working
- [ ] Terminal/retro effects applied
- [ ] CSS animations for pixel art
- [ ] Design system documented
- [ ] Responsive design foundations`,
  },
  {
    title: 'Betting Window & Economic Display UI',
    labels: ['ui', 'economy'],
    priority: 3,
    description: `Implement 10-second countdown display, responsive bet amount input, bet type selection buttons, confirmation & validation feedback, real-time wallet display, leaderboard (top 5/bottom 5), reaping target highlight, and freedom pass offer UI.

**Dependencies**: Stories 9 (Wallet/Betting), 11 (Leaderboard), 18 (Pixel Art)

## Acceptance Criteria
- [ ] 10-second countdown visible to all
- [ ] Responsive bet amount input
- [ ] Bet type selection UI (all types)
- [ ] Confirmation and validation feedback
- [ ] Real-time wallet display
- [ ] Leaderboard UI (top 5/bottom 5)
- [ ] Reaping target highlighted
- [ ] Freedom pass offer UI
- [ ] Touch-friendly for mobile`,
  },
  {
    title: 'Game State Display & Animations',
    labels: ['ui', 'game'],
    priority: 3,
    description: `Implement HP bars (player & AI), turn indicator, magazine status (rounds remaining, eject used), action log feed, HP damage animations, death transitions (red tint), betting countdown effects, magazine reload animations, and all dramatic visual effects.

**Dependencies**: Stories 6 (Core Loop), 8 (Timing), 18 (Pixel Art)

## Acceptance Criteria
- [ ] HP bars for player and AI
- [ ] Turn indicator shows active player
- [ ] Magazine status visible (rounds, eject used)
- [ ] Action log feed displays all events
- [ ] HP damage animations working
- [ ] Death red tint transition smooth
- [ ] Betting countdown effects
- [ ] Magazine reload animations
- [ ] All dramatic pauses have visual cues`,
  },
];

function createStory(story: Story, index: number): void {
  console.log(`\n[${index + 1}/${stories.length}] Creating: ${story.title}`);

  try {
    // Note: Skipping labels for now (they need to be created in Linear first)
    // Labels can be added manually in Linear UI after creation
    const priorityArg = story.priority ? `--priority ${story.priority}` : '';

    // Include labels in description for reference
    const labelsNote = `**Labels**: ${story.labels.join(', ')}\n\n`;
    const fullDescription = labelsNote + story.description;

    // Escape backticks and quotes in description
    const escapedDescription = fullDescription
      .replace(/`/g, '\\`')
      .replace(/"/g, '\\"');

    // Note: Project must be added manually in Linear UI after creation
    // Linear CLI doesn't support project assignment by slug
    const command = `linear issue create \\
      --team TOR \\
      --title "${story.title}" \\
      --description "${escapedDescription}" \\
      ${priorityArg}`;

    execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    console.log(`✅ Created: ${story.title}`);
  } catch (error) {
    console.error(`❌ Failed to create: ${story.title}`);
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
  }
}

function main(): void {
  console.log('🚀 Creating Linear Stories for The Reaping Project');
  console.log(`📋 Project ID: ${PROJECT_ID}`);
  console.log(`📊 Total stories: ${stories.length}\n`);

  console.log('Categories:');
  console.log('  - Foundation & Infrastructure: 5 stories');
  console.log('  - Core Game Mechanics: 3 stories');
  console.log('  - Economic Systems: 3 stories');
  console.log('  - Game Flow & Lifecycle: 3 stories');
  console.log('  - AI & Narrative Layer: 2 stories');
  console.log('  - Real-time & UI: 4 stories');

  stories.forEach((story, index) => createStory(story, index));

  console.log('\n✨ Story creation complete!');
  console.log(`\n🔗 View in Linear: https://linear.app/stefan-projects/project/${PROJECT_ID}`);
}

main();
