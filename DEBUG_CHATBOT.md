# Debug Chatbot - Troubleshooting Stuck API Calls

## Problem
The chatbot API call gets stuck in "pending" state and never completes.

## Debugging Steps

### 1. Check Supabase Edge Function Logs

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions
2. Click on `claude-autonomous-chat`
3. Click "Logs" tab
4. Look for console.log output:
   - "=== Edge Function Called ===" - Function started
   - "Calling Anthropic API..." - About to call Claude
   - "Anthropic API response status: 200" - Claude responded
   - Any error messages

### 2. Test with Simple Version

We've created a simplified version without tools to isolate the issue:

**Deploy the simple version:**
```bash
cd /path/to/jetstream-airport-advisor
supabase functions deploy claude-autonomous-chat-simple
```

**Or via Dashboard:**
1. Go to Supabase Dashboard → Edge Functions → Deploy new function
2. Name: `claude-autonomous-chat-simple`
3. Paste content from `supabase/functions/claude-autonomous-chat-simple/index.ts`
4. Deploy

**Test it:**
Temporarily change the frontend to use the simple version:
- Edit `src/components/HomePageChatbot.tsx` line 56
- Change from: `claude-autonomous-chat`
- To: `claude-autonomous-chat-simple`
- Save and test

### 3. Common Issues

**Issue: "Anthropic API request timed out"**
- The Anthropic API is not responding within 55 seconds
- Check your ANTHROPIC_API_KEY is valid
- Check Anthropic API status: https://status.anthropic.com/

**Issue: No logs appear at all**
- The Edge Function isn't being called
- Check the function URL is correct
- Check CORS headers
- Check the frontend is sending the request

**Issue: "ANTHROPIC_API_KEY is not configured"**
- Add the secret in Supabase Dashboard → Settings → Edge Functions → Secrets
- Key: `ANTHROPIC_API_KEY`
- Value: Your Anthropic API key (starts with `sk-ant-`)

**Issue: Error 401 from Anthropic**
- Invalid API key
- API key doesn't have access to claude-3-5-sonnet-20241022 model
- Check your Anthropic account status

**Issue: Error 429 from Anthropic**
- Rate limit exceeded
- Wait a few minutes
- Or upgrade your Anthropic plan

### 4. Check Network in Browser

1. Open DevTools (F12)
2. Go to Network tab
3. Send a message
4. Find the request to `claude-autonomous-chat`
5. Check:
   - Status code
   - Response headers
   - Response body (if any)
   - Time elapsed

### 5. Manual API Test

Test the Anthropic API directly to see if it's working:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

Expected response:
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! ..."
    }
  ],
  ...
}
```

### 6. What to Report

If the issue persists, provide:
1. Edge Function logs (from Supabase dashboard)
2. Browser console errors
3. Network tab status code and response
4. Result of manual API test (step 5)
5. Your Anthropic account tier (free/pro/enterprise)

## Quick Fixes to Try

### Fix 1: Switch to simple version (no tools)
Use `claude-autonomous-chat-simple` instead - this removes all the tool calling complexity

### Fix 2: Increase timeout
The current timeout is 55 seconds. Lovable might have a shorter timeout.

### Fix 3: Use streaming
The current version uses `stream: false` for simplicity. Streaming might be more reliable.

### Fix 4: Reduce max_tokens
Try reducing from 2048 to 1024 or 512 to speed up response.

## Next Steps

Once we identify where it's stuck, we can fix it properly. The simple version will help us determine if:
- The issue is with the Anthropic API call itself
- The issue is with tool execution
- The issue is with response streaming
- The issue is with Lovable's environment
