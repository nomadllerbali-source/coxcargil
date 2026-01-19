/*
  # Fix Property Types RLS Policies

  ## Overview
  Updates RLS policies for property_types table to allow anonymous access,
  matching the access pattern used for other tables in the system.

  ## Changes
  - Drop existing restrictive policies
  - Add new policies that allow anonymous and authenticated users to perform all operations
  
  ## Security Note
  This allows open access to property type management. In production, you should
  implement proper authentication and restrict these policies to admin users only.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert property types" ON property_types;
DROP POLICY IF EXISTS "Authenticated users can update property types" ON property_types;
DROP POLICY IF EXISTS "Authenticated users can delete property types" ON property_types;

-- Create new permissive policies
CREATE POLICY "Anyone can insert property types"
  ON property_types FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update property types"
  ON property_types FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete property types"
  ON property_types FOR DELETE
  TO anon, authenticated
  USING (true);
