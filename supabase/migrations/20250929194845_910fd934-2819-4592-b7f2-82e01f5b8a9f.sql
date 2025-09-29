-- Add Gulfstream G280
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
  'Gulfstream', 'G280', 'Super Midsize Jet', 'Gulfstream G280',
  20550, 39600, 34600, 3300,
  11300, 70,
  450, 482, 430,
  3600, 3450,
  1750, 2480, 1050, 220,
  3700, 45000, 20,
  4800, 2480, 4600,
  10, 8,
  25.8, 7.2, 6.25,
  4000, 5000,
  2, 'Honeywell', 'HTF7250G', 7624,
  '[
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1550},
    {"weight_lbs": 33000, "fuel_burn_lbs_hr": 1680},
    {"weight_lbs": 37000, "fuel_burn_lbs_hr": 1750},
    {"weight_lbs": 39600, "fuel_burn_lbs_hr": 1810}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1920},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1750},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1640},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 1580}
  ]'::jsonb,
  '[
    {"payload_lbs": 1200, "range_nm": 3600},
    {"payload_lbs": 1800, "range_nm": 3500},
    {"payload_lbs": 2500, "range_nm": 3300},
    {"payload_lbs": 3300, "range_nm": 3000}
  ]'::jsonb,
  'Gulfstream G280 - Super midsize with excellent range. Advanced avionics and comfort.'
);

-- Add Gulfstream G450
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
  'Gulfstream', 'G450', 'Large Jet', 'Gulfstream G450',
  26300, 74600, 66000, 4400,
  29500, 100,
  470, 488, 450,
  4350, 4200,
  2600, 3600, 1500, 250,
  4000, 45000, 18,
  5450, 2820, 5200,
  16, 12,
  42.6, 7.3, 6.2,
  5500, 7000,
  2, 'Rolls-Royce', 'Tay 611-8C', 13850,
  '[
    {"weight_lbs": 50000, "fuel_burn_lbs_hr": 2300},
    {"weight_lbs": 60000, "fuel_burn_lbs_hr": 2480},
    {"weight_lbs": 70000, "fuel_burn_lbs_hr": 2600},
    {"weight_lbs": 74600, "fuel_burn_lbs_hr": 2680}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 2850},
    {"altitude_ft": 39000, "fuel_burn_lbs_hr": 2650},
    {"altitude_ft": 43000, "fuel_burn_lbs_hr": 2480},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 2400}
  ]'::jsonb,
  '[
    {"payload_lbs": 1500, "range_nm": 4350},
    {"payload_lbs": 2500, "range_nm": 4200},
    {"payload_lbs": 3500, "range_nm": 3950},
    {"payload_lbs": 4400, "range_nm": 3650}
  ]'::jsonb,
  'Gulfstream G450 - Long-range large-cabin jet. Transatlantic capability with excellent performance.'
);

-- Add Gulfstream G500
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
  'Gulfstream', 'G500', 'Large Jet', 'Gulfstream G500',
  51700, 79600, 66800, 6200,
  33400, 100,
  488, 516, 465,
  5300, 5150,
  2800, 3900, 1600, 250,
  4300, 51000, 17,
  5300, 2770, 5000,
  19, 14,
  41.5, 7.7, 6.2,
  6500, 8500,
  2, 'Pratt & Whitney Canada', 'PW814GA', 15144,
  '[
    {"weight_lbs": 55000, "fuel_burn_lbs_hr": 2450},
    {"weight_lbs": 65000, "fuel_burn_lbs_hr": 2680},
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 2800},
    {"weight_lbs": 79600, "fuel_burn_lbs_hr": 2880}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3050},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 2800},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2650},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2550}
  ]'::jsonb,
  '[
    {"payload_lbs": 2000, "range_nm": 5300},
    {"payload_lbs": 3500, "range_nm": 5100},
    {"payload_lbs": 5000, "range_nm": 4800},
    {"payload_lbs": 6200, "range_nm": 4400}
  ]'::jsonb,
  'Gulfstream G500 - Modern long-range jet with advanced technology. Excellent speed and range.'
);

-- Add Gulfstream G550
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
  'Gulfstream', 'G550', 'Large Jet', 'Gulfstream G550',
  48200, 91000, 75300, 5300,
  43500, 110,
  476, 488, 459,
  6750, 6500,
  3050, 4200, 1750, 260,
  3900, 51000, 18,
  5910, 2770, 5600,
  19, 14,
  43.9, 7.3, 6.2,
  6000, 8000,
  2, 'Rolls-Royce', 'BR710A2-20', 15385,
  '[
    {"weight_lbs": 60000, "fuel_burn_lbs_hr": 2750},
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 2950},
    {"weight_lbs": 85000, "fuel_burn_lbs_hr": 3050},
    {"weight_lbs": 91000, "fuel_burn_lbs_hr": 3130}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3350},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3050},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2880},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2780}
  ]'::jsonb,
  '[
    {"payload_lbs": 2000, "range_nm": 6750},
    {"payload_lbs": 3000, "range_nm": 6550},
    {"payload_lbs": 4000, "range_nm": 6250},
    {"payload_lbs": 5300, "range_nm": 5850}
  ]'::jsonb,
  'Gulfstream G550 - Ultra-long-range jet. Can fly nonstop from New York to Tokyo. Icon of private aviation.'
);

-- Add Gulfstream G600
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
  'Gulfstream', 'G600', 'Large Jet', 'Gulfstream G600',
  54300, 94600, 74600, 6800,
  37200, 110,
  488, 516, 465,
  6500, 6350,
  3000, 4150, 1700, 260,
  4200, 51000, 17,
  5500, 2840, 5200,
  19, 14,
  45.2, 7.7, 6.25,
  7000, 9500,
  2, 'Pratt & Whitney Canada', 'PW815GA', 15680,
  '[
    {"weight_lbs": 60000, "fuel_burn_lbs_hr": 2650},
    {"weight_lbs": 75000, "fuel_burn_lbs_hr": 2880},
    {"weight_lbs": 88000, "fuel_burn_lbs_hr": 3000},
    {"weight_lbs": 94600, "fuel_burn_lbs_hr": 3080}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3280},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3000},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 2830},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 2730}
  ]'::jsonb,
  '[
    {"payload_lbs": 2500, "range_nm": 6500},
    {"payload_lbs": 4000, "range_nm": 6300},
    {"payload_lbs": 5500, "range_nm": 6000},
    {"payload_lbs": 6800, "range_nm": 5650}
  ]'::jsonb,
  'Gulfstream G600 - Ultra-long-range with larger cabin than G550. State-of-the-art cockpit.'
);

-- Add Gulfstream G650ER
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
  'Gulfstream', 'G650ER', 'Ultra Long Range', 'Gulfstream G650',
  54200, 99600, 83500, 7000,
  46900, 120,
  488, 516, 465,
  7500, 7300,
  3300, 4600, 1850, 280,
  4000, 51000, 17,
  6299, 2770, 6000,
  19, 14,
  46.8, 8.2, 6.4,
  8500, 11000,
  2, 'Rolls-Royce', 'BR725 A1-12', 16900,
  '[
    {"weight_lbs": 65000, "fuel_burn_lbs_hr": 2950},
    {"weight_lbs": 80000, "fuel_burn_lbs_hr": 3180},
    {"weight_lbs": 92000, "fuel_burn_lbs_hr": 3300},
    {"weight_lbs": 99600, "fuel_burn_lbs_hr": 3400}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3620},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3300},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 3120},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 3000}
  ]'::jsonb,
  '[
    {"payload_lbs": 2500, "range_nm": 7500},
    {"payload_lbs": 4000, "range_nm": 7350},
    {"payload_lbs": 5500, "range_nm": 7100},
    {"payload_lbs": 7000, "range_nm": 6800}
  ]'::jsonb,
  'Gulfstream G650ER - Extended range variant. Longest range business jet. Fly anywhere nonstop.'
);

-- Add Gulfstream G700
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
  'Gulfstream', 'G700', 'Ultra Long Range', 'Gulfstream G700',
  57500, 107600, 87000, 8000,
  48300, 120,
  488, 516, 465,
  7750, 7500,
  3350, 4650, 1900, 280,
  4000, 51000, 17,
  6250, 2740, 6000,
  19, 14,
  56.8, 8.2, 6.4,
  9500, 12500,
  2, 'Rolls-Royce', 'Pearl 700', 18250,
  '[
    {"weight_lbs": 70000, "fuel_burn_lbs_hr": 2980},
    {"weight_lbs": 85000, "fuel_burn_lbs_hr": 3220},
    {"weight_lbs": 98000, "fuel_burn_lbs_hr": 3350},
    {"weight_lbs": 107600, "fuel_burn_lbs_hr": 3450}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3680},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3350},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 3170},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 3050}
  ]'::jsonb,
  '[
    {"payload_lbs": 3000, "range_nm": 7750},
    {"payload_lbs": 5000, "range_nm": 7600},
    {"payload_lbs": 6500, "range_nm": 7350},
    {"payload_lbs": 8000, "range_nm": 7000}
  ]'::jsonb,
  'Gulfstream G700 - Flagship with largest cabin in class. Ultra-long range. Pinnacle of luxury.'
);

-- Add Gulfstream G800
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
  'Gulfstream', 'G800', 'Ultra Long Range', 'Gulfstream G800',
  57000, 107600, 87000, 8200,
  51200, 120,
  488, 516, 465,
  8000, 7800,
  3320, 4630, 1880, 280,
  4000, 51000, 17,
  6250, 2740, 6000,
  19, 14,
  61.5, 8.2, 6.4,
  10000, 13000,
  2, 'Rolls-Royce', 'Pearl 700', 18250,
  '[
    {"weight_lbs": 70000, "fuel_burn_lbs_hr": 2960},
    {"weight_lbs": 85000, "fuel_burn_lbs_hr": 3200},
    {"weight_lbs": 98000, "fuel_burn_lbs_hr": 3320},
    {"weight_lbs": 107600, "fuel_burn_lbs_hr": 3420}
  ]'::jsonb,
  '[
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 3650},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 3320},
    {"altitude_ft": 47000, "fuel_burn_lbs_hr": 3140},
    {"altitude_ft": 51000, "fuel_burn_lbs_hr": 3020}
  ]'::jsonb,
  '[
    {"payload_lbs": 3000, "range_nm": 8000},
    {"payload_lbs": 5000, "range_nm": 7850},
    {"payload_lbs": 6500, "range_nm": 7600},
    {"payload_lbs": 8200, "range_nm": 7250}
  ]'::jsonb,
  'Gulfstream G800 - Longest range business jet ever. Largest cabin in Gulfstream fleet. Ultimate capability.'
);