# Vercel AI SDK Integration Guide

This guide explains the migration from Supabase Edge Functions to Vercel AI SDK for the chatbot.

## 🎯 What Changed

### Before (Supabase Edge Functions):
- Chatbot backend hosted on Supabase Edge Functions (Deno runtime)
- Manual streaming implementation with Server-Sent Events
- Custom tool execution logic
- Required deploying to Supabase separately

### After (Vercel AI SDK):
- Chatbot backend hosted on Vercel (Next.js API routes)
- Native streaming with Vercel AI SDK
- Built-in tool calling with type safety (Zod schemas)
- Automatic deployment with Vercel

---

## 📦 New Dependencies

```bash
npm install ai @ai-sdk/anthropic zod
```

**Packages:**
- `ai` - Vercel AI SDK core (streaming, React hooks)
- `@ai-sdk/anthropic` - Anthropic Claude provider
- `zod` - Schema validation for tools (already in project)

---

## 🔧 Architecture

### API Route: `/api/chat/route.ts`

This is the new backend for the chatbot, replacing the Supabase edge function.

**Location:** `C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration\api\chat\route.ts`

**Features:**
- Uses `streamText()` from Vercel AI SDK
- Claude Sonnet 4 model (`claude-sonnet-4-20250514`)
- 9 migrated tools with full functionality
- Direct Supabase database access (service role)
- Type-safe tool parameters with Zod schemas

**Example Tool Definition:**
```typescript
create_lead: tool({
  description: 'Parse natural language and create a new lead...',
  parameters: z.object({
    first_name: z.string().describe("Client's first name"),
    last_name: z.string().describe("Client's last name"),
    // ... more parameters
  }),
  execute: async (input) => {
    // Create lead + account + opportunity
    return result;
  },
})
```

---

## 🎨 Frontend: `HomePageChatbotVercel.tsx`

The new React component uses Vercel's `useChat` hook for seamless integration.

**Location:** `C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration\src\components\HomePageChatbotVercel.tsx`

**Features:**
- `useChat()` hook handles all streaming/state
- Automatic message management
- Built-in error handling
- localStorage persistence (same as before)
- Identical UI to original chatbot

**Key Differences:**
```typescript
// OLD: Manual state management
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
// Manual fetch with SSE parsing

// NEW: Vercel useChat hook
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  initialMessages: [initialMessage],
});
```

---

## 🔄 Migrated Tools

All 9 tools from the Supabase edge function have been migrated to Vercel AI SDK format:

### 1. **create_lead**
- Creates lead + account + opportunity (all in one)
- Parses natural language booking requests
- Returns formatted confirmation

### 2. **search_data**
- Query leads, opportunities, accounts
- Supports filters (date, status, airports, passengers)
- Returns formatted list (max 10 results)

### 3. **lookup_accounts**
- Find existing accounts by name, email, company
- Prevents duplicate account creation
- Returns matching accounts with IDs

### 4. **create_opportunity**
- Creates opportunity for existing account
- Requires account_id from lookup_accounts
- Includes trip details and dates

### 5. **update_record**
- Modify existing leads/opportunities/accounts
- Prevents updating protected fields (id, created_at, user_id)
- Returns confirmation

### 6. **calculate_metrics**
- Calculate distance, flight time, cost estimates
- Uses Haversine formula for distance
- Returns detailed metrics

### 7. **enrich_airports**
- Get detailed airport info (coordinates, elevation, location)
- Validates airport codes
- Returns formatted airport data

### 8. **search_aircraft**
- Find operators with matching aircraft
- Filters by aircraft categories and route
- Returns operator details

### 9. **send_quote_requests**
- Send quote requests to selected operators
- Creates records in quote_requests table
- Returns confirmation

---

## 🔐 Environment Variables

Add these to your Vercel project (in addition to existing variables):

### Required for Vercel AI SDK:
```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Already Configured:
```env
VITE_SUPABASE_URL=https://hwemookrxvflpinfpkrj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_GOOGLE_MAPS_API_KEY=...
VITE_TINYMCE_API_KEY=...
```

**Important:**
- `ANTHROPIC_API_KEY` is now used by Vercel (not Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` is needed for database operations in API route

---

## 🚀 Deployment Steps

### 1. Install Dependencies

Run in PowerShell or CMD:
```bash
cd C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration
npm install ai @ai-sdk/anthropic zod
```

### 2. Update Component Import

In your page/layout file, replace:
```typescript
// OLD
import { HomePageChatbot } from '@/components/HomePageChatbot';

// NEW
import { HomePageChatbotVercel } from '@/components/HomePageChatbotVercel';
```

Then use:
```tsx
<HomePageChatbotVercel />
```

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview, Development |

### 4. Deploy to Vercel

```bash
git add .
git commit -m "Add Vercel AI SDK chatbot integration"
git push origin main
```

Vercel will automatically deploy with the new chatbot!

---

## 🧪 Testing

### Local Testing

1. Create `.env.local` file:
```env
VITE_SUPABASE_URL=https://hwemookrxvflpinfpkrj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_TINYMCE_API_KEY=your-tinymce-key
```

2. Run dev server:
```bash
npm run dev
```

3. Test chatbot at `http://localhost:5173`

### Test Cases

**1. Create Lead:**
```
Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet
```
Should create lead + account + opportunity

**2. Search:**
```
Show me all leads from last week
```
Should query and display leads

**3. Calculate Metrics:**
```
What's the distance from TEB to LAX?
```
Should calculate distance and flight time

**4. Lookup Account:**
```
Find account for john@example.com
```
Should search accounts

---

## 📊 Benefits of Vercel AI SDK

### 1. **Better Performance**
- Native streaming (no manual SSE parsing)
- Edge runtime for low latency
- Automatic caching

### 2. **Type Safety**
- Zod schemas for tool parameters
- TypeScript support throughout
- Runtime validation

### 3. **Developer Experience**
- `useChat()` hook handles all state
- Built-in error handling
- Easy tool definition

### 4. **Deployment**
- Single deployment (no separate edge function deploy)
- Automatic with git push
- Preview deployments for PRs

### 5. **Monitoring**
- Vercel Analytics integration
- Request logs in dashboard
- Error tracking

---

## 🔄 Keeping Both Versions

You can keep both implementations during transition:

**Supabase Version:**
- `HomePageChatbot.tsx` (original)
- Uses Supabase edge function
- Fallback if Vercel has issues

**Vercel Version:**
- `HomePageChatbotVercel.tsx` (new)
- Uses Vercel AI SDK
- Recommended for production

Switch between them by changing the import:
```typescript
// Use Supabase version
import { HomePageChatbot } from '@/components/HomePageChatbot';

// Use Vercel version
import { HomePageChatbotVercel } from '@/components/HomePageChatbotVercel';
```

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Module not found: Can't resolve 'ai'`

**Fix:** Install dependencies:
```bash
npm install ai @ai-sdk/anthropic zod
```

---

### API Route Not Found

**Error:** `404: /api/chat not found`

**Fix:** Ensure `api/chat/route.ts` exists and is properly exported:
```typescript
export async function POST(req: Request) {
  // ... implementation
}
```

---

### Tool Execution Fails

**Error:** `Failed to create lead: user_id violates not-null constraint`

**Fix:** Run the database migration first:
```sql
ALTER TABLE public.accounts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN user_id DROP NOT NULL;
```

See [RUN_MIGRATION_FIRST.md](./RUN_MIGRATION_FIRST.md)

---

### Environment Variables Not Working

**Error:** `ANTHROPIC_API_KEY is not configured`

**Fix:**
1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure variables are set for all environments (Production, Preview, Development)
3. Redeploy after adding variables

---

## 📚 Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Anthropic Provider Docs](https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic)
- [useChat Hook Reference](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat)
- [Tool Calling Guide](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)

---

## 🎉 Next Steps

1. ✅ Install dependencies (`npm install ai @ai-sdk/anthropic zod`)
2. ✅ Configure environment variables in Vercel
3. ✅ Update component import to use `HomePageChatbotVercel`
4. ✅ Test locally with `.env.local`
5. ✅ Deploy to Vercel
6. ✅ Test in production
7. ✅ Monitor usage and errors
8. ✅ Remove old Supabase edge function (optional)

---

**Migration Created:** 2026-01-09
**Vercel AI SDK Version:** Latest
**Claude Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
