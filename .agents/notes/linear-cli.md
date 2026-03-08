# Linear CLI - Story Creation Patterns

## Working Configuration (2026-03-08)

**Team:** TOR (torinojs)
**Project:** 22c63845669e (DEMO)
**Created Issues:** TOR-31 through TOR-50 (20 stories)

## Key Gotchas

### 1. Team Key Required
Linear CLI cannot determine team automatically. **ALWAYS** use `--team TOR` when creating issues, otherwise fails with:
```
Could not determine team key
```

### 2. Labels Must Pre-Exist
Cannot apply labels via CLI unless they already exist in Linear workspace. Attempting `--label "foundation"` fails with:
```
Could not determine ID for issue label foundation
```

**Workaround:** Include labels in description for reference, apply manually in UI later:
```typescript
const labelsNote = `**Labels**: ${story.labels.join(', ')}\n\n`;
const fullDescription = labelsNote + story.description;
```

### 3. Project Assignment Limitations
Cannot assign to project by slug via CLI. Both `--project "demo-22c63845669e"` and `--project "22c63845669e"` fail with:
```
Could not determine ID for project 22c63845669e
```

**Workaround:** Create issues without project assignment, bulk-assign in Linear UI after creation.

### 4. Issue List Filters
`linear issue list` has complex default filtering that hides newly created issues. Default states shown:
- Default: `unstarted` only
- Newly created issues (via CLI) default to **no workflow state** → not shown

**Solution:** View specific issues by ID instead:
```bash
linear issue view TOR-31
linear issue title TOR-36
```

### 5. Sort Parameter Required
Many list commands require `--sort` flag or `LINEAR_ISSUE_SORT` env var:
```bash
linear issue list --team TOR --sort priority
```
Valid sort values: `manual`, `priority` (NOT `created` or `updated`)

## Working Script Pattern

```typescript
import { execSync } from 'child_process';

function createStory(story: Story): void {
  const priorityArg = story.priority ? `--priority ${story.priority}` : '';
  const labelsNote = `**Labels**: ${story.labels.join(', ')}\n\n`;
  const fullDescription = labelsNote + story.description;

  const escapedDescription = fullDescription
    .replace(/`/g, '\\`')
    .replace(/"/g, '\\"');

  const command = `linear issue create \\
    --team TOR \\
    --title "${story.title}" \\
    --description "${escapedDescription}" \\
    ${priorityArg}`;

  execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
}
```

## Post-Creation Manual Steps

After script execution:
1. Open project in Linear UI: `https://linear.app/stefan-projects/project/22c63845669e`
2. Bulk-select all new issues (filter by recent, TOR-31+)
3. Assign to project "DEMO"
4. Add labels if needed (foundation, game, econ, flow, ai, ui)
5. (Optional) Set up blocking relationships for dependencies

## Story Deduplication (2026-03-08)

**Deleted Duplicates** (overlapped with bootstrap TOR-2 to TOR-10):
- ~~TOR-31: Monorepo Setup~~ → Duplicate of TOR-3 (DONE)
- ~~TOR-32: Database Layer~~ → Duplicate of TOR-5 (DONE)
- ~~TOR-34: Deployment~~ → Duplicate of TOR-9 (DONE)
- ~~TOR-35: AI SDK~~ → Duplicate of TOR-8 (DONE)

**Remaining Stories** (TOR-33, TOR-36 to TOR-50 = 16 stories):

**Priority 1** (Foundation - remaining):
- TOR-33: GitHub OAuth Authentication (replace email/password, needs TOR-5)

**Priority 2** (Core features - parallel within tier):
- TOR-36: Russian Roulette Core Loop (needs TOR-5)
- TOR-37: AI Opponent (needs TOR-8, TOR-36)
- TOR-38: Game Timing (needs TOR-36)
- TOR-39: Wallet & Betting (needs TOR-5)
- TOR-41: Leaderboard (needs TOR-39)
- TOR-42: Lobby & Reaping (needs TOR-33, TOR-39)
- TOR-47: Real-time Sync (needs TOR-5)
- TOR-48: Pixel Art Foundation (needs TOR-3)

**Priority 3** (Polish - depends on core):
- TOR-40: Freedom Pass (needs TOR-36, TOR-39)
- TOR-43: Victory/Death States (needs TOR-36, TOR-42)
- TOR-44: Session Management (needs TOR-42, TOR-43)
- TOR-45: AI Taunts (needs TOR-8, TOR-36)
- TOR-46: Narrative Framing (needs TOR-43, TOR-45)
- TOR-49: Betting UI (needs TOR-39, TOR-41, TOR-48)
- TOR-50: Game Display (needs TOR-36, TOR-38, TOR-48)

## References

- Script location: `scripts/create-linear-stories.ts`
- Requirements docs: `docs/requirements/`
- Linear workspace: `https://linear.app/stefan-projects`
