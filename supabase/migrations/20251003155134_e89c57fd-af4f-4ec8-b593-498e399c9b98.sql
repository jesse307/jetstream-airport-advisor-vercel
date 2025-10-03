-- Drop the constraint first
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_trip_type_check;

-- Update existing data to new format
UPDATE public.leads 
SET trip_type = 'One Way' 
WHERE trip_type = 'one-way';

UPDATE public.leads 
SET trip_type = 'Round Trip' 
WHERE trip_type = 'round-trip';

-- Add the new constraint
ALTER TABLE public.leads 
ADD CONSTRAINT leads_trip_type_check 
CHECK (trip_type IN ('One Way', 'Round Trip'));