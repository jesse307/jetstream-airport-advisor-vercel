-- Create aircraft_operators table to cache operator information
CREATE TABLE IF NOT EXISTS public.aircraft_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tail_number TEXT UNIQUE NOT NULL,
  operator_name TEXT,
  callsign_prefix TEXT,
  aircraft_type TEXT,
  last_seen_airport TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aircraft_operators ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public operator viewing"
  ON public.aircraft_operators
  FOR SELECT
  USING (true);

-- Allow public insert/update for cache population
CREATE POLICY "Allow public operator insertion"
  ON public.aircraft_operators
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public operator updates"
  ON public.aircraft_operators
  FOR UPDATE
  USING (true);

-- Create index for fast lookups
CREATE INDEX idx_aircraft_operators_tail ON public.aircraft_operators(tail_number);
CREATE INDEX idx_aircraft_operators_callsign ON public.aircraft_operators(callsign_prefix);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_aircraft_operator_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_aircraft_operators_timestamp
  BEFORE UPDATE ON public.aircraft_operators
  FOR EACH ROW
  EXECUTE FUNCTION update_aircraft_operator_timestamp();