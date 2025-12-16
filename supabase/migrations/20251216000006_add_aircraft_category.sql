-- Add aircraft_category column to aircraft_locations table
ALTER TABLE public.aircraft_locations
ADD COLUMN IF NOT EXISTS aircraft_category TEXT;

-- Add index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_aircraft_locations_category ON public.aircraft_locations(aircraft_category);

-- Add comment to explain the column
COMMENT ON COLUMN public.aircraft_locations.aircraft_category IS 'Aircraft category (e.g., Light Jet, Midsize, Heavy Jet, Turboprop, etc.)';
