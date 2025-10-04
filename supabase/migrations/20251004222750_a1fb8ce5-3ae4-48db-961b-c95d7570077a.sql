-- Add new timestamp columns with timezone support
ALTER TABLE leads 
ADD COLUMN departure_datetime timestamp with time zone,
ADD COLUMN return_datetime timestamp with time zone;

-- Migrate existing data: combine date + time into timezone-aware timestamps
-- This assumes times are in America/New_York timezone for existing data
UPDATE leads
SET departure_datetime = (departure_date::text || ' ' || departure_time::text)::timestamp AT TIME ZONE 'America/New_York'
WHERE departure_date IS NOT NULL AND departure_time IS NOT NULL;

UPDATE leads
SET return_datetime = (return_date::text || ' ' || return_time::text)::timestamp AT TIME ZONE 'America/New_York'
WHERE return_date IS NOT NULL AND return_time IS NOT NULL;

-- Add a comment to document the columns
COMMENT ON COLUMN leads.departure_datetime IS 'Departure date and time with timezone support';
COMMENT ON COLUMN leads.return_datetime IS 'Return date and time with timezone support';