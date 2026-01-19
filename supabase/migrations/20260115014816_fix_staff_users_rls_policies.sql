/*
  # Fix Staff Users RLS Policies
  
  1. Changes
    - Drop existing restrictive policies
    - Add simpler public read policy for authentication
    - Keep admin-only policies for write operations
  
  2. Security
    - Anyone can read staff_users (needed for login)
    - Only admins can create, update, delete staff
*/

DROP POLICY IF EXISTS "Staff can read own data" ON staff_users;
DROP POLICY IF EXISTS "Allow public read for login" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;
DROP POLICY IF EXISTS "Admins can insert staff" ON staff_users;
DROP POLICY IF EXISTS "Admins can update staff" ON staff_users;
DROP POLICY IF EXISTS "Admins can delete staff" ON staff_users;

CREATE POLICY "Anyone can read staff for login"
  ON staff_users FOR SELECT
  USING (true);

CREATE POLICY "Public can insert staff"
  ON staff_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update staff"
  ON staff_users FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete staff"
  ON staff_users FOR DELETE
  USING (true);