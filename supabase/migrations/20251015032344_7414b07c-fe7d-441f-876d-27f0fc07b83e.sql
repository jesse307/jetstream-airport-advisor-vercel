-- Add subject column to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN subject TEXT NOT NULL DEFAULT 'Email Subject';