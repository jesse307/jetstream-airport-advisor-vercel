-- Add Challenger 300
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
  'Bombardier', 'Challenger 300', 'Super Midsize Jet', 'Challenger 300',
  21000, 38850, 34850, 3100,
  10600, 70,
  450, 470, 430,
  3100, 2950,
  1700, 2400, 1000, 220,
  3900, 45000, 19,
  4750, 2770, 4500,
  10, 8,
  25.3, 7.2, 6.1,
  3800, 4800,
  2, 'Honeywell', 'HTF7000', 6826,
  '[
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1500},
    {"weight_lbs": 33000, "fuel_burn_lbs_hr": 1630},
    {"weight_lbs": 36000, "fuel_burn_lbs_hr": 1700},
    {"weight_lbs": 38850, "fuel_burn_lbs_hr": 1760}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1850},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1700},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1600},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 1540}
  ]'::jsonb,
  '[
    {"payload_lbs": 1200, "range_nm": 3100},
    {"payload_lbs": 1800, "range_nm": 3000},
    {"payload_lbs": 2400, "range_nm": 2800},
    {"payload_lbs": 3100, "range_nm": 2500}
  ]'::jsonb,
  'Challenger 300 - Super midsize with wide-body cabin comfort. Popular for transcontinental flights.'
);

-- Add Challenger 350
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
  'Bombardier', 'Challenger 350', 'Super Midsize Jet', 'Challenger 350',
  21500, 39000, 35000, 3150,
  10700, 70,
  450, 470, 430,
  3300, 3150,
  1720, 2450, 1000, 220,
  4000, 45000, 19,
  4830, 2700, 4500,
  10, 8,
  25.3, 7.2, 6.1,
  3900, 4900,
  2, 'Honeywell', 'HTF7350', 7323,
  '[
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1520},
    {"weight_lbs": 33000, "fuel_burn_lbs_hr": 1650},
    {"weight_lbs": 36500, "fuel_burn_lbs_hr": 1720},
    {"weight_lbs": 39000, "fuel_burn_lbs_hr": 1780}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1880},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1720},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1610},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 1550}
  ]'::jsonb,
  '[
    {"payload_lbs": 1200, "range_nm": 3300},
    {"payload_lbs": 1800, "range_nm": 3200},
    {"payload_lbs": 2400, "range_nm": 3000},
    {"payload_lbs": 3150, "range_nm": 2750}
  ]'::jsonb,
  'Challenger 350 - Enhanced version of 300. Excellent range and cabin comfort. Very popular.'
);

-- Add Challenger 3500
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
  'Bombardier', 'Challenger 3500', 'Super Midsize Jet', 'Challenger 3500',
  21800, 39000, 35000, 3200,
  10800, 70,
  450, 475, 430,
  3400, 3200,
  1690, 2420, 980, 220,
  4100, 45000, 18,
  4835, 2693, 4500,
  10, 8,
  25.3, 7.2, 6.1,
  4000, 5000,
  2, 'Honeywell', 'HTF7350', 7323,
  '[
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1480},
    {"weight_lbs": 33000, "fuel_burn_lbs_hr": 1620},
    {"weight_lbs": 36500, "fuel_burn_lbs_hr": 1690},
    {"weight_lbs": 39000, "fuel_burn_lbs_hr": 1750}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1850},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1690},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1580},
    {"altitude_ft": 45000, "fuel_burn_lbs_hr": 1520}
  ]'::jsonb,
  '[
    {"payload_lbs": 1200, "range_nm": 3400},
    {"payload_lbs": 1800, "range_nm": 3300},
    {"payload_lbs": 2400, "range_nm": 3100},
    {"payload_lbs": 3200, "range_nm": 2850}
  ]'::jsonb,
  'Challenger 3500 - Latest generation with improved range and modern cabin. Launched 2022.'
);

-- Add Hawker 800XP
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
  'Hawker Beechcraft', 'Hawker 800XP', 'Midsize Jet', 'Hawker 800XP',
  15300, 28000, 25500, 2650,
  8600, 60,
  420, 447, 400,
  2540, 2400,
  1580, 2200, 900, 200,
  3270, 41000, 21,
  5030, 2675, 4800,
  8, 6,
  21.3, 6.0, 5.8,
  3000, 3800,
  2, 'Honeywell', 'TFE731-5BR', 4660,
  '[
    {"weight_lbs": 20000, "fuel_burn_lbs_hr": 1380},
    {"weight_lbs": 24000, "fuel_burn_lbs_hr": 1500},
    {"weight_lbs": 26500, "fuel_burn_lbs_hr": 1580},
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1630}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1720},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1580},
    {"altitude_ft": 39000, "fuel_burn_lbs_hr": 1490},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1450}
  ]'::jsonb,
  '[
    {"payload_lbs": 1000, "range_nm": 2540},
    {"payload_lbs": 1500, "range_nm": 2450},
    {"payload_lbs": 2000, "range_nm": 2300},
    {"payload_lbs": 2650, "range_nm": 2100}
  ]'::jsonb,
  'Hawker 800XP - Reliable midsize jet. Wide cabin and solid performance. Production 1995-2005.'
);

-- Add Hawker 850XP
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
  'Hawker Beechcraft', 'Hawker 850XP', 'Midsize Jet', 'Hawker 850XP',
  15500, 28000, 25500, 2700,
  8700, 60,
  425, 450, 405,
  2642, 2500,
  1600, 2240, 910, 200,
  3370, 41000, 20,
  5030, 2703, 4800,
  8, 6,
  21.3, 6.0, 5.8,
  3100, 3900,
  2, 'Honeywell', 'TFE731-5BR', 4660,
  '[
    {"weight_lbs": 20000, "fuel_burn_lbs_hr": 1400},
    {"weight_lbs": 24000, "fuel_burn_lbs_hr": 1520},
    {"weight_lbs": 26500, "fuel_burn_lbs_hr": 1600},
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1650}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1750},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1600},
    {"altitude_ft": 39000, "fuel_burn_lbs_hr": 1510},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1470}
  ]'::jsonb,
  '[
    {"payload_lbs": 1000, "range_nm": 2642},
    {"payload_lbs": 1500, "range_nm": 2550},
    {"payload_lbs": 2000, "range_nm": 2400},
    {"payload_lbs": 2700, "range_nm": 2200}
  ]'::jsonb,
  'Hawker 850XP - Improved 800XP with extended range. Enhanced avionics. Production 2006-2009.'
);

-- Add Hawker 900XP
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
  'Hawker Beechcraft', 'Hawker 900XP', 'Midsize Jet', 'Hawker 900XP',
  16100, 28000, 25500, 2750,
  8800, 60,
  428, 453, 408,
  2710, 2565,
  1620, 2260, 920, 200,
  3450, 41000, 20,
  5030, 2730, 4800,
  9, 7,
  21.3, 6.0, 5.8,
  3200, 4000,
  2, 'Honeywell', 'TFE731-50R', 4660,
  '[
    {"weight_lbs": 20000, "fuel_burn_lbs_hr": 1420},
    {"weight_lbs": 24000, "fuel_burn_lbs_hr": 1540},
    {"weight_lbs": 26500, "fuel_burn_lbs_hr": 1620},
    {"weight_lbs": 28000, "fuel_burn_lbs_hr": 1670}
  ]'::jsonb,
  '[
    {"altitude_ft": 27000, "fuel_burn_lbs_hr": 1770},
    {"altitude_ft": 35000, "fuel_burn_lbs_hr": 1620},
    {"altitude_ft": 39000, "fuel_burn_lbs_hr": 1530},
    {"altitude_ft": 41000, "fuel_burn_lbs_hr": 1490}
  ]'::jsonb,
  '[
    {"payload_lbs": 1000, "range_nm": 2710},
    {"payload_lbs": 1500, "range_nm": 2620},
    {"payload_lbs": 2000, "range_nm": 2470},
    {"payload_lbs": 2750, "range_nm": 2250}
  ]'::jsonb,
  'Hawker 900XP - Most advanced Hawker 800 series. Best range and payload. Production 2007-2012.'
);