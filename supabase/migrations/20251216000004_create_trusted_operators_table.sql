-- Create trusted_operators table
CREATE TABLE IF NOT EXISTS public.trusted_operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_name TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add operator_id to aircraft_locations to link aircraft to operators
ALTER TABLE public.aircraft_locations
ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES public.trusted_operators(id) ON DELETE SET NULL;

-- Create index for faster operator lookups
CREATE INDEX IF NOT EXISTS idx_trusted_operators_company_id ON public.trusted_operators(company_id);
CREATE INDEX IF NOT EXISTS idx_trusted_operators_user_id ON public.trusted_operators(user_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_locations_operator_id ON public.aircraft_locations(operator_id);

-- Enable Row Level Security
ALTER TABLE public.trusted_operators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trusted_operators
CREATE POLICY "Users can view their own trusted operators"
  ON public.trusted_operators
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trusted operators"
  ON public.trusted_operators
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trusted operators"
  ON public.trusted_operators
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted operators"
  ON public.trusted_operators
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update aircraft_locations RLS to allow access for user's trusted operators
DROP POLICY IF EXISTS "Allow public aircraft location viewing" ON public.aircraft_locations;
DROP POLICY IF EXISTS "Allow authenticated users to view aircraft" ON public.aircraft_locations;
DROP POLICY IF EXISTS "Allow authenticated users to insert aircraft" ON public.aircraft_locations;
DROP POLICY IF EXISTS "Allow authenticated users to update aircraft" ON public.aircraft_locations;
DROP POLICY IF EXISTS "Allow authenticated users to delete aircraft" ON public.aircraft_locations;

-- Create new RLS policies for aircraft_locations that work with trusted_operators
CREATE POLICY "Users can view aircraft from their trusted operators"
  ON public.aircraft_locations
  FOR SELECT
  USING (
    is_trusted = true OR
    operator_id IN (
      SELECT id FROM public.trusted_operators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert aircraft"
  ON public.aircraft_locations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update aircraft from their trusted operators"
  ON public.aircraft_locations
  FOR UPDATE
  USING (
    operator_id IN (
      SELECT id FROM public.trusted_operators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete aircraft from their trusted operators"
  ON public.aircraft_locations
  FOR DELETE
  USING (
    operator_id IN (
      SELECT id FROM public.trusted_operators WHERE user_id = auth.uid()
    )
  );
