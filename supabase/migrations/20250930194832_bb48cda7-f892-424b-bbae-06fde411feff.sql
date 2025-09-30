-- Create webhook_logs table to track outgoing webhook calls
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow public to insert webhook logs
CREATE POLICY "Allow public webhook log creation" 
ON public.webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow public to view webhook logs
CREATE POLICY "Allow public webhook log viewing" 
ON public.webhook_logs 
FOR SELECT 
USING (true);

-- Create index for faster lookups by lead_id
CREATE INDEX idx_webhook_logs_lead_id ON public.webhook_logs(lead_id);

-- Create index for faster lookups by created_at
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);