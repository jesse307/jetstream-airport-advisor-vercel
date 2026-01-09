# Deploy Autonomous Chatbot - Quick Guide

## The chatbot shows "..." and doesn't respond?

This means the Edge Function hasn't been deployed yet. Follow these steps:

## Option 1: Deploy via Supabase Dashboard (Easiest)

1. **Go to your Supabase project:**
   - Visit: https://supabase.com/dashboard/project/hwemookrxvflpinfpkrj/functions

2. **Click "Deploy new function"**

3. **Upload the function:**
   - Function name: `claude-autonomous-chat`
   - Copy the entire contents of `supabase/functions/claude-autonomous-chat/index.ts`
   - Paste into the code editor
   - Click "Deploy"

4. **Verify deployment:**
   - The function should appear in your functions list
   - Status should show as "Active"

## Option 2: Deploy via Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref hwemookrxvflpinfpkrj

# Deploy the function
supabase functions deploy claude-autonomous-chat

# Verify deployment
supabase functions list
```

## Option 3: Deploy Script (Windows)

Run the included deployment script:

```bash
./deploy-chatbot.sh
```

## Verify It Works

1. **Check browser console** for any errors
2. **Refresh your home page**
3. **Try a test message:**
   ```
   "Hello, can you help me?"
   ```
4. **Should see Claude respond** instead of just "..."

## Troubleshooting

### Error: "ANTHROPIC_API_KEY is not configured"
- Go to Supabase Dashboard → Settings → Secrets
- Add secret: `ANTHROPIC_API_KEY` with your Anthropic API key
- Redeploy the function

### Error: "Edge Function not deployed"
- Follow Option 1 or 2 above to deploy

### Error: "Rate limit exceeded"
- Your Anthropic API key may have hit rate limits
- Wait a few minutes and try again
- Or upgrade your Anthropic plan

### Error 500 (Server Error)
- Check Supabase function logs:
  - Dashboard → Edge Functions → claude-autonomous-chat → Logs
- Look for specific error messages
- Common issues:
  - Missing database tables (accounts, opportunities, trusted_operators)
  - RLS policies blocking service role access
  - Invalid API key

### Still showing "..."?
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests
5. Share error details for help

## Quick Test Checklist

- [ ] Edge Function deployed
- [ ] ANTHROPIC_API_KEY secret added
- [ ] Page refreshed
- [ ] Test message sent
- [ ] Response received (not just "...")
- [ ] No errors in console

## Example Test Messages

Once deployed, try these:

```
1. "Hello!" (simple test)

2. "Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet"
   (creates lead)

3. "Show me leads from last week"
   (searches data)

4. "How long is the flight from JFK to LAX?"
   (calculates metrics)
```

## Need More Help?

1. Check Supabase function logs
2. Check browser console for errors
3. Verify API key is correct
4. Try redeploying the function
5. Check CHATBOT_README.md for detailed documentation
