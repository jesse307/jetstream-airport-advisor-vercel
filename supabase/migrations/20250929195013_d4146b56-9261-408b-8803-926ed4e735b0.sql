-- Add Global 5000
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
  51810, 87700, 73200, 5000,
  36000, 100,
  476, 499, 455,
  5200, 5000,
  2650, 3700, 1550, 250,
  3700, 51000, 19,
  5540, 2207, 5300,
  19, 13,
  42.5, 7.9, 6.2,
  5800, 7500,
  2, 'Rolls-Royce', 'BR710', 14750,
  '[
    {"weight_lbs": 60000, "fuel_burn_lbs_hr": 2400},
    {"weight_lbs": 70000, "fuel_burn_lbs_hr": 2560},
    {"weight_lbs": 80000, "fuel_burn_lbs_hr": 2650},
    {"weight_lbs": 87700, "fuel_burn_lbs_hr": 2720}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 2900},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2650},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2500},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2420}
  ]'::jsonb,
  '[
    {"payload_lbs": 2000, "range_nm": 5200},
    {"payload_lbs": 3000, "range_nm": 5050},
    {"payload_lbs": 4000, "range_nm": 4850},
    {"payload_lbs": 5000, "range_nm": 4600}
  ]'::jsonb,
  'Global 5000 - Ultra-long-range business jet. Wide-body cabin with exceptional comfort.'
);

-- Add Global 5500
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
  52900, 91800, 75900, 5200,
  36600, 100,
  476, 499, 455,
  5900, 5700,
  2700, 3750, 1580, 250,
  3800, 51000, 18,
  5450, 2207, 5200,
  19, 13,
  41.9, 7.9, 6.2,
  6000, 8000,
  2, 'Rolls-Royce', 'Pearl 15', 15125,
  '[
    {"weight_lbs": 62000, "fuel_burn_lbs_hr": 2450},
    {"weight_lbs": 72000, "fuel_burn_lbs_hr": 2610},
    {"weight_lbs": 84000, "fuel_burn_lbs_hr": 2700},
    {"weight_lbs": 91800, "fuel_burn_lbs_hr": 2770}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 2950},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2700},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2550},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2470}
  ]'::jsonb,
  '[
    {"payload_lbs": 2000, "range_nm": 5900},
    {"payload_lbs": 3000, "range_nm": 5750},
    {"payload_lbs": 4200, "range_nm": 5550},
    {"payload_lbs": 5200, "range_nm": 5300}
  ]'::jsonb,
  'Global 5500 - Enhanced Global 5000 with improved range and modern cabin. Launched 2018.'
);

-- Add Global 6000
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
  'Bombardier', 'Global 6000', 'Large Jet', 'Global 6000',
  52950, 99500, 78600, 5450,
  42400, 110,
  476, 513, 455,
  6000, 5800,
  2900, 4000, 1650, 260,
  3800, 51000, 18,
  5540, 2602, 5300,
  19, 13,
  48.5, 7.9, 6.2,
  6500, 8500,
  2, 'Rolls-Royce', 'BR710A2-20', 14750,
  '[
    {"weight_lbs": 65000, "fuel_burn_lbs_hr": 2600},
    {"weight_lbs": 78000, "fuel_burn_lbs_hr": 2780},
    {"weight_lbs": 90000, "fuel_burn_lbs_hr": 2900},
    {"weight_lbs": 99500, "fuel_burn_lbs_hr": 2980}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3180},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2900},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2730},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2640}
  ]'::jsonb,
  '[
    {"payload_lbs": 2000, "range_nm": 6000},
    {"payload_lbs": 3200, "range_nm": 5850},
    {"payload_lbs": 4400, "range_nm": 5650},
    {"payload_lbs": 5450, "range_nm": 5400}
  ]'::jsonb,
  'Global 6000 - Ultra-long-range with spacious cabin. Connects continents nonstop.'
);

-- Add Global 6500
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
  'Bombardier', 'Global 6500', 'Large Jet', 'Global 6500',
  54200, 99500, 78600, 5600,
  42500, 110,
  476, 516, 455,
  6600, 6400,
  2850, 3950, 1630, 260,
  3900, 51000, 17,
  5450, 2602, 5200,
  19, 13,
  48.5, 7.9, 6.2,
  6800, 9000,
  2, 'Rolls-Royce', 'Pearl 15', 15125,
  '[
    {"weight_lbs": 65000, "fuel_burn_lbs_hr": 2550},
    {"weight_lbs": 78000, "fuel_burn_lbs_hr": 2730},
    {"weight_lbs": 90000, "fuel_burn_lbs_hr": 2850},
    {"weight_lbs": 99500, "fuel_burn_lbs_hr": 2930}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3120},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2850},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2680},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2590}
  ]'::jsonb,
  '[
    {"payload_lbs": 2000, "range_nm": 6600},
    {"payload_lbs": 3500, "range_nm": 6450},
    {"payload_lbs": 4800, "range_nm": 6200},
    {"payload_lbs": 5600, "range_nm": 5950}
  ]'::jsonb,
  'Global 6500 - Enhanced 6000 with Pearl engines. Improved range and efficiency. Launched 2018.'
);

-- Add Global 7500
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
  58000, 114850, 90700, 6400,
  51800, 120,
  488, 516, 465,
  7700, 7500,
  3450, 4800, 2000, 280,
  4000, 51000, 17,
  5800, 2236, 5500,
  19, 14,
  54.3, 8.0, 6.2,
  9000, 12000,
  2, 'GE Aviation', 'Passport', 18920,
  '[
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 3050},
    {"weight_lbs": 92000, "fuel_burn_lbs_hr": 3300},
    {"weight_lbs": 105000, "fuel_burn_lbs_hr": 3450},
    {"weight_lbs": 114850, "fuel_burn_lbs_hr": 3550}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3780},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3450},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 3260},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 3150}
  ]'::jsonb,
  '[
    {"payload_lbs": 2500, "range_nm": 7700},
    {"payload_lbs": 4000, "range_nm": 7550},
    {"payload_lbs": 5500, "range_nm": 7300},
    {"payload_lbs": 6400, "range_nm": 7000}
  ]'::jsonb,
  'Global 7500 - Flagship ultra-long-range jet. Largest business jet cabin. Industry-leading range.'
);

-- Add Global 8000
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
  57500, 115000, 90700, 6500,
  52300, 120,
  490, 528, 468,
  8000, 7800,
  3400, 4750, 1980, 280,
  4100, 51000, 16,
  5800, 2236, 5500,
  19, 14,
  54.3, 8.0, 6.2,
  10000, 13500,
  2, 'GE Aviation', 'Passport', 18920,
  '[
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 3000},
    {"weight_lbs": 92000, "fuel_burn_lbs_hr": 3250},
    {"weight_lbs": 105000, "fuel_burn_lbs_hr": 3400},
    {"weight_lbs": 115000, "fuel_burn_lbs_hr": 3500}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3730},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3400},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 3210},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 3100}
  ]'::jsonb,
  '[
    {"payload_lbs": 2500, "range_nm": 8000},
    {"payload_lbs": 4000, "range_nm": 7850},
    {"payload_lbs": 5500, "range_nm": 7600},
    {"payload_lbs": 6500, "range_nm": 7300}
  ]'::jsonb,
  'Global 8000 - Fastest and longest-range purpose-built business jet. Mach 0.94. Game-changing performance.'
);