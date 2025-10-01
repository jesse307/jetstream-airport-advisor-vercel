-- Create pending_lead_imports table
CREATE TABLE public.pending_lead_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_data TEXT NOT NULL,
  source TEXT DEFAULT 'make.com',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.pending_lead_imports ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public viewing of pending imports" 
ON public.pending_lead_imports 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insertion of pending imports" 
ON public.pending_lead_imports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update of pending imports" 
ON public.pending_lead_imports 
FOR UPDATE 
USING (true);

-- Create index for performance
CREATE INDEX idx_pending_imports_processed ON public.pending_lead_imports(processed, created_at DESC);