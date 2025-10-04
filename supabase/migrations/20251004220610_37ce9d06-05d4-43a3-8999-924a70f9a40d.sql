-- Create table for aircraft locations
CREATE TABLE public.aircraft_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tail_number TEXT NOT NULL UNIQUE,
  home_airport_icao TEXT,
  home_airport_iata TEXT,
  home_airport_name TEXT,
  country_code TEXT,
  operator_name TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_aircraft_locations_tail_number ON public.aircraft_locations(tail_number);
CREATE INDEX idx_aircraft_locations_icao ON public.aircraft_locations(home_airport_icao);

-- Enable Row Level Security
ALTER TABLE public.aircraft_locations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public aircraft location viewing" 
ON public.aircraft_locations 
FOR SELECT 
USING (true);

-- Create policy for insert (for initial data loading)
CREATE POLICY "Allow public aircraft location insertion" 
ON public.aircraft_locations 
FOR INSERT 
WITH CHECK (true);

-- Create policy for updates
CREATE POLICY "Allow public aircraft location updates" 
ON public.aircraft_locations 
FOR UPDATE 
USING (true);