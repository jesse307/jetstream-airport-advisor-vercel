-- Add fleet_type column to trusted_operators table
ALTER TABLE public.trusted_operators
ADD COLUMN IF NOT EXISTS fleet_type TEXT DEFAULT 'fixed' CHECK (fleet_type IN ('floating', 'fixed'));

-- Add comment to explain the column
COMMENT ON COLUMN public.trusted_operators.fleet_type IS 'Indicates whether the operator has a floating fleet (aircraft available for charter) or fixed fleet (dedicated aircraft)';
