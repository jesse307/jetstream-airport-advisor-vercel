-- Create fallback_airports table for storing airport data scraped from external sources
CREATE TABLE IF NOT EXISTS public.fallback_airports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text,
  city text,
  state text,
  country text,
  latitude numeric,
  longitude numeric,
  elevation integer,
  runway_length integer,
  runway_surface text,
  fbo jsonb,
  source text NOT NULL DEFAULT 'airnav',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fallback_airports ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public fallback airport viewing" 
ON public.fallback_airports 
FOR SELECT 
USING (true);

-- Allow public insert for fallback data
CREATE POLICY "Allow public fallback airport insertion" 
ON public.fallback_airports 
FOR INSERT 
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_fallback_airports_code ON public.fallback_airports(code);

-- Add update trigger
CREATE TRIGGER update_fallback_airports_updated_at
BEFORE UPDATE ON public.fallback_airports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();