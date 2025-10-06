-- Create NFL teams table with stadium coordinates
CREATE TABLE public.nfl_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  team_city text NOT NULL,
  stadium_name text NOT NULL,
  stadium_latitude numeric NOT NULL,
  stadium_longitude numeric NOT NULL,
  team_api_id integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nfl_teams ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to NFL teams"
  ON public.nfl_teams
  FOR SELECT
  USING (true);

-- Insert all 32 NFL teams with their stadium coordinates
INSERT INTO public.nfl_teams (team_name, team_city, stadium_name, stadium_latitude, stadium_longitude) VALUES
  ('Arizona Cardinals', 'Glendale', 'State Farm Stadium', 33.5276, -112.2626),
  ('Atlanta Falcons', 'Atlanta', 'Mercedes-Benz Stadium', 33.7553, -84.4008),
  ('Baltimore Ravens', 'Baltimore', 'M&T Bank Stadium', 39.2780, -76.6227),
  ('Buffalo Bills', 'Orchard Park', 'Highmark Stadium', 42.7738, -78.7870),
  ('Carolina Panthers', 'Charlotte', 'Bank of America Stadium', 35.2258, -80.8529),
  ('Chicago Bears', 'Chicago', 'Soldier Field', 41.8623, -87.6167),
  ('Cincinnati Bengals', 'Cincinnati', 'Paycor Stadium', 39.0954, -84.5160),
  ('Cleveland Browns', 'Cleveland', 'Cleveland Browns Stadium', 41.5061, -81.6995),
  ('Dallas Cowboys', 'Arlington', 'AT&T Stadium', 32.7473, -97.0945),
  ('Denver Broncos', 'Denver', 'Empower Field at Mile High', 39.7439, -105.0201),
  ('Detroit Lions', 'Detroit', 'Ford Field', 42.3400, -83.0456),
  ('Green Bay Packers', 'Green Bay', 'Lambeau Field', 44.5013, -88.0622),
  ('Houston Texans', 'Houston', 'NRG Stadium', 29.6847, -95.4107),
  ('Indianapolis Colts', 'Indianapolis', 'Lucas Oil Stadium', 39.7601, -86.1639),
  ('Jacksonville Jaguars', 'Jacksonville', 'EverBank Stadium', 30.3239, -81.6373),
  ('Kansas City Chiefs', 'Kansas City', 'GEHA Field at Arrowhead Stadium', 39.0489, -94.4839),
  ('Las Vegas Raiders', 'Las Vegas', 'Allegiant Stadium', 36.0908, -115.1836),
  ('Los Angeles Chargers', 'Inglewood', 'SoFi Stadium', 33.9535, -118.3390),
  ('Los Angeles Rams', 'Inglewood', 'SoFi Stadium', 33.9535, -118.3390),
  ('Miami Dolphins', 'Miami Gardens', 'Hard Rock Stadium', 25.9580, -80.2389),
  ('Minnesota Vikings', 'Minneapolis', 'U.S. Bank Stadium', 44.9738, -93.2577),
  ('New England Patriots', 'Foxborough', 'Gillette Stadium', 42.0909, -71.2643),
  ('New Orleans Saints', 'New Orleans', 'Caesars Superdome', 29.9511, -90.0812),
  ('New York Giants', 'East Rutherford', 'MetLife Stadium', 40.8128, -74.0742),
  ('New York Jets', 'East Rutherford', 'MetLife Stadium', 40.8128, -74.0742),
  ('Philadelphia Eagles', 'Philadelphia', 'Lincoln Financial Field', 39.9008, -75.1675),
  ('Pittsburgh Steelers', 'Pittsburgh', 'Acrisure Stadium', 40.4468, -80.0158),
  ('San Francisco 49ers', 'Santa Clara', 'Levi''s Stadium', 37.4032, -121.9696),
  ('Seattle Seahawks', 'Seattle', 'Lumen Field', 47.5952, -122.3316),
  ('Tampa Bay Buccaneers', 'Tampa', 'Raymond James Stadium', 27.9759, -82.5033),
  ('Tennessee Titans', 'Nashville', 'Nissan Stadium', 36.1665, -86.7713),
  ('Washington Commanders', 'Landover', 'Northwest Stadium', 38.9076, -76.8645);

-- Create index for faster geographic queries
CREATE INDEX idx_nfl_teams_coordinates ON public.nfl_teams (stadium_latitude, stadium_longitude);