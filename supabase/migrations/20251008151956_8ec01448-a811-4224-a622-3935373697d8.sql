-- Create table for open legs/availability from operator emails
CREATE TABLE public.open_legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_name TEXT,
  aircraft_type TEXT,
  tail_number TEXT,
  departure_airport TEXT,
  arrival_airport TEXT,
  departure_date DATE,
  departure_time TIME,
  arrival_date DATE,
  arrival_time TIME,
  passengers INTEGER,
  price NUMERIC,
  notes TEXT,
  raw_html TEXT,
  parsed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.open_legs ENABLE ROW LEVEL SECURITY;

-- Create policies for viewing
CREATE POLICY "Authenticated users can view open legs"
ON public.open_legs
FOR SELECT
TO authenticated
USING (true);

-- Create policies for inserting (webhook will use service role)
CREATE POLICY "Service role can insert open legs"
ON public.open_legs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policies for updating
CREATE POLICY "Authenticated users can update open legs"
ON public.open_legs
FOR UPDATE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_open_legs_updated_at
BEFORE UPDATE ON public.open_legs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();