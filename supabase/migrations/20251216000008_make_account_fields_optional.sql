-- Make name and email fields optional in accounts table to allow lead conversion without mandatory fields
ALTER TABLE public.accounts
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL;

-- Update comments to reflect optional nature
COMMENT ON COLUMN public.accounts.name IS 'Account name (optional - can be populated later)';
COMMENT ON COLUMN public.accounts.email IS 'Account email (optional - can be populated later)';
