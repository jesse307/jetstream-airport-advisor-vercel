-- Update the email template with the correct Supabase Storage URL for the image
UPDATE email_templates 
SET template_content = REPLACE(
  template_content, 
  'src="https://lovable.dev/uploads/prod/project/77c1f7ca-c9dd-4d1d-883a-1ba59a9aad73/production/images/Stratos.png"', 
  'src="https://hwemookrxvflpinfpkrj.supabase.co/storage/v1/object/public/email-assets/Stratos.png"'
)
WHERE is_default = true;