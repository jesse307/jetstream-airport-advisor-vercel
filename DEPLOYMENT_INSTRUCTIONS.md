# Deployment Instructions for Edge Function Update

## What's Being Deployed

Updated `claude-autonomous-chat` edge function with the following improvements:

### ✅ Changes Made:
1. **Account Creation** - Now creates accounts automatically (not just leads)
2. **Opportunity Creation** - Automatically creates opportunities with full trip details
3. **Time Fields** - Includes departure_time, return_date, and return_time
4. **Lead Conversion** - Marks leads as converted with account link

### 📁 File to Deploy:
- `supabase/functions/claude-autonomous-chat/index.ts`

---

## Deployment Method 1: Supabase Dashboard (EASIEST) ⭐

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click "Edge Functions" in the left sidebar
   - Find `claude-autonomous-chat`

3. **Deploy New Version**
   - Click on the function name
   - Click "Deploy new version" or "Redeploy"
   - The dashboard will automatically pull from your project

4. **Verify Deployment**
   - Check that the deployment status shows "Active"
   - Look for the latest timestamp

---

## Deployment Method 2: Supabase CLI

### Prerequisites:
Install Supabase CLI if not already installed:

**Windows (PowerShell as Admin):**
```powershell
scoop install supabase
```

Or download from: https://github.com/supabase/cli/releases

### Deploy Command:
```bash
cd C:\Users\jesse\OneDrive\Desktop\jetstream-airport-advisor
supabase functions deploy claude-autonomous-chat
```

Or use the batch file:
```bash
deploy-functions.bat
```

---

## Deployment Method 3: Manual File Upload

If the automatic deployment doesn't work:

1. Go to Supabase Dashboard → Edge Functions → `claude-autonomous-chat`
2. Click "Edit function"
3. Copy the entire contents of:
   `supabase/functions/claude-autonomous-chat/index.ts`
4. Paste into the editor
5. Click "Deploy"

---

## What Happens After Deployment

Once deployed, when a user creates a lead via the chatbot:

### Input Example:
```
"Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet"
```

### Output:
✅ **Lead Created:**
- first_name: Michael
- last_name: Morgan
- departure_airport: TEB
- arrival_airport: LAX
- departure_date: 2026-01-15
- departure_time: 12:00:00
- return_date: 2026-01-17
- return_time: 15:00:00
- passengers: 2
- trip_type: Round Trip

✅ **Account Created:**
- name: Michael Morgan
- email: michael.morgan@chatbot-lead.com
- lead_id: [linked to lead]

✅ **Opportunity Created:**
- name: TEB to LAX - Michael Morgan
- account_id: [linked to account]
- stage: qualification
- departure_date: 2026-01-15
- departure_time: 12:00:00
- return_date: 2026-01-17
- return_time: 15:00:00
- passengers: 2
- trip_type: round-trip
- expected_close_date: 2026-01-15

✅ **Lead Marked as Converted:**
- converted_to_account_id: [account.id]
- converted_at: [timestamp]

---

## Testing After Deployment

1. Open your application homepage
2. Use the chatbot to create a test lead:
   ```
   "Test User, 1/20 @ 9am - 1/22 @ 5pm, 2 pax, JFK to LAX, mid jet"
   ```

3. Verify in your database:
   - Check `leads` table - new lead should exist
   - Check `accounts` table - new account should be created
   - Check `opportunities` table - new opportunity should be created
   - Lead should have `converted_to_account_id` populated

---

## Troubleshooting

### Error: "Column not found"
- Some time fields may not exist in your database yet
- Run migration: `20251216000010_add_datetime_fields_to_opportunities.sql`
- Via Dashboard: SQL Editor → Paste migration SQL → Run

### Error: "Permission denied"
- Check that edge function has access to tables
- Verify RLS policies allow service role access

### Deployment Fails
- Check function logs in Supabase Dashboard
- Look for TypeScript errors
- Verify all dependencies are listed

---

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Going to Edge Functions in dashboard
2. Clicking on function history/versions
3. Selecting a previous working version
4. Clicking "Restore"

---

## Support

If you encounter issues:
1. Check Supabase Dashboard → Edge Functions → Logs
2. Look for error messages in browser console
3. Verify database schema matches expected structure

---

**Last Updated:** 2026-01-09
**Edge Function Version:** claude-autonomous-chat v2.0 (with account creation)
