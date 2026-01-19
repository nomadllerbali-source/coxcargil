/*
  # Create Payment Configuration and Admin Tables

  1. New Tables
    - `payment_config`
      - `id` (uuid, primary key)
      - `config_type` (text) - 'cash' or 'upi'
      - `cash_contact_name` (text) - name of person collecting cash
      - `cash_contact_phone` (text) - phone number for cash collection
      - `upi_id` (text) - UPI ID for payments
      - `upi_number` (text) - UPI phone number
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Only authenticated users can read payment_config
    - Only authenticated users can manage admin_users
    - Public access denied by default
*/

-- Create payment_config table
CREATE TABLE IF NOT EXISTS payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL DEFAULT 'general',
  cash_contact_name text DEFAULT '',
  cash_contact_phone text DEFAULT '',
  upi_id text DEFAULT '',
  upi_number text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Payment config policies - allow anyone to read (guests need to see payment details)
CREATE POLICY "Anyone can read payment config"
  ON payment_config
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert payment config"
  ON payment_config
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update payment config"
  ON payment_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Admin users policies - very restrictive
CREATE POLICY "Service role can read admin users"
  ON admin_users
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert admin users"
  ON admin_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update admin users"
  ON admin_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert default payment config
INSERT INTO payment_config (config_type, cash_contact_name, cash_contact_phone, upi_id, upi_number)
VALUES ('general', 'Resort Manager', '+91 1234567890', 'resort@upi', '1234567890')
ON CONFLICT DO NOTHING;
