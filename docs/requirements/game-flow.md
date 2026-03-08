# Game Flow

## Complete Player Journey

This document describes the full lifecycle of a game session from lobby through gameplay to exit.

---

## Authentication Gate

### GitHub OAuth

**Required to enter:**
- All users must authenticate via GitHub
- No anonymous access
- Auth serves as access gate only (not for wallet persistence)

**User data stored:**
- GitHub user ID (unique identifier)
- Username (display name)
- Avatar URL (profile picture)

**Optional future data:**
- Games played (statistics)
- Times reaped (statistics)
- Victories achieved (statistics)

---

## Lobby Phase

### Entry

After GitHub auth succeeds:
- User enters lobby
- **Wallet assigned immediately** (random from bell curve)
- Username displayed
- Joins waiting pool

### Lobby State

**Waiting for minimum players:**
- **Minimum required:** 4 players
- Current player count displayed prominently
- Leaderboard visible (top 5 rich, bottom 5 poor)
- Global player count shown

**AI narration:**
- AI presents scenario/lore while waiting
- Throttled taunts (not spamming)
- Sets dystopian tone
- Example: "Welcome to The Reaping. Your economic status has been... evaluated."

### Auto-Start Trigger

**When player count >= 4:**
- Countdown timer begins (duration TBD, e.g., 5-10 seconds)
- Allows late arrivals to join
- Clear visual countdown
- When timer expires: first reaping begins

### First Reaping

**Selection criteria:** Poorest wallet
- Player with lowest wallet balance selected
- Cannot refuse (forced participation)
- Selected player becomes active player
- All others become spectators

**Announcement:**
- AI announces selection
- Selected player's name displayed
- Taunt about their inadequate wallet
- Brief dramatic pause before game begins

---

## Active Gameplay

### Roles

**Active Player (1):**
- Currently playing against AI
- Makes shot decisions (shoot self/opponent)
- Cannot bet (focused on survival)
- Displayed prominently in UI

**Spectators (3+):**
- All other participants
- Must watch (cannot leave screen)
- Must bet (during betting windows)
- Can see all game state
- Displayed in spectator list

**AI Opponent:**
- Always present
- Makes automated decisions via LLM
- Taunts based on events
- Has eject ability

### Game Loop

**Per round (magazine):**

1. **Magazine Load**
   - New magazine generated (random size/ratio)
   - Composition revealed (X live, Y blank)
   - Betting window opens

2. **Betting Window (10 seconds)**
   - Spectators place bets on round outcomes
   - Multiple bets allowed
   - Timer counts down
   - Bets lock when window closes

3. **Turn Sequence**
   - Alternating player/AI turns
   - Each turn: choose target, pull trigger
   - AI may use eject (once per magazine)
   - Actions have dramatic pauses
   - HP updated after each shot

4. **Round End**
   - Magazine depleted
   - Bets resolved (batch)
   - Wallets updated
   - Leaderboard refreshes
   - Brief summary/pause

5. **Next Round or Game End**
   - If both still alive: new magazine loads (return to step 1)
   - If player dies: death flow
   - If AI dies: victory flow

---

## Mid-Game Arrivals

### Joining During Active Game

**New users can join anytime:**
- Authenticate via GitHub
- Immediately become spectator
- **Wallet assigned** (random from bell curve)
- **Cannot bet in current round** (betting started before they arrived)
- **Can bet starting next round**
- **Eligible for reaping** at game end (based on wallet)

**UI behavior:**
- Join spectator list
- See current game state
- Leaderboard includes them immediately
- Global player count increments

**No disruption:**
- Game continues uninterrupted
- Active player unaffected
- Other spectators see new arrival in list

---

## Death Flow (Player Loses)

### When Player Reaches 0 HP

**Immediate effects:**
1. Game pauses
2. Player death announced
3. AI taunts about the failure
4. Dramatic visual effect (death animation TBD)

### Dead Player State

**Becomes permanent spectator:**
- Cannot leave game
- Screen darkened with **subtle red tint overlay**
- Can still see all game state
- **Cannot interact** (no betting, no chat if implemented)
- Wallet becomes irrelevant (cannot be reaped again)
- Remains visible in player list with "DEAD" indicator

**Thematic purpose:**
- Dead players witness eternally
- Cannot escape even in death
- Reinforces dystopian horror

### Freedom Pass Opportunity

**Before next reaping:**
- If this is first death (freedom pass not yet used this game):
  - Richest spectator offered freedom pass
  - Can purchase escape (costs entire wallet)
  - Consequence: all other spectators' wallets randomly reduced (0.1x-1.0x)
  - Buyer can then EXIT (leave game)

**If purchased:**
- Buyer sees EXIT button
- Other spectators see wallet reductions
- AI taunts about the purchase and its consequences
- Continue to reaping (buyer excluded if they exit)

**If declined:**
- Proceed directly to reaping

### Next Reaping

**Selection:** Poorest remaining spectator (alive, non-dead)
- Excludes dead players
- Excludes player who bought freedom and exited
- Selected player becomes new active player
- New game begins (return to game loop)

**If insufficient players (< 4 remaining):**
- Game cannot continue
- All remaining players see END screen
- Option to EXIT

---

## Victory Flow (Player Wins)

### When AI Reaches 0 HP

**Immediate effects:**
1. Game pauses
2. Victory announced: "FREEDOM GRANTED"
3. AI delivers final taunt (acknowledging defeat or dismissing it)
4. Dramatic visual effect

### Universal Exit Opportunity

**All participants (player + spectators) presented with:**
- **Single EXIT button**
- Message: "You are free to leave"
- Clicking EXIT triggers `window.close()`

**Freedom achieved:**
- Player survived the AI
- System allows escape for all
- No forced continuation
- No penalties

### Session End

**When all participants exit (or page closes):**
- Game instance destroyed
- All wallets discarded
- Redis state cleared
- Next visitor starts fresh lobby

**If game cannot continue (< 4 remaining):**
- Same END screen with EXIT option

---

## Session Lifecycle Summary

```
GitHub Auth
    ↓
Lobby (wait for 4+ players)
    ↓
First Reaping (poorest selected)
    ↓
Game Loop:
  ├─ Magazine load
  ├─ Betting window
  ├─ Turn sequence
  ├─ Round end
  └─ Check HP
      ├─ Both alive → next magazine
      ├─ Player dies → Death Flow:
      │     ├─ Freedom pass offer
      │     ├─ Next reaping
      │     └─ Continue game loop
      └─ AI dies → Victory Flow:
            └─ All EXIT (game ends)
```

---

## State Transitions

### Lobby → Game
- Triggered by: 4+ players + timer expires
- Effect: First reaping, game begins

### Game → Death Flow
- Triggered by: Player 0 HP
- Effect: Death announcement → freedom pass → reaping → game continues

### Game → Victory Flow
- Triggered by: AI 0 HP
- Effect: Victory announcement → all EXIT → session ends

### Game → Insufficient Players
- Triggered by: < 4 remaining participants
- Effect: END screen, all EXIT

### Mid-game → Spectator Join
- Triggered by: New user authenticates during active game
- Effect: Immediately spectate, bet next round, eligible for reaping

---

## Edge Cases

### Player Exits Browser During Their Turn
- **Consequence:** Treated as death (forfeit)
- **Flow:** Death flow triggered, next reaping

### Last Spectator Buys Freedom and Exits
- **Check player count:** If < 4, trigger insufficient players flow
- **Otherwise:** Continue with remaining spectators

### All Spectators Have 0 Wallet
- **Tie-breaking:** Random selection among tied poorest
- **Or:** First to reach 0 chronologically

### Player Wins on First Magazine
- **Valid outcome:** Victory flow triggers normally
- **Spectators may not have bet much:** Economic churn minimal, acceptable

### Freedom Pass Declined, Then Player Wins Next Round
- **Freedom pass used status:** Still marked as used (only one offer per game)
- **Next victory:** No freedom pass offer, direct to victory flow
