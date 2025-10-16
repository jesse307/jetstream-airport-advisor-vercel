-- Add trusted flag and enhance aircraft_locations table
ALTER TABLE aircraft_locations ADD COLUMN IF NOT EXISTS is_trusted boolean DEFAULT false;
ALTER TABLE aircraft_locations ADD COLUMN IF NOT EXISTS aircraft_type text;
ALTER TABLE aircraft_locations ADD COLUMN IF NOT EXISTS notes text;

-- Create index for faster trusted operator queries
CREATE INDEX IF NOT EXISTS idx_aircraft_locations_trusted ON aircraft_locations(is_trusted) WHERE is_trusted = true;
CREATE INDEX IF NOT EXISTS idx_aircraft_locations_home_airport ON aircraft_locations(home_airport_icao) WHERE home_airport_icao IS NOT NULL;

-- Add RLS policies for trusted operators management
CREATE POLICY "Authenticated users can view aircraft locations" 
ON aircraft_locations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert aircraft locations" 
ON aircraft_locations FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update aircraft locations" 
ON aircraft_locations FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete aircraft locations" 
ON aircraft_locations FOR DELETE 
TO authenticated 
USING (true);