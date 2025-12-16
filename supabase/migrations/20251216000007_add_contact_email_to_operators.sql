-- Add contact_email column to trusted_operators table
ALTER TABLE public.trusted_operators
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.trusted_operators.contact_email IS 'Contact email address for the operator';
