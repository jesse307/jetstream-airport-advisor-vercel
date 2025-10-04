-- Add source column to leads table to track lead origin
ALTER TABLE public.leads 
ADD COLUMN source text DEFAULT 'manual'::text;

-- Add index for better query performance
CREATE INDEX idx_leads_source ON public.leads(source);

-- Add comment to describe the column
COMMENT ON COLUMN public.leads.source IS 'Source of the lead: manual, chrome_extension_auto, make.com, etc.';