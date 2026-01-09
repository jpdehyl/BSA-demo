# Lead Intel v1.0 → v2.0 Migration Plan

> **From:** Replit (Development)
> **To:** Azure (Production)
> **Timeline:** January 9-18, 2026
> **Target:** Hawk Ridge Systems Production Environment

---

## Executive Summary

This migration plan outlines the transition from the Replit development environment to Azure production infrastructure for Lead Intel v2.0. The migration includes:

- **Database:** PostgreSQL (Replit) → Azure SQL Database
- **Hosting:** Replit App → Azure App Service
- **Storage:** Local/Replit → Azure Blob Storage
- **Integrations:** Google Sheets → Salesforce, Twilio → Zoom Phone

**Critical Timeline:**
- **MVP Demo:** Monday, January 13, 2026
- **Hard Deadline:** Saturday, January 18, 2026

---

## Migration Phases

### Phase 1: Infrastructure Setup (Jan 9-10)
**Duration:** 1.5 days
**Owner:** DevOps + Claude Code

### Phase 2: Application Migration (Jan 10-12)
**Duration:** 2.5 days
**Owner:** Development Team + Claude Code

### Phase 3: Integration Configuration (Jan 12-13)
**Duration:** 1.5 days
**Owner:** Integration Specialists + Claude Code

### Phase 4: Testing & Validation (Jan 13-17)
**Duration:** 4 days
**Owner:** QA + Product Team

### Phase 5: Cutover & Go-Live (Jan 17-18)
**Duration:** 1 day
**Owner:** Full Team

---

## Phase 1: Infrastructure Setup

### 1.1 Azure Resource Provisioning

#### Required Azure Resources

**Resource Group:**
```bash
az group create \
  --name rg-leadintel-prod \
  --location eastus
```

**Azure SQL Database:**
```bash
az sql server create \
  --name sql-leadintel-prod \
  --resource-group rg-leadintel-prod \
  --location eastus \
  --admin-user leadintel_admin \
  --admin-password [SECURE_PASSWORD]

az sql db create \
  --resource-group rg-leadintel-prod \
  --server sql-leadintel-prod \
  --name leadintel-db \
  --service-objective S1 \
  --backup-storage-redundancy Local
```

**Azure App Service:**
```bash
az appservice plan create \
  --name asp-leadintel-prod \
  --resource-group rg-leadintel-prod \
  --sku B1 \
  --is-linux

az webapp create \
  --resource-group rg-leadintel-prod \
  --plan asp-leadintel-prod \
  --name app-leadintel-prod \
  --runtime "NODE:20-lts"
```

**Azure Blob Storage:**
```bash
az storage account create \
  --name stleadintel \
  --resource-group rg-leadintel-prod \
  --location eastus \
  --sku Standard_LRS

az storage container create \
  --name call-recordings \
  --account-name stleadintel \
  --public-access off

az storage container create \
  --name handoff-documents \
  --account-name stleadintel \
  --public-access off
```

**Azure Redis Cache (Optional):**
```bash
az redis create \
  --name redis-leadintel \
  --resource-group rg-leadintel-prod \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

**Azure Key Vault:**
```bash
az keyvault create \
  --name kv-leadintel \
  --resource-group rg-leadintel-prod \
  --location eastus
```

**Azure Application Insights:**
```bash
az monitor app-insights component create \
  --app ai-leadintel \
  --location eastus \
  --resource-group rg-leadintel-prod \
  --application-type web
```

#### 1.2 Network Configuration

**Firewall Rules:**
```bash
# Allow Azure services to access SQL Database
az sql server firewall-rule create \
  --resource-group rg-leadintel-prod \
  --server sql-leadintel-prod \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow development IPs (temporary, remove after migration)
az sql server firewall-rule create \
  --resource-group rg-leadintel-prod \
  --server sql-leadintel-prod \
  --name AllowDevTeam \
  --start-ip-address [DEV_IP] \
  --end-ip-address [DEV_IP]
```

**CORS Configuration:**
```bash
az webapp cors add \
  --resource-group rg-leadintel-prod \
  --name app-leadintel-prod \
  --allowed-origins https://leadintel.hawkridgesystems.com
```

#### 1.3 Secret Management

**Store secrets in Key Vault:**
```bash
# Database connection string
az keyvault secret set \
  --vault-name kv-leadintel \
  --name DATABASE-URL \
  --value "sqlserver://sql-leadintel-prod.database.windows.net:1433/leadintel-db?..."

# Salesforce credentials
az keyvault secret set --vault-name kv-leadintel --name SALESFORCE-CLIENT-ID --value "[SF_ID]"
az keyvault secret set --vault-name kv-leadintel --name SALESFORCE-CLIENT-SECRET --value "[SF_SECRET]"

# Zoom credentials
az keyvault secret set --vault-name kv-leadintel --name ZOOM-CLIENT-ID --value "[ZOOM_ID]"
az keyvault secret set --vault-name kv-leadintel --name ZOOM-CLIENT-SECRET --value "[ZOOM_SECRET]"

# Gemini API key
az keyvault secret set --vault-name kv-leadintel --name GEMINI-API-KEY --value "[GEMINI_KEY]"

# Session secret
az keyvault secret set --vault-name kv-leadintel --name SESSION-SECRET --value "[RANDOM_SECRET]"
```

**Grant App Service access to Key Vault:**
```bash
az webapp identity assign \
  --resource-group rg-leadintel-prod \
  --name app-leadintel-prod

# Get the principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --resource-group rg-leadintel-prod \
  --name app-leadintel-prod \
  --query principalId -o tsv)

# Grant access
az keyvault set-policy \
  --name kv-leadintel \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

---

## Phase 2: Application Migration

### 2.1 Code Changes for Azure Compatibility

#### Database Connection (Drizzle ORM)

**Current (Replit - PostgreSQL):**
```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);
```

**New (Azure - SQL Server):**
```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Azure SQL requires SSL
  },
  max: 20, // Connection pooling
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
```

**Alternative (Azure SQL with mssql driver):**
```typescript
import { drizzle } from 'drizzle-orm/mssql';
import sql from 'mssql';

const config = {
  server: process.env.AZURE_SQL_SERVER!,
  database: process.env.AZURE_SQL_DATABASE!,
  user: process.env.AZURE_SQL_USER!,
  password: process.env.AZURE_SQL_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 20,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);
await pool.connect();

export const db = drizzle(pool);
```

#### File Storage (Azure Blob)

**New Service:**
```typescript
// server/storage/blobStorage.ts
import { BlobServiceClient } from '@azure/storage-blob';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

export class BlobStorage {
  private recordingsContainer = blobServiceClient.getContainerClient('call-recordings');
  private handoffContainer = blobServiceClient.getContainerClient('handoff-documents');

  async uploadRecording(callId: string, audioBuffer: Buffer): Promise<string> {
    const blobName = `${callId}.m4a`;
    const blockBlobClient = this.recordingsContainer.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(audioBuffer, {
      blobHTTPHeaders: { blobContentType: 'audio/m4a' },
    });

    return blockBlobClient.url;
  }

  async uploadHandoffDocument(leadId: number, pdfBuffer: Buffer): Promise<string> {
    const blobName = `handoff-${leadId}-${Date.now()}.pdf`;
    const blockBlobClient = this.handoffContainer.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(pdfBuffer, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    });

    return blockBlobClient.url;
  }

  async downloadRecording(blobUrl: string): Promise<Buffer> {
    const blockBlobClient = this.recordingsContainer.getBlockBlobClient(
      blobUrl.split('/').pop()!
    );
    const downloadResponse = await blockBlobClient.download();
    return await streamToBuffer(downloadResponse.readableStreamBody!);
  }
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => chunks.push(data instanceof Buffer ? data : Buffer.from(data)));
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}

export const blobStorage = new BlobStorage();
```

#### Session Management (Azure Redis or SQL)

**Option 1: SQL-based sessions (simpler for MVP):**
```typescript
// server/index.ts
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool: pool, // Same as database pool
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));
```

**Option 2: Redis-based sessions (better performance):**
```typescript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));
```

#### Environment Variable Loading

**New startup script:**
```typescript
// server/config/azure.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export async function loadSecretsFromKeyVault() {
  if (process.env.NODE_ENV !== 'production') {
    // Use .env file in development
    return;
  }

  const vaultName = process.env.AZURE_KEYVAULT_NAME!;
  const url = `https://${vaultName}.vault.azure.net`;

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(url, credential);

  const secrets = [
    'DATABASE-URL',
    'SALESFORCE-CLIENT-ID',
    'SALESFORCE-CLIENT-SECRET',
    'ZOOM-CLIENT-ID',
    'ZOOM-CLIENT-SECRET',
    'GEMINI-API-KEY',
    'SESSION-SECRET',
  ];

  for (const secretName of secrets) {
    const secret = await client.getSecret(secretName);
    const envVarName = secretName.replace(/-/g, '_');
    process.env[envVarName] = secret.value;
  }
}

// In server/index.ts
import { loadSecretsFromKeyVault } from './config/azure.js';

async function startServer() {
  await loadSecretsFromKeyVault();
  // ... rest of server initialization
}

startServer();
```

### 2.2 Database Schema Migration

#### Step 1: Backup Replit Database
```bash
# On Replit console
pg_dump $DATABASE_URL > /tmp/leadintel_backup_$(date +%Y%m%d).sql

# Download backup
curl -o leadintel_backup.sql [replit_file_url]
```

#### Step 2: Convert Schema (PostgreSQL → Azure SQL)

**Differences to handle:**
- Serial → Identity
- JSONB → NVARCHAR(MAX) or JSON type (if supported)
- Boolean → BIT
- Text → NVARCHAR(MAX)
- Timestamp → DATETIME2

**Conversion script:**
```sql
-- Example conversion for leads table

-- PostgreSQL (original)
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  status VARCHAR(50),
  fit_score INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Azure SQL (converted)
CREATE TABLE leads (
  id INT IDENTITY(1,1) PRIMARY KEY,
  company_name NVARCHAR(MAX) NOT NULL,
  status NVARCHAR(50),
  fit_score INT,
  metadata NVARCHAR(MAX), -- Store JSON as string
  created_at DATETIME2 DEFAULT GETDATE()
);
```

#### Step 3: Run Drizzle Migration

**Update drizzle.config.ts:**
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  driver: 'pg', // or 'mssql' if using Azure SQL native driver
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Generate and push migration:**
```bash
npm run db:push
```

#### Step 4: Data Migration

**Export data from Replit:**
```sql
-- Export leads
COPY (SELECT * FROM leads) TO '/tmp/leads.csv' WITH CSV HEADER;

-- Export users
COPY (SELECT * FROM users) TO '/tmp/users.csv' WITH CSV HEADER;

-- Export research_packets
COPY (SELECT * FROM research_packets) TO '/tmp/research_packets.csv' WITH CSV HEADER;

-- Export call_sessions
COPY (SELECT * FROM call_sessions) TO '/tmp/call_sessions.csv' WITH CSV HEADER;
```

**Import data to Azure SQL:**

Option 1: Use Azure Data Studio with SQL Server Import/Export Wizard

Option 2: Bulk insert script
```sql
-- Azure SQL
BULK INSERT leads
FROM '/path/to/leads.csv'
WITH (
  FORMAT = 'CSV',
  FIRSTROW = 2,
  FIELDTERMINATOR = ',',
  ROWTERMINATOR = '\n'
);
```

Option 3: Node.js migration script
```typescript
// scripts/migrate-data.ts
import { db as oldDb } from './server/db-old'; // Replit connection
import { db as newDb } from './server/db'; // Azure connection
import { leads, users, researchPackets, callSessions } from './shared/schema';

async function migrateData() {
  console.log('Starting data migration...');

  // Migrate users
  const oldUsers = await oldDb.select().from(users);
  console.log(`Migrating ${oldUsers.length} users...`);
  for (const user of oldUsers) {
    await newDb.insert(users).values(user);
  }

  // Migrate leads
  const oldLeads = await oldDb.select().from(leads);
  console.log(`Migrating ${oldLeads.length} leads...`);
  for (const lead of oldLeads) {
    await newDb.insert(leads).values(lead);
  }

  // ... repeat for other tables

  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

### 2.3 Application Deployment

#### Build Configuration

**Update package.json:**
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "start": "node dist/index.cjs",
    "azure:deploy": "az webapp up --name app-leadintel-prod --resource-group rg-leadintel-prod"
  },
  "engines": {
    "node": "20.x"
  }
}
```

#### Deploy to Azure App Service

**Method 1: GitHub Actions (Recommended)**

```yaml
# .github/workflows/azure-deploy.yml
name: Deploy to Azure App Service

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'app-leadintel-prod'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .

      - name: Run post-deployment health check
        run: |
          sleep 30
          curl -f https://app-leadintel-prod.azurewebsites.net/health || exit 1
```

**Method 2: Azure CLI**

```bash
# Build locally
npm run build

# Deploy
az webapp up \
  --name app-leadintel-prod \
  --resource-group rg-leadintel-prod \
  --runtime "NODE:20-lts"
```

**Method 3: ZIP Deploy**

```bash
# Create deployment package
zip -r deploy.zip . -x "*.git*" "node_modules/*" ".env"

# Deploy
az webapp deployment source config-zip \
  --resource-group rg-leadintel-prod \
  --name app-leadintel-prod \
  --src deploy.zip
```

---

## Phase 3: Integration Configuration

### 3.1 Salesforce Integration Setup

#### OAuth App Configuration

1. **Create Connected App in Salesforce:**
   - Go to Setup → Apps → App Manager → New Connected App
   - Basic Information:
     - Name: Lead Intel v2.0
     - Contact Email: [admin_email]
   - API (Enable OAuth Settings):
     - Callback URL: `https://app-leadintel-prod.azurewebsites.net/api/salesforce/auth/callback`
     - Selected OAuth Scopes:
       - Full access (full)
       - Manage user data via APIs (api)
       - Perform requests at any time (refresh_token, offline_access)
   - Save and note Client ID and Client Secret

2. **Configure Webhook (Outbound Message):**
   - Setup → Process Automation → Workflow Rules → New Rule
   - Object: Lead
   - Evaluation Criteria: Created, and every time it's edited
   - Rule Criteria: ISCHANGED(Status) OR ISNEW()
   - Workflow Action: New Outbound Message
   - Endpoint URL: `https://app-leadintel-prod.azurewebsites.net/api/webhooks/salesforce`
   - Include Session ID: Yes
   - Fields to Send: Id, FirstName, LastName, Company, Email, Phone, Website, Status

3. **Store credentials in Key Vault:**
```bash
az keyvault secret set \
  --vault-name kv-leadintel \
  --name SALESFORCE-CLIENT-ID \
  --value "[CLIENT_ID_FROM_SF]"

az keyvault secret set \
  --vault-name kv-leadintel \
  --name SALESFORCE-CLIENT-SECRET \
  --value "[CLIENT_SECRET_FROM_SF]"

az keyvault secret set \
  --vault-name kv-leadintel \
  --name SALESFORCE-REDIRECT-URI \
  --value "https://app-leadintel-prod.azurewebsites.net/api/salesforce/auth/callback"
```

#### Test Salesforce Integration

```bash
# Manual OAuth flow test
curl -X GET "https://app-leadintel-prod.azurewebsites.net/api/salesforce/auth"

# Webhook test
curl -X POST "https://app-leadintel-prod.azurewebsites.net/api/webhooks/salesforce" \
  -H "Content-Type: application/xml" \
  -d '<soapenv:Envelope>...</soapenv:Envelope>'
```

### 3.2 Zoom Phone Integration Setup

#### Webhook Configuration

1. **Create Zoom App:**
   - Go to Zoom App Marketplace → Develop → Build App
   - App Type: Server-to-Server OAuth
   - Basic Information:
     - App Name: Lead Intel Call Recorder
     - Short Description: Call recording sync for Lead Intel
   - Scopes:
     - recording:read:admin
     - recording:write:admin
     - phone:read:admin
   - Webhooks:
     - Event Subscription: Enabled
     - Event Types: Recording Completed
     - Event Notification Endpoint URL: `https://app-leadintel-prod.azurewebsites.net/api/webhooks/zoom/recording`
     - Add Verification Token

2. **Store credentials:**
```bash
az keyvault secret set --vault-name kv-leadintel --name ZOOM-ACCOUNT-ID --value "[ACCOUNT_ID]"
az keyvault secret set --vault-name kv-leadintel --name ZOOM-CLIENT-ID --value "[CLIENT_ID]"
az keyvault secret set --vault-name kv-leadintel --name ZOOM-CLIENT-SECRET --value "[CLIENT_SECRET]"
az keyvault secret set --vault-name kv-leadintel --name ZOOM-WEBHOOK-SECRET --value "[VERIFICATION_TOKEN]"
```

#### Test Zoom Integration

```bash
# Webhook verification test
curl -X POST "https://app-leadintel-prod.azurewebsites.net/api/webhooks/zoom/recording" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "endpoint.url_validation",
    "payload": {
      "plainToken": "test_token"
    }
  }'

# Expected response: { "plainToken": "test_token", "encryptedToken": "[encrypted]" }
```

### 3.3 Azure Speech-to-Text Setup

```bash
# Create Cognitive Services resource
az cognitiveservices account create \
  --name cs-leadintel-speech \
  --resource-group rg-leadintel-prod \
  --kind SpeechServices \
  --sku F0 \
  --location eastus

# Get API key
SPEECH_KEY=$(az cognitiveservices account keys list \
  --name cs-leadintel-speech \
  --resource-group rg-leadintel-prod \
  --query key1 -o tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name kv-leadintel \
  --name AZURE-SPEECH-API-KEY \
  --value "$SPEECH_KEY"

az keyvault secret set \
  --vault-name kv-leadintel \
  --name AZURE-SPEECH-REGION \
  --value "eastus"
```

**Test transcription:**
```typescript
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_API_KEY!,
  process.env.AZURE_SPEECH_REGION!
);

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const pushStream = sdk.AudioInputStream.createPushStream();
  pushStream.write(audioBuffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        resolve(result.text);
      },
      (error) => {
        recognizer.close();
        reject(error);
      }
    );
  });
}
```

---

## Phase 4: Testing & Validation

### 4.1 Smoke Tests (Post-Deployment)

**Checklist:**

- [ ] **Health Check:** `GET /health` returns 200 OK
- [ ] **Database Connection:** `GET /api/debug/db-status` succeeds
- [ ] **Authentication:** Login flow works
- [ ] **Lead Creation:** Can create a new lead
- [ ] **Research Generation:** Research job completes
- [ ] **Salesforce Sync:** Webhook receives and processes lead
- [ ] **Zoom Recording:** Webhook processes recording event
- [ ] **File Upload:** Blob storage accepts files
- [ ] **Transcription:** Azure Speech-to-Text returns transcript
- [ ] **Kanban Board:** Displays leads in correct stages
- [ ] **Handoff:** Can hand off qualified lead to AE

**Automated smoke test script:**
```bash
#!/bin/bash
# smoke-test.sh

BASE_URL="https://app-leadintel-prod.azurewebsites.net"

echo "Running smoke tests..."

# Health check
echo -n "Health check... "
curl -sf "$BASE_URL/health" > /dev/null && echo "✓" || echo "✗"

# Database
echo -n "Database connection... "
curl -sf "$BASE_URL/api/debug/db-status" > /dev/null && echo "✓" || echo "✗"

# Auth
echo -n "Login endpoint... "
curl -sf "$BASE_URL/api/auth/login" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' > /dev/null && echo "✓" || echo "✗"

# ... more tests

echo "Smoke tests complete!"
```

### 4.2 Integration Tests

**Salesforce Integration:**
1. Create lead in Salesforce
2. Verify webhook received in Lead Intel
3. Verify lead appears in kanban "New Lead" column
4. Verify research job queued

**Zoom Integration:**
1. Simulate Zoom recording.completed webhook
2. Verify recording downloaded
3. Verify transcription triggered
4. Verify transcript saved to database

**End-to-End Flow:**
1. Salesforce → Lead Intel (sync)
2. Research generation (all sources)
3. Call logging (manual or Zoom webhook)
4. Qualification (status update)
5. Handoff to AE (email + Salesforce task)

### 4.3 Performance Tests

**Load Test (Artillery or k6):**
```yaml
# artillery-test.yml
config:
  target: "https://app-leadintel-prod.azurewebsites.net"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 requests per second
scenarios:
  - name: "Lead creation"
    flow:
      - post:
          url: "/api/leads"
          json:
            companyName: "Test Company {{ $randomNumber() }}"
            contactName: "John Doe"
            email: "john@test{{ $randomNumber() }}.com"
```

Run:
```bash
artillery run artillery-test.yml
```

**Database Query Performance:**
```sql
-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 4.4 User Acceptance Testing (UAT)

**Test Users:**
- 2 SDRs
- 1 Manager
- 1 Account Executive
- 1 Admin

**Test Scenarios:**
1. **SDR Flow:**
   - View new leads in kanban
   - Read research brief
   - Log a call (manually)
   - Update lead status
   - Hand off qualified lead

2. **Manager Flow:**
   - View team dashboard
   - Filter kanban by SDR
   - Review call transcripts
   - Check conversion metrics

3. **AE Flow:**
   - Receive handoff email
   - Open handoff document
   - View Salesforce task
   - Accept lead

**Feedback Collection:**
- UX issues log
- Performance concerns
- Feature requests
- Bug reports

---

## Phase 5: Cutover & Go-Live

### 5.1 Pre-Cutover Checklist

- [ ] All smoke tests passing
- [ ] All integration tests passing
- [ ] UAT signoff received
- [ ] Database backup verified
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] On-call rotation established
- [ ] Communication plan sent to users

### 5.2 Cutover Steps

**T-1 hour: Final Preparations**
1. Announce maintenance window to users
2. Set Replit app to read-only mode
3. Final database sync (Replit → Azure)
4. Verify data integrity

**T-0: Cutover**
1. Update Salesforce webhook URL to Azure endpoint
2. Update Zoom webhook URL to Azure endpoint
3. Update DNS (if custom domain)
4. Enable Azure App Service
5. Run smoke tests
6. Verify first Salesforce sync works

**T+15 min: Validation**
1. Check Application Insights for errors
2. Verify database connections stable
3. Test critical workflows
4. Monitor response times

**T+1 hour: User Notification**
1. Send "Go-Live" email to users
2. Provide new URL: `https://leadintel.hawkridgesystems.com`
3. Share support contact

### 5.3 Rollback Plan

**If critical issues occur within 2 hours:**

1. **Revert DNS:**
   ```bash
   # Point domain back to Replit
   ```

2. **Revert Webhooks:**
   - Salesforce: Change endpoint back to Replit URL
   - Zoom: Change endpoint back to Replit URL

3. **Communicate:**
   - Email users about rollback
   - Provide ETA for next attempt

4. **Root Cause Analysis:**
   - Review Application Insights logs
   - Check database connection errors
   - Validate integration failures
   - Document findings

### 5.4 Post-Cutover Monitoring

**First 24 Hours:**
- Monitor every 1 hour
- Check error rate < 1%
- Verify response time p95 < 2s
- Confirm no data loss

**First Week:**
- Daily health checks
- Review user feedback
- Track performance metrics
- Address bugs immediately

---

## Data Migration Validation

### Data Integrity Checks

**Row Counts:**
```sql
-- Compare counts between old (Replit) and new (Azure) databases

-- Replit
SELECT 'leads' as table, COUNT(*) as count FROM leads
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'research_packets', COUNT(*) FROM research_packets
UNION ALL
SELECT 'call_sessions', COUNT(*) FROM call_sessions;

-- Azure (should match exactly)
[Run same query on Azure SQL]
```

**Data Sampling:**
```sql
-- Verify a sample of records migrated correctly

-- Replit
SELECT id, company_name, email, status FROM leads ORDER BY id LIMIT 10;

-- Azure (should match exactly)
[Run same query on Azure SQL]
```

**Referential Integrity:**
```sql
-- Check foreign keys are intact

-- Find orphaned research packets (bad)
SELECT rp.id
FROM research_packets rp
LEFT JOIN leads l ON rp.lead_id = l.id
WHERE l.id IS NULL;

-- Should return 0 rows
```

---

## Rollback Procedures

### Scenario 1: Database Issues

**Symptoms:** Connection errors, query timeouts, data corruption

**Rollback Steps:**
1. Restore database from last known good backup
2. Revert application to previous version
3. Verify data integrity
4. Resume service

**Prevention:**
- Always test migrations on staging first
- Keep 3 days of backups
- Use transactions for bulk operations

### Scenario 2: Integration Failures

**Symptoms:** Salesforce/Zoom webhooks failing, auth errors

**Rollback Steps:**
1. Revert webhook URLs to Replit
2. Check credential configuration
3. Re-test authentication flows
4. Gradually re-enable integrations

### Scenario 3: Performance Degradation

**Symptoms:** Slow response times, high CPU/memory usage

**Rollback Steps:**
1. Scale up App Service plan (quick fix)
2. Identify slow queries (Application Insights)
3. Add database indexes if needed
4. Optimize API endpoints

---

## Timeline & Milestones

```
January 9 (Thu)
├─ Morning: Azure infrastructure setup
├─ Afternoon: Database schema migration
└─ Evening: Code changes for Azure compatibility

January 10 (Fri)
├─ Morning: Application deployment to Azure
├─ Afternoon: Salesforce integration configuration
└─ Evening: Zoom integration configuration

January 11 (Sat)
├─ Morning: Data migration (Replit → Azure)
├─ Afternoon: Integration testing
└─ Evening: Performance testing

January 12 (Sun)
├─ Morning: UAT with test users
├─ Afternoon: Bug fixes
└─ Evening: Final smoke tests

January 13 (Mon) 🎯 MVP DEMO
├─ Morning: Demo preparation
├─ Afternoon: MVP demo to stakeholders
└─ Evening: Feedback collection

January 14-17 (Tue-Fri)
├─ Bug fixes and refinements
├─ Additional testing
└─ Performance optimization

January 18 (Sat) 🚀 HARD DEADLINE
├─ Morning: Final checks
├─ Afternoon: Cutover to production
└─ Evening: Go-live monitoring
```

---

## Success Criteria

**Technical:**
- [ ] 99.9% uptime (no more than 1 minute downtime/day)
- [ ] Response time p95 < 2 seconds
- [ ] Error rate < 1%
- [ ] All integrations working (Salesforce, Zoom, Azure)
- [ ] Zero data loss during migration

**Business:**
- [ ] All 20 SDRs onboarded
- [ ] All managers can view team metrics
- [ ] All AEs receive handoff notifications
- [ ] Research briefs generated within 5 minutes
- [ ] Call recordings transcribed within 2 minutes

**User Satisfaction:**
- [ ] UAT signoff from all user types
- [ ] No critical bugs reported in first week
- [ ] Positive feedback on UX/UI (Apple-style simplicity)
- [ ] SDRs report time savings on research

---

## Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration fails | High | Medium | Test on staging, have rollback plan |
| Salesforce auth issues | High | Low | Test OAuth flow thoroughly |
| Performance degradation | Medium | Medium | Load testing, auto-scaling |
| Zoom webhook delays | Low | Medium | Implement retry logic |
| User resistance to new UI | Medium | Low | UAT, training materials |
| Timeline slippage | High | Medium | Daily standups, ruthless prioritization |

---

## Post-Migration Cleanup

**Week 1:**
- [ ] Remove Replit firewall rule from Azure SQL
- [ ] Archive Replit database backup
- [ ] Update documentation with Azure URLs
- [ ] Remove temporary test users

**Week 2:**
- [ ] Decommission Replit app (keep backup)
- [ ] Review and optimize Azure costs
- [ ] Set up cost alerts
- [ ] Document lessons learned

**Week 4:**
- [ ] Review performance metrics
- [ ] Collect user feedback
- [ ] Plan v2.1 improvements
- [ ] Celebrate success! 🎉

---

**Document Version:** 1.0
**Last Updated:** January 9, 2026
**Owner:** Claude Code + DevOps Team
**Next Review:** Post-cutover (January 19, 2026)
