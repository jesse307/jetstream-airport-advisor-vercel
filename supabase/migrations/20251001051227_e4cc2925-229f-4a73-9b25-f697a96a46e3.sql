-- Add call_notes column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS call_notes text;