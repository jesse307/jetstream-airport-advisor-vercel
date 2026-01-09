# Quick Start: Vercel AI SDK Chatbot

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration
npm install ai @ai-sdk/anthropic zod
```

### Step 2: Add Environment Variables

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://hwemookrxvflpinfpkrj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_TINYMCE_API_KEY=your-tinymce-key
```

### Step 3: Update Component

Find where `HomePageChatbot` is used and replace with:

```typescript
import { HomePageChatbotVercel } from '@/components/HomePageChatbotVercel';

// In your component:
<HomePageChatbotVercel />
```

### Step 4: Test Locally
```bash
npm run dev
```

Open http://localhost:5173 and test the chatbot!

### Step 5: Deploy to Vercel

1. Add environment variables in Vercel Dashboard:
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Push to GitHub:
```bash
git add .
git commit -m "Add Vercel AI SDK chatbot"
git push origin main
```

3. Vercel auto-deploys!

---

## ✅ Test Commands

Try these in the chatbot:

**Create Lead:**
```
Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet
```

**Search:**
```
Show me all leads from last week
```

**Calculate:**
```
What's the distance from TEB to LAX?
```

---

## 📁 Files Created

- `api/chat/route.ts` - Chatbot API route
- `src/components/HomePageChatbotVercel.tsx` - New component
- `VERCEL_AI_SDK_INTEGRATION.md` - Full guide
- `.env.example` - Environment template

---

**Need Help?** See [VERCEL_AI_SDK_INTEGRATION.md](./VERCEL_AI_SDK_INTEGRATION.md) for detailed guide.
