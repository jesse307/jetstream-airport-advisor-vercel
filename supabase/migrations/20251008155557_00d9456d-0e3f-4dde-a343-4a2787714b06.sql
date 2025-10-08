-- Update route normalization to handle regional destinations
DROP FUNCTION IF EXISTS public.normalize_route(text, text);

CREATE OR REPLACE FUNCTION public.normalize_route(dep text, arr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  dep_code text;
  arr_result text;
  result text;
BEGIN
  -- Extract departure airport code (typically 3-4 uppercase letters, possibly in parentheses)
  dep_code := UPPER(TRIM(regexp_replace(dep, '.*\(([A-Z]{3,4})\).*', '\1', 'g')));
  -- If no parentheses found, try to extract just uppercase letters
  IF dep_code = UPPER(TRIM(dep)) THEN
    dep_code := UPPER(TRIM(regexp_replace(dep, '[^A-Z]', '', 'g')));
    -- Limit to reasonable airport code length (3-4 chars)
    IF length(dep_code) > 4 THEN
      dep_code := UPPER(TRIM(dep));
    END IF;
  END IF;
  
  -- Check for regional destinations
  IF LOWER(TRIM(arr)) ~ 'midwest' THEN
    arr_result := 'MIDWEST';
  ELSIF LOWER(TRIM(arr)) ~ 'northeast' THEN
    arr_result := 'NORTHEAST';
  ELSIF LOWER(TRIM(arr)) ~ 'northwest' THEN
    arr_result := 'NORTHWEST';
  ELSIF LOWER(TRIM(arr)) ~ 'southeast' THEN
    arr_result := 'SOUTHEAST';
  ELSIF LOWER(TRIM(arr)) ~ 'southwest' THEN
    arr_result := 'SOUTHWEST';
  ELSIF LOWER(TRIM(arr)) ~ 'west coast' THEN
    arr_result := 'WEST COAST';
  ELSIF LOWER(TRIM(arr)) ~ 'east coast' THEN
    arr_result := 'EAST COAST';
  -- Check if arrival is "transient" or similar
  ELSIF LOWER(TRIM(arr)) ~ 'transient|various|tbd|multiple|anywhere' THEN
    arr_result := 'TRANSIENT';
  ELSE
    -- Extract arrival airport code
    arr_result := UPPER(TRIM(regexp_replace(arr, '.*\(([A-Z]{3,4})\).*', '\1', 'g')));
    IF arr_result = UPPER(TRIM(arr)) THEN
      arr_result := UPPER(TRIM(regexp_replace(arr, '[^A-Z]', '', 'g')));
      IF length(arr_result) > 4 THEN
        arr_result := UPPER(TRIM(arr));
      END IF;
    END IF;
  END IF;
  
  result := dep_code || ' - ' || arr_result;
  RETURN result;
END;
$$;

-- Update existing routes
UPDATE public.open_legs
SET route = normalize_route(departure_airport, arrival_airport);