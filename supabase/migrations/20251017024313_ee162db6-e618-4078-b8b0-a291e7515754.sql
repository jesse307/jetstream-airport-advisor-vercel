-- Add floating_fleet column to aircraft_locations
ALTER TABLE public.aircraft_locations 
ADD COLUMN floating_fleet boolean NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_aircraft_locations_floating_fleet 
ON public.aircraft_locations(floating_fleet);

-- Update the trigger to handle the new column
CREATE OR REPLACE FUNCTION public.update_aircraft_operator_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;