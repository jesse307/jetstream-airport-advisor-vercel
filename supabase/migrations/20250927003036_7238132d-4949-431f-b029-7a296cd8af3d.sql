-- Create leads table for charter broker lead management
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('one-way', 'round-trip')),
  departure_airport TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIME,
  return_date DATE,
  return_time TIME,
  passengers INTEGER NOT NULL DEFAULT 1 CHECK (passengers > 0),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'booked', 'cancelled')),
  notes TEXT,
  analysis_data JSONB, -- Store flight analysis results
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is for lead intake)
-- In a production environment, you'd want proper authentication
CREATE POLICY "Allow public lead creation" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public lead viewing" 
ON public.leads 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public lead updates" 
ON public.leads 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_email ON public.leads(email);