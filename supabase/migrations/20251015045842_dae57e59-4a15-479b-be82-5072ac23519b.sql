-- Fix the image link to use the correct deployed app URL
UPDATE email_templates 
SET template_content = REPLACE(
  template_content, 
  'src="https://hwemookrxvflpinfpkrj.supabase.co/storage/v1/object/public/images/Stratos.png"', 
  'src="https://lovable.dev/uploads/prod/project/77c1f7ca-c9dd-4d1d-883a-1ba59a9aad73/production/images/Stratos.png"'
)
WHERE is_default = true;