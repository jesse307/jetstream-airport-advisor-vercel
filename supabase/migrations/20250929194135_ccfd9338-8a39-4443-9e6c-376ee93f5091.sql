-- Create aircraft table with detailed performance specifications
CREATE TABLE public.aircraft (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Basic Info
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Light Jet', 'Super Light Jet', 'Midsize', etc.
  variant TEXT, -- For different versions like CJ3, CJ3+
  aviapages_name TEXT, -- Name used by Aviapages API for matching
  
  -- Weight (lbs)
  empty_weight INTEGER NOT NULL,
  max_takeoff_weight INTEGER NOT NULL,
  max_landing_weight INTEGER NOT NULL,
  max_payload INTEGER NOT NULL,
  
  -- Fuel (lbs)
  fuel_capacity INTEGER NOT NULL,
  unusable_fuel INTEGER DEFAULT 50,
  
  -- Performance - Speed (knots)
  cruise_speed_normal INTEGER NOT NULL, -- Normal cruise
  cruise_speed_max INTEGER NOT NULL, -- Max cruise
  cruise_speed_long_range INTEGER NOT NULL, -- Long range cruise
  
  -- Performance - Range (nautical miles)
  max_range INTEGER NOT NULL,
  max_range_with_reserves INTEGER, -- With 45 min reserve
  
  -- Performance - Fuel Burn (lbs/hr)
  fuel_burn_cruise INTEGER NOT NULL, -- Normal cruise
  fuel_burn_climb INTEGER NOT NULL, -- Average during climb
  fuel_burn_descent INTEGER NOT NULL, -- Average during descent
  fuel_burn_taxi INTEGER DEFAULT 200, -- Total for taxi ops
  
  -- Performance - Climb/Descent
  rate_of_climb INTEGER NOT NULL, -- feet per minute
  rate_of_descent INTEGER DEFAULT 2000, -- feet per minute (typical descent)
  service_ceiling INTEGER NOT NULL, -- feet
  time_to_climb_fl410 INTEGER, -- minutes to FL410
  
  -- Runway Requirements (feet)
  takeoff_distance INTEGER NOT NULL,
  landing_distance INTEGER NOT NULL,
  min_runway INTEGER NOT NULL,
  
  -- Cabin
  max_passengers INTEGER NOT NULL,
  typical_passengers INTEGER NOT NULL,
  cabin_length NUMERIC(5,1),
  cabin_width NUMERIC(4,1),
  cabin_height NUMERIC(4,1),
  
  -- Operating Costs (USD per hour)
  hourly_rate_min INTEGER,
  hourly_rate_max INTEGER,
  
  -- Performance Curves (JSONB for flexible data)
  fuel_burn_vs_weight JSONB, -- [{weight_lbs: 10000, fuel_burn_lbs_hr: 900}, ...]
  fuel_burn_vs_altitude JSONB, -- [{altitude_ft: 35000, fuel_burn_lbs_hr: 850}, ...]
  range_vs_payload JSONB, -- [{payload_lbs: 1000, range_nm: 1850}, ...]
  
  -- Additional specs
  engines_count INTEGER DEFAULT 2,
  engine_manufacturer TEXT,
  engine_model TEXT,
  thrust_per_engine INTEGER, -- pounds or newtons
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  UNIQUE(manufacturer, model, variant)
);

-- Enable RLS
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required for viewing aircraft specs)
CREATE POLICY "Allow public aircraft viewing"
ON public.aircraft
FOR SELECT
USING (true);

-- Create index for common queries
CREATE INDEX idx_aircraft_category ON public.aircraft(category);
CREATE INDEX idx_aircraft_manufacturer ON public.aircraft(manufacturer);
CREATE INDEX idx_aircraft_aviapages_name ON public.aircraft(aviapages_name);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_aircraft_updated_at
BEFORE UPDATE ON public.aircraft
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Citation CJ3 with detailed performance data
INSERT INTO public.aircraft (
  manufacturer, model, category, variant, aviapages_name,
  empty_weight, max_takeoff_weight, max_landing_weight, max_payload,
  fuel_capacity, unusable_fuel,
  cruise_speed_normal, cruise_speed_max, cruise_speed_long_range,
  max_range, max_range_with_reserves,
  fuel_burn_cruise, fuel_burn_climb, fuel_burn_descent, fuel_burn_taxi,
  rate_of_climb, rate_of_descent, service_ceiling, time_to_climb_fl410,
  takeoff_distance, landing_distance, min_runway,
  max_passengers, typical_passengers,
  cabin_length, cabin_width, cabin_height,
  hourly_rate_min, hourly_rate_max,
  engines_count, engine_manufacturer, engine_model, thrust_per_engine,
  fuel_burn_vs_weight, fuel_burn_vs_altitude, range_vs_payload,
  notes
) VALUES (
  'Cessna', 'Citation CJ3', 'Light Jet', NULL, 'Citation CJ3',
  8300, 13870, 12500, 1925,
  4710, 50, -- 703 gallons @ 6.7 lbs/gal
  400, 417, 380, -- Normal, Max, Long Range cruise speeds
  1875, 1750, -- Max range, range with reserves
  998, 1450, 650, 200, -- Fuel burn: cruise, climb, descent, taxi (lbs/hr)
  4478, 2000, 45000, 19, -- Climb rate, descent rate, ceiling, time to FL410
  3180, 2770, 3000, -- Takeoff, landing, min runway
  7, 6, -- Max pax, typical pax
  15.6, 4.9, 4.8, -- Cabin dimensions (ft)
  2200, 2800, -- Hourly rate range
  2, 'Williams International', 'FJ44-3A', 2820, -- Engines
  -- Fuel burn vs weight (takeoff weight in lbs, fuel burn in lbs/hr at cruise)
  '[
    {"weight_lbs": 10000, "fuel_burn_lbs_hr": 850},
    {"weight_lbs": 11500, "fuel_burn_lbs_hr": 920},
    {"weight_lbs": 13000, "fuel_burn_lbs_hr": 998},
    {"weight_lbs": 13870, "fuel_burn_lbs_hr": 1050}
  ]'::jsonb,
  -- Fuel burn vs altitude (altitude in ft, fuel burn in lbs/hr)
  '[
    {"altitude_ft": 25000, "fuel_burn_lbs_hr": 1100},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 998},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 920},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 880}
  ]'::jsonb,
  -- Range vs payload (payload in lbs, range in nm)
  '[
    {"payload_lbs": 500, "range_nm": 1875},
    {"payload_lbs": 1000, "range_nm": 1800},
    {"payload_lbs": 1500, "range_nm": 1650},
    {"payload_lbs": 1925, "range_nm": 1500}
  ]'::jsonb,
  'Citation CJ3 (525B) - Light jet with excellent short-field performance. Production: 2004-2016.'
);

COMMENT ON TABLE public.aircraft IS 'Detailed aircraft performance specifications with multi-phase fuel burn models';
COMMENT ON COLUMN public.aircraft.fuel_burn_vs_weight IS 'Fuel consumption at different takeoff weights during cruise';
COMMENT ON COLUMN public.aircraft.fuel_burn_vs_altitude IS 'Fuel consumption at different cruise altitudes';
COMMENT ON COLUMN public.aircraft.range_vs_payload IS 'Maximum range at different payload weights';