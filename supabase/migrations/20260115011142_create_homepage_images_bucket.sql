/*
  # Create homepage images storage bucket

  1. Storage
    - Create `homepage-images` bucket for storing homepage background images
    - Set up RLS policies for public read and admin upload
  
  2. Security
    - Public users can read/download images
    - Authenticated users can upload/modify images
    - File size limit enforced client-side: 200 KB
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage-images', 'homepage-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read homepage images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'homepage-images');

CREATE POLICY "Authenticated users can upload homepage images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'homepage-images');

CREATE POLICY "Authenticated users can delete homepage images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'homepage-images');
