-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('koa-attachments', 'koa-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Allow Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete Access" ON storage.objects;

-- Create policy for public read access (SELECT)
CREATE POLICY "Allow Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'koa-attachments');

-- Create policy for write access (INSERT)
CREATE POLICY "Allow Insert Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'koa-attachments');

-- Create policy for write access (UPDATE)
CREATE POLICY "Allow Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'koa-attachments');

-- Create policy for write access (DELETE)
CREATE POLICY "Allow Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'koa-attachments');
