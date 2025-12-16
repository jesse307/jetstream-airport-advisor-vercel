-- Make opportunity name optional to allow lead conversion without mandatory fields
ALTER TABLE public.opportunities
ALTER COLUMN name DROP NOT NULL;

-- Update comment to reflect optional nature
COMMENT ON COLUMN public.opportunities.name IS 'Opportunity name (optional - auto-generated if not provided)';
