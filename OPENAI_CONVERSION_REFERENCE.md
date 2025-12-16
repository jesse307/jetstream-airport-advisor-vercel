# OpenAI Conversion Reference

Quick reference for converting Supabase Edge Functions from Lovable AI (Gemini) to OpenAI.

## Quick Find & Replace

For each file in `supabase/functions/*/index.ts`:

### 1. Environment Variable
```typescript
// FIND:
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// REPLACE WITH:
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
```

### 2. API Endpoint
```typescript
// FIND:
await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {

// REPLACE WITH:
await fetch('https://api.openai.com/v1/chat/completions', {
```

### 3. Authorization Header
```typescript
// FIND:
'Authorization': `Bearer ${LOVABLE_API_KEY}`,

// REPLACE WITH:
'Authorization': `Bearer ${OPENAI_API_KEY}`,
```

### 4. Model Name
```typescript
// FIND:
model: 'google/gemini-2.5-flash',

// REPLACE WITH:
model: 'gpt-3.5-turbo',  // or 'gpt-4' or 'gpt-4-turbo-preview'
```

### 5. Error Handling (Credits/Auth)
```typescript
// FIND:
if (response.status === 402) {
  return new Response(
    JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),

// REPLACE WITH:
if (response.status === 401) {
  return new Response(
    JSON.stringify({ error: 'OpenAI API key invalid or missing.' }),
```

---

## Function Calling Changes

### Old Format (Lovable AI / Gemini)
```typescript
tools: [
  {
    type: "function",
    function: {
      name: "my_function",
      description: "...",
      parameters: { /* schema */ }
    }
  }
],
tool_choice: { type: "function", function: { name: "my_function" } }
```

### New Format (OpenAI)
```typescript
functions: [
  {
    name: "my_function",
    description: "...",
    parameters: { /* schema */ }
  }
],
function_call: { name: "my_function" }
```

### Extracting Function Call Result

**Old (Lovable/Gemini):**
```typescript
const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
const result = JSON.parse(toolCall.function.arguments);
```

**New (OpenAI):**
```typescript
const functionCall = data.choices?.[0]?.message?.function_call;
const result = JSON.parse(functionCall.arguments);
```

---

## Streaming Responses

For streaming endpoints (like `lead-chat`), the format is identical:

```typescript
stream: true
```

Both Lovable AI and OpenAI use Server-Sent Events (SSE) format:
```
data: {"choices":[{"delta":{"content":"..."}}]}
```

**No changes needed for streaming parsing!**

---

## Special Cases

### lead-chat Function: Gemini Grounding

**Problem:** Gemini has built-in web search via `grounding: { googleSearch: {} }`

**Solution Options:**

#### Option 1: Remove Web Search (Simplest)
```typescript
// Remove this from the request:
grounding: {
  googleSearch: {}
}

// And remove the web_search tool definition
```

#### Option 2: Implement Custom Web Search
Add a custom web search API (e.g., SerpAPI, Brave Search):

```typescript
// In tool handler:
if (toolCall.function?.name === "web_search") {
  const args = JSON.parse(toolCall.function.arguments);

  // Call search API
  const searchResponse = await fetch(`https://api.serpapi.com/search?q=${args.query}&api_key=${SERPAPI_KEY}`);
  const searchResults = await searchResponse.json();

  // Return results to model
  // ... handle results
}
```

---

## File-by-File Conversion Checklist

- [ ] `generate-flight-analysis/index.ts` - Simple chat completion
- [ ] `suggest-aircraft/index.ts` - Function calling
- [ ] `lead-chat/index.ts` - Streaming + tools + grounding (COMPLEX)
- [ ] `parse-lead-data/index.ts` - Function calling
- [ ] `process-call-notes/index.ts` - Chat completion
- [ ] `receive-open-leg-email/index.ts` - Chat completion
- [ ] `parse-call-notes/index.ts` - Chat completion
- [ ] `extract-airports/index.ts` - Function calling
- [ ] `generate-email/index.ts` - Chat completion
- [ ] `receive-quote-email/index.ts` - Chat completion

---

## Testing Each Function

After converting each function, test it:

```bash
# Deploy the updated function
supabase functions deploy function-name

# Test it via the Supabase dashboard or your app
# Check logs
supabase functions logs function-name
```

---

## Cost Optimization Tips

### 1. Add max_tokens
Limit response length to control costs:
```typescript
body: JSON.stringify({
  model: 'gpt-3.5-turbo',
  messages: [...],
  max_tokens: 500,  // Limit response length
})
```

### 2. Use Cheaper Models for Simple Tasks
- **Simple text generation:** `gpt-3.5-turbo`
- **Complex reasoning:** `gpt-4-turbo-preview`
- **Function calling:** Either works, `gpt-3.5-turbo` is cheaper

### 3. Implement Caching
Cache common AI responses:
```typescript
// Before calling OpenAI, check cache
const cacheKey = `analysis:${departure}:${arrival}:${distance}:${passengers}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

// After OpenAI response
await redis.set(cacheKey, response, 'EX', 3600); // Cache for 1 hour
```

### 4. Reduce Temperature for Deterministic Tasks
```typescript
temperature: 0.3  // Lower = more consistent, less creative
```

---

## Model Comparison

| Task | Recommended Model | Why |
|------|------------------|-----|
| Flight analysis | gpt-3.5-turbo | Simple text generation |
| Aircraft suggestions | gpt-3.5-turbo | Structured output, cost-effective |
| Lead chat | gpt-4-turbo | Complex conversation, better context |
| Email parsing | gpt-3.5-turbo | Straightforward extraction |
| Call notes | gpt-3.5-turbo | Simple summarization |

---

## Deployment Strategy

### Safe Migration:
1. **Create new functions with `-openai` suffix** (already shown in examples)
2. **Test new functions thoroughly**
3. **Update frontend to call new functions**
4. **Monitor for 24-48 hours**
5. **Delete old Lovable AI functions**

### Quick Migration:
1. **Update functions in place**
2. **Deploy all at once:** `supabase functions deploy --all`
3. **Test immediately**

---

## Example Conversion: generate-flight-analysis

See `supabase/functions/generate-flight-analysis-openai/index.ts` for full example.

**Changes made:**
- ✅ `LOVABLE_API_KEY` → `OPENAI_API_KEY`
- ✅ `ai.gateway.lovable.dev` → `api.openai.com`
- ✅ `google/gemini-2.5-flash` → `gpt-3.5-turbo`
- ✅ 402 error → 401 error
- ✅ Added `max_tokens: 500`
- ✅ Response parsing (unchanged)

---

## Need Help?

- **OpenAI API Reference:** https://platform.openai.com/docs/api-reference
- **Function Calling Guide:** https://platform.openai.com/docs/guides/function-calling
- **Pricing:** https://openai.com/api/pricing/
