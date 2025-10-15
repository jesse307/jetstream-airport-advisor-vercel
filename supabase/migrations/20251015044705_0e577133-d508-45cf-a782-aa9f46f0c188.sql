-- Make 'New Standard Quote E-Mail' the global default template
UPDATE email_templates 
SET user_id = NULL, is_default = true 
WHERE id = 'fedd3161-a421-4f0e-86fe-d37facbb1cb2';

-- Delete all other global system templates
DELETE FROM email_templates 
WHERE user_id IS NULL 
AND id != 'fedd3161-a421-4f0e-86fe-d37facbb1cb2';