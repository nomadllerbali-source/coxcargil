/*
  # Create homepage settings table

  1. New Tables
    - `homepage_settings`
      - `id` (uuid, primary key)
      - `background_image_url` (text, URL to the homepage background image)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `homepage_settings` table
    - Add public SELECT policy for reading settings
    - Homepage settings are managed via admin service role
*/

CREATE TABLE IF NOT EXISTS homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  background_image_url text NOT NULL DEFAULT 'img-20260106-wa0035.jpg',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view homepage settings"
  ON homepage_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage homepage settings"
  ON homepage_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

INSERT INTO homepage_settings (background_image_url)
SELECT 'img-20260106-wa0035.jpg'
WHERE NOT EXISTS (SELECT 1 FROM homepage_settings);
