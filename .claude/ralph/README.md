# Ralph Methodology for Lead Intel

> **Autonomous iterative development with fresh context per cycle**

This document adapts the [Ralph methodology](https://github.com/snarktank/ralph) for Lead Intel's multi-agent development workflow.

---

## What is Ralph?

Ralph is an **autonomous AI agent loop** that runs fresh agent instances repeatedly until all PRD (Product Requirements Document) items are complete. Each iteration:

- Starts with **clean context** (no conversation history)
- Works on **one small task** from the PRD
- Validates with **quality gates** (typecheck, tests)
- **Commits** successful changes to git
- **Logs learnings** to progress.txt
- Updates **task status** in prd.json

**Key Insight:** Fresh context prevents token exhaustion and context pollution. State persists through git, progress.txt, and prd.json.

---

## How Ralph Works with Lead Intel Multi-Agent System

### Standard Ralph
```
ralph.sh → Amp Agent (fresh) → Build → Test → Commit → Repeat
```

### Lead Intel Ralph (Multi-Agent)
```
ralph.sh → Director Agent → [Researcher/Analyst/UX] → Build → Test → Commit → Repeat
                ↓
         Routes to specialist agents based on task type
```

**Enhancement:** Our Director Agent intelligently routes tasks to specialist agents:
- **Researcher** tasks → Researcher Agent
- **Analytics** tasks → Business Analyst Agent
- **UX/Frontend** tasks → UX Agent
- **Complex** tasks → Multi-agent coordination

---

## File Structure

```
.claude/ralph/
├── README.md                    # This file
├── prd.json                     # Task registry (auto-generated)
├── progress.txt                 # Learnings log (append-only)
├── AGENTS.md                    # Project context for agents
└── templates/
    └── prd-template.json        # PRD structure template
```

---

## Creating a PRD

### Step 1: Define User Stories

Create a markdown PRD with small, granular tasks:

```markdown
# Feature: Enhanced Lead Research

## User Stories

### 1. Add Google News Integration
**As a** Researcher Agent
**I want** to scrape Google News for company mentions
**So that** SDRs have recent news in their research briefs

**Acceptance Criteria:**
- [ ] Create `server/ai/newsResearch.ts` module
- [ ] Integrate with Google News API
- [ ] Return structured news articles (title, date, summary, url)
- [ ] Add to `leadResearch.ts` orchestrator
- [ ] Include confidence scoring

**Priority:** High
**Effort:** Medium (3-4 hours)

### 2. Add Job Postings Analysis
**As a** Researcher Agent
**I want** to analyze company job postings
**So that** we can identify pain points from hiring patterns

**Acceptance Criteria:**
- [ ] Create `server/ai/jobPostingsAnalysis.ts`
- [ ] Scrape job postings from company website
- [ ] Extract pain signals (e.g., "5 CAD engineer roles = capacity issue")
- [ ] Return structured pain points with evidence

**Priority:** High
**Effort:** Medium (2-3 hours)

### 3. UX: Display Research by Default
**As an** SDR
**I want** research briefs displayed by default (not accordion)
**So that** I don't miss pre-call intelligence

**Acceptance Criteria:**
- [ ] Modify `client/src/pages/leads.tsx`
- [ ] Change accordion to expanded-by-default
- [ ] Make research collapsible (not hidden)
- [ ] Test on mobile viewport

**Priority:** High
**Effort:** Low (1 hour)
```

### Step 2: Convert to prd.json

```json
{
  "feature": "Enhanced Lead Research",
  "branchName": "feature/enhanced-lead-research",
  "created": "2026-01-09T12:00:00Z",
  "stories": [
    {
      "id": "story-1",
      "title": "Add Google News Integration",
      "description": "Create newsResearch.ts module to scrape Google News for company mentions",
      "agentType": "researcher",
      "priority": "high",
      "effort": "medium",
      "acceptanceCriteria": [
        "Create server/ai/newsResearch.ts module",
        "Integrate with Google News API",
        "Return structured news articles",
        "Add to leadResearch.ts orchestrator",
        "Include confidence scoring"
      ],
      "files": [
        "server/ai/newsResearch.ts",
        "server/ai/leadResearch.ts"
      ],
      "passes": false,
      "completedAt": null
    },
    {
      "id": "story-2",
      "title": "Add Job Postings Analysis",
      "description": "Analyze company job postings to identify pain points",
      "agentType": "researcher",
      "priority": "high",
      "effort": "medium",
      "acceptanceCriteria": [
        "Create server/ai/jobPostingsAnalysis.ts",
        "Scrape job postings from company website",
        "Extract pain signals from hiring patterns",
        "Return structured pain points with evidence"
      ],
      "files": [
        "server/ai/jobPostingsAnalysis.ts",
        "server/ai/leadResearch.ts"
      ],
      "passes": false,
      "completedAt": null
    },
    {
      "id": "story-3",
      "title": "UX: Display Research by Default",
      "description": "Show research briefs expanded by default instead of accordion",
      "agentType": "ux",
      "priority": "high",
      "effort": "low",
      "acceptanceCriteria": [
        "Modify client/src/pages/leads.tsx",
        "Change accordion to expanded-by-default",
        "Make research collapsible",
        "Test on mobile viewport"
      ],
      "files": [
        "client/src/pages/leads.tsx"
      ],
      "passes": false,
      "completedAt": null
    }
  ]
}
```

**Key Fields:**
- `agentType`: Which specialist agent to use (researcher, analyst, ux, or director)
- `priority`: high, medium, low
- `effort`: low, medium, high
- `passes`: false (pending) → true (complete)
- `files`: Files that will be modified (helps agent focus)

---

## Running Ralph

### Manual Ralph (Development)

```bash
# 1. Create your PRD
cat > .claude/ralph/my-feature-prd.json << 'EOF'
{
  "feature": "My Feature",
  "branchName": "feature/my-feature",
  "stories": [...]
}
EOF

# 2. Start on feature branch
git checkout -b feature/my-feature

# 3. Run iterations manually
while true; do
  # Get next incomplete story
  STORY=$(jq -r '.stories[] | select(.passes == false) | .id' .claude/ralph/my-feature-prd.json | head -1)

  if [ -z "$STORY" ]; then
    echo "✅ All stories complete!"
    break
  fi

  # Extract story details
  TITLE=$(jq -r ".stories[] | select(.id == \"$STORY\") | .title" .claude/ralph/my-feature-prd.json)
  AGENT=$(jq -r ".stories[] | select(.id == \"$STORY\") | .agentType" .claude/ralph/my-feature-prd.json)

  echo "🎯 Working on: $TITLE (Agent: $AGENT)"

  # Invoke appropriate agent
  # (You do this manually or script it)
  @$AGENT Implement story: $TITLE

  # After agent completes, run quality checks
  npm run check
  npm run test:e2e

  # If passes, commit and mark complete
  if [ $? -eq 0 ]; then
    git add -A
    git commit -m "feat: $TITLE"

    # Update prd.json
    jq "(.stories[] | select(.id == \"$STORY\") | .passes) = true" .claude/ralph/my-feature-prd.json > tmp.json && mv tmp.json .claude/ralph/my-feature-prd.json

    # Log learnings
    echo "✅ $TITLE - $(date)" >> .claude/ralph/progress.txt
  else
    echo "❌ Quality checks failed. Fix and retry."
    break
  fi
done
```

### Automated Ralph (Future)

```bash
# Not yet implemented - would require automation script
./scripts/ralph-loop.sh .claude/ralph/my-feature-prd.json
```

---

## Quality Gates

Each iteration must pass:

1. **TypeScript Check**
   ```bash
   npm run check
   ```

2. **E2E Tests** (for UI changes)
   ```bash
   npm run test:e2e
   ```

3. **Playwright Tests** (for UX changes)
   ```bash
   npm run playwright:flows
   ```

4. **Database Migration** (for schema changes)
   ```bash
   npm run db:push
   ```

**Rule:** Only commit if all quality gates pass. Broken code cascades through iterations.

---

## Progress.txt Format

Append learnings after each successful iteration:

```
=== 2026-01-09 - story-1: Add Google News Integration ===
✅ Created server/ai/newsResearch.ts
✅ Integrated with Google News API
✅ Added to leadResearch.ts orchestrator

Lessons Learned:
- Google News API rate limits: 100 requests/day
- Need to cache results for 24 hours
- Confidence scoring based on article recency and source authority

Files Modified:
- server/ai/newsResearch.ts (NEW)
- server/ai/leadResearch.ts (MODIFIED)
- server/storage.ts (MODIFIED - added caching)

Next Story: story-2 (Job Postings Analysis)

---

=== 2026-01-09 - story-2: Add Job Postings Analysis ===
✅ Created server/ai/jobPostingsAnalysis.ts
✅ Scrapes job postings from company websites
✅ Extracts pain signals from hiring patterns

Lessons Learned:
- Job boards vary significantly (Indeed, LinkedIn, company careers page)
- Focus on company careers page for most accurate data
- Pain signals: High volume of specific role = capacity issue
- Example: "5 CAD engineer openings" → CAD workflow inefficiency

Gotchas:
- Some sites block scraping - need to handle gracefully
- Job postings often lack detailed descriptions

Files Modified:
- server/ai/jobPostingsAnalysis.ts (NEW)
- server/ai/leadResearch.ts (MODIFIED)

Next Story: story-3 (UX: Display Research by Default)

---
```

**Purpose:** Since each agent has fresh context, progress.txt provides continuity and prevents repeating mistakes.

---

## AGENTS.md Updates

Update `.claude/agents/README.md` with project-specific learnings:

```markdown
## Project Context (Updated by Ralph Iterations)

### Recent Learnings (2026-01-09)

**Google News Integration:**
- Rate limit: 100 requests/day
- Cache results for 24 hours in database
- Confidence scoring: Recent articles (< 30 days) = high confidence

**Job Postings Analysis:**
- Focus on company careers page (most accurate)
- Pain signal pattern: High volume of specific role = capacity/workflow issue
- Gracefully handle sites that block scraping

**Lead Research Orchestrator:**
- All research modules return standardized format:
  ```typescript
  {
    data: T,
    confidence: "high" | "medium" | "low",
    sources: string[],
    timestamp: Date
  }
  ```

### Gotchas

- Google News API has daily limits - implement caching
- Job posting scrapers need fallback handling
- Research modules must timeout after 30 seconds
```

---

## Task Sizing Guidelines

**✅ Right-sized tasks** (can complete in one context window):
- Add a single API integration module
- Create one UI component
- Modify one existing feature
- Add one database table
- Write tests for one module

**❌ Over-sized tasks** (will exhaust context):
- "Build entire dashboard"
- "Implement all analytics"
- "Create complete research system"
- "Redesign the entire UI"

**Rule of thumb:** If acceptance criteria has > 5 items, split the story.

---

## Multi-Agent Routing

Ralph directs tasks to specialist agents based on `agentType`:

### Researcher Agent
```json
{
  "agentType": "researcher",
  "title": "Add LinkedIn Company Scraping"
}
```

**Routes to:** `@researcher`

**Capabilities:**
- Web scraping (LinkedIn, X, websites)
- Data extraction and structuring
- Confidence scoring
- API integration (Google News, SerpAPI, XAI)

---

### Business Analyst Agent
```json
{
  "agentType": "analyst",
  "title": "Create Conversion Rate Analysis Module"
}
```

**Routes to:** `@business-analyst`

**Capabilities:**
- Analytics module creation
- Metric definitions
- Insight generation
- Forecasting models
- Executive reporting

---

### UX Agent
```json
{
  "agentType": "ux",
  "title": "Simplify Lead Creation Form"
}
```

**Routes to:** `@ux-agent`

**Capabilities:**
- UX audits with Playwright
- Component modifications
- Workflow optimization
- Accessibility fixes
- Responsive design

---

### Director Agent
```json
{
  "agentType": "director",
  "title": "Implement End-to-End Lead Qualification Flow"
}
```

**Routes to:** `@director`

**Use when:**
- Task requires multiple agents
- Complex coordination needed
- Cross-cutting concerns
- Architectural decisions

---

## Example: Complete Ralph Cycle

### Iteration 1: Google News Integration

**Input (prd.json):**
```json
{
  "id": "story-1",
  "title": "Add Google News Integration",
  "agentType": "researcher",
  "passes": false
}
```

**Process:**
1. Ralph reads prd.json, finds first incomplete story
2. Routes to Researcher Agent (`@researcher`)
3. Researcher Agent:
   - Reads acceptance criteria
   - Creates `server/ai/newsResearch.ts`
   - Integrates with Google News API
   - Adds to `leadResearch.ts` orchestrator
   - Runs quality checks
4. Quality gates pass (npm run check)
5. Git commit: `feat: add Google News integration`
6. Update prd.json: `"passes": true`
7. Append to progress.txt

**Output:**
- ✅ New module created and integrated
- ✅ Code passes TypeScript check
- ✅ Git history updated
- ✅ Story marked complete
- ✅ Learnings logged

---

### Iteration 2: Job Postings Analysis

**Input:**
```json
{
  "id": "story-2",
  "title": "Add Job Postings Analysis",
  "agentType": "researcher",
  "passes": false
}
```

**Process:** Same as Iteration 1

**Key:** Fresh context - Researcher Agent has no memory of Iteration 1, but reads:
- Git commits (sees newsResearch.ts exists)
- progress.txt (learns about API rate limits)
- AGENTS.md (understands project patterns)

---

### Iteration 3: UX Improvement

**Input:**
```json
{
  "id": "story-3",
  "title": "UX: Display Research by Default",
  "agentType": "ux",
  "passes": false
}
```

**Process:**
1. Ralph routes to UX Agent (`@ux-agent`)
2. UX Agent:
   - Captures current UI with Playwright
   - Modifies `client/src/pages/leads.tsx`
   - Tests on mobile viewport
   - Runs quality checks
   - Captures after screenshot
3. Quality gates pass
4. Git commit: `feat(ux): display research by default`
5. Update prd.json: `"passes": true`

**Note:** Different agent type, same process. Ralph doesn't care which agent - it just routes and validates.

---

## Benefits of Ralph for Lead Intel

### 1. **Fresh Context Per Task**
- No token exhaustion
- No context pollution
- Clean slate for each story

### 2. **Persistent Memory**
- Git history preserves code
- progress.txt preserves learnings
- prd.json tracks completion

### 3. **Quality Enforcement**
- Type checks prevent broken code
- Tests validate behavior
- Only working code commits

### 4. **Specialist Routing**
- Right agent for the right task
- Researcher for data, UX for frontend, etc.
- Director for complex coordination

### 5. **Incremental Progress**
- Small tasks complete reliably
- Visible progress (git log)
- Easy to resume if interrupted

---

## Best Practices

### ✅ Do:
- **Write small stories** - Each fits in one context window
- **Run quality checks** - Every iteration
- **Commit frequently** - After each story
- **Log learnings** - Update progress.txt
- **Update AGENTS.md** - Capture project patterns

### ❌ Don't:
- **Write huge stories** - Will exhaust context
- **Skip quality checks** - Broken code cascades
- **Batch commits** - Lose granularity
- **Ignore failures** - Fix before continuing
- **Let context accumulate** - Fresh context is the point

---

## Integration with CI/CD

Ralph fits naturally into CI/CD:

```yaml
# .github/workflows/ralph.yml
name: Ralph Autonomous Development

on:
  workflow_dispatch:
    inputs:
      prd_file:
        description: 'Path to prd.json'
        required: true

jobs:
  ralph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Ralph Loop
        run: |
          ./scripts/ralph-loop.sh ${{ github.event.inputs.prd_file }}

      - name: Create Pull Request
        if: success()
        uses: peter-evans/create-pull-request@v5
        with:
          title: "Ralph: Completed ${{ github.event.inputs.prd_file }}"
          body: "Autonomous development cycle complete. All stories passed."
```

---

## Troubleshooting

### Story stuck in loop
**Problem:** Agent keeps failing quality checks

**Solution:**
1. Check progress.txt for error patterns
2. Simplify acceptance criteria
3. Split story into smaller tasks
4. Add explicit guidance to AGENTS.md

---

### Context exhaustion
**Problem:** Agent runs out of tokens mid-task

**Solution:**
1. Story is too large - split it
2. Reduce acceptance criteria
3. Remove unnecessary details from PRD

---

### Quality gates fail
**Problem:** npm run check fails after agent changes

**Solution:**
1. Don't commit - fix the issue first
2. Add TypeScript linting to AGENTS.md gotchas
3. Consider if agent needs better guidance

---

## Resources

- **Original Ralph:** https://github.com/snarktank/ralph
- **Lead Intel Agents:** `.claude/agents/README.md`
- **CLAUDE.md:** Project documentation
- **Progress Log:** `.claude/ralph/progress.txt`

---

## Philosophy

> "Small tasks, fresh context, quality gates, persistent memory."

Ralph embodies:
- **Simplicity** - One task at a time
- **Quality** - Every iteration passes checks
- **Autonomy** - Agent works independently
- **Reliability** - State persists across cycles

**Ralph + Multi-Agent = Powerful iterative development for Lead Intel** 🚀
