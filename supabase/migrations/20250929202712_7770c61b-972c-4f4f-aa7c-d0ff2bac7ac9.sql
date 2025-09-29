-- Update Challenger 350 fuel burn rates to correct values
UPDATE aircraft 
SET 
  fuel_burn_cruise = 1600,
  fuel_burn_climb = 2300,
  fuel_burn_descent = 950,
  updated_at = now()
WHERE model = 'Challenger 350';