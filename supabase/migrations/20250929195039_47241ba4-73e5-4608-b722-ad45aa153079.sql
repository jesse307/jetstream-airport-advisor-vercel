-- Add Bombardier Global 5000
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
  'Bombardier', 'Global 5000', 'Large Jet', 'Global 5000',
  48950, 89950, 73700, 6200,
  37850, 110,
  470, 488, 450,
  5200, 5000,
  2750, 3800, 1600, 260,
  4000, 51000, 18,
  5540, 2207, 5300,
  19, 13,
  48.3, 7.8, 6.2,
  6000, 8000,
  2, 'Rolls-Royce', 'BR710A2-20', 14750,
  '[
    {"weight_lbs": 60000, "fuel_burn_lbs_hr": 2500},
    {"weight_lbs": 73000, "fuel_burn_lbs_hr": 2680},
    {"weight_lbs": 83000, "fuel_burn_lbs_hr": 2750},
    {"weight_lbs": 89950, "fuel_burn_lbs_hr": 2820}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3000},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2750},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2600},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2500}
  ]'::jsonb,
  '[
    {"payload_lbs": 2000, "range_nm": 5200},
    {"payload_lbs": 3500, "range_nm": 5050},
    {"payload_lbs": 5000, "range_nm": 4800},
    {"payload_lbs": 6200, "range_nm": 4500}
  ]'::jsonb,
  'Global 5000 - Long-range large cabin jet. Exceptional comfort and performance. Production 2005-2018.'
);

-- Add Bombardier Global 5500
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
  'Bombardier', 'Global 5500', 'Large Jet', 'Global 5500',
  49700, 92500, 73800, 6500,
  39600, 110,
  472, 488, 452,
  5900, 5750,
  2700, 3750, 1550, 260,
  4100, 51000, 17,
  5250, 2207, 5000,
  19, 14,
  51.4, 7.8, 6.2,
  6500, 8700,
  2, 'Rolls-Royce', 'Pearl 15', 15125,
  '[
    {"weight_lbs": 62000, "fuel_burn_lbs_hr": 2450},
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 2620},
    {"weight_lbs": 86000, "fuel_burn_lbs_hr": 2700},
    {"weight_lbs": 92500, "fuel_burn_lbs_hr": 2770}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 2950},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2700},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2550},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2450}
  ]'::jsonb,
  '[
    {"payload_lbs": 2500, "range_nm": 5900},
    {"payload_lbs": 4000, "range_nm": 5750},
    {"payload_lbs": 5500, "range_nm": 5500},
    {"payload_lbs": 6500, "range_nm": 5200}
  ]'::jsonb,
  'Global 5500 - Enhanced 5000 with Pearl engines. Better range and efficiency. Modern cockpit.'
);

-- Add Bombardier Global 6000
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
  'Bombardier', 'Global 6000', 'Ultra Long Range', 'Global 6000',
  52300, 99500, 77800, 6800,
  42350, 120,
  476, 488, 456,
  6000, 5850,
  3000, 4150, 1700, 270,
  3900, 51000, 18,
  5540, 2207, 5300,
  19, 14,
  55.6, 7.8, 6.2,
  6800, 9200,
  2, 'Rolls-Royce', 'BR710A2-20', 14750,
  '[
    {"weight_lbs": 65000, "fuel_burn_lbs_hr": 2700},
    {"weight_lbs": 80000, "fuel_burn_lbs_hr": 2900},
    {"weight_lbs": 92000, "fuel_burn_lbs_hr": 3000},
    {"weight_lbs": 99500, "fuel_burn_lbs_hr": 3080}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3280},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3000},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2830},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2730}
  ]'::jsonb,
  '[
    {"payload_lbs": 2500, "range_nm": 6000},
    {"payload_lbs": 4000, "range_nm": 5850},
    {"payload_lbs": 5500, "range_nm": 5600},
    {"payload_lbs": 6800, "range_nm": 5300}
  ]'::jsonb,
  'Global 6000 - Ultra-long range with larger cabin than 5000. Excellent for intercontinental flights.'
);

-- Add Bombardier Global 6500
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
  'Bombardier', 'Global 6500', 'Ultra Long Range', 'Global 6500',
  53400, 99500, 77800, 7000,
  43600, 120,
  476, 490, 456,
  6600, 6450,
  2950, 4100, 1680, 270,
  4000, 51000, 17,
  5450, 2207, 5200,
  19, 14,
  57.9, 7.8, 6.2,
  7200, 9800,
  2, 'Rolls-Royce', 'Pearl 15', 15125,
  '[
    {"weight_lbs": 65000, "fuel_burn_lbs_hr": 2650},
    {"weight_lbs": 80000, "fuel_burn_lbs_hr": 2850},
    {"weight_lbs": 92000, "fuel_burn_lbs_hr": 2950},
    {"weight_lbs": 99500, "fuel_burn_lbs_hr": 3030}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3220},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2950},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2780},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2680}
  ]'::jsonb,
  '[
    {"payload_lbs": 2500, "range_nm": 6600},
    {"payload_lbs": 4000, "range_nm": 6450},
    {"payload_lbs": 5500, "range_nm": 6200},
    {"payload_lbs": 7000, "range_nm": 5850}
  ]'::jsonb,
  'Global 6500 - Enhanced 6000 with Pearl engines. Improved efficiency and range. Fly nonstop worldwide.'
);

-- Add Bombardier Global 7500
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
  'Bombardier', 'Global 7500', 'Ultra Long Range', 'Global 7500',
  56050, 114850, 88300, 8400,
  52950, 130,
  488, 516, 467,
  7700, 7500,
  3400, 4750, 1950, 280,
  4100, 51000, 17,
  5800, 2236, 5500,
  19, 14,
  54.5, 8.0, 6.2,
  9500, 12500,
  2, 'General Electric', 'Passport 20', 18920,
  '[
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 3050},
    {"weight_lbs": 95000, "fuel_burn_lbs_hr": 3300},
    {"weight_lbs": 108000, "fuel_burn_lbs_hr": 3400},
    {"weight_lbs": 114850, "fuel_burn_lbs_hr": 3480}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3720},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3400},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 3220},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 3100}
  ]'::jsonb,
  '[
    {"payload_lbs": 3000, "range_nm": 7700},
    {"payload_lbs": 5000, "range_nm": 7500},
    {"payload_lbs": 7000, "range_nm": 7200},
    {"payload_lbs": 8400, "range_nm": 6850}
  ]'::jsonb,
  'Global 7500 - Longest-range and largest-cabin business jet. Four living areas. Fly anywhere nonstop.'
);

-- Add Bombardier Global 8000
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
  'Bombardier', 'Global 8000', 'Ultra Long Range', 'Global 8000',
  56500, 115000, 88500, 8500,
  54500, 130,
  488, 528, 467,
  8000, 7800,
  3380, 4720, 1930, 280,
  4100, 51000, 17,
  5800, 2236, 5500,
  19, 14,
  54.5, 8.0, 6.2,
  10000, 13500,
  2, 'General Electric', 'Passport 20', 18920,
  '[
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 3030},
    {"weight_lbs": 95000, "fuel_burn_lbs_hr": 3280},
    {"weight_lbs": 108000, "fuel_burn_lbs_hr": 3380},
    {"weight_lbs": 115000, "fuel_burn_lbs_hr": 3460}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3700},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3380},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 3200},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 3080}
  ]'::jsonb,
  '[
    {"payload_lbs": 3000, "range_nm": 8000},
    {"payload_lbs": 5000, "range_nm": 7800},
    {"payload_lbs": 7000, "range_nm": 7500},
    {"payload_lbs": 8500, "range_nm": 7150}
  ]'::jsonb,
  'Global 8000 - Fastest ultra-long-range jet (Mach 0.94). Longest range. Ultimate performance and luxury.'
);