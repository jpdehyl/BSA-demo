# Lead Intel - Agent Context & Project Patterns

> **Purpose:** This file provides persistent project context for fresh agent instances during Ralph iterations.
> **Updated:** After each successful Ralph cycle

---

## Project Overview

**Lead Intel** is an AI-powered Sales Intelligence & Coaching Platform built with:
- **Frontend:** React 18 + Vite + Tailwind + shadcn/ui
- **Backend:** Express.js + TypeScript + Drizzle ORM
- **Database:** PostgreSQL 16
- **AI:** Google Gemini via Replit AI Integrations
- **Voice:** Twilio Voice SDK (browser-based)
- **Testing:** Playwright (UX audits)

**Repository:** `/home/user/hawkridgesales`

---

## Architecture Patterns

### Storage Layer Pattern
All database operations go through `server/storage.ts`:

```typescript
import { storage } from './storage.js';

// ✅ CORRECT
const leads = await storage.getLeads();
const lead = await storage.createLead(data);

// ❌ WRONG - Don't bypass storage layer
const leads = await db.select().from(leads);
```

### API Route Pattern
All routes require authentication middleware:

```typescript
import { requireAuth, requireRole } from './routes.js';

// Standard endpoint
app.get('/api/leads', requireAuth, async (req, res) => {
  const userId = req.session!.userId;
  const leads = await storage.getLeads();
  res.json(leads);
});

// Role-restricted endpoint
app.get('/api/manager/oversight',
  requireAuth,
  requireRole('manager', 'admin'),
  async (req, res) => {
    // Handler
  }
);
```

### React Query Pattern
Frontend uses TanStack React Query for server state:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Query
const { data: leads } = useQuery({
  queryKey: ['leads'],
  queryFn: () => fetch('/api/leads', { credentials: 'include' }).then(r => r.json()),
});

// Mutation
const createLead = useMutation({
  mutationFn: (data) => fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  },
});
```

### AI Integration Pattern
All AI modules follow this structure:

```typescript
// server/ai/myModule.ts
import { genAI } from './config.js';
import { storage } from '../storage.js';

export async function analyzeWithAI(input: InputType): Promise<OutputType> {
  // 1. Gather raw data (ground with real data)
  const rawData = await fetchRawData(input);

  // 2. Build prompt with grounding
  const prompt = buildPrompt(rawData);

  // 3. Call Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);

  // 4. Parse JSON response
  const data = JSON.parse(result.response.text());

  // 5. Store in database with confidence
  await storage.saveAnalysis({
    ...data,
    confidence: assessConfidence(data),
  });

  return data;
}

function assessConfidence(data: any): string {
  const dataPoints = Object.values(data).filter(Boolean).length;
  if (dataPoints >= 3) return 'high';
  if (dataPoints >= 2) return 'medium';
  return 'low';
}
```

**Key Principles:**
- Always ground AI with real data (no hallucination)
- Return structured JSON
- Include confidence metrics
- Save results to database
- Handle errors gracefully

---

## Database Conventions

### Naming
- **Tables:** Snake case plural (`call_sessions`, `research_packets`)
- **Columns:** Camel case (`firstName`, `createdAt`)
- **Foreign Keys:** `{table}Id` (`leadId`, `sdrId`)
- **JSON Columns:** Suffix with `Json` (`painPointsJson`)

### Timestamps
Always include `createdAt`, optionally `updatedAt`:

```typescript
export const myTable = pgTable('my_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});
```

### Adding Tables
1. Define in `shared/schema.ts`
2. Add Zod schemas with `createInsertSchema` and `createSelectSchema`
3. Define relations
4. Run `npm run db:push`
5. Add storage methods in `server/storage.ts`

---

## Frontend Conventions

### Component Structure
```typescript
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export function MyComponent() {
  // 1. Hooks (queries, mutations, state)
  const { data, isLoading } = useQuery({ ... });
  const mutation = useMutation({ ... });
  const [localState, setLocalState] = useState();

  // 2. Event handlers
  const handleClick = () => {
    mutation.mutate({ ... });
  };

  // 3. Render logic
  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Title</h1>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

### Styling
- Use Tailwind utility classes
- Use `cn()` helper for conditional classes
- Use shadcn/ui components from `@/components/ui/`
- CSS variables for theming (defined in `client/src/index.css`)

### Forms
- React Hook Form with Zod validation
- Use `zodResolver` for schema validation
- shadcn/ui form components

---

## File Locations

### Backend
- **Routes:** `server/routes.ts`, `server/leads-routes.ts`, `server/coach-routes.ts`
- **AI Modules:** `server/ai/*.ts`
- **Storage:** `server/storage.ts`
- **Database:** `server/db.ts`
- **Schema:** `shared/schema.ts`

### Frontend
- **Pages:** `client/src/pages/*.tsx`
- **Components:** `client/src/components/*.tsx`
- **UI Library:** `client/src/components/ui/*.tsx` (shadcn/ui)
- **Hooks:** `client/src/hooks/*.ts`
- **Auth:** `client/src/lib/auth.tsx`

### Configuration
- **TypeScript:** `tsconfig.json`
- **Vite:** `vite.config.ts`
- **Tailwind:** `tailwind.config.ts`
- **Drizzle:** `drizzle.config.ts`
- **Playwright:** `playwright.config.ts`

---

## Common Commands

```bash
# Development
npm run dev                # Start dev server
npm run check              # TypeScript type check
npm run build              # Build for production

# Database
npm run db:push            # Push schema changes

# Testing
npm run test:e2e           # Run E2E tests
npm run playwright:screenshot <url> [name]        # Screenshot
npm run playwright:accessibility <url>            # Accessibility audit
npm run playwright:flows                          # Test user flows
npm run ux:audit-all                              # All UX audits

# Git (current branch)
git status
git add -A
git commit -m "feat: description"
git push -u origin claude/add-claude-documentation-IUhta
```

---

## Quality Gates

Before committing, ensure:

1. **TypeScript Check**
   ```bash
   npm run check
   ```

2. **Build Success**
   ```bash
   npm run build
   ```

3. **Tests Pass** (if applicable)
   ```bash
   npm run test:e2e
   ```

4. **Database Migrations** (if schema changed)
   ```bash
   npm run db:push
   ```

**Rule:** Only commit if all quality gates pass.

---

## Known Gotchas

### 1. Session Configuration
- Always use `credentials: 'include'` in fetch requests
- Session managed via `express-session` with PostgreSQL store
- Auth middleware: `requireAuth` (all routes except /api/auth/*)

### 2. Database Relationships
- Drizzle relations defined in `shared/schema.ts`
- Use `.with()` for eager loading relations
- Foreign keys: One-to-one (users ↔ sdrs), One-to-many (leads ↔ research_packets)

### 3. AI Rate Limits
- Google News API: 100 requests/day
- Implement caching for frequently accessed data
- Confidence scoring required for all AI outputs

### 4. Playwright Tests
- Must run on development server (http://localhost:5000)
- Start server before running tests
- Screenshots saved to `screenshots/` directory

### 5. Frontend Routing
- Uses Wouter (not React Router)
- Protected routes checked via `useAuth` hook
- Role-based rendering for manager/admin features

---

## Recent Updates (Ralph Iterations)

### 2026-01-09: Initial Ralph Setup
- Created Ralph methodology documentation
- Defined multi-agent routing strategy
- Established quality gate requirements
- Set up progress logging system

**Next Iterations:**
- Will be logged here after each successful Ralph cycle
- Format: Date, Story ID, Changes, Learnings, Files Modified

---

## Tips for Agents

### When Creating API Endpoints
1. Use `requireAuth` middleware
2. Add to appropriate routes file (`routes.ts`, `leads-routes.ts`, etc.)
3. Use storage layer (don't bypass)
4. Return JSON responses
5. Handle errors with try/catch

### When Modifying Frontend
1. Use existing components from `@/components/ui/`
2. Follow React Query patterns
3. Test responsive design (mobile, tablet, desktop)
4. Use Playwright for validation

### When Adding AI Features
1. Ground with real data (no hallucination)
2. Return structured JSON
3. Include confidence metrics
4. Save to database
5. Handle timeouts (30 seconds max)

### When Updating Database
1. Define in `shared/schema.ts`
2. Add relations if needed
3. Run `npm run db:push`
4. Add storage methods
5. Update types

---

## Resources

- **CLAUDE.md:** Complete project documentation
- **Multi-Agent System:** `.claude/agents/README.md`
- **Playwright Utilities:** `scripts/playwright-ux/README.md`
- **Ralph Methodology:** `.claude/ralph/README.md`

---

**This file is updated after each Ralph iteration to capture learnings and project evolution.**
