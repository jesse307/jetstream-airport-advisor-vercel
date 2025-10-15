-- Create a public storage bucket for email images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public read access for email assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');