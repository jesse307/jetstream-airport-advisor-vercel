-- Fix the image link in the default email template to use absolute path
UPDATE email_templates 
SET template_content = REPLACE(template_content, 'src="images/Stratos.png"', 'src="https://hwemookrxvflpinfpkrj.supabase.co/storage/v1/object/public/images/Stratos.png"')
WHERE is_default = true;