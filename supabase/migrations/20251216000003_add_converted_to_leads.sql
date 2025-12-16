-- Add converted_to_account_id column to leads table
ALTER TABLE public.leads
ADD COLUMN converted_to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;

-- Create index for converted leads
CREATE INDEX idx_leads_converted_to_account_id ON public.leads(converted_to_account_id);
