# Game Structure

## Core Definitions

These terms define the game's structural hierarchy:

### Set
**The entire game** from start until one participant reaches 0 HP.
- One set = complete player vs AI match
- Continues through multiple rounds/magazines until death
- No time limit

### Round
**One magazine** of chambers played to completion.
- A round begins when magazine is loaded
- Ends when all chambers are expended
- Multiple rounds occur per set

### Magazine
**A chamber array** with randomized properties:
- **Random size:** Number of total chambers (range TBD in [Magic Numbers](./magic-numbers.md))
- **Random ratio:** Proportion of live vs blank rounds
- Each magazine is independently randomized

### Chamber/Round (atomic unit)
**Single bullet** in the magazine (either live or blank).

---

## HP System

### Starting Health
- **Player:** 5 HP
- **AI:** 5 HP

### Damage Model
- **Live round hit:** -1 HP
- **Blank round:** 0 damage
- **Game ends immediately** when either participant reaches 0 HP

### No Healing
- HP only decreases, never increases
- No items or abilities restore health

---

## Magazine Mechanics

### Randomization Per Magazine

Each new magazine generates with:

1. **Random size** (number of chambers)
   - Min/max values TBD
   - Independent of previous magazines

2. **Random live/blank ratio**
   - Percentage of live rounds
   - Ratio bounds TBD (suggested: 30-70% live for tension)
   - Rounded to nearest whole number of rounds

**Example magazine:**
- Size: 6 chambers
- Ratio: 50% live
- Composition: 3 live, 3 blank (shuffled randomly)

### Magazine Lifecycle

1. **Load:** Magazine generated with random size/ratio
2. **Reveal:** Players informed of total live/blank counts (not order)
3. **Play:** Chambers expended through player/AI turns
4. **Deplete:** All chambers used
5. **Reload:** New magazine generated with new random parameters

### Information Disclosure

**Players know:**
- Total chambers in current magazine
- Total live rounds remaining
- Total blank rounds remaining
- Which chambers have been used

**Players don't know:**
- Order of remaining chambers (unless only one remains)
- Future magazine compositions

---

## Turn-Based Gameplay

### Turn Order
- Alternates between player and AI
- Starting player: randomized per magazine (TBD)
- Turn passes after each shot

### Action Options

On your turn, you must choose:

1. **Shoot opponent:** Point gun at opponent, pull trigger
   - Live round: opponent takes 1 damage
   - Blank: no effect

2. **Shoot self:** Point gun at yourself, pull trigger
   - Live round: you take 1 damage, turn ends
   - Blank: no damage, **you go again** (extra turn)

### Strategic Depth

Shooting yourself with a blank grants an extra turn, creating risk/reward decisions based on known magazine composition.

---

## AI Special Ability: Eject

### Mechanic

The AI has an **unfair advantage** to reinforce the dystopian power imbalance:

**Eject action:**
- AI can choose to eject the current chambered round without firing
- Usable **once per magazine**
- Visible to all players (announced action)
- Does not count as a shot
- Turn continues (AI then takes normal action)

### Thematic Purpose

This ability:
- Makes the AI's rigging **explicit**
- Creates suspicion and psychological pressure
- Reinforces AI dominance narrative
- Introduces uncertainty (did AI eject because it was live or bluffing?)

### UI Requirements

When AI ejects:
- Clear animation/visual feedback
- Announcement in game log
- Spectators see the action clearly
- Ejected round removed from magazine (counts updated)

---

## Victory Conditions

### Player Wins (AI reaches 0 HP)
- Player survives
- Game ends immediately
- All participants presented with EXIT button
- Clicking EXIT triggers `window.close()` (freedom granted)

### Player Loses (Player reaches 0 HP)
- Player dies
- Game continues
- Dead player becomes spectator with red tint overlay
- Next poorest spectator is reaped
- New round begins with new player vs AI

---

## Game Continuation

A single game session continues indefinitely through multiple player deaths until:
- Player achieves victory (AI dies)
- Fewer than 4 total participants remain (game cannot continue)

**There is no win condition for AI** - the system perpetuates itself by feeding new players when the current one dies.

---

## Timing & Pacing

### Action Delays (Values TBD)

Dramatic pauses between actions for tension:
- After trigger pull: delay before hit/blank revealed
- After damage: pause to show HP change
- After death: moment of silence before reaping
- Between turns: brief transition

### Round Transitions

Between magazine depletion and reload:
- Display magazine statistics (hits/misses)
- Brief respite before next magazine loads
- Allow spectators to review bets/outcomes

---

## Information Display Requirements

During active gameplay, all participants must see:

**Player Status:**
- Current HP
- Name/identifier

**AI Status:**
- Current HP
- Eject ability status (available/used)

**Magazine Status:**
- Current chamber number
- Total chambers
- Live rounds remaining
- Blank rounds remaining

**Round History:**
- Previous shots (hit/miss/eject)
- Turn sequence

---

## Edge Cases

### Last Chamber Certainty
When only one chamber remains, outcome is certain (known live or blank).
- Player must still choose target (self/opponent)
- AI may still choose to eject if unused (denial of information)

### Magazine Exhaustion
If all chambers are blanks and players keep shooting themselves for extra turns:
- Magazine eventually depletes
- New magazine loads automatically

### Simultaneous Death (Impossible)
Turn-based system prevents simultaneous 0 HP.
- Current turn player's action resolves first
- If they die from shooting self, game ends before opponent's turn
