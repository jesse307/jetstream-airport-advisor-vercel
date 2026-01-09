# ⚠️ IMPORTANT: Run This Migration First!

## Issue
The chatbot is getting this error:
```
Failed to create opportunity: null value in column "user_id" violates not-null constraint
```

## Root Cause
The `accounts` and `opportunities` tables require a `user_id`, but the chatbot creates records anonymously (no authenticated user).

## Solution
Run the migration to make `user_id` nullable in both tables.

---

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended) ✅

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste this SQL:

```sql
-- Make user_id nullable in accounts and opportunities tables
-- This allows the chatbot to create accounts and opportunities anonymously

-- Make accounts.user_id nullable
ALTER TABLE public.accounts
ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.accounts.user_id IS 'User who owns this account. Can be null for chatbot-created accounts.';

-- Make opportunities.user_id nullable
ALTER TABLE public.opportunities
ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.opportunities.user_id IS 'User who owns this opportunity. Can be null for chatbot-created opportunities.';
```

6. Click **Run** (or press Ctrl+Enter)
7. Verify success ✅

---

### Option 2: Supabase CLI

If you have the CLI installed:

```bash
cd C:\Users\jesse\OneDrive\Desktop\jetstream-airport-advisor
supabase db push
```

This will apply all pending migrations including:
- `20260109000001_make_opportunities_user_id_nullable.sql`

---

## After Running the Migration

1. **Deploy the edge function** (see QUICK_DEPLOY.txt)
2. **Test the chatbot** - it should now create accounts successfully!

---

## What This Changes

### Before:
- `accounts.user_id` - NOT NULL (required)
- `opportunities.user_id` - NOT NULL (required)
- ❌ Chatbot cannot create records (no user context)

### After:
- `accounts.user_id` - NULLABLE (optional)
- `opportunities.user_id` - NULLABLE (optional)
- ✅ Chatbot can create records anonymously

---

## Impact

- Existing records: Not affected (they already have user_id values)
- New chatbot records: Will have `user_id = null`
- Manual records: Can still have user_id values as before
- Later assignment: You can update `user_id` later if needed

---

**MUST DO THIS BEFORE DEPLOYING THE EDGE FUNCTION!**

Otherwise you'll continue to get the constraint violation error.
