-- Add Citation CJ4
INSERT INTO public.aircraft (
  manufacturer, model, category, aviapages_name,
  empty_weight, max_takeoff_weight, max_landing_weight, max_payload,
  fuel_capacity, unusable_fuel,
  cruise_speed_normal, cruise_speed_max, cruise_speed_long_range,
  max_range, max_range_with_reserves,
  fuel_burn_cruise, fuel_burn_climb, fuel_burn_descent, fuel_burn_taxi,
  rate_of_climb, service_ceiling, time_to_climb_fl410,
  takeoff_distance, landing_distance, min_runway,
  max_passengers, typical_passengers,
  cabin_length, cabin_width, cabin_height,
  hourly_rate_min, hourly_rate_max,
  engines_count, engine_manufacturer, engine_model, thrust_per_engine,
  fuel_burn_vs_weight, fuel_burn_vs_altitude, range_vs_payload,
  notes
) VALUES (
  'Cessna', 'Citation CJ4', 'Light Jet', 'Citation CJ4',
  10280, 17110, 15660, 2220,
  5828, 50,
  391, 451, 370,
  2165, 2000,
  1185, 1680, 750, 200,
  3854, 45000, 18,
  3410, 2940, 3200,
  10, 8,
  17.3, 4.8, 4.8,
  2800, 3600,
  2, 'Williams International', 'FJ44-4A', 3621,
  '[
    {"weight_lbs": 12000, "fuel_burn_lbs_hr": 1050},
    {"weight_lbs": 14000, "fuel_burn_lbs_hr": 1120},
    {"weight_lbs": 16000, "fuel_burn_lbs_hr": 1185},
    {"weight_lbs": 17110, "fuel_burn_lbs_hr": 1230}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1280},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1185},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1100},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 1050}
  ]'::jsonb,
  '[
    {"payload_lbs": 500, "range_nm": 2165},
    {"payload_lbs": 1000, "range_nm": 2050},
    {"payload_lbs": 1500, "range_nm": 1900},
    {"payload_lbs": 2220, "range_nm": 1700}
  ]'::jsonb,
  'Citation CJ4 - Light jet with excellent range and cabin comfort. Max speed 451 kts.'
);

-- Add Citation Latitude
INSERT INTO public.aircraft (
  manufacturer, model, category, aviapages_name,
  empty_weight, max_takeoff_weight, max_landing_weight, max_payload,
  fuel_capacity, unusable_fuel,
  cruise_speed_normal, cruise_speed_max, cruise_speed_long_range,
  max_range, max_range_with_reserves,
  fuel_burn_cruise, fuel_burn_climb, fuel_burn_descent, fuel_burn_taxi,
  rate_of_climb, service_ceiling, time_to_climb_fl410,
  takeoff_distance, landing_distance, min_runway,
  max_passengers, typical_passengers,
  cabin_length, cabin_width, cabin_height,
  hourly_rate_min, hourly_rate_max,
  engines_count, engine_manufacturer, engine_model, thrust_per_engine,
  fuel_burn_vs_weight, fuel_burn_vs_altitude, range_vs_payload,
  notes
) VALUES (
  'Cessna', 'Citation Latitude', 'Midsize Jet', 'Citation Latitude',
  15100, 30800, 28400, 2500,
  8000, 60,
  430, 446, 410,
  2700, 2550,
  1650, 2300, 900, 200,
  4000, 45000, 19,
  3580, 3180, 3500,
  9, 7,
  21.7, 6.5, 6.0,
  3400, 4200,
  2, 'Pratt & Whitney Canada', 'PW306D1', 5907,
  '[
    {"weight_lbs": 20000, "fuel_burn_lbs_hr": 1400},
    {"weight_lbs": 25000, "fuel_burn_lbs_hr": 1550},
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1650},
    {"weight_lbs": 30800, "fuel_burn_lbs_hr": 1720}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1780},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1650},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1540},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 1480}
  ]'::jsonb,
  '[
    {"payload_lbs": 800, "range_nm": 2700},
    {"payload_lbs": 1200, "range_nm": 2600},
    {"payload_lbs": 1800, "range_nm": 2400},
    {"payload_lbs": 2500, "range_nm": 2100}
  ]'::jsonb,
  'Citation Latitude - Midsize jet with spacious flat-floor cabin. Excellent comfort and range.'
);

-- Add Citation Longitude
INSERT INTO public.aircraft (
  manufacturer, model, category, aviapages_name,
  empty_weight, max_takeoff_weight, max_landing_weight, max_payload,
  fuel_capacity, unusable_fuel,
  cruise_speed_normal, cruise_speed_max, cruise_speed_long_range,
  max_range, max_range_with_reserves,
  fuel_burn_cruise, fuel_burn_climb, fuel_burn_descent, fuel_burn_taxi,
  rate_of_climb, service_ceiling, time_to_climb_fl410,
  takeoff_distance, landing_distance, min_runway,
  max_passengers, typical_passengers,
  cabin_length, cabin_width, cabin_height,
  hourly_rate_min, hourly_rate_max,
  engines_count, engine_manufacturer, engine_model, thrust_per_engine,
  fuel_burn_vs_weight, fuel_burn_vs_altitude, range_vs_payload,
  notes
) VALUES (
  'Cessna', 'Citation Longitude', 'Super Midsize Jet', 'Citation Longitude',
  23700, 39500, 33500, 3200,
  10500, 70,
  450, 483, 430,
  3500, 3350,
  1850, 2600, 1100, 220,
  4000, 45000, 20,
  4810, 3170, 4500,
  12, 9,
  25.2, 6.5, 6.0,
  4400, 5400,
  2, 'Honeywell', 'HTF7700L', 7665,
  '[
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1600},
    {"weight_lbs": 33000, "fuel_burn_lbs_hr": 1750},
    {"weight_lbs": 37000, "fuel_burn_lbs_hr": 1850},
    {"weight_lbs": 39500, "fuel_burn_lbs_hr": 1920}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 2000},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1850},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1720},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 1650}
  ]'::jsonb,
  '[
    {"payload_lbs": 1000, "range_nm": 3500},
    {"payload_lbs": 1600, "range_nm": 3400},
    {"payload_lbs": 2400, "range_nm": 3200},
    {"payload_lbs": 3200, "range_nm": 2900}
  ]'::jsonb,
  'Citation Longitude - Super midsize jet, Cessna''s largest business jet. Exceptional range and cabin.'
);

-- Add Citation Sovereign+
INSERT INTO public.aircraft (
  manufacturer, model, category, aviapages_name,
  empty_weight, max_takeoff_weight, max_landing_weight, max_payload,
  fuel_capacity, unusable_fuel,
  cruise_speed_normal, cruise_speed_max, cruise_speed_long_range,
  max_range, max_range_with_reserves,
  fuel_burn_cruise, fuel_burn_climb, fuel_burn_descent, fuel_burn_taxi,
  rate_of_climb, service_ceiling, time_to_climb_fl410,
  takeoff_distance, landing_distance, min_runway,
  max_passengers, typical_passengers,
  cabin_length, cabin_width, cabin_height,
  hourly_rate_min, hourly_rate_max,
  engines_count, engine_manufacturer, engine_model, thrust_per_engine,
  fuel_burn_vs_weight, fuel_burn_vs_altitude, range_vs_payload,
  notes
) VALUES (
  'Cessna', 'Citation Sovereign+', 'Midsize Jet', 'Citation Sovereign',
  18150, 30300, 27000, 2700,
  9300, 60,
  430, 458, 410,
  3200, 3050,
  1720, 2400, 950, 200,
  3960, 47000, 21,
  3600, 2770, 3500,
  12, 9,
  25.3, 5.5, 5.7,
  3600, 4500,
  2, 'Pratt & Whitney Canada', 'PW306D', 5852,
  '[
    {"weight_lbs": 22000, "fuel_burn_lbs_hr": 1500},
    {"weight_lbs": 26000, "fuel_burn_lbs_hr": 1640},
    {"weight_lbs": 28500, "fuel_burn_lbs_hr": 1720},
    {"weight_lbs": 30300, "fuel_burn_lbs_hr": 1780}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1850},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1720},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1600},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 1520}
  ]'::jsonb,
  '[
    {"payload_lbs": 1000, "range_nm": 3200},
    {"payload_lbs": 1500, "range_nm": 3100},
    {"payload_lbs": 2000, "range_nm": 2900},
    {"payload_lbs": 2700, "range_nm": 2650}
  ]'::jsonb,
  'Citation Sovereign+ - Midsize jet with transcontinental range. Spacious cabin with stand-up headroom.'
);

-- Add Citation X+
INSERT INTO public.aircraft (
  manufacturer, model, category, aviapages_name,
  empty_weight, max_takeoff_weight, max_landing_weight, max_payload,
  fuel_capacity, unusable_fuel,
  cruise_speed_normal, cruise_speed_max, cruise_speed_long_range,
  max_range, max_range_with_reserves,
  fuel_burn_cruise, fuel_burn_climb, fuel_burn_descent, fuel_burn_taxi,
  rate_of_climb, service_ceiling, time_to_climb_fl410,
  takeoff_distance, landing_distance, min_runway,
  max_passengers, typical_passengers,
  cabin_length, cabin_width, cabin_height,
  hourly_rate_min, hourly_rate_max,
  engines_count, engine_manufacturer, engine_model, thrust_per_engine,
  fuel_burn_vs_weight, fuel_burn_vs_altitude, range_vs_payload,
  notes
) VALUES (
  'Cessna', 'Citation X+', 'Super Midsize Jet', 'Citation X',
  22464, 36600, 32000, 2514,
  12931, 70,
  470, 528, 450,
  3380, 3229,
  2150, 2900, 1200, 220,
  3650, 51000, 23,
  5280, 4702, 5000,
  8, 6,
  25.2, 5.6, 5.8,
  5200, 6400,
  2, 'Rolls-Royce', 'AE3007C2', 7034,
  '[
    {"weight_lbs": 26000, "fuel_burn_lbs_hr": 1900},
    {"weight_lbs": 30000, "fuel_burn_lbs_hr": 2050},
    {"weight_lbs": 34000, "fuel_burn_lbs_hr": 2150},
    {"weight_lbs": 36600, "fuel_burn_lbs_hr": 2220}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 2300},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2150},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2000},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 1900}
  ]'::jsonb,
  '[
    {"payload_lbs": 800, "range_nm": 3380},
    {"payload_lbs": 1200, "range_nm": 3300},
    {"payload_lbs": 1800, "range_nm": 3150},
    {"payload_lbs": 2514, "range_nm": 2900}
  ]'::jsonb,
  'Citation X+ - Fastest civilian aircraft. Cruise speed Mach 0.935 (528 kts). Production ended 2018.'
);