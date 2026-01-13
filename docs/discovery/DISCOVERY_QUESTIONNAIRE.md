# AI Sales Intelligence Platform
## Discovery Questionnaire & Technical Specifications
### Hawk Ridge Systems Implementation

---

| Field | Value |
|-------|-------|
| **Client** | Hawk Ridge Systems |
| **Prepared By** | Ground Game / DeHyl Co. |
| **Date** | January 2026 |
| **Version** | 1.0 - Discovery Phase |

---

## 1. Purpose of This Document

This discovery document captures the technical specifications and integration requirements needed to adapt the Lead Intel AI Sales Platform to Hawk Ridge Systems' environment. The existing platform was built with Twilio, PostgreSQL, and custom integrations. This questionnaire will help us map those capabilities to your Salesforce, Zoom, and Azure infrastructure.

---

## 2. Architecture Mapping

### 2.1 Current Platform Architecture

| Component | Current Implementation | Target (Hawk Ridge) |
|-----------|----------------------|---------------------|
| **CRM / Lead Source** | Google Sheets import, manual entry | Salesforce (TBD: Sales Cloud? Pardot?) |
| **Voice/Calls** | Twilio Voice SDK (browser softphone) | Zoom (TBD: Phone? Meetings? Both?) |
| **Database** | PostgreSQL (Replit managed) | Azure (TBD: SQL? Cosmos DB?) |
| **AI/ML** | Google Gemini (research, coaching, analysis) | TBD: Azure OpenAI? Keep Gemini? |
| **Authentication** | Session-based (Passport.js) | TBD: Azure AD? SSO? |
| **File Storage** | Google Drive (recordings, docs) | TBD: Azure Blob? SharePoint? |
| **Email** | Gmail API (notifications, coaching) | TBD: Outlook? SendGrid? |

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  React 18 + Vite + TanStack Query + Tailwind CSS               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                             │
│              Express.js + Session Auth + RBAC                   │
└─────────────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Twilio   │   │ Google   │   │ Gemini   │   │PostgreSQL│
    │ Voice    │   │ APIs     │   │ AI       │   │ Database │
    │    ↓     │   │    ↓     │   │          │   │    ↓     │
    │  ZOOM    │   │Salesforce│   │          │   │  AZURE   │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## 3. Salesforce Integration Questions

The platform currently manages leads internally. We need to understand how to integrate with your Salesforce instance for bi-directional sync.

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Products** | Which Salesforce products do you use? (Sales Cloud, Service Cloud, Marketing Cloud, Pardot, etc.) | |
| **Edition** | What Salesforce edition? (Professional, Enterprise, Unlimited) | |
| **Lead Objects** | Do you use standard Lead object, or custom objects for prospects? | |
| **Lead Lifecycle** | What are your lead statuses/stages? (New, Contacted, Qualified, etc.) | |
| **Custom Fields** | What custom fields exist on Lead/Contact/Account that we need to sync? | |
| **Assignment Rules** | How are leads assigned to SDRs? (Round robin, territory, manual?) | |
| **Handoff Process** | How do qualified leads get handed to AEs? (Opportunity creation? Lead conversion?) | |
| **Activity Tracking** | Where should call activities be logged? (Task? Activity? Custom object?) | |
| **Sync Direction** | Should lead updates flow: Platform → SF only? SF → Platform? Bidirectional? | |
| **API Access** | Do you have API access enabled? Any API call limits we should know about? | |
| **Connected Apps** | Any existing connected apps or integrations we need to coordinate with? | |
| **Sandbox** | Do you have a sandbox environment for development/testing? | |

---

## 4. Zoom Integration Questions

The current platform uses Twilio Voice SDK for browser-based calling with real-time transcription and AI coaching. We need to understand your Zoom setup to replicate these capabilities.

### 4.1 Zoom Products & Licensing

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Zoom Products** | Which Zoom products do you have? (Meetings, Phone, Contact Center, Webinars?) | |
| **Zoom Phone** | If Zoom Phone: BYOC or Zoom native? What calling plans? | |
| **Phone Numbers** | How are phone numbers assigned to SDRs? DID per rep? | |
| **Licensing** | What Zoom license tier? (Pro, Business, Enterprise?) | |
| **API Access** | Do you have Zoom API/SDK access? (Server-to-Server OAuth? JWT?) | |

### 4.2 Call Workflow Requirements

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Call Initiation** | How should SDRs make calls? (Click-to-call from app? Zoom client? Browser?) | |
| **Recording** | Is call recording enabled? Where are recordings stored? | |
| **Transcription** | Do you use Zoom's native transcription? Or need custom? | |
| **Real-Time Access** | Do we need real-time audio stream for live coaching? (This may require Zoom Contact Center) | |
| **Webhooks** | Can we receive webhooks for call start/end/recording ready? | |
| **Softphone** | Is browser-based calling required, or is Zoom desktop app acceptable? | |

### 4.3 Feature Mapping (Twilio → Zoom)

Current Twilio features that need Zoom equivalents:

| Current Feature | Twilio Implementation | Zoom Equivalent (TBD) |
|----------------|----------------------|----------------------|
| **Browser Softphone** | Twilio Voice SDK (WebRTC) | Zoom Phone WebSDK? Or Zoom client? |
| **Real-Time Transcription** | Twilio Media Streams → Custom ASR | Zoom transcription API? Real-time SDK? |
| **Live Coaching Tips** | WebSocket push during call | Same (if we get transcript stream) |
| **Call Recording** | Twilio dual-channel recording | Zoom cloud recording |
| **Post-Call Analysis** | Recording + transcript → Gemini AI | Same (fetch recording via API) |

### 4.4 Critical Zoom Questions

> ⚠️ **Important**: Real-time coaching requires access to the live audio/transcript stream during the call. This capability varies significantly by Zoom product:

| Zoom Product | Real-Time Access | Notes |
|--------------|------------------|-------|
| Zoom Meetings | Limited | Can use Meeting SDK for some access |
| Zoom Phone | Limited | Recording available post-call; real-time may require Contact Center |
| Zoom Contact Center | Yes | Full real-time streaming and agent assist capabilities |

**Key Question**: Is real-time coaching during calls a must-have, or can coaching be post-call only?

---

## 5. Azure Database & Infrastructure

The platform currently uses PostgreSQL with Drizzle ORM. We need to understand your Azure data infrastructure.

### 5.1 Database Configuration

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Database Type** | Which Azure database? (Azure SQL, Azure Database for PostgreSQL, Cosmos DB?) | |
| **Existing vs New** | Use existing database or create new for this application? | |
| **Schema Control** | Can we create/modify tables? Or must we work with existing schema? | |
| **Connection Method** | How to connect? (Connection string? Managed Identity? Private endpoint?) | |
| **Data Residency** | Any data residency requirements? (Region, compliance) | |

### 5.2 Azure Services

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Hosting** | Where should the app be hosted? (Azure App Service, AKS, Container Apps?) | |
| **Authentication** | Use Azure AD for user authentication? SSO requirements? | |
| **File Storage** | Use Azure Blob Storage for recordings/files? | |
| **AI Services** | Use Azure OpenAI? Or external AI (Gemini, OpenAI direct)? | |
| **Key Vault** | Store secrets in Azure Key Vault? | |
| **Networking** | Any VNet requirements? Private endpoints needed? | |

### 5.3 Current Data Model (Reference)

The platform uses these core tables. We can adapt to your schema if needed:

| Table | Purpose & Key Fields |
|-------|---------------------|
| **users** | Authentication & roles (email, password hash, role: admin/manager/sdr/ae) |
| **leads** | Prospect data (company, contact, status, fitScore, assignedSdrId, assignedAeId) |
| **research_packets** | AI research dossiers (companyIntel, painPoints, productMatches, talkTrack, confidence) |
| **call_sessions** | Call metadata (callSid, duration, recordingUrl, transcriptText, disposition) |
| **manager_call_analyses** | 7-dimension scoring (opening, discovery, listening, objection, value prop, closing, compliance) |
| **sdrs / managers** | Sales rep profiles with team assignments and reporting structure |

### 5.4 Database Migration Considerations

| Consideration | Question | Client Response |
|---------------|----------|-----------------|
| **ORM Compatibility** | Current: Drizzle ORM. Azure SQL compatible? Or switch to Prisma/TypeORM? | |
| **Migrations** | How should schema migrations be managed? (Drizzle Kit, manual, CI/CD?) | |
| **Existing Data** | Any existing data to migrate or integrate? | |

---

## 6. AI & Lead Research Configuration

### 6.1 AI Service Preferences

| Category | Question | Client Response |
|----------|----------|-----------------|
| **AI Provider** | Preferred AI: Azure OpenAI? Google Gemini? Anthropic Claude? Other? | |
| **Data Privacy** | Any restrictions on sending lead data to external AI services? | |
| **Existing AI** | Do you have existing Azure OpenAI deployments we should use? | |
| **Model Preferences** | Any specific model requirements? (GPT-4, Claude, Gemini Pro?) | |

### 6.2 Existing Data Subscriptions

Do you have any of these services that we can integrate with instead of scraping?

| Service | Have It? (Y/N) | API Access? | Notes |
|---------|---------------|-------------|-------|
| **LinkedIn Sales Navigator** | | | Preferred for LinkedIn data |
| **ZoomInfo** | | | Contact & company enrichment |
| **Apollo.io** | | | Contact enrichment |
| **Cognism** | | | B2B data platform |
| **Clearbit** | | | Company enrichment |
| **6sense** | | | Intent data |
| **Bombora** | | | Intent data |
| **Lusha** | | | Contact data |
| **Seamless.AI** | | | Contact data |

### 6.3 Research Sources

Current platform gathers intelligence from multiple sources. Confirm which are relevant:

| Source | Data Gathered | Include? (Y/N/Notes) |
|--------|--------------|---------------------|
| **Company Website** | About page, products, news, team info | |
| **LinkedIn (Company)** | Company size, industry, recent posts, job openings | |
| **LinkedIn (Contact)** | Title, background, career history, posts | |
| **X/Twitter** | Recent activity, interests, engagement | |
| **Google News** | Recent press, announcements, industry mentions | |
| **Job Postings** | Pain signals from hiring patterns | |
| **G2 / Capterra** | Software reviews, competitor usage | |
| **Glassdoor** | Company culture, employee sentiment | |
| **Salesforce Data** | Existing account history, past interactions | |

### 6.4 Deep Research (Browserless.io Integration)

We plan to use headless browser technology (Browserless.io) for enhanced intelligence gathering. This enables scraping of JavaScript-rendered content that APIs can't access.

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Compliance** | Any policies restricting web scraping of public data? | |
| **Volume** | Estimated deep researches per day? (affects Browserless tier) | |
| **Targeting** | Deep research all leads, or only high-value (e.g., Fit Score > 70)? | |
| **Budget** | Approved budget for Browserless service? (~$50-400/month) | |
| **Caching** | Acceptable to cache scraped data for 24-48 hours? | |

**What Deep Research Unlocks:**

| Source | Standard API | With Browserless |
|--------|-------------|------------------|
| LinkedIn Company | Basic public page | Full posts, employee count, job listings, growth signals |
| LinkedIn Contact | Often blocked | Career history, posts, activity, skills |
| Company Website | Static HTML only | JS-rendered content, pricing pages, case studies |
| Job Boards | API limits | Full descriptions, tech stack signals, hiring velocity |
| G2/Capterra | Blocked | Reviews, competitor comparisons, pain points |

### 6.5 Product Catalog

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Products** | What products/services should the AI recommend? (Need product catalog) | |
| **Pain-Product Map** | Are there documented pain points that map to specific products? | |
| **Talk Tracks** | Do you have existing talk tracks/scripts we should incorporate? | |
| **Objection Handling** | Common objections and approved responses? | |
| **Competitive Intel** | Key competitors and differentiation points? | |

### 6.6 AI Features Configuration

| Feature | Current Behavior | Customize? |
|---------|-----------------|------------|
| **Research Dossier** | Auto-generates company intel, contact intel, pain points, product matches, talk tracks | |
| **Confidence Scoring** | High/Medium/Low based on data quality | |
| **Live Coaching** | Real-time tips during calls based on transcript | |
| **Post-Call Analysis** | 7-dimension scoring with recommendations | |
| **Qualification Extraction** | BANT extraction from transcripts | |

---

## 7. Users, Roles & Permissions

### 7.1 User Types

| Role | Question | Client Response |
|------|----------|-----------------|
| **SDRs** | How many SDRs will use the platform? | |
| **Managers** | How many sales managers? What oversight do they need? | |
| **AEs** | How many Account Executives receive handoffs? | |
| **Admins** | Who manages users and system configuration? | |
| **Executives** | Do executives need read-only dashboards? | |

### 7.2 Team Structure

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Hierarchy** | What is your sales team structure? (SDR → Manager → Director?) | |
| **Territories** | Do SDRs have territories or industry focus? | |
| **SDR-AE Pairing** | Are SDRs paired with specific AEs, or pool handoffs? | |
| **Visibility** | Can managers see all team leads, or just their direct reports? | |

### 7.3 Current Role Permissions (Reference)

| Role | Capabilities |
|------|-------------|
| **Admin** | Full system access, user management, configuration |
| **Manager** | Team oversight, call analysis, all team leads, coaching |
| **SDR** | Own leads, calls, research, pipeline management |
| **Account Executive** | Qualified leads, handoff receipt, pipeline view |

**Question**: Does this permission model work, or do you need customizations?

---

## 8. Sales Workflow & Process

### 8.1 Lead Lifecycle

| Stage | Question | Client Response |
|-------|----------|-----------------|
| **Lead Source** | Where do leads originate? (Salesforce? Marketing? Events? Inbound?) | |
| **Qualification Criteria** | What defines a 'qualified' lead? (BANT? MEDDIC? Custom?) | |
| **Handoff Trigger** | What triggers handoff to AE? (Score threshold? Manual?) | |
| **SLAs** | Any SLAs for lead follow-up timing? | |

### 8.2 Call Workflow

| Stage | Question | Client Response |
|-------|----------|-----------------|
| **Pre-Call** | What info do SDRs need before calling? How much prep time? | |
| **During Call** | Are real-time coaching tips valuable? What kind of prompts help? | |
| **Post-Call** | What must be logged after each call? Notes? Disposition? Next steps? | |
| **Manager Review** | How are calls reviewed? All calls? Random sample? Flagged only? | |

### 8.3 Current Lead Statuses (Reference)

```
new → researching → contacted → engaged → qualified → handed_off → converted
                                    │                      │
                                    └──────────────────────┴──→ lost
```

**Question**: Does this flow match your process, or do you need different statuses?

---

## 9. AI & System Behavior

These questions define how the system should behave in production, especially around AI reliability and edge cases.

### 9.1 Product Boundary & Graceful Degradation

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Core Functions** | What must continue working if AI is unavailable? (e.g., calling, lead management, CRM sync) | |
| **AI-Dependent** | What can gracefully degrade? (e.g., research, coaching tips, scoring) | |
| **Degraded UX** | When AI is down, what should users see? (cached data? manual fallback? error message?) | |

### 9.2 Roles & Scale

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Phase 1 Users** | Which roles actively use the product in Phase 1? (SDRs only? Managers? AEs?) | |
| **User Count** | How many concurrent users should Phase 1 support? | |
| **Daily Volume** | Expected daily leads created? Daily calls made? | |
| **Peak Load** | Any known peak usage times? (e.g., Monday mornings, end of quarter) | |

### 9.3 Assistive vs Transactional

| Category | Question | Client Response |
|----------|----------|-----------------|
| **AI Role** | Is Phase 1 strictly assistive/advisory, or does AI execute actions? | |
| **Auto-Actions** | Should AI auto-update CRM? Auto-route leads? Auto-create tasks? | |
| **Human-in-Loop** | Which AI actions require human approval before execution? | |
| **Audit Trail** | Do AI-initiated actions need to be flagged/logged separately? | |

### 9.4 Latency Expectations

| Capability | Required Latency | Notes |
|------------|-----------------|-------|
| **Live coaching tips** | Real-time (<2 sec) / Near-real-time (<10 sec) / Async | |
| **Research dossier** | Real-time / Near-real-time / Async (background) | |
| **Post-call analysis** | Real-time / Near-real-time / Async | |
| **Lead scoring** | Real-time / Near-real-time / Async | |
| **CRM sync** | Real-time / Near-real-time / Async | |

### 9.5 Failure & Fallback Behavior

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Low Confidence** | When AI confidence is low, what should happen? (show anyway with warning? hide? require human review?) | |
| **Research Failure** | If research fails, should SDR be blocked from calling, or proceed with partial data? | |
| **Coaching Failure** | If live coaching fails mid-call, what's the fallback? (silent fail? notification?) | |
| **Retry Strategy** | Should failed AI operations auto-retry? How many times? | |

### 9.6 Data Coverage Threshold

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Minimum Data** | What's the minimum data required for a lead to be "researchable"? (company name only? + website? + contact?) | |
| **Below Threshold** | How should the system behave with insufficient data? (skip research? show warning? block?) | |
| **Data Quality** | Acceptable percentage of leads with incomplete data? | |
| **Enrichment** | Should system attempt to enrich missing data automatically? | |

### 9.7 Model Dependency & Management

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Primary Model** | Preferred AI model? (Azure OpenAI GPT-4? Gemini? Claude?) | |
| **Fallback Model** | Should there be a fallback model if primary is unavailable? | |
| **Cost Controls** | Monthly AI budget cap? Cost alerts? | |
| **Model Drift** | How should we monitor for accuracy degradation over time? | |
| **Rate Limits** | Acceptable behavior when hitting API rate limits? (queue? degrade? error?) | |

### 9.8 Customization Strategy

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Approach** | Prompting only? RAG (retrieval-augmented)? Fine-tuning? | |
| **Knowledge Base** | Do you have internal docs/playbooks to feed into RAG? | |
| **Updates** | How often will product catalog / talk tracks / objection handles change? | |
| **Evaluation** | How will we measure if AI outputs are "good enough"? | |

### 9.9 External Platforms & Terms of Service

| Platform | Usage | ToS Compliance |
|----------|-------|----------------|
| **LinkedIn** | Scraping company/contact pages | Confirm: Sales Navigator API preferred? Or accept scraping risk? |
| **Google News** | Article summaries | Confirm: API usage within limits? |
| **Job Boards** | Scraping job postings | Confirm: Which boards are acceptable to scrape? |
| **G2 / Capterra** | Review scraping | Confirm: Acceptable or excluded? |
| **Glassdoor** | Culture/sentiment data | Confirm: Acceptable or excluded? |

**Key Question**: Do you have legal/compliance review for web scraping activities?

### 9.10 Production Readiness Checklist

Beyond "the demo works," what must be true for Phase 1 go-live?

| Category | Requirement | Status (Ready/Not Ready/N/A) |
|----------|-------------|------------------------------|
| **Security** | Authentication via Azure AD/SSO | |
| **Security** | Data encryption at rest and in transit | |
| **Security** | Penetration testing completed | |
| **Access Control** | Role-based permissions enforced | |
| **Access Control** | Audit logging for sensitive actions | |
| **Monitoring** | Application performance monitoring (APM) | |
| **Monitoring** | Error tracking and alerting | |
| **Monitoring** | AI usage and cost dashboards | |
| **Cost Controls** | Monthly budget caps configured | |
| **Cost Controls** | Alerts for unusual spend | |
| **Compliance** | Call recording consent flows | |
| **Compliance** | Data retention policies implemented | |
| **Disaster Recovery** | Backup and restore tested | |
| **Documentation** | Admin runbook complete | |
| **Training** | User training materials ready | |

---

## 10. Non-Functional Requirements

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Availability** | Uptime requirements? (99.9%? Business hours only?) | |
| **Performance** | Acceptable response times? Any latency concerns for real-time features? | |
| **Scalability** | Expected growth? Peak concurrent users? | |
| **Security** | Security certifications required? (SOC2, ISO27001, HIPAA?) | |
| **Compliance** | Call recording consent requirements? Data retention policies? | |
| **Audit** | Audit logging requirements? What actions must be tracked? | |
| **Backup/DR** | Backup and disaster recovery requirements? | |
| **Browser Support** | Which browsers must be supported? Mobile access needed? | |

---

## 11. Timeline & Priorities

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Go-Live Date** | Target launch date? Any hard deadlines? | |
| **Pilot Group** | Start with pilot group? How many users? | |
| **MVP Features** | Must-have features for initial launch? | |
| **Phase 2** | Features that can wait for Phase 2? | |
| **Training** | Training needs? Who will be trained? | |

### 11.1 Feature Prioritization

Please rank these features (1 = Must Have, 2 = Should Have, 3 = Nice to Have, 4 = Not Needed):

| Feature | Priority (1-4) | Notes |
|---------|---------------|-------|
| Lead management & pipeline | | |
| AI research dossiers | | |
| Click-to-call from app | | |
| Real-time coaching during calls | | |
| Post-call AI analysis | | |
| Manager call scoring | | |
| Salesforce bi-directional sync | | |
| Team performance dashboards | | |
| AE handoff workflow | | |
| Email notifications | | |
| Mobile access | | |

---

## 12. Access & Key Contacts

### 12.1 Technical Access Needed

To begin development, we will need access to:

| Access Item | Priority | Status | Owner |
|-------------|----------|--------|-------|
| Salesforce sandbox credentials | High | | |
| Zoom API credentials (OAuth app) | High | | |
| Azure subscription access | High | | |
| Azure AD tenant (for auth) | Medium | | |
| Product catalog / documentation | Medium | | |
| Sample talk tracks / scripts | Medium | | |
| Test phone numbers | Medium | | |
| Logo and brand assets | Low | | |

### 12.2 Key Contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Project Sponsor | | | |
| Business Owner | | | |
| IT Lead | | | |
| Salesforce Admin | | | |
| Zoom Admin | | | |
| Azure Admin | | | |
| Sales Operations | | | |
| End User Champion (SDR) | | | |

### 12.3 Communication Preferences

| Item | Response |
|------|----------|
| Preferred communication channel (Slack, Teams, Email?) | |
| Meeting cadence during discovery | |
| Decision-making process for technical choices | |
| Escalation path for blockers | |

---

## 13. Technical Deep Dive (For IT Team)

### 13.1 Integration Authentication

| Integration | Question | Client Response |
|-------------|----------|-----------------|
| **Salesforce** | OAuth 2.0 flow preference? (Web Server, JWT Bearer?) | |
| **Zoom** | Server-to-Server OAuth or User-level OAuth? | |
| **Azure** | Managed Identity available? Or service principal? | |
| **SSO** | SAML or OIDC for user authentication? | |

### 13.2 Network & Security

| Category | Question | Client Response |
|----------|----------|-----------------|
| **IP Allowlisting** | Do any services require IP allowlisting? | |
| **VPN** | Is VPN required for any integrations? | |
| **WAF** | Web Application Firewall requirements? | |
| **DLP** | Data Loss Prevention policies to consider? | |

### 13.3 DevOps & Deployment

| Category | Question | Client Response |
|----------|----------|-----------------|
| **CI/CD** | Preferred CI/CD platform? (Azure DevOps, GitHub Actions?) | |
| **Environments** | How many environments? (Dev, Staging, Prod?) | |
| **Deployment** | Deployment approval process? | |
| **Monitoring** | Preferred monitoring tools? (App Insights, Datadog?) | |

---

## 14. Sign-Off

By completing this questionnaire, Hawk Ridge Systems confirms the accuracy of the information provided and authorizes Ground Game / DeHyl Co. to proceed with technical planning based on these responses.

| Field | Value |
|-------|-------|
| **Client Representative** | |
| **Title** | |
| **Signature** | |
| **Date** | |

---

## Appendix A: Current Platform Capabilities

For reference, here are the full capabilities of the existing Lead Intel platform:

### A.1 Lead Management
- Lead creation (manual + Google Sheets import)
- Lead assignment to SDRs
- Status tracking through pipeline
- Fit scoring (0-100)
- Priority classification (Hot/Warm/Cool/Cold)
- AE handoff workflow with email notifications

### A.2 AI Research
- One-click research dossier generation
- Multi-source intelligence (website, LinkedIn, X/Twitter, news)
- Pain point identification with confidence scoring
- Product matching to Hawk Ridge catalog
- Personalized talk track generation
- Discovery questions and objection handles

### A.3 Voice/Calling
- Browser-based softphone (Twilio Voice SDK)
- Click-to-call from lead record
- Call recording (dual-channel)
- Real-time transcription
- Live AI coaching tips during call
- Call disposition logging

### A.4 Post-Call Analysis
- Automatic transcript analysis
- 7-dimension call scoring
- Manager call reviews
- Coaching recommendations
- Performance trending

### A.5 Analytics & Reporting
- SDR performance dashboards
- Team leaderboards
- Conversion metrics
- Activity tracking
- Manager oversight views

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **SDR** | Sales Development Representative - makes outbound calls to qualify leads |
| **AE** | Account Executive - handles qualified opportunities through close |
| **BANT** | Budget, Authority, Need, Timeline - qualification framework |
| **Fit Score** | 0-100 score indicating how well a lead matches ideal customer profile |
| **Research Packet** | AI-generated intelligence dossier for a lead |
| **Talk Track** | Suggested conversation flow for a sales call |
| **Disposition** | Call outcome (Connected, Voicemail, No Answer, etc.) |

---

**Questions?**

Contact: Juan Pablo Dominguez, Director
Email: jp@dehyl.ca
Phone: 604.600.9654
