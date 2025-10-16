-- Add source_url column to leads table to store the URL from captured lead data
ALTER TABLE leads ADD COLUMN source_url text;