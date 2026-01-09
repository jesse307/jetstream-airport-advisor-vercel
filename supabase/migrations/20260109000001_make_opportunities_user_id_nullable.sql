-- Make user_id nullable in accounts and opportunities tables
-- This allows the chatbot to create accounts and opportunities anonymously
-- (no authenticated user context in the edge function)

-- Make accounts.user_id nullable
ALTER TABLE public.accounts
ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.accounts.user_id IS 'User who owns this account. Can be null for chatbot-created accounts.';

-- Make opportunities.user_id nullable
ALTER TABLE public.opportunities
ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.opportunities.user_id IS 'User who owns this opportunity. Can be null for chatbot-created opportunities.';
