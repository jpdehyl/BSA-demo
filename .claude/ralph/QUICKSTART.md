# Ralph Quick Start Guide

Get started with Ralph iterative development in 5 minutes.

---

## 1. Create Your PRD

Copy the template and customize:

```bash
cp .claude/ralph/templates/prd-template.json .claude/ralph/my-feature.json
```

Edit `my-feature.json`:

```json
{
  "feature": "My Feature Name",
  "branchName": "feature/my-feature",
  "created": "2026-01-09T12:00:00Z",
  "stories": [
    {
      "id": "story-1",
      "title": "Short descriptive title",
      "description": "What to build",
      "agentType": "researcher|analyst|ux|director",
      "priority": "high|medium|low",
      "effort": "low|medium|high",
      "acceptanceCriteria": [
        "Concrete testable requirement 1",
        "Concrete testable requirement 2"
      ],
      "files": ["path/to/file.ts"],
      "passes": false,
      "completedAt": null
    }
  ]
}
```

**Tips:**
- Keep stories small (< 5 acceptance criteria)
- Choose correct `agentType` for routing
- List files that will be modified

---

## 2. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

---

## 3. Run First Iteration

### Get Next Story

```bash
# Get first incomplete story
STORY_ID=$(jq -r '.stories[] | select(.passes == false) | .id' .claude/ralph/my-feature.json | head -1)

# Get story details
TITLE=$(jq -r ".stories[] | select(.id == \"$STORY_ID\") | .title" .claude/ralph/my-feature.json)
AGENT=$(jq -r ".stories[] | select(.id == \"$STORY_ID\") | .agentType" .claude/ralph/my-feature.json)

echo "🎯 Story: $TITLE"
echo "🤖 Agent: $AGENT"
```

### Invoke Agent

Based on `$AGENT` value:

**Researcher:**
```
@researcher Implement story: [paste story title and acceptance criteria]
```

**Business Analyst:**
```
@business-analyst Implement story: [paste story title and acceptance criteria]
```

**UX:**
```
@ux-agent Implement story: [paste story title and acceptance criteria]
```

**Director:**
```
@director Implement story: [paste story title and acceptance criteria]
```

---

## 4. Validate Quality Gates

After agent completes implementation:

```bash
# TypeScript check
npm run check

# Build (if applicable)
npm run build

# Tests (if applicable)
npm run test:e2e

# Playwright (for UX changes)
npm run playwright:flows
```

---

## 5. Commit Changes

If all quality gates pass:

```bash
git add -A
git commit -m "feat: $TITLE"
```

---

## 6. Update PRD Status

Mark story as complete:

```bash
# Update passes to true
jq "(.stories[] | select(.id == \"$STORY_ID\") | .passes) = true | (.stories[] | select(.id == \"$STORY_ID\") | .completedAt) = \"$(date -Iseconds)\"" .claude/ralph/my-feature.json > tmp.json && mv tmp.json .claude/ralph/my-feature.json

# Commit PRD update
git add .claude/ralph/my-feature.json
git commit -m "chore: mark $STORY_ID complete"
```

---

## 7. Log Learnings

Append to progress.txt:

```bash
cat >> .claude/ralph/progress.txt << EOF

=== $(date +%Y-%m-%d) - $STORY_ID: $TITLE ===
✅ [Paste acceptance criteria that were met]

Lessons Learned:
- [Key insight 1]
- [Key insight 2]

Gotcas:
- [Warning or caveat discovered]

Files Modified:
- [path/to/file.ts (NEW/MODIFIED)]

Quality Gates:
✅ npm run check
✅ npm run build

Next Story: [next story id]

---
EOF
```

---

## 8. Repeat

Continue with next story:

```bash
# Get next story
STORY_ID=$(jq -r '.stories[] | select(.passes == false) | .id' .claude/ralph/my-feature.json | head -1)

# If no more stories:
if [ -z "$STORY_ID" ]; then
  echo "✅ All stories complete!"
  git push -u origin feature/my-feature
  # Create PR
else
  echo "🎯 Next story: $STORY_ID"
  # Repeat steps 3-8
fi
```

---

## Example Session

```bash
# 1. Create PRD
cp .claude/ralph/templates/prd-template.json .claude/ralph/news-integration.json
# Edit news-integration.json...

# 2. Create branch
git checkout -b feature/news-integration

# 3. Get first story
STORY_ID=$(jq -r '.stories[0].id' .claude/ralph/news-integration.json)
TITLE=$(jq -r '.stories[0].title' .claude/ralph/news-integration.json)
AGENT=$(jq -r '.stories[0].agentType' .claude/ralph/news-integration.json)

echo "Story: $TITLE"
echo "Agent: $AGENT"
# Output:
# Story: Add Google News Integration
# Agent: researcher

# 4. Invoke agent
@researcher Implement story: Add Google News Integration
# [Agent works on implementation]

# 5. Quality checks
npm run check
# ✅ No TypeScript errors

# 6. Commit
git add -A
git commit -m "feat: add Google News integration"

# 7. Update PRD
jq '(.stories[0].passes) = true' .claude/ralph/news-integration.json > tmp.json && mv tmp.json .claude/ralph/news-integration.json
git add .claude/ralph/news-integration.json
git commit -m "chore: mark story-1 complete"

# 8. Log learnings
echo "
=== 2026-01-09 - story-1: Add Google News Integration ===
✅ Created server/ai/newsResearch.ts
✅ Integrated with Google News API
✅ Added to leadResearch.ts

Lessons Learned:
- Google News API rate limit: 100 requests/day
- Need 24-hour caching

Files Modified:
- server/ai/newsResearch.ts (NEW)
- server/ai/leadResearch.ts (MODIFIED)

---
" >> .claude/ralph/progress.txt

# 9. Repeat for next story
STORY_ID=$(jq -r '.stories[] | select(.passes == false) | .id' .claude/ralph/news-integration.json | head -1)
# Continue...
```

---

## Troubleshooting

### Story fails quality checks

**Don't commit broken code.**

Instead:
1. Review error output
2. Ask agent to fix specific issue
3. Re-run quality checks
4. Commit only when all pass

### Context exhaustion

**Story is too large.**

Split it:
1. Copy story
2. Create story-1a and story-1b
3. Reduce acceptance criteria per story
4. Update PRD

### Agent confusion

**Add more context to AGENTS.md**

Update `.claude/ralph/AGENTS.md` with:
- Pattern that wasn't clear
- Gotcha that caused issues
- Example of correct approach

---

## Pro Tips

### Batch Story Creation

Create all stories upfront in PRD for better planning:

```json
{
  "stories": [
    { "id": "story-1", ... },
    { "id": "story-2", ... },
    { "id": "story-3", ... },
    { "id": "story-4", ... }
  ]
}
```

### Priority Ordering

Ralph processes stories in order. Put high-priority items first:

```json
{
  "stories": [
    { "priority": "high", ... },    // ← Done first
    { "priority": "high", ... },
    { "priority": "medium", ... },
    { "priority": "low", ... }      // ← Done last
  ]
}
```

### Agent Type Selection

| Task Type | Agent |
|-----------|-------|
| Web scraping, API integration, data extraction | researcher |
| Metrics, insights, forecasting, reports | analyst |
| UI/UX changes, frontend components | ux |
| Multi-agent coordination, complex tasks | director |

### Validation Per Agent Type

**Researcher:**
```bash
npm run check
npm run build
```

**Analyst:**
```bash
npm run check
npm run build
```

**UX:**
```bash
npm run check
npm run playwright:flows
npm run playwright:accessibility http://localhost:5000/page
```

**Director:**
```bash
npm run check
npm run build
npm run test:e2e
```

---

## Resources

- **Full Ralph Methodology:** `.claude/ralph/README.md`
- **Project Context:** `.claude/ralph/AGENTS.md`
- **PRD Template:** `.claude/ralph/templates/prd-template.json`
- **Progress Log:** `.claude/ralph/progress.txt`

---

**Happy iterating!** 🚀
