# Hawk Ridge Systems - Lead Intel v2.0 Requirements

> **Project:** Lead Intel Production Version
> **Client:** Hawk Ridge Systems
> **Timeline:** MVP by January 13, 2026 | Hard Deadline: January 18, 2026
> **Created:** January 9, 2026

---

## Executive Summary

Lead Intel v2.0 is a complete rebuild focused on making SDRs more effective at **selling** rather than researching/reporting. Based on discovery feedback from Hawk Ridge Systems' AI team, we're adapting to their existing infrastructure (Salesforce, Zoom Phone, Azure) and focusing on core value: **AI-powered pre-call research**.

**Core Goal:** Make SDRs better at sales by eliminating research/admin overhead.

---

## Team Structure

- **20 SDRs** (Sales Development Representatives)
- **Multiple Managers** (exact number TBD)
- **Multiple Account Executives** (exact number TBD)
- **Executive Stakeholders** (President needs sales/operations visibility)

---

## Key Changes from v1.0

### ✅ KEEP
- AI-powered lead research (core value)
- Pre-call intelligence for SDRs
- Manager oversight and visibility
- Multi-agent system (Researcher, Analyst, UX, Director)
- Ralph methodology for development

### ❌ REMOVE/DEFER
- Live coaching → Phase 2 (future)
- Twilio browser softphone → Replaced with Zoom Phone
- Google Sheets import → Replaced with Salesforce
- Replit hosting → Moving to Azure

### 🔄 CHANGE
- **Lead Source:** Salesforce (not Google Sheets)
- **Call Platform:** Zoom Phone (not Twilio)
- **Infrastructure:** Azure (not Replit)
- **Manager View:** Kanban board (not simple list)
- **Handoff Process:** Structured AE handoff with complete analysis

---

## Functional Requirements

### 1. Salesforce Integration

#### 1.1 Lead Sync (Read from Salesforce)
**Objects to Sync:**
- **Lead** (Primary) - New prospects not yet qualified
- **Contact** (Secondary) - Existing contacts for research
- **Account** (Read-only) - Company data for enrichment
- **Opportunity** (Read-only) - Deal context for research

**Sync Direction:** Salesforce → Lead Intel (one-way for research data)

**Sync Frequency:**
- Real-time webhook (preferred) when new Lead created
- Fallback: Polling every 15 minutes
- Manual sync button for on-demand refresh

**Required Fields:**
- Lead: FirstName, LastName, Company, Email, Phone, Industry, Status
- Contact: FirstName, LastName, Account.Name, Email, Phone, Title
- Account: Name, Website, Industry, NumberOfEmployees, AnnualRevenue
- Opportunity: Name, StageName, Amount, CloseDate

#### 1.2 Task Creation (Write to Salesforce)
**Use Case:** AE Handoff notifications

**Object:** Task
**Fields:**
- Subject: "Qualified Lead: [Company Name] - [Contact Name]"
- Description: Complete lead analysis (pain points, product fit, budget)
- WhoId: Lead or Contact ID
- OwnerId: Account Executive ID
- Status: "Not Started"
- Priority: "High"
- DueDate: Today + 1 business day

**Settings:** Toggle on/off per AE preference

#### 1.3 Authentication
- **OAuth 2.0** (Salesforce Connected App)
- **Refresh Token** flow for long-term access
- **Per-user authorization** (not org-wide)
- **Scope:** api, refresh_token, full (for read/write access)

---

### 2. Zoom Phone Integration

#### 2.1 Call Recording Download
**API:** Zoom Phone API v2
**Endpoint:** `GET /phone/recording/{recordingId}`

**Workflow:**
1. SDR makes call via Zoom Phone (outside Lead Intel)
2. Call ends, Zoom webhook fires
3. Lead Intel downloads recording (MP3/M4A)
4. Store in Azure Blob Storage
5. Link to call session record

**Authentication:** JWT or Server-to-Server OAuth

#### 2.2 Call Transcription
**Options:**
- **Option A:** Zoom's built-in transcription (if available)
- **Option B:** Azure Speech-to-Text (send downloaded audio)
- **Recommended:** Option B (more control, better accuracy)

**Process:**
1. Download recording from Zoom
2. Send to Azure Speech-to-Text API
3. Receive transcript with timestamps
4. Store in database (call_sessions.transcriptText)
5. Run AI analysis on transcript

#### 2.3 Performance Analysis
**After each call:**
1. Analyze transcript with Gemini
2. Extract metrics:
   - Talk time vs. listen time
   - Questions asked
   - Objections handled
   - Value propositions mentioned
   - Next steps clarity
3. Score on 7 dimensions (like v1.0)
4. Save to manager_call_analyses table

**Webhook Setup:**
- Zoom webhook for "recording.completed" event
- Endpoint: `POST /api/webhooks/zoom/recording`
- Verify webhook signature for security

---

### 3. Lead Research Engine (Enhanced)

#### 3.1 Data Sources
**Primary:**
- Company website (existing)
- LinkedIn company page (existing)
- LinkedIn contact profile (existing via SerpAPI)
- Google News (NEW - add in v2.0)
- Company job postings (NEW - add in v2.0)
- Salesforce historical data (NEW)

**Secondary:**
- X/Twitter (existing, optional)
- Industry publications (future)
- Funding databases (future)

#### 3.2 Research Output
**Structured dossier with:**

1. **Company Overview**
   - Size, industry, revenue (from Salesforce + web)
   - Recent news (last 30 days)
   - Growth signals (hiring, funding, expansion)

2. **Pain Points** (Ranked by severity)
   - Description
   - Evidence (with sources)
   - Severity: Critical, High, Medium, Low
   - Confidence score

3. **Product Fit Analysis**
   - Matched Hawk Ridge products
   - Relevance score (0-100)
   - Talk track suggestions
   - Value proposition

4. **Budget Indicators**
   - Estimated company revenue
   - Recent funding events
   - Technology spend signals
   - Budget tier: High (>$100K), Medium ($50K-$100K), Low (<$50K)

5. **Decision Maker Profile**
   - Name, title, tenure
   - Background and career path
   - Communication style (analytical, relational, driver, expressive)
   - Recent activity and interests

6. **Recommended Approach**
   - Primary talk track
   - Discovery questions (5-7)
   - Objection handling scripts
   - Best time to call (if determinable)

#### 3.3 Confidence Scoring
Every data point includes confidence:
- **High (80-100%):** Multiple sources, recent data
- **Medium (50-79%):** Single source or older data
- **Low (<50%):** Inferred or speculative

Display confidence visually in UI (color coding).

---

### 4. Manager Dashboard & Kanban

#### 4.1 Kanban Board (TOFU Visibility)

**Stages:**
1. **New Lead** - Just synced from Salesforce
2. **Researching** - AI research in progress
3. **Researched** - Ready for SDR to call
4. **Contacted** - SDR attempted contact
5. **Engaged** - Prospect responded, conversation ongoing
6. **Qualified** - Meets BANT criteria, ready for AE
7. **Handed Off** - Transferred to Account Executive
8. **Won** - Deal closed successfully
9. **Lost** - Deal lost or lead unresponsive

**Automatic Updates:**
- New Lead: On Salesforce sync
- Researching: When research job starts
- Researched: When research completes
- Contacted: After first call logged
- Engaged: When prospect responds (email/call)
- Qualified: When SDR marks as qualified
- Handed Off: When transferred to AE
- Won/Lost: Synced from Salesforce Opportunity

**Board Features:**
- Drag-and-drop to manually move cards
- Click card to view full lead details
- Color coding by priority/fit score
- Avatar icons for assigned SDR
- Quick actions: Call, Research, Handoff

#### 4.2 Filters
**By SDR:**
- Dropdown: All SDRs, or specific SDR
- Show only leads assigned to selected SDR

**By Source:**
- Inbound, Outbound, Partner Referral, Event, etc.
- Pull from Salesforce Lead.LeadSource field

**By Industry:**
- Manufacturing, Aerospace, Automotive, etc.
- Pull from Salesforce Account.Industry

**By Date Range:**
- Last 7 days, Last 30 days, This Quarter, Custom

**By Status:**
- Multi-select: New, Researched, Contacted, etc.

**Saved Filters:**
- Allow managers to save custom filter combinations
- "My Team - This Week"
- "High Priority - Not Contacted"

#### 4.3 Metrics Dashboard
**Key Metrics (for President/Executives):**

**Top-Line:**
- Total Leads in Pipeline
- Qualified Leads (this month)
- Conversion Rate (Lead → Qualified)
- Average Time to Qualify (days)

**Activity:**
- Calls Made (today, this week, this month)
- Connect Rate (%)
- Talk Time (total minutes)
- Emails Sent

**Team Performance:**
- Top Performers (by qualified leads)
- Bottlenecks (leads stuck in stage)
- Velocity Trends (week-over-week)

**Quality:**
- Average Fit Score
- Research Completion Rate
- Win Rate (Qualified → Closed Won)

**Charts:**
- Line chart: Leads by stage over time
- Bar chart: Qualified leads per SDR
- Pie chart: Lead sources distribution
- Heatmap: Call activity by hour/day

---

### 5. AE Handoff System

#### 5.1 Handoff Trigger
**When:** SDR clicks "Hand Off to AE" button

**Pre-Check:**
- Lead must have Status = "Qualified"
- Research must be complete (confidence > 50%)
- At least one call logged
- BANT fields populated (Budget, Authority, Need, Timeline)

**If checks fail:** Show error message, require completion

#### 5.2 Complete Lead Analysis Document

**Auto-generate PDF/Email with:**

**1. Executive Summary**
```
Company: Acme Manufacturing
Contact: John Smith, VP of Engineering
Fit Score: 88/100
Estimated Budget: $75K - $120K
Recommended Product: SOLIDWORKS + PDM Professional
```

**2. Pain Points (Top 3)**
```
1. CAD Workflow Inefficiency (Critical)
   - Evidence: 5 CAD engineer job postings, LinkedIn post mentions file conversion issues
   - Impact: Slowing product development cycles

2. Version Control Challenges (High)
   - Evidence: Manual file management mentioned on website
   - Impact: Errors, rework, compliance risk

3. Team Scaling Issues (Medium)
   - Evidence: Engineering team growing 50→100 (LinkedIn)
   - Impact: Current tools won't scale
```

**3. Product Fit Analysis**
```
SOLIDWORKS + PDM Professional (95% match)
- Solves: CAD standardization + version control
- Value Prop: Cut design iteration time by 40%, single platform that scales
- Talk Track: "Companies at your growth stage often hit a wall with CAD fragmentation..."
```

**4. Budget Indicators**
```
- Annual Revenue: $50M - $100M (estimated)
- Recent Funding: $15M Series B (6 months ago)
- Budget Tier: High ($75K - $120K)
- Decision Timeline: Next 60-90 days (new VP in honeymoon period)
```

**5. Decision Maker Profile**
```
John Smith - VP of Engineering (45 days tenure)
- Background: Previously at Tesla (8 years), scaled eng 50→200
- Style: Analytical (data-driven decision maker)
- Interests: Manufacturing automation, lean processes, team scalability
- Recent Activity: Engaged with CAD workflow automation content
```

**6. Recommended Next Steps**
```
1. Schedule discovery call within 48 hours (momentum window)
2. Lead with "CAD workflow inefficiency" pain point
3. Use discovery questions:
   - "How is your team managing CAD file versions across multiple tools?"
   - "What's your biggest bottleneck as you scale from 50 to 100 engineers?"
4. Prepare for objections:
   - Cost → "Clients see 6-month ROI from reduced rework"
   - Change management → "Migrated 50+ companies, zero downtime"
```

**7. Call History**
```
- Call 1: Jan 5, 2026 (Connected, 8 min)
  Summary: Initial contact, discussed growth plans, mentioned CAD challenges
  Next Step: Follow-up with product demo

- Call 2: Jan 8, 2026 (Voicemail)
  Message left: Product demo scheduling
```

#### 5.3 Notification Methods

**Email Notification:**
- To: Assigned AE email
- CC: SDR (for transparency)
- Subject: "Qualified Lead: Acme Manufacturing - John Smith"
- Body: Complete lead analysis (formatted HTML)
- Attachment: Research dossier PDF

**Salesforce Task:**
- Object: Task
- Subject: "Qualified Lead: Acme Manufacturing"
- Description: Link to Lead Intel + key points summary
- Owner: Account Executive
- Due Date: Tomorrow
- Priority: High

**Settings:**
- Toggle email on/off (per AE preference)
- Toggle Salesforce task on/off
- Default: Both enabled

**Confirmation:**
- Show success toast: "Lead handed off to [AE Name]"
- Update Lead status to "Handed Off"
- Move kanban card to "Handed Off" column
- Lock further SDR edits (read-only)

---

## Non-Functional Requirements

### 1. Performance
- Research generation: <60 seconds per lead
- Salesforce sync: <5 seconds for 100 leads
- Dashboard load: <2 seconds
- Kanban board: <1 second to update stage

### 2. Scalability
- Support 20 SDRs initially
- Scale to 100+ SDRs
- Handle 10,000+ leads in database
- Concurrent users: 50+

### 3. Reliability
- 99.5% uptime
- Automated backups (daily)
- Error logging and monitoring
- Graceful degradation if Salesforce/Zoom unavailable

### 4. Security
- OAuth 2.0 for Salesforce
- JWT/OAuth for Zoom Phone
- HTTPS only
- Azure AD integration (future)
- Role-based access control

### 5. UX/UI (Apple-Style Simplicity)
**Principles:**
- **Minimalist:** Only essential information visible
- **Fast:** Every action <3 clicks
- **Clear:** Obvious next action
- **Beautiful:** Clean, modern, professional
- **Mobile-friendly:** Responsive design

**Design System:**
- Clean typography (Inter or SF Pro)
- Generous white space
- Subtle shadows and borders
- Consistent spacing (8px grid)
- Accessible color contrast (WCAG AA)

---

## Technical Constraints

### Infrastructure
- **Hosting:** Azure (App Service or Container Apps)
- **Database:** Azure SQL Database (provided by Hawk Ridge)
- **Storage:** Azure Blob Storage (call recordings)
- **Cache:** Azure Redis Cache (optional)
- **CDN:** Azure CDN (for static assets)

### Integrations
- **Salesforce:** REST API v58.0
- **Zoom Phone:** API v2
- **Azure Speech-to-Text:** For transcription
- **Google Gemini:** Via Azure or direct (TBD)

### Development
- Keep existing stack: React, TypeScript, Express.js, Drizzle ORM
- Add: Salesforce SDK, Zoom SDK, Azure SDK
- CI/CD: Azure DevOps (if available) or GitHub Actions

---

## MVP Scope (January 13, 2026)

### MUST HAVE
✅ Salesforce lead sync (read)
✅ Enhanced research engine (with Google News, job postings)
✅ Clean research display (Apple-style UI)
✅ Zoom Phone call recording download
✅ Post-call transcript analysis
✅ Kanban board with filters
✅ AE handoff with complete analysis
✅ Manager metrics dashboard

### NICE TO HAVE (Phase 2)
- Live coaching during calls
- Advanced analytics (predictive models)
- Mobile app
- Slack/Teams notifications
- Custom reporting

---

## Success Metrics

### For SDRs
- Time spent on research: -70% (18 min → 5 min)
- Calls per day: +30% (38 → 50)
- Qualification rate: +50% (28% → 42%)

### For Managers
- Visibility into team activity: Real-time
- Time to spot issues: <5 minutes
- Coaching opportunities identified: +100%

### For AEs
- Lead quality score: >80/100 average
- Handoff information completeness: 95%+
- Time to first AE contact: <24 hours

### For Business
- Lead→Qualified conversion: +25%
- Sales cycle length: -20%
- Win rate (Qualified→Won): +15%

---

## Open Questions (Awaiting Hawk Ridge Response)

1. **Azure Services:** Which specific Azure services are available? (App Service, Container Apps, Functions?)
2. **Salesforce Edition:** Which Salesforce edition? (Professional, Enterprise, Unlimited?) - affects API limits
3. **Zoom Phone Setup:** How many Zoom Phone licenses? Shared or per-SDR?
4. **Custom Salesforce Fields:** Any custom fields on Lead/Contact/Account we should sync?
5. **Authentication:** Azure AD for SSO or separate login?
6. **Domain:** What domain for production? (e.g., leadintel.hawkridgesys.com)
7. **Email Service:** Azure SendGrid or Hawk Ridge's SMTP?
8. **Budget Constraints:** Any hard limits on Azure spend?

---

## Timeline

| Date | Milestone |
|------|-----------|
| Jan 9 | Discovery complete, architecture designed |
| Jan 10-11 | Development Sprint 1 (Foundation) |
| Jan 12-13 | Development Sprint 2 (Features) |
| Jan 13 | **MVP DEMO** |
| Jan 14-17 | Refinement, testing, deployment |
| Jan 18 | **HARD DEADLINE** - Production launch |

---

## Risk Mitigation

**Risk:** Azure services not available → **Mitigation:** Have Heroku backup plan
**Risk:** Salesforce API limits → **Mitigation:** Implement caching, rate limiting
**Risk:** Zoom webhook delays → **Mitigation:** Polling fallback
**Risk:** Research AI takes too long → **Mitigation:** Background jobs, queue system
**Risk:** Scope creep → **Mitigation:** Strict MVP focus, defer nice-to-haves

---

**Document Version:** 1.0
**Last Updated:** January 9, 2026
**Next Review:** After Hawk Ridge questionnaire response
