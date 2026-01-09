# Lead Intel v2.0 - Apple-Style UX Mockups

> **Design Philosophy:** "The best process is no process. The best tool is no tool unless necessary."
> **User Requirement:** "Apple style simplicity in our process and design and look"
> **Created:** January 9, 2026

---

## Design Principles

### Apple-Style Core Values
1. **Minimalism** - Remove unnecessary chrome, focus on content
2. **Clarity** - Clear visual hierarchy, readable typography
3. **Speed** - Instant feedback, smooth 200ms transitions
4. **Beauty** - Subtle shadows, generous whitespace, refined details
5. **Progressive Disclosure** - Show essentials first, details on-demand
6. **Delight** - Thoughtful micro-interactions

### Design System Foundation
**Typography:**
- Display: Inter 600 Semibold (32px-48px for big numbers)
- Headings: Inter 600 Semibold (20px-24px)
- Body: Inter 400 Regular (14px-16px)
- Labels: Inter 500 Medium (12px-14px)

**Spacing:** 8px grid system (8, 16, 24, 32, 40, 48)

**Colors:**
- Primary: `#2C88C9` (Hawk Ridge Blue)
- Accent: `#F26419` (Hawk Ridge Orange)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Danger: `#EF4444` (Red)
- Muted: `hsl(var(--muted))`

**Motion:** 200ms ease-out for all transitions

---

## 1. Kanban Board

### Overview
**Purpose:** Manager visibility into pipeline across 9 stages
**Users:** Managers (primary), SDRs (view own leads)
**Key Interaction:** Drag-and-drop cards between stages

### Layout Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PIPELINE                                                   [Filter ▼] [⟳ Live] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 Search leads...     [👤 SDR ▼]  [🏢 Industry ▼]  [📅 Last 30 days]  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───┐ ┌───┐  │
│  │ NEW  │ │RSRCH │ │RSCHD │ │CNTCT │ │ENGAG │ │QUALFD│ │HNDOFF│ │WON│ │LST│  │
│  │  12  │ │  3   │ │  8   │ │  15  │ │  7   │ │  4   │ │  2   │ │ 6 │ │ 3 │  │
│  ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├──────┤ ├───┤ ├───┤  │
│  │      │ │      │ │      │ │      │ │      │ │      │ │      │ │   │ │   │  │
│  │ ┌──┐ │ │ ┌──┐ │ │ ┌──┐ │ │ ┌──┐ │ │ ┌──┐ │ │ ┌──┐ │ │ ┌──┐ │ │┌─┐│ │┌─┐│  │
│  │ │██│ │ │ │░░│ │ │ │██│ │ │ │██│ │ │ │██│ │ │ │██│ │ │ │██│ │ ││█││ ││░││  │
│  │ └──┘ │ │ └──┘ │ │ └──┘ │ │ └──┘ │ │ └──┘ │ │ └──┘ │ │ └──┘ │ │└─┘│ │└─┘│  │
│  │      │ │      │ │      │ │      │ │      │ │      │ │      │ │   │ │   │  │
│  │ ┌──┐ │ │      │ │ ┌──┐ │ │ ┌──┐ │ │ ┌──┐ │ │ ┌──┐ │ │      │ │   │ │   │  │
│  │ │██│ │ │      │ │ │██│ │ │ │██│ │ │ │██│ │ │ │██│ │ │      │ │   │ │   │  │
│  │ └──┘ │ │      │ │ └──┘ │ │ └──┘ │ │ └──┘ │ │ └──┘ │ │      │ │   │ │   │  │
│  │      │ │      │ │      │ │      │ │      │ │      │ │      │ │   │ │   │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └───┘ └───┘  │
│                                                                                   │
│  Drag cards to update status • Auto-saves                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Card Detail (Hover/Focus State)

```
┌────────────────────────────────────────┐
│  Acme Manufacturing               [85] │  ← Fit score badge (large, right)
│  John Smith, VP Engineering            │
│  ────────────────────────────────────  │
│  🔴 High Priority                      │  ← Priority indicator
│  👤 Sarah Chen (SDR)                   │  ← Assigned SDR
│  📅 Next: Tomorrow 2:00 PM             │  ← Next action
│                                         │
│  [View Research →]                     │  ← Quick action (hover only)
└────────────────────────────────────────┘
```

### Apple-Style Design Notes

**Card Design:**
```css
/* Clean card with subtle elevation */
background: white;
border-radius: 8px;
padding: 16px;
box-shadow: 0 1px 3px rgba(0,0,0,0.08);
transition: all 200ms ease-out;

/* Hover state: Gentle lift */
&:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

/* Dragging state: More pronounced lift */
&.dragging {
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  transform: rotate(2deg);
  cursor: grabbing;
}
```

**Fit Score Badge:**
```css
/* Large, prominent fit score */
font-size: 24px;
font-weight: 600;
color: #10B981; /* Green for high scores */
background: rgba(16, 185, 129, 0.1);
border-radius: 6px;
padding: 4px 8px;
```

**Column Headers:**
```css
/* Minimalist column headers */
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
color: hsl(var(--muted-foreground));
margin-bottom: 16px;
```

### Responsive Behavior

**Desktop (1920px):**
- All 9 columns visible
- Horizontal scroll if needed
- Cards 280px wide

**Tablet (1024px):**
- Show 5-6 columns, horizontal scroll
- Cards 240px wide

**Mobile (375px):**
- Stack view (not kanban)
- Filter by status dropdown
- Cards full width

### Component Structure

```typescript
<KanbanBoard>
  <KanbanFilters />  {/* Search, SDR, Industry, Date Range */}
  <KanbanColumns>
    {stages.map(stage => (
      <KanbanColumn key={stage} stage={stage} count={leadCounts[stage]}>
        {leads.map(lead => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </KanbanColumn>
    ))}
  </KanbanColumns>
</KanbanBoard>
```

**Libraries:**
- `@dnd-kit/core` - Drag and drop
- `framer-motion` - Smooth animations
- `lucide-react` - Icons

---

## 2. Research Display

### Overview
**Purpose:** SDR reads AI-generated research before calling
**Users:** SDRs (primary)
**Key Interaction:** Progressive disclosure (expand/collapse sections)

### Layout Mockup (Collapsed State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Acme Manufacturing                                                 [×] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                          EXECUTIVE SUMMARY                         │ │
│  │                                                                    │ │
│  │                                  85                                │ │
│  │                              FIT SCORE                             │ │
│  │                                                                    │ │
│  │  Rapidly growing manufacturing company expanding CAD team.        │ │
│  │  Strong product-market fit for SolidWorks Premium + PDM.          │ │
│  │  Budget tier: High • Timeline: Immediate                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 PAIN POINTS                                      🟢 High Conf  │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  1. CAD File Version Control Chaos                        Critical │ │
│  │     Engineering team losing 2-3 hours/day managing file versions  │ │
│  │     Evidence: Job posting mentions "version control experience"   │ │
│  │     ─────────────────────────────────────────────────────────      │ │
│  │                                                                    │ │
│  │  2. Team Collaboration Bottlenecks                            High │ │
│  │     10 engineers, no centralized design management system         │ │
│  │     Evidence: LinkedIn shows distributed team structure           │ │
│  │     ─────────────────────────────────────────────────────────      │ │
│  │                                                                    │ │
│  │  3. Manufacturing Handoff Issues                            Medium │ │
│  │     Design-to-manufacturing workflow is manual                    │ │
│  │     Evidence: Job posting for "CAD/CAM specialist"                │ │
│  │                                                                    │ │
│  │  [Show 2 more pain points ▼]                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ✨ PRODUCT FIT                                      🟢 High Conf  │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  PRIMARY RECOMMENDATION: SolidWorks Premium + PDM Professional    │ │
│  │                                                                    │ │
│  │  Why it fits:                                                     │ │
│  │  • Solves version control chaos with centralized PDM             │ │
│  │  • Team collaboration features for 10+ engineers                 │ │
│  │  • CAM integration for manufacturing handoff                     │ │
│  │                                                                    │ │
│  │  Value proposition:                                               │ │
│  │  "Save 15-20 hours per week across your engineering team         │ │
│  │   with automated version control and seamless collaboration."    │ │
│  │                                                                    │ │
│  │  [📋 Copy Talk Track]                                             │ │
│  │                                                                    │ │
│  │  [Show secondary products ▼]                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  💰 BUDGET & TIMELINE                                [Expand ▼]   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  👤 DECISION MAKER PROFILE                           [Expand ▼]   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  💡 RECOMMENDED APPROACH                                          │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  Opening line:                                                    │ │
│  │  "I noticed Acme is hiring a CAD/CAM specialist – I'm guessing   │ │
│  │   your team is hitting some bottlenecks with design workflows?"  │ │
│  │                                                                    │ │
│  │  [📋 Copy Opening Line]  [📋 Copy Discovery Questions]           │ │
│  │                                                                    │ │
│  │  [Show full talk track ▼]                                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Research generated 3 minutes ago • Confidence: High                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Expanded Section Example (Budget & Timeline)

```
┌────────────────────────────────────────────────────────────────────┐
│  💰 BUDGET & TIMELINE                                [Collapse ▲]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Budget Tier: HIGH                                                 │
│  Estimated Range: $50K-$100K annual                                │
│                                                                    │
│  Indicators:                                                       │
│  • Company revenue: $25M+ (LinkedIn estimate)                     │
│  • Recent Series B funding: $15M (News: June 2025)               │
│  • Hiring 5+ engineers this quarter (Job postings)               │
│  • "Scaling production capacity" mentioned in CEO interview       │
│                                                                    │
│  Timeline: IMMEDIATE                                               │
│  • Hiring urgency suggests Q1 2026 implementation                 │
│  • New product launch planned for Q2 2026 (company blog)          │
│                                                                    │
│  Authority:                                                        │
│  • John Smith (VP Engineering) likely decision maker              │
│  • Reports to: CTO Sarah Johnson                                  │
│  • Final approval: CEO (for 50K+ purchases)                       │
└────────────────────────────────────────────────────────────────────┘
```

### Apple-Style Design Notes

**Executive Summary Card:**
```css
/* Hero section with huge fit score */
background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
border-radius: 12px;
padding: 48px;
text-align: center;

.fit-score {
  font-size: 72px;
  font-weight: 700;
  color: #10B981;
  line-height: 1;
  margin-bottom: 8px;
}

.fit-score-label {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: hsl(var(--muted-foreground));
}
```

**Confidence Indicators:**
```css
/* Subtle confidence badges */
.confidence-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;

  &.high {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  &.medium {
    background: rgba(245, 158, 11, 0.1);
    color: #D97706;
  }

  &.low {
    background: rgba(239, 68, 68, 0.1);
    color: #DC2626;
  }
}
```

**Expandable Sections:**
```css
/* Smooth accordion animation */
.section {
  overflow: hidden;
  transition: max-height 300ms cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed {
    max-height: 60px;
  }

  &.expanded {
    max-height: 800px;
  }
}

/* Header clickable area */
.section-header {
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}
```

**Copy Buttons:**
```css
/* Icon-only buttons, visible on hover */
.copy-button {
  opacity: 0;
  transition: opacity 200ms ease-out;

  .section:hover & {
    opacity: 1;
  }

  &:active {
    transform: scale(0.95);
  }
}
```

### Component Structure

```typescript
<ResearchDisplay lead={lead} research={research}>
  <ExecutiveSummary fitScore={85} summary="..." />

  <ResearchSection
    title="Pain Points"
    confidence="high"
    defaultExpanded={true}
  >
    <PainPointsList points={painPoints} />
  </ResearchSection>

  <ResearchSection
    title="Product Fit"
    confidence="high"
    defaultExpanded={true}
  >
    <ProductRecommendation
      primary={primaryProduct}
      value Prop={valueProp}
      onCopyTalkTrack={handleCopy}
    />
  </ResearchSection>

  <ResearchSection
    title="Budget & Timeline"
    confidence="medium"
    defaultExpanded={false}
  >
    <BudgetTimeline budget={budget} timeline={timeline} />
  </ResearchSection>

  <ResearchSection
    title="Decision Maker Profile"
    confidence="medium"
    defaultExpanded={false}
  >
    <DecisionMakerProfile profile={profile} />
  </ResearchSection>

  <RecommendedApproach
    opening={opening}
    questions={questions}
    onCopy={handleCopy}
  />
</ResearchDisplay>
```

---

## 3. Manager Dashboard

### Overview
**Purpose:** Team performance at a glance
**Users:** Sales Managers, Admins
**Key Interaction:** Filter by date range, SDR, team

### Layout Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                      [📅 Last 30 days ▼] [👤 All SDRs]│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────────┐ │
│  │                  │  │                  │  │                  │  │         │ │
│  │       156        │  │       42         │  │      27%         │  │  4.2m   │ │
│  │  TOTAL LEADS     │  │  QUALIFIED       │  │  CONVERSION RATE │  │ AVG TIME│ │
│  │                  │  │                  │  │                  │  │ RESEARCH│ │
│  │  ↑ 12% vs prev   │  │  ↑ 8% vs prev    │  │  ↓ 3% vs prev    │  │ ↓ 15s   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └─────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │  ACTIVITY OVER TIME                     │  │  TEAM LEADERBOARD           │  │
│  ├─────────────────────────────────────────┤  ├─────────────────────────────┤  │
│  │                                         │  │                             │  │
│  │       ╱╲                                │  │  👤 NAME      QUAL  CALLS   │  │
│  │      ╱  ╲    ╱╲                         │  │  ─────────────────────────  │  │
│  │     ╱    ╲  ╱  ╲  ╱╲                    │  │  1. Sarah Chen    12   45  │  │
│  │  ──╱      ╲╱    ╲╱  ╲───────            │  │  2. Mike Rodriguez 10   38  │  │
│  │                      ╲                  │  │  3. Emma Wilson     9   42  │  │
│  │                       ╲                 │  │  4. James Lee       8   35  │  │
│  │  ─────────────────────────────────────  │  │  5. Lisa Park       7   40  │  │
│  │  Week 1  Week 2  Week 3  Week 4         │  │                             │  │
│  │                                         │  │  [View Full Team →]         │  │
│  │  ── Calls  ── Qualified                 │  │                             │  │
│  └─────────────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                                   │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │  PIPELINE VELOCITY (Avg Days)           │  │  WIN RATE FUNNEL            │  │
│  ├─────────────────────────────────────────┤  ├─────────────────────────────┤  │
│  │                                         │  │                             │  │
│  │  New Lead         ███ 1.2 days          │  │      156 Researched         │  │
│  │  Researching      ██████ 2.5 days       │  │         ▼                   │  │
│  │  Contacted        ████████ 3.8 days     │  │       98 Contacted          │  │
│  │  Engaged          ███████████ 5.2 days  │  │         ▼                   │  │
│  │  Qualified        ████ 1.8 days         │  │       42 Qualified          │  │
│  │                                         │  │         ▼                   │  │
│  │  Total: 14.5 days                       │  │       27 Won                │  │
│  │  Target: 12 days  ⚠️                    │  │                             │  │
│  │                                         │  │  27% Conversion Rate        │  │
│  └─────────────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Apple-Style Design Notes

**KPI Cards (Big Numbers):**
```css
/* Huge, confident numbers */
.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.kpi-value {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  color: hsl(var(--foreground));
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 16px;
}

.kpi-trend {
  font-size: 14px;
  font-weight: 500;

  &.positive {
    color: #10B981;
  }

  &.negative {
    color: #EF4444;
  }
}
```

**Charts (Minimal, Clean):**
```css
/* recharts customization */
.recharts-cartesian-grid {
  stroke: hsl(var(--border));
  stroke-dasharray: 3 3;
  opacity: 0.3;
}

.recharts-line {
  stroke-width: 3px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.recharts-tooltip {
  background: white !important;
  border: 1px solid hsl(var(--border)) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}
```

**Leaderboard Table:**
```css
/* Clean, readable table */
.leaderboard {
  width: 100%;

  th {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: hsl(var(--muted-foreground));
    padding: 8px 16px;
    text-align: left;
    border-bottom: 1px solid hsl(var(--border));
  }

  td {
    font-size: 14px;
    padding: 16px;
    border-bottom: 1px solid hsl(var(--border));
  }

  tr:hover {
    background: hsla(var(--muted), 0.3);
    transition: background 200ms ease-out;
  }
}
```

### Responsive Behavior

**Desktop (1920px):**
- 4 KPI cards in top row
- 2x2 grid for charts below

**Tablet (1024px):**
- 2 KPI cards per row (2 rows)
- Stack charts vertically

**Mobile (375px):**
- 1 KPI card per row
- Charts full width, scrollable

### Component Structure

```typescript
<Dashboard>
  <DashboardHeader>
    <DateRangePicker />
    <SdrFilter />
  </DashboardHeader>

  <KpiGrid>
    <KpiCard value={156} label="Total Leads" trend="+12%" />
    <KpiCard value={42} label="Qualified" trend="+8%" />
    <KpiCard value="27%" label="Conversion Rate" trend="-3%" />
    <KpiCard value="4.2m" label="Avg Research Time" trend="-15s" />
  </KpiGrid>

  <ChartsGrid>
    <ActivityChart data={activityData} />
    <TeamLeaderboard data={leaderboardData} />
    <PipelineVelocity data={velocityData} />
    <WinRateFunnel data={funnelData} />
  </ChartsGrid>
</Dashboard>
```

**Libraries:**
- `recharts` - Charts
- `@tanstack/react-table` - Leaderboard
- `react-day-picker` - Date range picker

---

## 4. Handoff Form

### Overview
**Purpose:** SDR hands off qualified lead to AE
**Users:** SDRs
**Key Interaction:** Validation, preview, confirmation

### Layout Mockup (Initial State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HAND OFF TO ACCOUNT EXECUTIVE                                      [×] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Acme Manufacturing • John Smith                                         │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  VALIDATION CHECKLIST                                              │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  ✅ Lead status: Qualified                                         │ │
│  │  ✅ Research complete                                              │ │
│  │  ✅ At least one call logged                                       │ │
│  │  ✅ BANT information filled                                        │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  LEAD ANALYSIS                                                     │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  A complete analysis document has been generated including:       │ │
│  │  • Executive summary (Fit: 85/100)                                │ │
│  │  • Top 3 pain points with evidence                                │ │
│  │  • Product fit analysis (SolidWorks Premium + PDM)                │ │
│  │  • Budget indicators ($50K-$100K range)                           │ │
│  │  • Decision maker profile (John Smith, VP Engineering)            │ │
│  │  • Recommended approach & discovery questions                     │ │
│  │  • Call history (2 calls, 45 minutes total)                       │ │
│  │                                                                    │ │
│  │  [📄 Preview Full Analysis]                                        │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ACCOUNT EXECUTIVE                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Select AE...                                               ▼      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  NOTIFICATIONS                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ⚪ Send email to AE                                    [○────●]   │ │
│  │  ⚪ Create Salesforce task                              [○────●]   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  NOTES FOR AE (Optional)                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  Add any additional context...                                    │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│                                                                           │
│  [Cancel]                                         [Hand Off Lead →]      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dropdown Expanded

```
│  ACCOUNT EXECUTIVE                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Select AE...                                               ▲      │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  👤 Michael Torres         Northeast Territory                    │ │
│  │  👤 Jennifer Wu            West Coast                             │ │
│  │  👤 David Kim              Midwest & Central                      │ │
│  │  👤 Rachel Martinez        Southeast                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
```

### Preview Analysis (Modal)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LEAD ANALYSIS PREVIEW                                              [×] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║                       LEAD HANDOFF ANALYSIS                       ║  │
│  ║                      Acme Manufacturing Co.                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                           │
│  EXECUTIVE SUMMARY                                                        │
│  ────────────────────────────────────────────────────────────────────    │
│  Fit Score: 85/100 (High)                                                │
│  Budget: $50K-$100K • Timeline: Immediate • Authority: VP Level           │
│                                                                           │
│  Acme Manufacturing is a rapidly growing company expanding their          │
│  engineering team. Strong product-market fit for SolidWorks Premium       │
│  + PDM Professional. Ready to purchase within Q1 2026.                    │
│                                                                           │
│  TOP 3 PAIN POINTS                                                        │
│  ────────────────────────────────────────────────────────────────────    │
│  1. 🔴 CAD File Version Control Chaos (Critical)                          │
│     Engineering team losing 2-3 hours/day managing file versions          │
│     Evidence: Job posting mentions "version control experience"           │
│                                                                           │
│  2. 🟠 Team Collaboration Bottlenecks (High)                              │
│     10 engineers, no centralized design management system                 │
│     Evidence: LinkedIn shows distributed team structure                   │
│                                                                           │
│  [... more sections ...]                                                  │
│                                                                           │
│  ─────────────────────────────────────────────────────────────────────   │
│                                                    [Close]                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                            ⚠️                                             │
│                                                                           │
│                 Hand off Acme Manufacturing                               │
│                    to Michael Torres?                                     │
│                                                                           │
│  This will:                                                               │
│  • Send email with full analysis to mtorres@hawkridge.com                │
│  • Create Salesforce task assigned to Michael Torres                     │
│  • Update lead status to "Handed Off"                                    │
│  • Remove lead from your active pipeline                                 │
│                                                                           │
│  ───────────────────────────────────────────────────────────────────     │
│                                                                           │
│  [Cancel]                                      [Confirm Handoff →]       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Success State (Toast)

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Lead handed off to Michael Torres                           │
│                                                                  │
│  Email sent • Salesforce task created                           │
│                                               [Dismiss]          │
└─────────────────────────────────────────────────────────────────┘
```

### Apple-Style Design Notes

**Validation Checklist:**
```css
/* Clean checklist with green checkmarks */
.checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;

  .checkmark {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #10B981;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label {
    font-size: 14px;
    color: hsl(var(--foreground));
  }
}
```

**iOS-Style Toggles:**
```css
/* Beautiful iOS-inspired toggle switches */
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: hsl(var(--muted));
  position: relative;
  cursor: pointer;
  transition: background 200ms ease-out;

  &.active {
    background: #2C88C9;
  }

  .knob {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: left 200ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  &.active .knob {
    left: 22px;
  }
}
```

**Modal (Centered, Minimal):**
```css
/* Clean, centered modal */
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 48px;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);

  /* Smooth entry animation */
  animation: modal-enter 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

**Primary Button (Disabled State):**
```css
.primary-button {
  background: #2C88C9;
  color: white;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease-out;

  &:hover {
    background: #2477AD;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(44, 136, 201, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground));
    cursor: not-allowed;
    opacity: 0.5;
  }
}
```

**Toast Notification:**
```css
/* Subtle slide-in from top */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  animation: toast-enter 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Auto-dismiss after 3s */
  transition: opacity 300ms ease-out;
}

@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Component Structure

```typescript
<HandoffForm lead={lead}>
  <ValidationChecklist
    checks={[
      { label: "Lead status: Qualified", passed: true },
      { label: "Research complete", passed: true },
      { label: "At least one call logged", passed: true },
      { label: "BANT information filled", passed: true }
    ]}
  />

  <AnalysisPreview
    document={handoffDocument}
    onPreview={() => setShowPreview(true)}
  />

  <Select
    label="Account Executive"
    options={accountExecutives}
    onChange={setSelectedAe}
  />

  <NotificationToggles
    email={sendEmail}
    salesforce={createSfTask}
    onToggle={handleToggle}
  />

  <Textarea
    label="Notes for AE"
    placeholder="Add any additional context..."
    optional
  />

  <FormActions>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button
      variant="primary"
      disabled={!isValid}
      onClick={handleHandoff}
    >
      Hand Off Lead →
    </Button>
  </FormActions>
</HandoffForm>

{showConfirmation && (
  <ConfirmationModal
    title="Hand off Acme Manufacturing to Michael Torres?"
    onConfirm={executeHandoff}
    onCancel={() => setShowConfirmation(false)}
  />
)}
```

---

## Implementation Roadmap

### Developer Handoff

**For each component, developers should:**

1. **Read the mockup section** for that component
2. **Review Apple-Style Design Notes** for CSS patterns
3. **Use Component Structure** as scaffolding
4. **Reference shadcn/ui components:**
   - Button, Card, Select, Input, Textarea, Badge, Dialog
   - Use existing components where possible
5. **Add Framer Motion** for animations:
   - Page transitions: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`
   - Card drag: `<motion.div drag dragConstraints={...}>`
   - Modal entry: `variants` for scale + fade
6. **Test with Playwright:**
   - Screenshot each component (desktop, tablet, mobile)
   - Accessibility audit (must score > 90)
   - User flow test (happy path)

### Component Breakdown

#### Kanban Board (Story 9) - 5 hours
- `KanbanBoard.tsx` (main container)
- `KanbanColumn.tsx` (stage column)
- `KanbanCard.tsx` (lead card)
- `KanbanFilters.tsx` (search + filters)
- Use: `@dnd-kit/core`, `framer-motion`

#### Research Display (Story 11) - 3 hours
- `ResearchDisplay.tsx` (main container)
- `ExecutiveSummary.tsx` (hero section)
- `ResearchSection.tsx` (expandable sections)
- `PainPointsList.tsx`, `ProductRecommendation.tsx`, etc.
- Use: `framer-motion` for accordion, `lucide-react` for icons

#### Manager Dashboard (Story 12) - 4 hours
- `Dashboard.tsx` (main container)
- `KpiCard.tsx` (big number cards)
- `ActivityChart.tsx` (line chart)
- `TeamLeaderboard.tsx` (sortable table)
- `PipelineVelocity.tsx` (bar chart)
- `WinRateFunnel.tsx` (funnel chart)
- Use: `recharts`, `@tanstack/react-table`

#### Handoff Form (Story 15) - 2 hours
- `HandoffForm.tsx` (main form)
- `ValidationChecklist.tsx` (checklist)
- `AnalysisPreview.tsx` (preview modal)
- `NotificationToggles.tsx` (iOS-style switches)
- `ConfirmationModal.tsx` (confirmation dialog)
- Use: `react-hook-form`, `framer-motion` for modal

### Accessibility Checklist

For every component:

- [ ] **Keyboard Navigation:** All interactive elements reachable via Tab
- [ ] **Focus Indicators:** Visible focus ring on all focusable elements
- [ ] **ARIA Labels:** Proper `aria-label`, `aria-labelledby`, `aria-describedby`
- [ ] **Color Contrast:** WCAG 2.1 AA minimum (4.5:1 for text)
- [ ] **Screen Reader:** Test with VoiceOver/NVDA
- [ ] **Reduced Motion:** Respect `prefers-reduced-motion` media query
- [ ] **Semantic HTML:** Use `<button>`, `<nav>`, `<main>`, etc. appropriately

### Testing Recommendations

**Playwright Tests:**

```typescript
// Kanban Board
test('kanban board - drag card between columns', async ({ page }) => {
  await page.goto('/dashboard');
  const card = page.locator('[data-testid="lead-card-123"]');
  const targetColumn = page.locator('[data-testid="column-contacted"]');
  await card.dragTo(targetColumn);
  await expect(card).toBeVisible();
});

// Research Display
test('research display - expand/collapse sections', async ({ page }) => {
  await page.goto('/leads/123/research');
  await page.click('[data-testid="section-budget"]');
  await expect(page.locator('[data-testid="budget-details"]')).toBeVisible();
});

// Manager Dashboard
test('dashboard - filter by date range', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-testid="date-range-picker"]');
  await page.click('text=Last 7 days');
  await expect(page.locator('[data-testid="kpi-total-leads"]')).toContainText('42');
});

// Handoff Form
test('handoff form - complete flow', async ({ page }) => {
  await page.goto('/leads/123/handoff');
  await page.selectOption('[data-testid="ae-select"]', 'Michael Torres');
  await page.click('[data-testid="toggle-email"]');
  await page.click('[data-testid="submit-handoff"]');
  await page.click('[data-testid="confirm-handoff"]');
  await expect(page.locator('.toast')).toContainText('Lead handed off');
});
```

**Accessibility Audits:**

```bash
# Run for each page
npm run playwright:accessibility http://localhost:5000/dashboard
npm run playwright:accessibility http://localhost:5000/leads/123/research
npm run playwright:accessibility http://localhost:5000/leads/123/handoff
```

---

## Design System v2 Summary

### New Components

1. **KanbanCard** - Draggable lead card with fit score badge
2. **ResearchSection** - Expandable accordion section
3. **KpiCard** - Big number metric card with trend
4. **NotificationToggle** - iOS-style switch
5. **ConfirmationModal** - Centered confirmation dialog
6. **Toast** - Slide-in notification

### Typography Scale

```css
--text-xs: 12px;   /* Labels, badges */
--text-sm: 14px;   /* Body, table cells */
--text-base: 16px; /* Inputs, default */
--text-lg: 18px;   /* Section headings */
--text-xl: 24px;   /* Page headings */
--text-2xl: 32px;  /* Card headings */
--text-3xl: 48px;  /* KPI values */
--text-4xl: 72px;  /* Fit score hero */
```

### Spacing Scale (8px Grid)

```css
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
--space-6: 48px;
```

### Shadow Scale

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
--shadow-md: 0 4px 12px rgba(0,0,0,0.10);
--shadow-lg: 0 12px 24px rgba(0,0,0,0.15);
--shadow-xl: 0 20px 60px rgba(0,0,0,0.30);
```

### Animation Timing

```css
--transition-fast: 100ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--easing: cubic-bezier(0.4, 0, 0.2, 1); /* ease-out */
```

---

## Next Steps

1. ✅ UX mockups complete
2. **Start Sprint 3 (Jan 11-12):**
   - Story 9: Kanban Board component
   - Story 10: Kanban API endpoints
   - Story 11: Research Display component
   - Story 12: Manager Dashboard
3. **Parallel UX review:** Test mockups with 1-2 SDRs for feedback
4. **Story 19 (Jan 13):** Final UX polish pass

---

**Created:** January 9, 2026
**Design System Version:** 2.0
**Ready for Implementation:** ✅

**Remember:** When in doubt, remove rather than add. Less is more. Make it beautiful, fast, and joyful to use. 🍎
