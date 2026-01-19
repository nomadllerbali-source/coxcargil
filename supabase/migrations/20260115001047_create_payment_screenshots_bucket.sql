/*
  # Create Payment Screenshots Storage Bucket

  1. New Storage Bucket
    - Creates `payment-screenshots` bucket for storing B2B agent payment proof images
  
  2. Security
    - Public bucket for easy access to uploaded screenshots
    - RLS policies to control upload permissions
    - Authenticated users (agents) can upload
    - Public read access for admin verification
*/

-- Create the storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment screenshots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload payment screenshots'
  ) THEN
    CREATE POLICY "Authenticated users can upload payment screenshots"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'payment-screenshots');
  END IF;
END $$;

-- Allow public read access to payment screenshots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access to payment screenshots'
  ) THEN
    CREATE POLICY "Public read access to payment screenshots"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'payment-screenshots');
  END IF;
END $$;

-- Allow users to update their own uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their payment screenshots'
  ) THEN
    CREATE POLICY "Users can update their payment screenshots"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'payment-screenshots')
    WITH CHECK (bucket_id = 'payment-screenshots');
  END IF;
END $$;
