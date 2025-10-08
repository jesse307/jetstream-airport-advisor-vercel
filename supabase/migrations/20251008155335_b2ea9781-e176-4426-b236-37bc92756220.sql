-- Add availability date range columns
ALTER TABLE public.open_legs 
ADD COLUMN IF NOT EXISTS availability_start_date date,
ADD COLUMN IF NOT EXISTS availability_end_date date;

-- Temporarily drop the unique index to allow route updates
DROP INDEX IF EXISTS idx_open_legs_unique;

-- Drop existing trigger and function to recreate with better logic
DROP TRIGGER IF EXISTS set_open_leg_route_trigger ON public.open_legs;
DROP FUNCTION IF EXISTS public.set_open_leg_route();
DROP FUNCTION IF EXISTS public.normalize_route(text, text);

-- Create improved route normalization function
CREATE OR REPLACE FUNCTION public.normalize_route(dep text, arr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  dep_code text;
  arr_code text;
  result text;
BEGIN
  -- Extract airport codes (typically 3-4 uppercase letters, possibly in parentheses)
  -- Remove everything that's not the code itself
  dep_code := UPPER(TRIM(regexp_replace(dep, '.*\(([A-Z]{3,4})\).*', '\1', 'g')));
  -- If no parentheses found, try to extract just uppercase letters
  IF dep_code = UPPER(TRIM(dep)) THEN
    dep_code := UPPER(TRIM(regexp_replace(dep, '[^A-Z]', '', 'g')));
    -- Limit to reasonable airport code length (3-4 chars)
    IF length(dep_code) > 4 THEN
      dep_code := UPPER(TRIM(dep));
    END IF;
  END IF;
  
  -- Check if arrival is "transient" or similar
  IF LOWER(TRIM(arr)) ~ 'transient|various|tbd|multiple' THEN
    result := dep_code || ' - TRANSIENT';
  ELSE
    -- Extract arrival airport code
    arr_code := UPPER(TRIM(regexp_replace(arr, '.*\(([A-Z]{3,4})\).*', '\1', 'g')));
    IF arr_code = UPPER(TRIM(arr)) THEN
      arr_code := UPPER(TRIM(regexp_replace(arr, '[^A-Z]', '', 'g')));
      IF length(arr_code) > 4 THEN
        arr_code := UPPER(TRIM(arr));
      END IF;
    END IF;
    result := dep_code || ' - ' || arr_code;
  END IF;
  
  RETURN result;
END;
$$;

-- Update existing rows with better route normalization
UPDATE public.open_legs
SET route = normalize_route(departure_airport, arrival_airport);

-- Remove duplicates keeping the most recent one
DELETE FROM public.open_legs a
USING public.open_legs b
WHERE a.id < b.id
  AND COALESCE(a.tail_number, '') = COALESCE(b.tail_number, '')
  AND COALESCE(a.aircraft_type, '') = COALESCE(b.aircraft_type, '')
  AND a.departure_date = b.departure_date
  AND COALESCE(a.departure_time::text, '') = COALESCE(b.departure_time::text, '')
  AND a.route = b.route;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION public.set_open_leg_route()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.route := normalize_route(NEW.departure_airport, NEW.arrival_airport);
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER set_open_leg_route_trigger
BEFORE INSERT OR UPDATE ON public.open_legs
FOR EACH ROW
EXECUTE FUNCTION public.set_open_leg_route();

-- Recreate unique index to prevent duplicates
CREATE UNIQUE INDEX idx_open_legs_unique 
ON public.open_legs (
  COALESCE(tail_number, ''), 
  COALESCE(aircraft_type, ''), 
  departure_date, 
  COALESCE(departure_time::text, ''),
  route
) WHERE tail_number IS NOT NULL OR aircraft_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.open_legs.availability_start_date IS 'Start date of aircraft availability period';
COMMENT ON COLUMN public.open_legs.availability_end_date IS 'End date of aircraft availability period';