# Vercel Deployment Checklist

## ✅ GitHub Repository Status

**Repository:** https://github.com/jesse307/jetstream-airport-advisor-vercel
- ✅ Repository exists
- ✅ Files pushed (665 commits)
- ✅ Main branch has all code
- ✅ Includes API route: `api/chat/route.ts`
- ✅ Includes Vercel config: `vercel.json`

---

## 🚀 Vercel Deployment Steps

### Step 1: Import Project to Vercel

1. Go to **https://vercel.com**
2. Click **"Add New..."** → **"Project"**
3. Under "Import Git Repository", find:
   ```
   jesse307/jetstream-airport-advisor-vercel
   ```
4. Click **"Import"**

---

### Step 2: Configure Build Settings

Vercel should auto-detect these settings:

- **Framework Preset:** Vite
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

Click **"Deploy"** but it will likely fail without environment variables.

---

### Step 3: Add Environment Variables

After import (or before first deploy), add these in:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

#### Required Variables:

| Variable Name | Value | Notes |
|--------------|--------|-------|
| `VITE_SUPABASE_URL` | `https://hwemookrxvflpinfpkrj.supabase.co` | Already have this |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key | Already have this |
| `VITE_GOOGLE_MAPS_API_KEY` | Your Google Maps key | Already have this |
| `VITE_TINYMCE_API_KEY` | Your TinyMCE key | Already have this |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | **NEW - Required for API route** |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (sk-ant-...) | **NEW - Required for chatbot** |

#### Important Notes:
- Add variables for **ALL environments** (Production, Preview, Development)
- `VITE_*` variables are for frontend (Vite bundles them)
- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only

---

### Step 4: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Check **"Use existing Build Cache"** (optional)
4. Click **"Redeploy"**

---

### Step 5: Verify Deployment

Once deployed, check:

1. ✅ **Homepage loads** - Visit your Vercel URL
2. ✅ **API route works** - Check `/api/chat` endpoint
3. ✅ **Chatbot functional** - Test creating a lead
4. ✅ **Supabase connection** - Data should save to database

---

## 🐛 Troubleshooting

### Issue: "Repository not found in Vercel"

**Solution:** Ensure GitHub integration is connected
1. Vercel Dashboard → Settings → Git
2. Check if GitHub account is connected
3. May need to authorize Vercel app in GitHub

---

### Issue: "Build fails"

**Common Causes:**
1. Missing dependencies - Run `npm install` locally to verify
2. TypeScript errors - Check build locally: `npm run build`
3. Environment variables not set - Vercel needs them at build time

**Fix:**
```bash
cd C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration
npm install
npm run build
```

If local build succeeds, issue is with Vercel environment variables.

---

### Issue: "API route returns 404"

**Cause:** API route file not recognized by Vercel

**Check:**
1. File exists: `api/chat/route.ts`
2. Exports `POST` function:
   ```typescript
   export async function POST(req: Request) { ... }
   ```
3. Vercel config correct in `vercel.json`

**Note:** Vercel uses Next.js-style API routes. File should be at:
- `pages/api/chat.ts` (Pages Router), OR
- `app/api/chat/route.ts` (App Router)

Your current structure: `api/chat/route.ts` might need to be moved!

---

### Issue: "Chatbot doesn't work"

**Common Causes:**
1. `ANTHROPIC_API_KEY` not set
2. `SUPABASE_SERVICE_ROLE_KEY` not set
3. API route not accessible

**Verify:**
1. Check browser console for errors
2. Check Vercel Functions logs:
   - Vercel Dashboard → Your Project → Logs
3. Test API directly: `POST /api/chat` with curl

---

## ⚠️ IMPORTANT: API Route Location

Vercel expects API routes in specific locations depending on framework:

### Current Location (Might Not Work):
```
api/chat/route.ts
```

### Correct Location for Vite + Vercel:

You have two options:

#### Option 1: Use Vercel Serverless Functions (Recommended)
Move file to:
```
api/chat.ts
```

Update file to export default:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... your code
}
```

#### Option 2: Convert to Next.js (More Work)
If you want to use App Router format:
1. Convert project to Next.js
2. Move to: `app/api/chat/route.ts`
3. Update `package.json` and build config

---

## 📝 Recommendation

Since your project is Vite-based, **Option 1** is easier:

1. Rename/move: `api/chat/route.ts` → `api/chat.ts`
2. Convert to Vercel serverless function format
3. Redeploy

Or use Next.js framework preset during Vercel import.

---

## 🔗 Quick Links

- **GitHub Repo:** https://github.com/jesse307/jetstream-airport-advisor-vercel
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel API Routes Docs:** https://vercel.com/docs/functions/serverless-functions
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## ✅ Final Checklist

- [ ] Repository imported to Vercel
- [ ] Environment variables added (all 6)
- [ ] API route in correct location for Vercel
- [ ] First deployment triggered
- [ ] Deployment succeeded (green checkmark)
- [ ] Homepage loads at Vercel URL
- [ ] Chatbot tested and working
- [ ] Database operations confirmed

---

**Need Help?** Check Vercel deployment logs for specific errors.
