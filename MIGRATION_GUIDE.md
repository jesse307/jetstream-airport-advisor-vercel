# Migration Guide: Lovable → Vercel + OpenAI

This guide walks you through migrating your Jetstream Airport Advisor app from Lovable to Vercel with OpenAI integration.

## Overview

**Current Setup:**
- Hosted on Lovable
- Uses Lovable AI Gateway (Google Gemini 2.5 Flash model)
- 10 Supabase Edge Functions using AI

**Target Setup:**
- Hosted on Vercel
- Uses OpenAI API (GPT-4 or GPT-3.5-turbo)
- Custom domain

## Files Using Lovable AI

The following Supabase Edge Functions call the Lovable AI Gateway:

1. `supabase/functions/generate-flight-analysis/index.ts` - Generates flight analysis
2. `supabase/functions/lead-chat/index.ts` - Lead chatbot with tools
3. `supabase/functions/suggest-aircraft/index.ts` - Aircraft suggestions
4. `supabase/functions/parse-lead-data/index.ts` - Parses lead data
5. `supabase/functions/process-call-notes/index.ts` - Processes call notes
6. `supabase/functions/receive-open-leg-email/index.ts` - Parses open leg emails
7. `supabase/functions/parse-call-notes/index.ts` - Parses call notes text
8. `supabase/functions/extract-airports/index.ts` - Extracts airport codes
9. `supabase/functions/generate-email/index.ts` - Generates emails
10. `supabase/functions/receive-quote-email/index.ts` - Parses quote emails

All functions use:
- **API Endpoint:** `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Model:** `google/gemini-2.5-flash`
- **Environment Variable:** `LOVABLE_API_KEY`

---

## Step 1: Set Up OpenAI Account

### 1.1 Create OpenAI Account
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Save your API key (starts with `sk-...`)

### 1.2 Choose Your Model
- **GPT-4 Turbo** (`gpt-4-turbo-preview`): Best quality, higher cost
- **GPT-4** (`gpt-4`): Great quality, moderate cost
- **GPT-3.5 Turbo** (`gpt-3.5-turbo`): Good quality, lower cost
- **Recommended:** Start with `gpt-3.5-turbo` for cost-effectiveness

### 1.3 Add Billing
- Add a payment method in OpenAI dashboard
- Set up usage limits to control costs
- Typical costs: ~$0.002 per 1K tokens for GPT-3.5-turbo

---

## Step 2: Update Supabase Functions for OpenAI

You'll need to update all 10 functions to use OpenAI instead of Lovable AI.

### 2.1 Key Changes

**Before (Lovable AI):**
```typescript
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [...]
  }),
});
```

**After (OpenAI):**
```typescript
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',  // or 'gpt-4' or 'gpt-4-turbo-preview'
    messages: [...]
  }),
});
```

### 2.2 Important Differences

| Feature | Lovable AI (Gemini) | OpenAI |
|---------|-------------------|---------|
| Endpoint | `ai.gateway.lovable.dev/v1/chat/completions` | `api.openai.com/v1/chat/completions` |
| Model | `google/gemini-2.5-flash` | `gpt-3.5-turbo` / `gpt-4` |
| Env Var | `LOVABLE_API_KEY` | `OPENAI_API_KEY` |
| Tool Calling | Supported | Supported (same format) |
| Streaming | Supported | Supported (same format) |
| Grounding | `grounding: { googleSearch: {} }` | Not available (use function tools) |

### 2.3 Special Case: lead-chat Function

The `lead-chat` function uses Gemini's grounding feature for web search:
```typescript
grounding: {
  googleSearch: {}
}
```

OpenAI doesn't have built-in web search, so you have two options:
1. **Remove web search capability** (simplest)
2. **Implement custom web search tool** using SerpAPI, Brave Search API, or similar

---

## Step 3: Update Environment Variables in Supabase

### 3.1 Add OpenAI API Key
```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3.2 Verify Secrets
```bash
supabase secrets list
```

You should see:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Other existing secrets

---

## Step 4: Set Up Vercel Deployment

### 4.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 4.2 Login to Vercel
```bash
vercel login
```

### 4.3 Link Project
From your project root:
```bash
vercel link
```

Follow prompts to create a new project or link existing one.

### 4.4 Configure Build Settings

Vercel should auto-detect Vite. If not, configure:

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 4.5 Add Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables

Add the following (copy from your current `.env` or Supabase dashboard):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important:**
- Vercel will automatically inject these during build
- No need to commit `.env` files
- Use `VITE_` prefix for variables accessed in frontend code

---

## Step 5: Deploy to Vercel

### 5.1 Test Deployment
```bash
vercel
```

This creates a preview deployment. Vercel will give you a URL like:
`https://your-app-xyz123.vercel.app`

### 5.2 Test the Preview
1. Open the preview URL
2. Test lead conversion
3. Test AI features (flight analysis, aircraft suggestions, lead chat)
4. Check all functionality works

### 5.3 Deploy to Production
```bash
vercel --prod
```

This deploys to:
`https://your-project-name.vercel.app`

---

## Step 6: Set Up Custom Domain

### 6.1 Add Domain in Vercel
1. Go to Vercel dashboard → Your Project → Settings → Domains
2. Click **Add Domain**
3. Enter your domain (e.g., `jetstream.yourdomain.com`)

### 6.2 Configure DNS

Vercel will show you DNS records to add. Typically:

**For subdomain (recommended):**
```
Type: CNAME
Name: jetstream (or your subdomain)
Value: cname.vercel-dns.com
```

**For apex domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 6.3 Wait for DNS Propagation
- Usually takes 5-60 minutes
- Vercel will auto-provision SSL certificate
- Check status in Vercel dashboard

---

## Step 7: Testing Checklist

After deployment, test all features:

- [ ] Lead intake form
- [ ] Lead conversion to account
- [ ] Flight analysis generation
- [ ] Aircraft suggestions
- [ ] Lead chatbot
- [ ] Call notes processing
- [ ] Email parsing (open legs, quotes)
- [ ] Trusted operators management
- [ ] Availability tracking
- [ ] Chrome extension (update URLs if needed)

---

## Step 8: Update Chrome Extension (if applicable)

If your Chrome extension points to your app:

1. Update `chrome-extension/manifest.json`:
```json
{
  "permissions": [
    "https://your-custom-domain.com/*"
  ]
}
```

2. Update any hardcoded URLs in:
   - `chrome-extension/background.js`
   - `chrome-extension/popup.js`

3. Rebuild and republish extension

---

## Cost Comparison

### Lovable AI (Gemini)
- Pricing through Lovable credits
- Typically bundled with hosting

### OpenAI
- **GPT-3.5 Turbo:** ~$0.002 per 1K tokens (~$0.001 input, ~$0.002 output)
- **GPT-4 Turbo:** ~$0.01 per 1K tokens (~$0.01 input, ~$0.03 output)
- **Estimated monthly cost:** $10-50 depending on usage

### Vercel
- **Hobby Plan:** Free (sufficient for most use cases)
- **Pro Plan:** $20/month (includes more bandwidth, faster builds)

---

## Rollback Plan

If issues arise:

1. **Keep Lovable deployment running** until Vercel is stable
2. **DNS switch:** Simply change DNS back to Lovable if needed
3. **Database:** Still uses Supabase (no migration needed)
4. **API keys:** Keep both Lovable and OpenAI keys active during transition

---

## Common Issues

### Issue: "OPENAI_API_KEY not configured"
**Solution:** Run `supabase secrets set OPENAI_API_KEY=sk-...`

### Issue: "Rate limit exceeded"
**Solution:** Increase OpenAI usage limits or implement caching

### Issue: Build fails on Vercel
**Solution:** Check build logs, ensure all dependencies in `package.json`

### Issue: Environment variables not working
**Solution:** Ensure they're prefixed with `VITE_` for frontend variables

### Issue: 404 errors on custom domain
**Solution:** Wait for DNS propagation (up to 48 hours max)

---

## Next Steps After Migration

1. **Monitor costs:** Check OpenAI dashboard weekly
2. **Set up alerts:** Configure Vercel deployment notifications
3. **Enable analytics:** Use Vercel Analytics for insights
4. **Implement caching:** Add Redis/caching for AI responses to reduce costs
5. **A/B test models:** Compare GPT-3.5 vs GPT-4 quality vs cost

---

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **OpenAI Docs:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

## Estimated Timeline

- **Step 1-2 (OpenAI setup + code updates):** 2-3 hours
- **Step 3 (Supabase secrets):** 10 minutes
- **Step 4-5 (Vercel deployment):** 30 minutes
- **Step 6 (Custom domain):** 30 minutes + DNS propagation
- **Step 7 (Testing):** 1-2 hours
- **Total:** 4-6 hours (excluding DNS propagation wait time)

Good luck with your migration! 🚀
