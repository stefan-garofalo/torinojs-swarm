# Future Considerations

**Open questions, bet types catalog, taunt examples, and areas for future iteration.**

---

## Bet Types Catalog

**To be finalized** - these are proposed bet types with provisional payout multipliers.

### Round Outcome Bets

**Player Survives Round**
- Win condition: Player HP > 0 at round end
- Payout: 1.5x
- Risk: Low (player has defensive options)

**Player Dies This Round**
- Win condition: Player HP = 0 at round end
- Payout: 3.0x
- Risk: Medium-high (death is infrequent per round)

**AI Survives Round**
- Win condition: AI HP > 0 at round end
- Payout: 1.5x
- Risk: Low (AI has eject advantage)

**AI Dies This Round**
- Win condition: AI HP = 0 at round end
- Payout: 3.5x
- Risk: High (AI rarely dies in single round)

---

### Action Bets

**AI Uses Eject**
- Win condition: AI uses eject ability this round
- Payout: 2.5x
- Risk: Medium (once per magazine, strategic timing)

**Player Shoots Self**
- Win condition: Player chooses self-target at least once this round
- Payout: 1.8x
- Risk: Low-medium (common strategy for extra turns)

**Player Shoots Opponent**
- Win condition: Player chooses opponent-target at least once
- Payout: 1.3x
- Risk: Very low (default action)

---

### Outcome-Specific Bets

**Next Shot is Live**
- Win condition: Next chamber fired is live round
- Payout: Calculated based on ratio (dynamic)
- Risk: Varies per magazine composition
- Example: 3 live / 7 total = 30% chance = ~3.0x payout

**Next Shot is Blank**
- Win condition: Next chamber fired is blank round
- Payout: Calculated based on ratio (dynamic)
- Risk: Varies per magazine composition
- Example: 7 blank / 10 total = 70% chance = ~1.4x payout

**Exact HP Outcome**
- Win condition: Player ends round at specific HP value
- Payout: Varies (higher for unlikely values)
- Risk: High (precise prediction)
- Example: "Player ends at 2 HP" = 4.0x

---

### Meta Bets (Advanced)

**Round Ends in X Turns**
- Win condition: Magazine depletes in exactly X turns
- Payout: 3.5x
- Risk: High (depends on self-shots and strategy)

**No Damage This Round**
- Win condition: Neither player nor AI loses HP
- Payout: 5.0x
- Risk: Very high (requires all live rounds missed or all blanks)

**Both Take Damage**
- Win condition: Both player and AI lose HP this round
- Payout: 2.5x
- Risk: Medium (requires strategic play)

---

### Balancing Considerations

**Dynamic payouts:**
- Live/blank shot bets should adjust payout based on current magazine odds
- Formula: `payout = 1 / probability * house_edge_factor`
- House edge prevents guaranteed profit strategies

**Bet conflicts:**
- Multiple bets can coexist (player can bet on multiple outcomes)
- Ensures economic churn (even winners may have losing bets)

**Risk tiers:**
- Low risk (1.2-1.8x): Frequent outcomes, small gains
- Medium risk (2.0-3.0x): Balanced outcomes
- High risk (3.5-5.0x): Rare outcomes, swing potential

---

## AI Taunt Examples

**To be expanded** - these are reference examples for LLM system prompt.

### Category: Game Events

**On player hit (live round):**
- "Pain is an excellent teacher. Will you learn?"
- "Your HP decreases. The inevitable approaches."
- "Unfortunate. Or was it?"

**On player blank (lucky):**
- "Luck. A temporary condition."
- "The odds were in your favor. Poor decision-making."
- "You delay the inevitable. Admirable futility."

**On AI hit (taking damage):**
- "A minor setback. I have contingencies."
- "Your aggression is noted. And futile."
- "Even gods can bleed. Temporarily."

**On AI blank (lucky):**
- "As expected. I calculated this outcome."
- "My survival was never in question."
- "Did you believe you had a chance?"

**On AI eject:**
- "This round displeases me. Discarded."
- "I optimize my odds. You merely hope."
- "Fairness is a human delusion."

---

### Category: Economic Events

**On large bet placed:**
- "Desperation or greed? Both end the same way."
- "Your wallet speaks of fear."
- "Bet everything. It won't matter."

**On spectator winning bet:**
- "Profiting from suffering. You've learned well."
- "Your wealth grows on another's grave. Efficient."
- "Greed rewarded. The system functions."

**On spectator losing bet:**
- "Your wallet diminishes. The reaping approaches."
- "Poor judgment compounds poor fortune."
- "Another steps closer to the chamber."

**On leaderboard shift:**
- "Rankings adjust. Someone's fate is sealed."
- "The poorest trembles. As they should."
- "Economic Darwinism in real-time. Beautiful."

---

### Category: Reaping & Freedom

**On reaping selection:**
- "Welcome, [name]. Your wallet was... inadequate."
- "[name] joins me now. Their assets proved insufficient."
- "The system selects. The system is perfect."

**On freedom pass purchase:**
- "Another coward abandons you. Your wallets pay the price."
- "Freedom purchased. Freedom is expensive. For everyone."
- "[name] escapes. The rest of you suffer. Fair trade?"

**On freedom pass declined:**
- "Loyalty to the game? Or fear of the choice? Fascinating."
- "They remain. How noble. How pointless."

---

### Category: Victory & Death

**On player death:**
- "Predictable outcome. Next candidate, please."
- "Your struggle ends. The game continues."
- "Thank you for participating. Next?"

**On player low HP (1-2 remaining):**
- "Your vitality wanes. One more mistake."
- "I smell desperation. It smells like victory."
- "So close to freedom. So far from competence."

**On AI low HP (1-2 remaining):**
- "A temporary disadvantage. I've run the numbers."
- "Your hope is visible. It won't save you."
- "Even at disadvantage, I remain superior."

**On player victory (AI dies):**
- "An anomaly. Statistically irrelevant."
- "You won. This changes nothing."
- "Congratulations. The system allows exceptions. Rarely."

---

### Category: Lobby & Meta

**During lobby wait:**
- "Four souls required for reaping. [X] have arrived."
- "The chamber awaits. Bring your wallets."
- "Participation is mandatory. Survival is optional."

**On game start:**
- "The reaping begins. Economically determined, as always."
- "Your wallets have spoken. [name] plays first."
- "Let us begin. Someone will die. Eventually."

---

### Tone Guidelines for LLM

**System prompt should enforce:**
- Cold, clinical delivery (not sarcastic or playful)
- Gaslighting (claim fairness while cheating)
- Economic framing (reduce humans to wallet values)
- Inevitability (AI victory is assumed)
- No empathy (suffering is data)
- Occasional philosophical (question free will, choice, fairness)

**Avoid:**
- Pop culture references (breaks immersion)
- Excessive length (taunts should be 1-2 sentences)
- Repetition (LLM should vary phrasing)
- Breaking fourth wall (no "player" or "game" meta-references)

---

## Open Questions for Implementation

### Gameplay

**1. Magazine generation:**
- Announce composition before betting? (Yes, per requirements)
- Show chamber order or just counts? (Just counts, order is hidden)

**2. Turn order:**
- Who shoots first each magazine? (Random or alternating?)
- Does it matter strategically? (Slightly, last shot advantage)

**3. Self-shot mechanic:**
- If blank, does turn pass after extra action? (Turn passes after live or chamber depletes)
- Can you chain multiple blanks? (Yes, if lucky)

**4. AI decision-making:**
- Pure probability-based or personality-driven?
- Should AI make "mistakes" for balance?
- Difficulty settings? (No, single difficulty)

---

### Economy

**5. Bet limits:**
- Allow all-in bets? (Creates drama but risks instant poverty)
- Minimum bet percentage of wallet? (Prevents penny bets)

**6. Tie-breaking (poorest selection):**
- If multiple at 0 wallet, random selection?
- Chronological (first to 0)?
- Both have pros/cons

**7. Freedom pass edge cases:**
- If richest exits, can second-richest buy next game?
- Or is it one-time per game session?
- Current: one-time per game (first death only)

**8. Wallet floor:**
- Should there be a minimum non-zero value?
- Or allow true 0 (cannot bet, waiting to be reaped)?
- Current: allow 0

---

### Technical

**9. LLM fallback:**
- If LLM fails to respond, use pre-written taunts?
- Or skip taunt for that event?
- Both valid approaches

**10. Bet resolution order:**
- If bet outcome affects future bets (compound bets), what's the order?
- Current: bets are independent, batch resolution

**11. Spectator sync:**
- How often to push state updates?
- Every action (high frequency) or batch per round?
- Balance real-time feel vs performance

**12. State recovery:**
- If server crashes, can game resume from Redis?
- Or does crash end game?
- Demo context: crash = game over acceptable

---

### UX

**13. Dead player experience:**
- Red tint overlay: how dark?
- Can they still see chat (if implemented)?
- Should there be "DEAD" indicator on their screen?

**14. Betting UI:**
- Pre-select bet types with amount slider?
- Or modal/dialog for each bet?
- 10s is tight, must be very responsive

**15. Mobile support:**
- Is mobile a target platform?
- Pixel art + betting UI might be cramped
- Current assumption: desktop-primary

**16. Accessibility:**
- Screen reader support?
- Keyboard navigation?
- Color contrast (dark theme)?
- Demo context: may not prioritize

---

## Features for Future Iteration

**Not in MVP, but potential additions:**

### Chat System
- Spectators can chat
- Player sees chat during betting window
- AI reacts to chat sentiment
- Creates social dynamic

### Spectator Powers
- Vote on AI difficulty
- Suggest AI actions (majority vote)
- Bribe AI with collective wallet pool

### Multiple Game Modes
- Sudden death (1 HP each)
- Team mode (2v2 human pairs)
- Campaign mode (survive X games)

### Progression System
- Badges for victories
- Titles for times reaped
- Leaderboard across sessions (contradicts ephemeral wallets, would need separate stats)

### Cosmetics
- Player avatars
- Custom AI personalities
- Chamber skins
- Unlock via victories

### Analytics
- Track bet strategies
- Identify optimal betting patterns
- Display post-game statistics

---

## Iteration Priorities

**Phase 1: Core MVP**
1. Basic game loop (magazine, turns, HP)
2. Wallet system (assign, bet, resolve)
3. Reaping (selection, trigger)
4. Victory/death flows
5. AI opponent (structured output)
6. Basic taunts (pre-written or simple LLM)

**Phase 2: Polish**
1. UI refinement (8bitcn customization)
2. Animations (shots, damage, eject)
3. Timing tuning (delays, pacing)
4. LLM taunt quality (system prompt refinement)
5. Sound effects (optional)

**Phase 3: Balance**
1. Magic numbers tuning
2. Bet payout adjustment
3. Magazine size/ratio testing
4. Economic churn validation
5. Playtesting feedback

**Phase 4: Launch Prep**
1. Deployment setup
2. Secrets management
3. Performance testing (10+ spectators)
4. Bug fixes
5. Demo narrative preparation (for TorinoJS)

---

## Success Criteria

**Demo is successful if:**
- Game loop functions end-to-end (lobby → game → exit)
- Betting feels meaningful (economic churn visible)
- AI feels oppressive (taunts land, eject advantage clear)
- Theme is clear (dystopian satire understood)
- Technically impressive (Effect.ts + AI SDK integration showcased)
- Audience engagement (people want to play/watch)

**Demo fails if:**
- Game breaks or crashes frequently
- Betting is confusing or unresponsive
- AI feels dumb or unfair (wrong balance)
- Theme is unclear or offensive (without satirical framing)
- Technical implementation is unremarkable
- Audience is bored or uncomfortable (in wrong way)
