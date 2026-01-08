# Lead Intel
## Technical Documentation for Production Deployment

**Version:** 1.0  
**Date:** January 2026  
**Prepared for:** Hawk Ridge Systems Development Team  
**Platform:** Built on Replit with AI-powered development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [External Integrations](#6-external-integrations)
7. [Security Architecture](#7-security-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [AI/ML Components](#9-aiml-components)
10. [Real-Time Systems](#10-real-time-systems)
11. [Environment Configuration](#11-environment-configuration)
12. [Build & Deployment](#12-build--deployment)
13. [Production Considerations](#13-production-considerations)
14. [Google Documents Reference](#14-google-documents-reference)
15. [File Structure Reference](#15-file-structure-reference)

---

## 1. Executive Summary

Lead Intel is an AI-powered sales intelligence platform providing:

- **Browser-based softphone** via Twilio Voice SDK
- **Real-time AI coaching** during live sales calls
- **Automated lead research** with Google Search grounding via Gemini AI
- **Performance analytics** with 7-dimension scoring
- **Role-based access control** for multi-tier sales organizations

The application is a full-stack TypeScript monorepo with a React frontend and Express.js backend, deployed on Replit with PostgreSQL persistence.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| AI Research Dossiers | One-click intelligence gathering with confidence scoring |
| Live Call Coaching | Real-time AI suggestions during active calls |
| Manager Scorecards | Automatic 7-dimension call analysis |
| Pipeline Management | Lead tracking from new to converted |
| AE Handoffs | Qualified lead transfer with email notifications |
| Learning Hub | SDR performance insights and coaching aggregation |
| CEO Dashboard | Team-wide visibility and metrics |

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  React 18 + Vite + TanStack Query + Tailwind CSS + Three.js    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                             │
│              Express.js + Session Auth + RBAC                   │
│                    Port 5000 (unified)                          │
└─────────────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Twilio   │   │ Google   │   │ Gemini   │   │PostgreSQL│
    │ Voice    │   │ APIs     │   │ AI       │   │ Database │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### Request Flow

```
User Action → React Component → TanStack Query → Express Route 
    → Auth Middleware → Business Logic → Storage Layer → PostgreSQL
```

### WebSocket Architecture

```
Browser ←→ /ws/transcription ←→ Express WS Handler
                │
                ├── Live transcription events
                ├── AI coaching tips (real-time)
                └── System notifications
```

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 7.3.0 | Build tool & dev server |
| TanStack Query | 5.60.5 | Server state management |
| Wouter | 3.3.5 | Client-side routing |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| Shadcn/ui | Latest | Component library (Radix-based) |
| Three.js | 0.182.0 | 3D graphics (landing page) |
| @react-three/fiber | 8.17.10 | React renderer for Three.js |
| Framer Motion | 11.13.1 | Animations |
| Recharts | 2.15.2 | Data visualization |
| Lucide React | 0.453.0 | Icon library |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.21.2 | HTTP server |
| TypeScript | 5.6.3 | Type safety |
| tsx | 4.20.5 | TypeScript execution |
| Drizzle ORM | 0.39.3 | Database ORM |
| drizzle-zod | 0.7.1 | Schema validation |
| Zod | 3.25.76 | Runtime validation |
| bcrypt | 6.0.0 | Password hashing |
| express-session | 1.18.1 | Session management |
| connect-pg-simple | 10.0.0 | PostgreSQL session store |
| ws | 8.18.0 | WebSocket server |
| pg | 8.16.3 | PostgreSQL driver |

### External Services

| Service | SDK Version | Purpose |
|---------|-------------|---------|
| Twilio Voice | 2.17.0 (browser), 5.11.1 (server) | Telephony |
| Google APIs | 169.0.0 | Drive, Sheets, Gmail |
| @google/genai | 1.34.0 | Gemini AI |
| @google/generative-ai | 0.24.1 | Gemini AI (legacy) |

---

## 4. Database Schema

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │────▶│    sdrs     │────▶│  managers   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │
      │                   │
      ▼                   ▼
┌─────────────┐     ┌─────────────┐
│callSessions │◀────│   leads     │
└─────────────┘     └─────────────┘
      │                   │
      │                   │
      ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│managerCallAna.. │ │researchPackets  │
└─────────────────┘ └─────────────────┘
```

### Core Tables

#### `users`
```typescript
{
  id: varchar (UUID, PK),
  email: text (unique, not null),
  password: text (bcrypt hash, not null),
  name: text (not null),
  role: text ("admin" | "manager" | "sdr" | "account_specialist" | "account_executive"),
  isActive: boolean (default: true),
  sdrId: varchar (FK → sdrs.id),
  managerId: varchar (FK → managers.id),
  createdAt: timestamp,
  lastLoginAt: timestamp
}
```

#### `leads`
```typescript
{
  id: varchar (UUID, PK),
  companyName: text (not null),
  companyWebsite: text,
  companyIndustry: text,
  companySize: text,
  contactName: text (not null),
  contactTitle: text,
  contactEmail: text (not null),
  contactPhone: text,
  contactLinkedIn: text,
  source: text (default: "manual"),
  status: text ("new" | "researching" | "contacted" | "engaged" | "qualified" | "handed_off" | "converted" | "lost"),
  fitScore: integer (0-100),
  priority: text ("hot" | "warm" | "cool" | "cold"),
  assignedSdrId: varchar (FK → sdrs.id),
  assignedAeId: varchar,
  qualificationNotes: text,
  buySignals: text,
  budget: text,
  timeline: text,
  decisionMakers: text,
  handedOffAt: timestamp,
  handedOffBy: varchar,
  nextFollowUpAt: timestamp,
  lastContactedAt: timestamp,
  createdAt: timestamp
}
```

#### `researchPackets`
```typescript
{
  id: varchar (UUID, PK),
  leadId: varchar (FK → leads.id, not null),
  companyIntel: text,
  contactIntel: text,
  painSignals: text,
  competitorPresence: text,
  fitAnalysis: text,
  fitScore: integer,
  priority: text,
  talkTrack: text,
  discoveryQuestions: text,
  objectionHandles: text,
  companyHardIntel: text,
  xIntel: text,
  linkedInIntel: text,
  sources: text,
  verificationStatus: text,
  painPointsJson: jsonb,
  productMatchesJson: jsonb,
  linkedInProfileJson: jsonb,
  xIntelJson: jsonb,
  careerHistoryJson: jsonb,
  dossierJson: jsonb (includes confidenceAssessment, companyWebsite),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `callSessions`
```typescript
{
  id: varchar (UUID, PK),
  callSid: text (unique, Twilio reference),
  userId: varchar (FK → users.id, not null),
  leadId: varchar (FK → leads.id),
  direction: text ("inbound" | "outbound"),
  fromNumber: text (not null),
  toNumber: text (not null),
  status: text ("initiated" | "ringing" | "in-progress" | "completed" | "failed"),
  duration: integer (seconds),
  recordingUrl: text,
  driveFileId: text,
  transcriptText: text,
  coachingNotes: text,
  managerSummary: text,
  startedAt: timestamp,
  endedAt: timestamp,
  disposition: text,
  keyTakeaways: text,
  nextSteps: text,
  sdrNotes: text,
  callbackDate: timestamp,
  sentimentScore: integer (1-5)
}
```

#### `managerCallAnalyses`
```typescript
{
  id: varchar (UUID, PK),
  callSessionId: varchar (FK → callSessions.id, not null),
  sdrId: text (not null),
  sdrName: text (not null),
  callDate: timestamp (not null),
  callType: text,
  durationSeconds: integer,
  overallScore: integer (0-100, not null),
  openingScore: integer,
  discoveryScore: integer,
  listeningScore: integer,
  objectionScore: integer,
  valuePropositionScore: integer,
  closingScore: integer,
  complianceScore: integer,
  keyObservations: text,
  criteriaComparison: text,
  recommendations: text,
  managerNotes: text,
  summary: text,
  fullAnalysis: text,
  transcript: text,
  emailSentTo: text,
  emailSentAt: timestamp,
  evaluationDocId: text,
  analyzedAt: timestamp,
  analyzedBy: text
}
```

#### `liveCoachingSessions`
```typescript
{
  id: varchar (UUID, PK),
  callProvider: text (default: "twilio"),
  zoomMeetingId: text (not null),
  zoomMeetingUuid: text,
  sdrId: varchar (FK → sdrs.id),
  leadId: varchar (FK → leads.id),
  hostEmail: text,
  topic: text,
  status: text (default: "active"),
  streamId: text,
  leadContext: text,
  joinUrl: text,
  phoneNumber: text,
  callDuration: integer,
  callOutcome: text,
  startedAt: timestamp,
  endedAt: timestamp
}
```

#### `session` (PostgreSQL Session Store)
```typescript
{
  sid: varchar (PK),
  sess: json (not null),
  expire: timestamp (not null)
}
```

### Database Migrations

Managed via Drizzle Kit:
```bash
npm run db:push        # Push schema changes
drizzle-kit generate   # Generate migration files
```

Migration output directory: `./migrations/`

---

## 5. API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Create new user account |
| POST | `/api/auth/login` | None | Authenticate user |
| POST | `/api/auth/logout` | Session | Destroy session |
| GET | `/api/auth/me` | Session | Get current user |

### Lead Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | Session | List all leads |
| GET | `/api/leads/:id` | Session | Get lead with research |
| POST | `/api/leads` | Session | Create lead |
| PATCH | `/api/leads/:id` | Session | Update lead |
| DELETE | `/api/leads/:id` | Session | Delete lead |
| POST | `/api/leads/:id/research` | Session | Generate AI research |
| PATCH | `/api/leads/:id/research` | Session | Update research packet |
| DELETE | `/api/leads/:id/research` | Session | Delete research |
| POST | `/api/leads/:id/handoff` | Session | Hand off to AE |
| POST | `/api/leads/import` | Session | Import from Google Sheets |

### Voice/Telephony

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/voice/token` | Session | Generate Twilio access token |
| POST | `/api/calls` | Session | Create call session record |
| PATCH | `/api/calls/:id` | Session | Update call session |
| GET | `/api/calls` | Session | List call sessions |
| POST | `/twilio/voice/outbound` | Twilio Signature | Outbound call webhook |
| POST | `/twilio/voice/status` | Twilio Signature | Call status webhook |
| POST | `/twilio/voice/recording-status` | Twilio Signature | Recording webhook |
| POST | `/twilio/transcription` | None | Real-time transcription |

### Coaching & Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/coach/sessions` | Session | List coaching sessions |
| POST | `/api/coach/sessions` | Session | Create coaching session |
| GET | `/api/coach/sessions/:id/tips` | Session | Get coaching tips |
| GET | `/api/manager/analyses` | Session | List all analyses |
| GET | `/api/manager/analyses/:sdrId` | Session | Analyses by SDR |
| POST | `/api/manager/analyze/:callId` | Manager+ | Trigger call analysis |

### User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| PATCH | `/api/users/:id/role` | Admin | Update user role |
| DELETE | `/api/users/:id` | Admin | Delete user |
| GET | `/api/sdrs` | Session | List SDRs |
| GET | `/api/managers` | Session | List managers |
| GET | `/api/account-executives` | Session | List AEs |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Session | Get user notifications |
| GET | `/api/notifications/unread-count` | Session | Unread count |
| PATCH | `/api/notifications/:id/read` | Session | Mark as read |
| POST | `/api/notifications/mark-all-read` | Session | Mark all read |

---

## 6. External Integrations

### Twilio Voice

**Purpose:** Browser-based softphone with call recording and real-time transcription

**Configuration:**
```typescript
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
```

**TwiML Configuration:**
- Real-time transcription via `<Transcription>` element
- Dual-channel recording: `record="record-from-answer-dual"`
- Webhook URLs configured in Twilio Console

**Production Webhook URLs:**
```
Voice URL: https://hawridgesales.replit.app/twilio/voice/outbound
Status Callback: https://hawridgesales.replit.app/twilio/voice/status
Recording Status: https://hawridgesales.replit.app/twilio/voice/recording-status
Transcription: https://hawridgesales.replit.app/twilio/transcription
```

### Google APIs

**Services Used:**
- **Google Drive:** Audio file storage and retrieval
- **Google Sheets:** Lead import
- **Gmail:** Coaching emails and notifications
- **Google Docs:** Knowledge base and criteria documents

**OAuth Configuration:**
```typescript
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
```

### Gemini AI

**Models Used:**
- `gemini-2.5-flash` — Fast research and coaching
- `gemini-2.5-pro` — Complex analysis
- `gemini-2.5-flash-image` — Image processing

**Features:**
- Google Search grounding for real-time company research
- Audio transcription
- Call coaching analysis
- Lead research dossier generation
- Confidence scoring

**Configuration:**
```typescript
// Replit AI Integrations (preferred)
const AI_INTEGRATIONS_GEMINI_API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const AI_INTEGRATIONS_GEMINI_BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

// Direct Gemini (fallback)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
```

### SerpAPI (Optional)

**Purpose:** LinkedIn profile search enrichment

```typescript
const SERP_API = process.env.SERP_API;
```

---

## 7. Security Architecture

### Authentication

**Method:** Session-based authentication with PostgreSQL persistence

**Session Configuration:**
```typescript
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,           // HTTPS only in production
    httpOnly: true,         // No JavaScript access
    maxAge: 2592000000,     // 30 days
    sameSite: "lax"         // CSRF protection
  }
}
```

**Password Hashing:**
- Algorithm: bcrypt
- Salt rounds: 12
- Library: `bcrypt@6.0.0`

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `admin` | Full system access, user management |
| `manager` | Team oversight, call analysis, all leads |
| `sdr` | Own leads, calls, research |
| `account_specialist` | Own leads, limited research |
| `account_executive` | Qualified leads, handoff receipt |

**Middleware Implementation:**
```typescript
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

const requireRole = (...allowedRoles) => async (req, res, next) => {
  const user = await storage.getUser(req.session.userId);
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
```

### Twilio Webhook Security

```typescript
function validateTwilioWebhook(req, res, next) {
  const twilioSignature = req.headers['x-twilio-signature'];
  const isValid = twilio.validateRequest(
    TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    req.body
  );
  if (!isValid) return res.status(403).send("Forbidden");
  next();
}
```

### Security Headers

**Production Requirements:**
- Enable HTTPS only
- Set `trust proxy` for reverse proxy environments
- Implement rate limiting (recommended: express-rate-limit)
- Add CORS configuration for API access

---

## 8. Frontend Architecture

### Directory Structure

```
client/src/
├── components/
│   ├── ui/                    # Shadcn components (50+ components)
│   ├── app-sidebar.tsx        # Main navigation
│   ├── softphone.tsx          # Twilio Voice UI
│   ├── notification-bell.tsx  # Real-time notifications
│   ├── budgeting-panel.tsx    # Budget tracking
│   └── ...
├── hooks/
│   ├── use-toast.ts           # Toast notifications
│   ├── use-mobile.tsx         # Responsive detection
│   └── use-transcription.ts   # WebSocket transcription
├── lib/
│   ├── auth.tsx               # Auth context provider
│   ├── queryClient.ts         # TanStack Query config
│   └── utils.ts               # Utility functions
├── pages/
│   ├── landing.tsx            # Public landing (Three.js)
│   ├── login.tsx              # Authentication
│   ├── dashboard.tsx          # Main dashboard
│   ├── leads.tsx              # Lead management
│   ├── coaching.tsx           # Live coaching
│   ├── learning.tsx           # SDR Learning Hub
│   ├── reports.tsx            # Analytics
│   ├── settings.tsx           # User/system settings
│   ├── ae-pipeline.tsx        # AE handoff pipeline
│   └── budgeting.tsx          # Budget tools
├── App.tsx                    # Root component + routing
├── main.tsx                   # Entry point
└── index.css                  # Global styles + CSS variables
```

### State Management

**Server State:** TanStack Query
```typescript
// Query example
const { data: leads } = useQuery({
  queryKey: ['/api/leads'],
});

// Mutation example
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/leads', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/leads'] })
});
```

**Client State:** React hooks (useState, useContext)

### Routing

**Library:** Wouter 3.3.5

```typescript
<Switch>
  <Route path="/" component={Landing} />
  <Route path="/login" component={Login} />
  <Route path="/dashboard" component={Dashboard} />
  <Route path="/leads" component={Leads} />
  <Route path="/coaching" component={Coaching} />
  {/* ... */}
</Switch>
```

### Styling System

**Framework:** Tailwind CSS 3.4 with CSS custom properties

**Theme Variables:** (defined in `index.css`)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  /* ... 40+ variables */
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

**Component Library:** Shadcn/ui with New York style variant

---

## 9. AI/ML Components

### Lead Research Pipeline

```
Lead Data → Company Intel → Contact Intel → Pain Analysis → Product Matching → Dossier Generation
                │               │               │                │
                ▼               ▼               ▼                ▼
         Google Search    LinkedIn Scrape   Gemini Analysis   Hawk Ridge Catalog
```

**Module Files:**
- `server/ai/leadResearch.ts` — Main orchestration
- `server/ai/companyHardIntel.ts` — Firmographic data
- `server/ai/websiteScraper.ts` — Website intelligence
- `server/ai/linkedInResearch.ts` — LinkedIn enrichment
- `server/ai/xResearch.ts` — X/Twitter intel
- `server/ai/productCatalog.ts` — Product matching

### Coaching Analysis Pipeline

```
Call Recording → Transcription → Dimension Analysis → Scoring → Recommendations
                      │                 │                │
                      ▼                 ▼                ▼
               Gemini Audio      7-Dimension Model    Email Generation
```

**Scoring Dimensions:**
1. Opening Score (rapport, agenda setting)
2. Discovery Score (needs uncovering)
3. Product Score (knowledge demonstration)
4. Objection Score (handling resistance)
5. Listening Score (active engagement)
6. Control Score (conversation guidance)
7. Closing Score (next steps)

**Module Files:**
- `server/ai/transcribe.ts` — Audio transcription
- `server/ai/coachingAnalysis.ts` — Post-call analysis
- `server/ai/managerAnalysis.ts` — Manager scorecards
- `server/ai/analyze.ts` — Real-time coaching tips
- `server/ai/qualificationExtractor.ts` — BANT extraction

### Confidence Assessment

**Structure:**
```typescript
interface ConfidenceAssessment {
  overall: "high" | "medium" | "low";
  companyInfoConfidence: "high" | "medium" | "low";
  contactInfoConfidence: "high" | "medium" | "low";
  reasoning: string;
  warnings: string[];
}
```

**Evaluation Criteria:**
- High: Verified via official sources, domain matches company
- Medium: Multiple corroborating sources, some unverified claims
- Low: Single source, conflicting data, stale information

---

## 10. Real-Time Systems

### WebSocket Architecture

**Endpoint:** `/ws/transcription`

**Implementation:** Native `ws` library with `noServer: true` mode

```typescript
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (request, socket, head) => {
  if (request.url?.startsWith("/ws/transcription")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});
```

**Message Types:**

```typescript
// Transcription event
{
  type: "transcription",
  sessionId: string,
  speaker: "agent" | "customer",
  text: string,
  timestamp: number
}

// Coaching tip
{
  type: "coaching_tip",
  sessionId: string,
  tipType: "objection" | "product" | "discovery" | "closing",
  content: string
}

// Notification
{
  type: "notification",
  userId: string,
  title: string,
  message: string,
  entityType: string,
  entityId: string
}
```

### Notification Service

**File:** `server/notificationService.ts`

**Triggers:**
- Lead status changes
- Research completion
- Call completion
- Manager notifications for qualified leads
- AE handoffs

---

## 11. Environment Configuration

### Required Secrets

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Session
SESSION_SECRET="your-secure-secret-key"

# Twilio Voice
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_API_KEY_SID="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_API_KEY_SECRET="your-api-key-secret"
TWILIO_TWIML_APP_SID="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"

# Google APIs
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REFRESH_TOKEN="your-refresh-token"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Optional
SERP_API="your-serpapi-key"
LEADS_SPREADSHEET_ID="google-sheet-id"
```

### Optional Environment Variables

```bash
# Timezone (IANA format)
LOCAL_TIMEZONE="America/Los_Angeles"

# Replit AI Integrations (auto-populated)
AI_INTEGRATIONS_GEMINI_API_KEY="auto"
AI_INTEGRATIONS_GEMINI_BASE_URL="auto"
```

---

## 12. Build & Deployment

### Development

```bash
npm run dev          # Start development server (tsx)
npm run check        # TypeScript type checking
npm run db:push      # Push schema to database
```

### Production Build

```bash
npm run build        # Build frontend (Vite) + backend (esbuild)
npm run start        # Start production server
```

**Build Output:**
```
dist/
├── index.cjs        # Bundled server
└── public/          # Static frontend assets
```

### Build Configuration

**Vite (Frontend):**
```typescript
export default defineConfig({
  plugins: [react(), runtimeErrorOverlay()],
  resolve: {
    alias: {
      "@": path.resolve("client/src"),
      "@shared": path.resolve("shared"),
      "@assets": path.resolve("attached_assets"),
    },
  },
  build: {
    outDir: "dist/public",
  },
});
```

**esbuild (Backend):**
```typescript
// script/build.ts
await esbuild.build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  outfile: "dist/index.cjs",
  format: "cjs",
});
```

---

## 13. Production Considerations

### Infrastructure Recommendations

| Component | Development | Production Recommendation |
|-----------|-------------|---------------------------|
| Hosting | Replit | AWS ECS / GCP Cloud Run / Azure Container Apps |
| Database | Replit PostgreSQL | AWS RDS / GCP Cloud SQL (high availability) |
| Sessions | PostgreSQL | Redis Cluster (performance) |
| CDN | None | CloudFront / Cloud CDN (static assets) |
| Monitoring | Console logs | Datadog / New Relic / Sentry |
| Secrets | Replit Secrets | AWS Secrets Manager / HashiCorp Vault |

### Scaling Considerations

1. **Database Connection Pooling**
   - Current: Direct pg connection
   - Recommended: PgBouncer or application-level pooling

2. **WebSocket Scaling**
   - Current: Single-server WebSocket
   - Recommended: Redis pub/sub for multi-server sync

3. **AI Rate Limiting**
   - Implement request queuing with `p-limit`
   - Add retry logic with `p-retry`
   - Consider Gemini API quota management

4. **Session Store**
   - Current: PostgreSQL via connect-pg-simple
   - Recommended: Redis for sub-millisecond latency

### Monitoring Checklist

- [ ] Application error tracking (Sentry)
- [ ] API performance monitoring (latency percentiles)
- [ ] Database query analysis (slow query log)
- [ ] Twilio webhook health checks
- [ ] AI API usage and cost tracking
- [ ] Real-time alert thresholds

### Security Hardening

- [ ] Enable rate limiting on all endpoints
- [ ] Implement CORS with explicit origin allowlist
- [ ] Add Content Security Policy headers
- [ ] Enable database SSL connections
- [ ] Rotate session secrets regularly
- [ ] Audit log for sensitive operations
- [ ] Penetration testing before launch

---

## 14. Google Documents Reference

### Drive Folder IDs

| Folder | ID | Purpose |
|--------|-----|---------|
| **INBOX Folder** | `1NsEMlqn_TUeVenFSWgLU3jEsUCa6LWus` | Audio files for processing |
| **PROCESSED Folder** | `1AUTWsUq2AS-LC2sgKkSqk1bhEYhI_D-2` | Processed audio archive |
| **Coaching Examples** | `10J6xKMbdDlZrKS6el0qWlnZeurtkLStS` | Sample coaching recordings |

### Document Links

| Document | Google Docs Link | Purpose |
|----------|------------------|---------|
| **Knowledge Base** | [View Document](https://docs.google.com/document/d/1NxcQYGHXaVfEGK7Vs5AiOjse8bsRbHBEiwdLsMr0LME/edit) | Hawk Ridge Systems product knowledge and sales playbook |
| **SDR Persona** | [View Document](https://docs.google.com/document/d/1clt69Puie5CB96ukgjMAVCKDyuSPS5BU-C_JrI-tq3I/edit) | SDR communication style and persona guidelines |
| **Daily Summary Criteria** | [View Document](https://docs.google.com/document/d/1fuaUZ6kLtWtdF39meAxfoktSPvRRzVWcGg5oEq8ygL8/edit) | Criteria for daily call summaries and analysis |
| **Lead Scoring Parameters** | [View Document](https://docs.google.com/document/d/1xERqop5Y9iBNjghbwPF4jNpPKVMW8SlPkJEUnczXL5E/edit) | Lead qualification and scoring methodology |

### Spreadsheet Links

| Spreadsheet | Google Sheets Link | Purpose |
|-------------|-------------------|---------|
| **Leads Spreadsheet** | [View Spreadsheet](https://docs.google.com/spreadsheets/d/1dEbs4B7oucHJmA8U0-VehfzQN3Yt54RRs6VQlWNxX2I/edit) | Lead import source for Google Sheets integration |

### Direct Document IDs (for API usage)

```typescript
// For use in server/google/driveClient.ts
const DOCUMENT_IDS = {
  KNOWLEDGE_BASE: "1NxcQYGHXaVfEGK7Vs5AiOjse8bsRbHBEiwdLsMr0LME",
  SDR_PERSONA: "1clt69Puie5CB96ukgjMAVCKDyuSPS5BU-C_JrI-tq3I",
  DAILY_SUMMARY_CRITERIA: "1fuaUZ6kLtWtdF39meAxfoktSPvRRzVWcGg5oEq8ygL8",
  LEAD_SCORING_PARAMS: "1xERqop5Y9iBNjghbwPF4jNpPKVMW8SlPkJEUnczXL5E",
  LEADS_SPREADSHEET: "1dEbs4B7oucHJmA8U0-VehfzQN3Yt54RRs6VQlWNxX2I"
};
```

---

## 15. File Structure Reference

```
lead-intel/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # 50+ Shadcn components
│   │   │   └── *.tsx            # Feature components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities
│   │   ├── pages/               # Route pages
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles
│   └── index.html
├── server/
│   ├── ai/                      # AI/ML modules
│   │   ├── leadResearch.ts
│   │   ├── coachingAnalysis.ts
│   │   ├── managerAnalysis.ts
│   │   └── *.ts
│   ├── google/                  # Google API clients
│   │   ├── driveClient.ts
│   │   ├── sheetsClient.ts
│   │   └── gmailClient.ts
│   ├── replit_integrations/     # Replit AI integration
│   ├── index.ts                 # Server entry
│   ├── routes.ts                # API routes
│   ├── storage.ts               # Data access layer
│   ├── db.ts                    # Database connection
│   ├── twilio-voice.ts          # Twilio handlers
│   ├── transcription.ts         # WebSocket handlers
│   └── notificationService.ts   # Notification system
├── shared/
│   ├── schema.ts                # Drizzle schema + types
│   └── models/
│       └── chat.ts              # Chat models
├── migrations/                   # Database migrations
├── attached_assets/             # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── drizzle.config.ts
└── replit.md                    # Project documentation
```

---

## Appendix A: Type Definitions

All TypeScript types are generated from Drizzle schema via `drizzle-zod`:

```typescript
// Insert types (for creating records)
type InsertUser = z.infer<typeof insertUserSchema>;
type InsertLead = z.infer<typeof insertLeadSchema>;
type InsertResearchPacket = z.infer<typeof insertResearchPacketSchema>;

// Select types (for reading records)
type User = typeof users.$inferSelect;
type Lead = typeof leads.$inferSelect;
type ResearchPacket = typeof researchPackets.$inferSelect;
```

---

## Appendix B: API Response Formats

**Success Response:**
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

**Paginated Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

## Appendix C: Notification Types

```typescript
const notificationTypes = [
  "lead_status_change",    // Lead moved to new status
  "lead_qualified",        // Lead marked as qualified
  "lead_assigned",         // Lead assigned to user
  "call_completed",        // Call session ended
  "call_analyzed",         // Manager analysis complete
  "meeting_booked",        // Meeting scheduled
  "research_ready",        // AI research completed
  "coaching_available",    // New coaching insights
  "ae_handoff"            // Lead handed to Account Executive
];
```

---

## Appendix D: Lead Status Flow

```
new → researching → contacted → engaged → qualified → handed_off → converted
                                    │                      │
                                    └──────────────────────┴──→ lost
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Maintained by:** Lead Intel Development Team  
**Built with:** Replit AI Agent

---

*This document is intended for internal use by the Hawk Ridge Systems development team. For questions or updates, contact the Lead Intel project maintainers.*
