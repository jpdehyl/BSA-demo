# Lead Intel v2.0 - Discovery Phase Summary

> **Status:** ✅ Discovery Complete
> **Branch:** `claude/v2-production-hawk-ridge-IUhta`
> **Created:** January 9, 2026
> **Timeline:** MVP Demo (Jan 13), Production Launch (Jan 18)

---

## 📋 Discovery Documents Created

### 1. Requirements Document
**File:** `.claude/discovery/hawk-ridge-requirements.md` (15 KB, 565 lines)

**Contents:**
- Executive summary with timeline constraints
- Team structure (20 SDRs, multiple managers/AEs)
- Key changes from v1.0:
  - Salesforce (replacing Google Sheets)
  - Zoom Phone (replacing Twilio)
  - Azure (replacing Replit)
- Detailed functional requirements:
  - Salesforce integration (Lead, Contact, Account sync, Task creation)
  - Zoom Phone integration (recordings, transcription, analysis)
  - Enhanced research engine (Google News, job postings)
  - Manager kanban board (9 stages, filters, metrics)
  - AE handoff system (complete analysis, email + SF task)
- Non-functional requirements:
  - **Critical:** Apple-style UX/UI simplicity
  - Performance, scalability, security
- MVP scope vs. deferred features
- Success metrics
- Open questions
- Risk mitigation

### 2. Architecture Document
**File:** `.claude/discovery/v2-architecture.md` (31 KB, 876 lines)

**Contents:**
- System overview diagram
- Data flow diagrams:
  - Lead sync (Salesforce → Lead Intel)
  - Research generation (multi-source)
  - Call recording & analysis (Zoom → Azure Speech)
  - AE handoff (email + Salesforce task)
- Component architecture:
  - Backend services (Salesforce, Zoom, Research, Handoff)
  - Frontend components (Kanban, Research Display, Metrics, Handoff Form)
- Database schema changes:
  - New tables: `salesforce_sync_log`, `zoom_call_recordings`, `handoff_logs`
  - Modified tables: `leads` (BANT fields), `call_sessions` (Zoom fields)
- API endpoints (65+ total):
  - Salesforce: `/api/salesforce/*`, `/api/webhooks/salesforce`
  - Zoom: `/api/webhooks/zoom/*`
  - Kanban: `/api/kanban/*`
  - Handoff: `/api/handoff/*`
- Azure infrastructure setup:
  - App Service (Node.js 20)
  - SQL Database (S1 tier)
  - Blob Storage (recordings, handoff docs)
  - Key Vault (secrets management)
  - Application Insights (monitoring)
  - Redis Cache (optional, sessions)
- Deployment strategy (GitHub Actions)
- Security considerations (OAuth, HTTPS, encryption)
- Monitoring & observability (metrics, alerts)
- Performance optimization (caching, pooling, CDN)
- Disaster recovery (backups, RTO/RPO)
- Scalability plan (20 → 50 → 100+ SDRs)

### 3. Migration Plan
**File:** `.claude/discovery/migration-plan.md` (28 KB, 1,086 lines)

**Contents:**
- 5-phase migration plan:
  - **Phase 1:** Infrastructure Setup (Jan 9-10)
  - **Phase 2:** Application Migration (Jan 10-12)
  - **Phase 3:** Integration Configuration (Jan 12-13)
  - **Phase 4:** Testing & Validation (Jan 13-17)
  - **Phase 5:** Cutover & Go-Live (Jan 17-18)
- Detailed Azure resource provisioning (CLI commands)
- Code changes for Azure compatibility:
  - Database connection (PostgreSQL → Azure SQL)
  - File storage (local → Azure Blob)
  - Session management (SQL or Redis)
  - Environment variables (Key Vault)
- Database schema migration (PostgreSQL → Azure SQL conversions)
- Data migration scripts (export/import)
- Application deployment (GitHub Actions, Azure CLI, ZIP deploy)
- Integration configuration:
  - Salesforce OAuth setup (Connected App, webhooks)
  - Zoom Phone setup (Server-to-Server OAuth, webhooks)
  - Azure Speech-to-Text setup
- Testing & validation:
  - Smoke tests (health checks, API tests)
  - Integration tests (Salesforce, Zoom, end-to-end)
  - Performance tests (load testing, query optimization)
  - User acceptance testing (SDRs, managers, AEs)
- Cutover steps:
  - Pre-cutover checklist
  - T-0 cutover actions
  - Rollback plan (3 scenarios)
  - Post-cutover monitoring
- Data integrity checks
- Risk mitigation matrix
- Post-migration cleanup

---

## 🎯 Ralph PRD Created

**File:** `.claude/ralph/v2-production.json`

**Overview:**
- **20 user stories** across 5 sprints
- **Timeline:** 4 days to MVP, 9 days to production launch
- **Philosophy:** Small tasks, fresh context, quality gates

### Sprint Breakdown

#### Sprint 1: Foundation (Jan 9-10)
**Stories:** 1-4 (12 hours estimated)

1. **Azure Infrastructure Setup** - Provision all Azure resources
2. **Database Migration** - Schema + data migration to Azure SQL
3. **Azure Blob Storage Integration** - File upload/download service
4. **Salesforce OAuth Integration** - OAuth 2.0 authentication flow

**Goal:** Azure infrastructure ready, database migrated, Salesforce auth working

---

#### Sprint 2: Integrations & Research (Jan 10-12)
**Stories:** 5-8 (13 hours estimated)

5. **Salesforce Lead Sync** - Webhook/polling for lead sync (SF → Lead Intel)
6. **Enhanced Research Engine - Google News** - Recent news scraping
7. **Enhanced Research Engine - Job Postings** - Pain point analysis
8. **Research Orchestrator Enhancement** - Integrate new sources, BANT generation

**Goal:** Salesforce leads syncing, enhanced research with news and job postings

---

#### Sprint 3: Frontend & Analytics (Jan 11-12)
**Stories:** 9-12 (14 hours estimated)

9. **Kanban Board Component** - Apple-style drag-drop board (9 stages)
10. **Kanban API Endpoints** - Backend support for kanban
11. **Research Display Component** - Apple-style minimalist research brief
12. **Manager Metrics Dashboard** - KPIs, charts, leaderboard

**Goal:** Kanban board live, research display polished, manager dashboard functional

---

#### Sprint 4: Handoff & Deployment (Jan 12-13)
**Stories:** 13-16 (11 hours estimated)

13. **AE Handoff Generator** - Generate complete lead analysis document
14. **AE Handoff Execution** - Email + Salesforce task creation
15. **Handoff Form Component** - Apple-style handoff UI with validation
16. **Azure Deployment Configuration** - GitHub Actions CI/CD pipeline

**Goal:** AE handoff system working, deployed to Azure

---

#### Sprint 5: Testing & Demo (Jan 13)
**Stories:** 18-20 (9 hours estimated)

18. **Comprehensive Testing & Bug Fixes** - Smoke, integration, UAT tests
19. **UX Polish & Apple-Style Refinement** - Final UX pass, consistency audit
20. **MVP Demo Preparation** - Seed data, demo script, presentation

**Goal:** All tests passing, UX polished, ready for MVP demo

---

#### Post-MVP (Jan 14-17)
**Story:** 17 (2 hours estimated)

17. **Zoom Phone Webhook Handler** - Stub for post-MVP implementation

**Goal:** Foundation for Zoom integration (full implementation deferred)

---

## 📊 Success Metrics

### Technical
- ✅ All smoke tests passing
- ✅ Response time p95 < 2 seconds
- ✅ Error rate < 1%
- ✅ Database migration with zero data loss
- ✅ Salesforce webhook processing < 5 seconds

### Business
- ✅ Research briefs generated within 5 minutes
- ✅ Kanban board displays all leads correctly
- ✅ Manager dashboard shows accurate metrics
- ✅ AE handoff email delivered within 1 minute
- ✅ Salesforce task created successfully

### UX (Critical)
- ✅ **Apple-style simplicity achieved** (minimalist, fast, clear, beautiful)
- ✅ No critical UX issues in UAT
- ✅ Mobile-friendly (tested on iPhone/iPad)
- ✅ Accessibility score > 90 (Lighthouse)
- ✅ Positive feedback from SDRs, managers, AEs

---

## 🎨 UX Design Philosophy

**Apple-Style Principles:**
1. **Minimalism** - Remove unnecessary UI chrome, focus on content
2. **Clarity** - Clear visual hierarchy, readable typography
3. **Speed** - Fast interactions, smooth animations (200ms ease-out)
4. **Beauty** - Subtle shadows, ample whitespace, consistent spacing (8px grid)
5. **Progressive Disclosure** - Show essentials, collapse details
6. **Delight** - Micro-interactions, thoughtful transitions

**Typography:**
- Headings: SF Pro Display (or system-ui)
- Body: SF Pro Text (or system-ui)

**Spacing:**
- Use 8px grid system
- Consistent padding/margins

**Colors:**
- Follow design_guidelines.md palette
- Confidence indicators: green (high), yellow (medium), red (low)

**Components to Polish:**
- Kanban Board (story-9)
- Research Display (story-11)
- Metrics Dashboard (story-12)
- Handoff Form (story-15)

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Azure infrastructure delays | High | Medium | Start Day 1, fallback to Replit for demo |
| Salesforce OAuth complexity | High | Low | Thorough testing, use SF sandbox |
| Database migration data loss | High | Low | Multiple backups, staging test, verify counts |
| Timeline slippage | High | Medium | Daily standups, ruthless prioritization |
| **UX not meeting Apple-style standards** | **High** | **Low** | **UX Agent involvement, Playwright audits, early feedback** |

---

## 🚀 Next Steps

### Immediate (Today, Jan 9)
1. ✅ Discovery documentation complete
2. ✅ Ralph PRD created and committed
3. **🎨 Design Apple-style UX mockups** (UX Agent - IN PROGRESS)
   - Kanban Board mockup
   - Research Display mockup
   - Manager Dashboard mockup
   - Handoff Form mockup
4. **Begin Story 1:** Azure Infrastructure Setup

### This Week (Jan 9-13)
- **Thu Jan 9:** Stories 1-4 (Foundation)
- **Fri Jan 10:** Stories 5-8 (Integrations & Research)
- **Sat Jan 11:** Stories 9-12 (Frontend & Analytics)
- **Sun Jan 12:** Stories 13-16 (Handoff & Deployment)
- **Mon Jan 13:** Stories 18-20 (Testing & Demo) → **🎯 MVP DEMO**

### Next Week (Jan 14-18)
- **Tue-Fri Jan 14-17:** Bug fixes, refinements, performance optimization
- **Sat Jan 18:** **🚀 PRODUCTION LAUNCH** (hard deadline)

---

## 📁 File Structure

```
.claude/
├── discovery/
│   ├── README.md (this file)
│   ├── hawk-ridge-requirements.md (15 KB)
│   ├── v2-architecture.md (31 KB)
│   └── migration-plan.md (28 KB)
├── ralph/
│   ├── v2-production.json (Ralph PRD with 20 stories)
│   ├── progress.txt (will log learnings after each story)
│   └── AGENTS.md (project context for fresh agents)
└── agents/
    ├── director.md
    ├── researcher.md
    ├── business-analyst.md
    └── ux-agent.md
```

---

## 💡 Key Insights from Discovery

1. **Timeline is Aggressive** - 4 days to MVP, 9 days to production
   - Requires ruthless prioritization
   - Defer non-MVP features (live coaching, full Zoom integration)
   - Daily standups critical

2. **UX is Critical** - User explicitly emphasized Apple-style simplicity
   - Minimalist design, fast, clear, beautiful
   - UX Agent must be involved in all UI work
   - Playwright audits for every component

3. **Azure Migration is Complex** - Moving from Replit to Azure
   - Database schema changes (PostgreSQL → Azure SQL)
   - File storage changes (local → Blob Storage)
   - Secrets management (env vars → Key Vault)
   - CI/CD pipeline (GitHub Actions)

4. **Salesforce Integration is Foundation** - Lead source moved from Google Sheets
   - OAuth 2.0 authentication required
   - Webhook for real-time sync preferred
   - Task creation for AE handoff

5. **Enhanced Research is Differentiator** - Google News + job postings
   - SDRs need better intelligence before calls
   - BANT indicators crucial for qualification
   - Research must complete within 5 minutes

6. **Manager Visibility is Key** - Kanban board with 9 stages
   - 20 SDRs, multiple managers/AEs need clear pipeline view
   - Real-time updates (WebSocket or polling)
   - Filters by SDR, source, industry, date range

7. **AE Handoff Must Be Seamless** - Complete analysis document
   - Email + Salesforce task (toggleable per AE)
   - Include pain points, product fit, budget, decision maker profile
   - Deliver within 1 minute

---

## ✅ Discovery Phase Complete

**Summary:**
- 3 comprehensive discovery documents created (74 KB total)
- 20 user stories defined with clear acceptance criteria
- 5 sprints planned with realistic timelines
- Success metrics defined (technical, business, UX)
- Risks identified with mitigation plans
- Next step: UX mockups, then implementation begins

**Ready to proceed with:**
1. UX Agent: Design Apple-style mockups
2. Director Agent: Begin Story 1 (Azure Infrastructure Setup)

**Branch:** `claude/v2-production-hawk-ridge-IUhta`

**Status:** 🟢 Ready for Implementation

---

**Created:** January 9, 2026
**Last Updated:** January 9, 2026
**Next Review:** After MVP Demo (January 13, 2026)
