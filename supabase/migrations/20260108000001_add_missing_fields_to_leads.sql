-- Add missing fields to leads table for better CRM integration

-- Add datetime columns for more precise time tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS departure_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS return_datetime TIMESTAMP WITH TIME ZONE;

-- Add user_id for authenticated lead tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add conversion tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS converted_to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

-- Add aircraft categories preference
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS aircraft_categories TEXT[];

-- Add source tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web-form';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_account_id ON public.leads(converted_to_account_id);
CREATE INDEX IF NOT EXISTS idx_leads_departure_datetime ON public.leads(departure_datetime);
CREATE INDEX IF NOT EXISTS idx_leads_departure_airport ON public.leads(departure_airport);
CREATE INDEX IF NOT EXISTS idx_leads_arrival_airport ON public.leads(arrival_airport);

-- Add helpful comments
COMMENT ON COLUMN public.leads.departure_datetime IS 'Full departure date and time in one field';
COMMENT ON COLUMN public.leads.return_datetime IS 'Full return date and time in one field for round trips';
COMMENT ON COLUMN public.leads.user_id IS 'References authenticated user if lead was created by logged-in user';
COMMENT ON COLUMN public.leads.converted_to_account_id IS 'References the account this lead was converted to';
COMMENT ON COLUMN public.leads.converted_at IS 'Timestamp when lead was converted to account';
COMMENT ON COLUMN public.leads.aircraft_categories IS 'Array of preferred aircraft categories like ["Light Jet", "Mid Jet"]';
COMMENT ON COLUMN public.leads.source IS 'Where the lead came from: web-form, chatbot, phone, email, etc.';

-- Note: RLS policies already exist for leads table, no need to create new ones
