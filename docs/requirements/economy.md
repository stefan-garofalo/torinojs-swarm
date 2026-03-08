# Economy System

## Wallet System

### Starting Wallet Distribution

**Assignment timing:** On lobby join (per-session)

**Distribution model:** Bell curve (normal distribution)
- Random value drawn from normal distribution
- Parameters TBD in [Magic Numbers](./magic-numbers.md):
  - `WALLET_START_MEAN`: Center of distribution
  - `WALLET_START_STD_DEV`: Spread/variance

**Inequality by design:**
- Some players start with significantly more wealth
- Some start near-poor, close to being reaped
- No grinding or earning outside of betting
- Creates immediate economic stratification

### Wallet Persistence

**Ephemeral per-game:**
- Wallets assigned on lobby join
- Persist only for that game session
- Discarded when game ends (all exit)
- Next lobby join = fresh random wallet

**No cross-session carry-over:**
- GitHub auth does not preserve wallets
- Each game is economically isolated
- No meta-progression or grinding

### Wallet Operations

**Decrease:**
- Placing bets (locked until resolution)
- Failed bets (wallet reduced by bet amount)
- Freedom pass random reduction (when someone else buys freedom)

**Increase:**
- Winning bets (wallet increased by payout)

**Cannot go negative:**
- Minimum wallet value: 0
- Players cannot bet more than current wallet
- At 0 wallet: still eligible for reaping, cannot bet

---

## Betting System

### Betting Window

**Timing:** Before each round begins
- **Duration:** 10 seconds
- **Trigger:** Magazine loaded, compositions revealed
- **Countdown:** Visible timer for all spectators

**UI Requirements:**
- Clear countdown display
- Bet types as quick-action buttons
- Amount input (slider or text field)
- Confirm button
- Real-time wallet balance display

### Bet Placement

**Rules:**
- **Multiple bets allowed** per round (spectators can bet on multiple outcomes)
- **Minimum bet amount:** TBD
- **Maximum bet amount:** Current wallet balance or TBD cap
- **Bets lock** when round starts (no changes after window closes)

**Process:**
1. Click bet type button
2. Enter/select amount
3. Confirm bet
4. Bet added to active bets list
5. Wallet reduced by bet amount (locked funds)
6. Repeat for additional bets if desired

### Bet Resolution

**Timing:** Batch at round end
- All bets for that round resolve simultaneously
- Winning bets: payout added to wallet
- Losing bets: already deducted, no further action
- Results displayed briefly before next betting window

### Bet Types

**To be defined** in [Future Considerations](./future-considerations.md).

**Examples for reference:**
- Player survives round
- Player dies this round
- AI survives round
- AI dies this round
- AI uses eject this round
- Next shot is live/blank
- Specific HP outcomes

**Each bet type needs:**
- Clear description
- Win/loss conditions
- Payout multiplier
- Risk assessment

### Payout Multipliers

**TBD** - must balance:
- Risk vs reward
- Encourage frequent betting
- Maintain economic churn (wallets rising/falling)
- Avoid guaranteed winning strategies

---

## Freedom Pass

### The Escape Mechanism

The only way to escape the game system before victory.

**Eligibility:**
- **Timing:** End of game only (after player dies or wins, before reaping)
- **Who:** Richest spectator at that moment
- **Frequency:** One purchase per game (after first purchase, no longer offered)

### Cost

**Effectively entire wallet:**
- Player purchases freedom
- Can then click EXIT button
- Wallet becomes irrelevant (they're leaving)

### Effect on Other Spectators

**Random wallet reduction:**
- Each remaining spectator's wallet multiplied by random factor
- **Range:** 0.1x to 1.0x (linear uniform distribution)
- Applied independently per spectator

**Examples:**
- Spectator A: 500 → 500 * 0.3 = 150 (70% reduction)
- Spectator B: 200 → 200 * 0.9 = 180 (10% reduction)
- Spectator C: 800 → 800 * 0.15 = 120 (85% reduction)

**Thematic purpose:**
- Escaping punishes everyone else
- Creates resentment toward the escapee
- Rich get richer, poor get poorer
- Reinforces dystopian economic violence

### UI Presentation

When freedom pass is offered:
- Clear prompt to richest spectator
- Shows cost (their wallet balance)
- Explains consequence (others' wallets reduced)
- Two buttons: BUY FREEDOM or DECLINE
- If declined, reaping proceeds normally

### After Purchase

- Buyer sees EXIT button (can leave anytime)
- All other spectators see wallet reduction
- AI taunts about the purchase
- Game continues without buyer (if they exit)
- Next reaping selects from remaining spectators

---

## Leaderboard

### Display

**Always visible** during game:

**Top 5 Richest:**
- Rank, name, wallet amount
- Updated in real-time

**Bottom 5 Poorest:**
- Rank, name, wallet amount
- Updated in real-time
- Bottom player highlighted (next to be reaped)

### Update Frequency

**Real-time during betting:**
- As bets placed, wallets decrease (funds locked)
- Rankings shift immediately
- Creates visible economic pressure

**Batch updates after round:**
- Bet resolutions processed
- Wallets increase/decrease based on outcomes
- Rankings recalculated
- Next reaping candidate may change

### Social Pressure

The leaderboard serves to:
- Make economic status visible to all
- Create fear in those near the bottom
- Motivate betting to avoid being poorest
- Show who's profiting from the game
- Reinforce that everyone sees who's at risk

### UI Requirements

- Persistent display (sidebar or overlay)
- Clear visual distinction for bottom player
- Smooth transitions when rankings change
- Player's own position highlighted if not in top/bottom 5

---

## Economic Balance Goals

The economy should create:

1. **Constant churn:** Wallets frequently rising/falling through betting
2. **Risk/reward tension:** Big bets can save you or doom you
3. **No safe strategy:** Being richest makes you freedom-eligible but requires aggression
4. **Poverty spiral:** Once near bottom, hard to escape without big wins
5. **Complicity:** Everyone profits from watching others die

### Anti-patterns to Avoid

- **Optimal conservative strategy:** (sitting out betting to avoid bottom)
  - Solution: Ensure bet payouts can outpace passive wallet erosion
- **Runaway wealth:** (richest becomes unreachable)
  - Solution: Freedom pass reductions, bet limits
- **Guaranteed bankruptcy:** (everyone eventually goes to 0)
  - Solution: Balance payout multipliers

---

## Global Player Count

**Always displayed:**
- Total players in game (active player + spectators)
- Updates real-time as players join/leave
- Visible during lobby and gameplay

**Purpose:**
- Shows scale of forced participation
- Makes the "society" feel populated
- Indicates when game might end (< 4 players)
