-- Add route column for normalized searchable route format
ALTER TABLE public.open_legs 
ADD COLUMN IF NOT EXISTS route text;

-- Create function to normalize route format
CREATE OR REPLACE FUNCTION public.normalize_route(dep text, arr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Normalize to uppercase and trim whitespace
  RETURN UPPER(TRIM(dep)) || ' - ' || UPPER(TRIM(arr));
END;
$$;

-- Update existing rows to populate route
UPDATE public.open_legs
SET route = normalize_route(departure_airport, arrival_airport);

-- Delete duplicate rows, keeping only the most recent one
DELETE FROM public.open_legs a
USING public.open_legs b
WHERE a.id < b.id
  AND COALESCE(a.tail_number, '') = COALESCE(b.tail_number, '')
  AND COALESCE(a.aircraft_type, '') = COALESCE(b.aircraft_type, '')
  AND a.departure_date = b.departure_date
  AND COALESCE(a.departure_time::text, '') = COALESCE(b.departure_time::text, '')
  AND a.route = b.route;

-- Create function to auto-populate route on insert/update
CREATE OR REPLACE FUNCTION public.set_open_leg_route()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.route := normalize_route(NEW.departure_airport, NEW.arrival_airport);
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set route
DROP TRIGGER IF EXISTS set_open_leg_route_trigger ON public.open_legs;
CREATE TRIGGER set_open_leg_route_trigger
BEFORE INSERT OR UPDATE ON public.open_legs
FOR EACH ROW
EXECUTE FUNCTION public.set_open_leg_route();

-- Create unique index to prevent duplicates based on key fields
CREATE UNIQUE INDEX IF NOT EXISTS idx_open_legs_unique 
ON public.open_legs (
  COALESCE(tail_number, ''), 
  COALESCE(aircraft_type, ''), 
  departure_date, 
  COALESCE(departure_time::text, ''),
  route
) WHERE tail_number IS NOT NULL OR aircraft_type IS NOT NULL;

-- Create index on route for better search performance
CREATE INDEX IF NOT EXISTS idx_open_legs_route ON public.open_legs(route);

-- Add comment explaining the duplicate prevention
COMMENT ON INDEX idx_open_legs_unique IS 'Prevents duplicate open legs from multiple sources by ensuring unique combination of tail/aircraft, date, time, and route';