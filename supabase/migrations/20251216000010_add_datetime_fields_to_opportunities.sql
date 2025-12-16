-- Add datetime fields to opportunities table to store flight times
ALTER TABLE public.opportunities
ADD COLUMN departure_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN return_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN departure_time TIME,
ADD COLUMN return_date DATE,
ADD COLUMN return_time TIME;

-- Add helpful comment
COMMENT ON COLUMN public.opportunities.departure_datetime IS 'Full departure date and time';
COMMENT ON COLUMN public.opportunities.return_datetime IS 'Full return date and time for round trips';
COMMENT ON COLUMN public.opportunities.departure_time IS 'Departure time (legacy field)';
COMMENT ON COLUMN public.opportunities.return_date IS 'Return date for round trips';
COMMENT ON COLUMN public.opportunities.return_time IS 'Return time (legacy field)';
