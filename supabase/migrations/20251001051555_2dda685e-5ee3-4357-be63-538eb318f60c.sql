-- Add email and phone validation columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_valid boolean,
ADD COLUMN IF NOT EXISTS phone_valid boolean;