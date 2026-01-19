/*
  # Fix Payment Screenshots Bucket Policies

  1. Changes
    - Drop existing restrictive policies
    - Add new policies that allow unauthenticated uploads
    - B2B agents use custom auth, not Supabase auth
  
  2. Security
    - Allow anonymous uploads (B2B agents are not Supabase auth users)
    - Maintain public read access
    - Allow updates to uploaded files
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their payment screenshots" ON storage.objects;

-- Allow anonymous users to upload payment screenshots (for B2B agents)
CREATE POLICY "Anyone can upload payment screenshots"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow anyone to update payment screenshots
CREATE POLICY "Anyone can update payment screenshots"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'payment-screenshots')
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow anyone to delete their payment screenshots
CREATE POLICY "Anyone can delete payment screenshots"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'payment-screenshots');
