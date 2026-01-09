# Lead Intel v2.0 - System Architecture

> **Version:** 2.0.0
> **Target:** Production (Hawk Ridge Systems)
> **Infrastructure:** Azure + Salesforce + Zoom Phone
> **Created:** January 9, 2026

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SYSTEMS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │  Salesforce  │      │  Zoom Phone  │      │ Azure Speech │     │
│  │              │      │              │      │   to Text    │     │
│  │ - Leads      │      │ - Recordings │      │              │     │
│  │ - Contacts   │      │ - Webhooks   │      │ - STT API    │     │
│  │ - Accounts   │      │              │      │              │     │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘     │
│         │                     │                     │              │
│         │ OAuth 2.0           │ JWT/OAuth           │ API Key      │
│         ↓                     ↓                     ↓              │
└─────────────────────────────────────────────────────────────────────┘
         │                     │                     │
         ↓                     ↓                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         LEAD INTEL v2.0                              │
│                      (Azure App Service)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    BACKEND (Express.js)                       │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  API Layer                                                    │ │
│  │  ├─ /api/salesforce/* ──────────> Salesforce Integration     │ │
│  │  ├─ /api/leads/* ────────────────> Lead Management           │ │
│  │  ├─ /api/research/* ─────────────> AI Research Engine        │ │
│  │  ├─ /api/calls/* ────────────────> Call Analysis             │ │
│  │  ├─ /api/kanban/* ───────────────> Kanban Board              │ │
│  │  ├─ /api/handoff/* ──────────────> AE Handoff System         │ │
│  │  └─ /api/webhooks/zoom/* ────────> Zoom Webhooks             │ │
│  │                                                               │ │
│  │  Business Logic                                               │ │
│  │  ├─ Salesforce Sync Service                                  │ │
│  │  ├─ Research Orchestrator (Multi-Agent)                      │ │
│  │  ├─ Call Analysis Service                                    │ │
│  │  ├─ Handoff Generator                                        │ │
│  │  └─ Notification Service                                     │ │
│  │                                                               │ │
│  │  AI Modules (Google Gemini)                                  │ │
│  │  ├─ Lead Research                                            │ │
│  │  ├─ News Scraping (NEW)                                      │ │
│  │  ├─ Job Postings Analysis (NEW)                              │ │
│  │  ├─ Call Transcript Analysis                                 │ │
│  │  └─ Handoff Document Generation                              │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  FRONTEND (React + Vite)                      │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Pages                                                        │ │
│  │  ├─ Dashboard ──────────> Metrics & KPIs                     │ │
│  │  ├─ Kanban Board ───────> TOFU Visibility                    │ │
│  │  ├─ Lead Detail ────────> Research Display (Apple-style)     │ │
│  │  ├─ Call History ───────> Transcript & Analysis              │ │
│  │  ├─ Handoff Review ─────> AE Handoff Interface               │ │
│  │  └─ Settings ───────────> Integration Config                 │ │
│  │                                                               │ │
│  │  Components (shadcn/ui)                                       │ │
│  │  ├─ Kanban Board (drag-drop)                                 │ │
│  │  ├─ Research Brief Display                                   │ │
│  │  ├─ Call Analysis Cards                                      │ │
│  │  ├─ Metrics Dashboard                                        │ │
│  │  └─ Handoff Form                                             │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (Azure)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │  Azure SQL      │    │  Azure Blob     │    │ Azure Redis   │  │
│  │  Database       │    │  Storage        │    │ Cache         │  │
│  │                 │    │                 │    │ (Optional)    │  │
│  │ - Leads         │    │ - Call          │    │ - Session     │  │
│  │ - Research      │    │   Recordings    │    │ - Cache       │  │
│  │ - Call Sessions │    │ - Handoff PDFs  │    │               │  │
│  │ - Analyses      │    │                 │    │               │  │
│  └─────────────────┘    └─────────────────┘    └───────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Lead Sync Flow (Salesforce → Lead Intel)

```
┌──────────────┐
│  Salesforce  │
│              │
│  New Lead    │
│  Created     │
└──────┬───────┘
       │
       │ Webhook (preferred)
       │ or Polling (fallback)
       ↓
┌──────────────────────────┐
│  Lead Intel Backend      │
│  /api/webhooks/salesforce│
└──────┬───────────────────┘
       │
       │ 1. Validate webhook
       │ 2. Transform SF data
       │ 3. Check for duplicates
       ↓
┌──────────────────────────┐
│  Database                │
│  INSERT INTO leads       │
└──────┬───────────────────┘
       │
       │ 4. Trigger research job
       ↓
┌──────────────────────────┐
│  Background Queue        │
│  Research Job Queued     │
└──────┬───────────────────┘
       │
       │ 5. Update kanban
       ↓
┌──────────────────────────┐
│  Frontend                │
│  New card in "New Lead"  │
│  column                  │
└──────────────────────────┘
```

### 2. Research Generation Flow

```
┌──────────────────────────┐
│  New Lead in Database    │
└──────┬───────────────────┘
       │
       │ Trigger
       ↓
┌──────────────────────────┐
│  Research Orchestrator   │
│  (Multi-Agent)           │
└──────┬───────────────────┘
       │
       │ Route to Researcher Agent
       ↓
┌──────────────────────────┐
│  Researcher Agent        │
│  Gather data from:       │
│  - Salesforce (Account)  │
│  - Company Website       │
│  - LinkedIn (Company)    │
│  - LinkedIn (Contact)    │
│  - Google News (NEW)     │
│  - Job Postings (NEW)    │
└──────┬───────────────────┘
       │
       │ Raw data
       ↓
┌──────────────────────────┐
│  Google Gemini AI        │
│  - Analyze pain points   │
│  - Match products        │
│  - Generate talk tracks  │
│  - Score budget/fit      │
└──────┬───────────────────┘
       │
       │ Structured dossier
       ↓
┌──────────────────────────┐
│  Database                │
│  INSERT research_packets │
└──────┬───────────────────┘
       │
       │ Update status
       ↓
┌──────────────────────────┐
│  Kanban Board            │
│  Move to "Researched"    │
└──────────────────────────┘
       │
       │ Notify SDR
       ↓
┌──────────────────────────┐
│  SDR sees research ready │
└──────────────────────────┘
```

### 3. Call Recording & Analysis Flow

```
┌──────────────────────────┐
│  SDR makes call via      │
│  Zoom Phone (outside app)│
└──────┬───────────────────┘
       │
       │ Call ends
       ↓
┌──────────────────────────┐
│  Zoom Phone              │
│  recording.completed     │
│  webhook fires           │
└──────┬───────────────────┘
       │
       │ POST /webhooks/zoom/recording
       ↓
┌──────────────────────────┐
│  Lead Intel Backend      │
│  1. Validate webhook     │
│  2. Download recording   │
└──────┬───────────────────┘
       │
       │ Upload to storage
       ↓
┌──────────────────────────┐
│  Azure Blob Storage      │
│  Save recording (MP3/M4A)│
└──────┬───────────────────┘
       │
       │ Send for transcription
       ↓
┌──────────────────────────┐
│  Azure Speech-to-Text    │
│  Transcribe audio        │
└──────┬───────────────────┘
       │
       │ Transcript text
       ↓
┌──────────────────────────┐
│  Database                │
│  UPDATE call_sessions    │
│  SET transcriptText      │
└──────┬───────────────────┘
       │
       │ Trigger analysis
       ↓
┌──────────────────────────┐
│  Google Gemini AI        │
│  - Analyze transcript    │
│  - Extract BANT          │
│  - Score 7 dimensions    │
│  - Generate insights     │
└──────┬───────────────────┘
       │
       │ Analysis results
       ↓
┌──────────────────────────┐
│  Database                │
│  INSERT manager_call_    │
│  analyses                │
└──────┬───────────────────┘
       │
       │ Update lead status
       ↓
┌──────────────────────────┐
│  Kanban Board            │
│  Move to "Contacted"     │
└──────────────────────────┘
```

### 4. AE Handoff Flow

```
┌──────────────────────────┐
│  SDR clicks              │
│  "Hand Off to AE"        │
└──────┬───────────────────┘
       │
       │ Validation checks
       ↓
┌──────────────────────────┐
│  Backend validates:      │
│  - Status = Qualified    │
│  - Research complete     │
│  - Call logged           │
│  - BANT filled           │
└──────┬───────────────────┘
       │
       │ Pass ✓
       ↓
┌──────────────────────────┐
│  Handoff Generator       │
│  Generate complete       │
│  lead analysis document  │
└──────┬───────────────────┘
       │
       │ Formatted document
       ↓
┌──────────────────────────┐
│  Parallel Actions:       │
│                          │
│  1. Email to AE ─────────┼──> Email Service
│  2. Salesforce Task ─────┼──> Salesforce API
│  3. Update DB ───────────┼──> Database
│  4. Update Kanban ───────┼──> Frontend
│                          │
└──────────────────────────┘
       │
       │ All complete
       ↓
┌──────────────────────────┐
│  Success Toast           │
│  "Lead handed off to     │
│   [AE Name]"             │
└──────────────────────────┘
```

---

## Component Architecture

### Backend Components

#### 1. Salesforce Integration Service
**File:** `server/integrations/salesforce.ts`

**Responsibilities:**
- OAuth 2.0 authentication
- Lead/Contact/Account sync
- Task creation for AE handoff
- Webhook handling
- Rate limit management

**Key Methods:**
```typescript
class SalesforceService {
  async authenticate(userId: string): Promise<OAuthTokens>
  async syncLeads(lastSyncTime?: Date): Promise<Lead[]>
  async getAccount(accountId: string): Promise<SalesforceAccount>
  async createTask(task: TaskData): Promise<string>
  async handleWebhook(payload: WebhookPayload): Promise<void>
}
```

#### 2. Zoom Phone Integration Service
**File:** `server/integrations/zoom.ts`

**Responsibilities:**
- Webhook validation
- Recording download
- Metadata extraction
- Storage management

**Key Methods:**
```typescript
class ZoomPhoneService {
  async validateWebhook(signature: string, body: string): boolean
  async downloadRecording(recordingId: string): Promise<Buffer>
  async getCallMetadata(callId: string): Promise<CallMetadata>
  async saveRecording(buffer: Buffer, callId: string): Promise<string>
}
```

#### 3. Research Orchestrator
**File:** `server/ai/researchOrchestrator.ts`

**Responsibilities:**
- Coordinate multi-source research
- Route to Researcher Agent
- Manage research queue
- Track progress

**Key Methods:**
```typescript
class ResearchOrchestrator {
  async queueResearch(leadId: number): Promise<string> // job ID
  async executeResearch(leadId: number): Promise<ResearchDossier>
  async getResearchStatus(jobId: string): Promise<JobStatus>
  async retryFailed(jobId: string): Promise<void>
}
```

#### 4. Call Analysis Service
**File:** `server/ai/callAnalysis.ts`

**Responsibilities:**
- Transcript analysis with Gemini
- BANT extraction
- Performance scoring
- Insights generation

**Key Methods:**
```typescript
class CallAnalysisService {
  async analyzeTranscript(transcript: string): Promise<CallAnalysis>
  async extractBANT(transcript: string): Promise<BANTData>
  async scorePerformance(transcript: string): Promise<ScoreCard>
  async generateInsights(analysis: CallAnalysis): Promise<string[]>
}
```

#### 5. Handoff Generator
**File:** `server/services/handoffGenerator.ts`

**Responsibilities:**
- Generate complete lead analysis
- Format email/PDF
- Send notifications
- Update status

**Key Methods:**
```typescript
class HandoffGenerator {
  async generateAnalysis(leadId: number): Promise<HandoffDocument>
  async sendToAE(document: HandoffDocument, aeId: number): Promise<void>
  async createSalesforceTask(leadId: number, aeId: number): Promise<string>
  async completeHandoff(leadId: number, aeId: number): Promise<void>
}
```

### Frontend Components

#### 1. Kanban Board
**File:** `client/src/components/KanbanBoard.tsx`

**Features:**
- Drag-and-drop cards between columns
- Real-time updates (WebSocket or polling)
- Filters (SDR, source, industry, date)
- Quick actions on cards
- Color coding by priority

**Libraries:**
- `@dnd-kit/core` for drag-and-drop
- `@tanstack/react-query` for data fetching
- `framer-motion` for animations

#### 2. Research Display
**File:** `client/src/components/ResearchDisplay.tsx`

**Apple-Style Principles:**
- Minimalist layout
- Progressive disclosure (collapse/expand sections)
- Clear visual hierarchy
- Confidence indicators (color-coded)
- Quick copy-to-clipboard

**Sections:**
1. Executive Summary (always visible)
2. Pain Points (top 3 expanded)
3. Product Fit (primary match visible)
4. Budget & Timeline (compact)
5. Decision Maker (collapsed by default)
6. Full Research (link to detailed view)

#### 3. Metrics Dashboard
**File:** `client/src/components/MetricsDashboard.tsx`

**Widgets:**
- Top-line KPIs (big numbers with trends)
- Activity chart (calls/emails over time)
- Team leaderboard (sortable)
- Pipeline velocity (stage transitions)
- Win rate funnel

**Libraries:**
- `recharts` for charts
- `@tanstack/react-table` for leaderboard
- `lucide-react` for icons

#### 4. Handoff Form
**File:** `client/src/components/HandoffForm.tsx`

**Flow:**
1. Validation checks (visual checklist)
2. Preview analysis document
3. Select Account Executive
4. Choose notification methods (toggles)
5. Add notes (optional)
6. Confirm handoff (modal)

---

## Database Schema Changes

### New Tables

#### salesforce_sync_log
```sql
CREATE TABLE salesforce_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL, -- 'lead', 'contact', 'account'
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  records_synced INTEGER,
  errors JSONB,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### zoom_call_recordings
```sql
CREATE TABLE zoom_call_recordings (
  id SERIAL PRIMARY KEY,
  call_session_id INTEGER REFERENCES call_sessions(id),
  zoom_recording_id VARCHAR(255) UNIQUE NOT NULL,
  download_url TEXT,
  storage_path TEXT, -- Azure Blob path
  file_size_bytes INTEGER,
  duration_seconds INTEGER,
  status VARCHAR(20), -- 'downloading', 'downloaded', 'transcribing', 'complete'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

#### handoff_logs
```sql
CREATE TABLE handoff_logs (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  from_sdr_id INTEGER REFERENCES sdrs(id),
  to_ae_id INTEGER REFERENCES account_executives(id),
  analysis_document JSONB, -- Complete lead analysis
  salesforce_task_id VARCHAR(255),
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  status VARCHAR(20), -- 'pending', 'sent', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Tables

#### leads (add columns)
```sql
ALTER TABLE leads ADD COLUMN salesforce_lead_id VARCHAR(255) UNIQUE;
ALTER TABLE leads ADD COLUMN last_synced_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN budget_tier VARCHAR(20); -- 'high', 'medium', 'low'
ALTER TABLE leads ADD COLUMN bant_budget TEXT;
ALTER TABLE leads ADD COLUMN bant_authority TEXT;
ALTER TABLE leads ADD COLUMN bant_need TEXT;
ALTER TABLE leads ADD COLUMN bant_timeline TEXT;
```

#### call_sessions (add columns)
```sql
ALTER TABLE call_sessions ADD COLUMN zoom_call_id VARCHAR(255);
ALTER TABLE call_sessions ADD COLUMN zoom_recording_id VARCHAR(255);
ALTER TABLE call_sessions ADD COLUMN bant_extracted JSONB;
```

---

## API Endpoints (New/Modified)

### Salesforce Endpoints

```
POST   /api/salesforce/auth/callback      # OAuth callback
GET    /api/salesforce/auth/status        # Check auth status
POST   /api/salesforce/sync/leads         # Manual sync trigger
POST   /api/salesforce/sync/contacts      # Sync contacts
GET    /api/salesforce/sync/status        # Get last sync status
POST   /api/webhooks/salesforce           # Salesforce outbound messages
```

### Zoom Endpoints

```
POST   /api/webhooks/zoom/recording       # Recording completed webhook
GET    /api/zoom/recordings/:callId       # Get recording details
POST   /api/zoom/recordings/:id/transcribe # Trigger transcription
GET    /api/zoom/recordings/:id/download  # Download recording
```

### Research Endpoints (Modified)

```
POST   /api/research/leads/:id            # Generate research (enhanced)
GET    /api/research/leads/:id            # Get research
GET    /api/research/leads/:id/status     # Get job status
POST   /api/research/leads/:id/retry      # Retry failed research
```

### Kanban Endpoints (New)

```
GET    /api/kanban/board                  # Get all cards
GET    /api/kanban/board/:stage           # Get cards by stage
PUT    /api/kanban/cards/:id/stage        # Update card stage
GET    /api/kanban/metrics                # Get board metrics
POST   /api/kanban/filters                # Save filter preset
```

### Handoff Endpoints (New)

```
POST   /api/handoff/validate/:leadId      # Validate handoff eligibility
POST   /api/handoff/generate/:leadId      # Generate analysis document
POST   /api/handoff/execute               # Execute handoff (email + SF)
GET    /api/handoff/history/:leadId       # Get handoff history
```

---

## Infrastructure Setup (Azure)

### Required Azure Services

1. **Azure App Service**
   - Plan: B1 or higher (production)
   - Runtime: Node.js 20 LTS
   - Auto-scaling: 2-5 instances
   - HTTPS only, custom domain

2. **Azure SQL Database**
   - Tier: S1 or higher
   - Size: 50 GB (initial)
   - Backup: Daily, 7-day retention
   - Geo-replication: Optional

3. **Azure Blob Storage**
   - Account: Standard (general purpose v2)
   - Container: `call-recordings` (private)
   - Container: `handoff-documents` (private)
   - Lifecycle policy: Archive after 90 days

4. **Azure Redis Cache** (Optional)
   - Tier: Basic C0 (dev) or Standard C1 (prod)
   - Purpose: Session store, API cache

5. **Azure Application Insights**
   - For logging, monitoring, alerts
   - Integrated with App Service

6. **Azure Key Vault**
   - Store secrets: Salesforce credentials, Zoom API keys, DB connection strings

### Environment Variables

```bash
# Database
DATABASE_URL=sqlserver://...

# Salesforce
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_REDIRECT_URI=...

# Zoom
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_WEBHOOK_SECRET=...

# Azure
AZURE_STORAGE_ACCOUNT=...
AZURE_STORAGE_KEY=...
AZURE_SPEECH_API_KEY=...
AZURE_SPEECH_REGION=...

# Google Gemini
GEMINI_API_KEY=...

# App
NODE_ENV=production
PORT=8080
SESSION_SECRET=...
```

---

## Deployment Strategy

### CI/CD Pipeline (Azure DevOps or GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: leadintel-prod
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

### Migration Steps (Replit → Azure)

1. **Backup current database**
   ```bash
   pg_dump DATABASE_URL > backup.sql
   ```

2. **Create Azure SQL Database**
   - Use Azure Portal or CLI
   - Run schema migration: `npm run db:push`

3. **Import data**
   - Transform PostgreSQL backup to Azure SQL format
   - Import leads, users, research data
   - Verify data integrity

4. **Deploy app to Azure App Service**
   - Configure environment variables
   - Deploy via GitHub Actions
   - Test endpoints

5. **Configure custom domain**
   - Point DNS to Azure App Service
   - Enable SSL certificate

6. **Cutover**
   - Update Salesforce webhook URL
   - Update Zoom webhook URL
   - Redirect users to new URL
   - Monitor for errors

---

## Security Considerations

### 1. Authentication & Authorization
- **Salesforce:** OAuth 2.0, refresh token rotation
- **Zoom:** JWT or Server-to-Server OAuth
- **Users:** Session-based auth (future: Azure AD SSO)

### 2. Data Protection
- **In Transit:** HTTPS only (TLS 1.2+)
- **At Rest:** Azure SQL encryption, Blob Storage encryption
- **Secrets:** Azure Key Vault, no hardcoded credentials

### 3. API Security
- **Webhooks:** Signature verification (Salesforce HMAC, Zoom signature)
- **Rate Limiting:** 100 req/min per user
- **CORS:** Whitelist specific domains only

### 4. Compliance
- **GDPR:** Data deletion capability
- **SOC 2:** Audit logging
- **CCPA:** Data export capability

---

## Monitoring & Observability

### Metrics to Track

**Application:**
- Response time (p50, p95, p99)
- Error rate (%)
- API call success rate

**Business:**
- Leads synced per hour
- Research jobs completed per hour
- Handoffs per day

**Infrastructure:**
- CPU usage
- Memory usage
- Database connections
- Blob storage size

### Alerts

- Error rate > 5% for 5 minutes
- Response time p95 > 3 seconds
- Salesforce sync failures
- Database connection pool exhausted

---

## Performance Optimization

### Backend
- **Caching:** Redis for Salesforce data (5 min TTL)
- **Background Jobs:** Queue for research, transcription
- **Connection Pooling:** 20 concurrent DB connections
- **CDN:** Azure CDN for static assets

### Frontend
- **Code Splitting:** Route-based lazy loading
- **Image Optimization:** WebP format, lazy loading
- **Bundle Size:** <500 KB initial load
- **Tree Shaking:** Remove unused code

### Database
- **Indexes:** On foreign keys, frequently queried columns
- **Query Optimization:** Use EXPLAIN, avoid N+1
- **Archiving:** Move old leads to archive table after 1 year

---

## Disaster Recovery

### Backup Strategy
- **Database:** Daily automated backups (7-day retention)
- **Blob Storage:** Geo-redundant storage
- **Configuration:** Infrastructure as Code (Terraform/ARM templates)

### Recovery Plan
1. Restore database from latest backup
2. Redeploy app from Git (last known good commit)
3. Restore Blob Storage if needed
4. Update DNS if needed
5. Test critical workflows
6. Notify users

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours

---

## Scalability Plan

### Phase 1 (Current): 20 SDRs
- Azure App Service: B1 (1 instance)
- Azure SQL: S1 (50 GB)
- Azure Redis: Basic C0

### Phase 2 (6 months): 50 SDRs
- App Service: S1 (2-3 instances, auto-scale)
- SQL: S2 (100 GB)
- Redis: Standard C1

### Phase 3 (12 months): 100+ SDRs
- App Service: P1V2 (3-5 instances)
- SQL: S3 (250 GB) or Premium
- Redis: Standard C2
- CDN: Azure CDN
- Search: Azure Cognitive Search (if needed)

---

**Document Version:** 1.0
**Last Updated:** January 9, 2026
**Next Review:** After Azure infrastructure confirmation
