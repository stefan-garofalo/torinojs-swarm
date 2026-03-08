# Magic Numbers

**Game balance values to be defined and tracked.**

These constants control gameplay balance, economic tension, and pacing. All values are subject to playtesting and iteration. Changes should be documented with rationale.

---

## Economy Constants

### Starting Wallet Distribution

```typescript
WALLET_START_MEAN: number        // TBD - Center of bell curve
WALLET_START_STD_DEV: number     // TBD - Spread of distribution
WALLET_MINIMUM: number = 0       // Hard floor (cannot go negative)
```

**Considerations:**
- Mean should support multiple rounds of betting
- Std dev should create noticeable inequality (some start ~2-3x others)
- Avoid starting values so low players are immediately at risk

**Example range to test:**
- Mean: 1000
- Std dev: 300
- Result: Most players 700-1300, outliers 400-1600

---

### Betting Limits

```typescript
BET_AMOUNT_MIN: number           // TBD - Minimum bet allowed
BET_AMOUNT_MAX: number | null    // TBD - Max bet (null = wallet balance)
BET_WINDOW_DURATION: 10          // Seconds (FIXED per requirements)
```

**Considerations:**
- Min bet prevents micro-betting to game system
- Max bet (if capped) prevents all-in swings
- 10s window is tight - UI must be responsive

**Example range to test:**
- Min: 10 (1% of mean starting wallet)
- Max: null (allow all-in bets for drama)

---

### Freedom Pass

```typescript
FREEDOM_WALLET_REDUCTION_MIN: 0.1   // FIXED - Minimum multiplier
FREEDOM_WALLET_REDUCTION_MAX: 1.0   // FIXED - Maximum multiplier
FREEDOM_DISTRIBUTION: 'uniform'     // FIXED - Linear random
```

**Fixed per requirements:**
- Each spectator's wallet multiplied by random value 0.1-1.0
- Linear uniform distribution (equal probability across range)

---

### Leaderboard

```typescript
LEADERBOARD_TOP_COUNT: 5        // FIXED - Top richest shown
LEADERBOARD_BOTTOM_COUNT: 5     // FIXED - Bottom poorest shown
LEADERBOARD_UPDATE_MODE: 'realtime' // FIXED - Updates during betting
```

---

## Game Balance Constants

### Health Points

```typescript
HP_START_PLAYER: 5              // FIXED
HP_START_AI: 5                  // FIXED
DAMAGE_PER_LIVE_ROUND: 1        // FIXED
```

---

### Magazine Configuration

```typescript
MAGAZINE_SIZE_MIN: number       // TBD - Minimum chambers per magazine
MAGAZINE_SIZE_MAX: number       // TBD - Maximum chambers per magazine

LIVE_ROUND_RATIO_MIN: number   // TBD - Minimum % of live rounds (0.0-1.0)
LIVE_ROUND_RATIO_MAX: number   // TBD - Maximum % of live rounds (0.0-1.0)
```

**Considerations:**
- Smaller magazines = faster rounds, less betting
- Larger magazines = more turns, more bets, longer rounds
- Ratio bounds create predictability vs chaos
- Too many blanks = boring, too many lives = quick deaths

**Example ranges to test:**

**Option A: Tight magazines**
- Size: 4-6 chambers
- Ratio: 0.33-0.67 (1-4 live per magazine)
- Result: Fast rounds, high tension

**Option B: Standard magazines**
- Size: 6-10 chambers
- Ratio: 0.3-0.7 (2-7 live per magazine)
- Result: Moderate pacing, strategic depth

**Option C: Chaotic magazines**
- Size: 4-12 chambers
- Ratio: 0.2-0.8 (1-9 live per magazine)
- Result: High variance, unpredictable

---

### AI Abilities

```typescript
AI_EJECT_USES_PER_MAGAZINE: 1   // FIXED
```

---

## Timing Constants

### Lobby

```typescript
LOBBY_MIN_PLAYERS: 4            // FIXED
LOBBY_AUTOSTART_DELAY: number   // TBD - Seconds after minimum reached
```

**Considerations:**
- Longer delay allows stragglers to join
- Shorter delay maintains momentum
- Example: 5-10 seconds

---

### Action Delays (Dramatic Pauses)

```typescript
DELAY_TRIGGER_PULL: number      // TBD - Pause before reveal (ms)
DELAY_AFTER_HIT: number         // TBD - Pause after damage (ms)
DELAY_AFTER_BLANK: number       // TBD - Pause after blank (ms)
DELAY_AFTER_EJECT: number       // TBD - Pause after AI eject (ms)
DELAY_AFTER_DEATH: number       // TBD - Pause before reaping (ms)
DELAY_BETWEEN_TURNS: number     // TBD - Transition between turns (ms)
DELAY_MAGAZINE_RELOAD: number   // TBD - Pause before new magazine (ms)
```

**Considerations:**
- Too short = loses tension
- Too long = frustrating, slow
- Balance cinematic feel vs gameplay pace

**Example range to test:**
- Trigger pull: 1500ms (suspenseful)
- After hit: 1000ms (show HP change)
- After blank: 500ms (relief moment)
- After eject: 800ms (surprise)
- After death: 2000ms (gravity of moment)
- Between turns: 300ms (smooth transition)
- Magazine reload: 1500ms (reset moment)

---

### Taunt Timing

```typescript
TAUNT_DISPLAY_DURATION: number  // TBD - How long taunt shown (ms)
TAUNT_MAX_PER_MINUTE: number    // TBD - Rate limit (fallback)
```

**Considerations:**
- Long enough to read
- Short enough not to block gameplay
- Rate limit prevents spam if LLM generates too many

**Example:**
- Display: 4000ms (4 seconds)
- Max per minute: 10 taunts (one per 6s average)

---

## Bet Types & Payouts

**To be defined in [Future Considerations](./future-considerations.md).**

Each bet type requires:

```typescript
{
  id: string                    // Unique identifier
  name: string                  // Display name
  description: string           // What the bet means
  winCondition: (game) => boolean   // Logic to determine win
  payoutMultiplier: number      // Winning payout (e.g., 2.0 = double)
}
```

**Example bet types to define:**

- Player survives round: 1.5x?
- Player dies this round: 3.0x?
- AI survives round: 1.5x?
- AI dies this round: 3.0x?
- AI uses eject: 2.5x?
- Next shot is live: 2.0x?
- Next shot is blank: 2.0x?
- Specific HP outcome: varies?

**Balance goals:**
- Low-risk bets: 1.2-1.8x (slight gains)
- Medium-risk bets: 2.0-3.0x (balanced)
- High-risk bets: 3.5-5.0x (swing potential)

---

## Player Count Limits

```typescript
MIN_PLAYERS_TO_START: 4         // FIXED
MIN_PLAYERS_TO_CONTINUE: 4      // FIXED - Game ends if below
MAX_PLAYERS: number | null      // TBD - Cap on lobby (null = unlimited)
```

**Considerations:**
- No max cap for demo (scale not a concern)
- Could add cap if performance issues arise

---

## Configuration Management

**During development:**
- Store in environment variables or config file
- Easy to adjust without code changes
- Document changes in git commits

**For balancing:**
- Track changes in Linear issues
- A/B test different values if possible
- Gather feedback from playtesters

**Example config file structure:**

```typescript
// config/game-balance.ts
export const GAME_CONFIG = {
  economy: {
    walletStartMean: 1000,
    walletStartStdDev: 300,
    // ...
  },
  gameplay: {
    magazineSizeMin: 6,
    magazineSizeMax: 10,
    // ...
  },
  timing: {
    betWindowDuration: 10,
    delayTriggerPull: 1500,
    // ...
  },
} as const
```

---

## Playtesting Checklist

When adjusting magic numbers, validate:

- [ ] Games last reasonable duration (not too quick/long)
- [ ] Betting windows feel adequate (10s is enough?)
- [ ] Wallets churn meaningfully (not stagnant)
- [ ] Poverty isn't guaranteed (possible to escape bottom)
- [ ] Wealth isn't guaranteed (possible to fall from top)
- [ ] AI feels threatening but beatable
- [ ] Pacing maintains tension without frustration
- [ ] Economic stratification is visible (inequality clear)
- [ ] Freedom pass is rare but attainable
- [ ] Reaping selection feels fair (poorest is clear)

---

## Iteration Process

1. **Set initial values** (educated guesses from examples above)
2. **Implement with config file** (easy to change)
3. **Playtest with team** (internal testing)
4. **Identify issues** (too fast, too slow, broken economy)
5. **Adjust specific values** (document reasoning)
6. **Repeat until balanced**
7. **Lock in values** for demo/launch

**Document all changes** in Linear issues with labels: `magic-number`, `balance-change`
