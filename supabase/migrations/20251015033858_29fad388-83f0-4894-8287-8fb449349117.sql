-- Update the template to be a system template (accessible to all users)
UPDATE public.email_templates
SET user_id = NULL
WHERE name = 'Default Lead Response';

-- Update RLS policy to allow viewing system templates (where user_id IS NULL)
DROP POLICY IF EXISTS "Users can view their own templates" ON public.email_templates;

CREATE POLICY "Users can view templates"
ON public.email_templates
FOR SELECT
TO authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

-- Allow users to copy system templates by creating their own versions
-- (existing INSERT policy already handles this)