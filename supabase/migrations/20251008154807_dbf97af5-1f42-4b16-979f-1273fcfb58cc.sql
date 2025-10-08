-- Fix search_path security issue for normalize_route function
CREATE OR REPLACE FUNCTION public.normalize_route(dep text, arr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Normalize to uppercase and trim whitespace
  RETURN UPPER(TRIM(dep)) || ' - ' || UPPER(TRIM(arr));
END;
$$;

-- Fix search_path security issue for set_open_leg_route function
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