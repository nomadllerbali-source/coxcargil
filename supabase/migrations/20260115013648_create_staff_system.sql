/*
  # Create Staff Management System
  
  1. New Tables
    - `staff_users`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Staff email for login
      - `password_hash` (text) - Hashed password
      - `full_name` (text) - Staff member's full name
      - `phone` (text) - Contact number
      - `role` (text) - Staff role (receptionist, manager, etc)
      - `is_active` (boolean) - Account status
      - `created_by` (uuid) - Admin who created this staff
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `staff_users` table
    - Add policy for staff to read own data
    - Add policy for admins to manage all staff
*/

CREATE TABLE IF NOT EXISTS staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text DEFAULT 'receptionist',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read own data"
  ON staff_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow public read for login"
  ON staff_users FOR SELECT
  USING (true);

CREATE POLICY "Admins can view all staff"
  ON staff_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert staff"
  ON staff_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update staff"
  ON staff_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete staff"
  ON staff_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );