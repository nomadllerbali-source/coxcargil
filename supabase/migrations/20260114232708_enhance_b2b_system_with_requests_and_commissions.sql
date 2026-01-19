/*
  # Enhanced B2B System with Booking Requests and Commission Management

  1. Table Updates
    - `b2b_agents`
      - Add `commission_percentage` (default 10%)
    
  2. New Tables
    - `b2b_booking_requests`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key to b2b_agents)
      - `guest_name` (text)
      - `guest_phone` (text)
      - `guest_city` (text)
      - `number_of_adults` (integer)
      - `number_of_kids` (integer)
      - `check_in_date` (date)
      - `check_out_date` (date)
      - `property_type_id` (uuid, foreign key)
      - `number_of_rooms` (integer)
      - `total_cost` (numeric) - Regular price
      - `agent_rate` (numeric) - Discounted price for agent
      - `advance_amount` (numeric) - 50% of agent rate
      - `payment_screenshot_url` (text)
      - `status` (text) - pending, approved, rejected
      - `admin_notes` (text)
      - `confirmation_number` (text)
      - `created_at` (timestamp)
      - `approved_at` (timestamp)
      - `approved_by` (text)

    - `agent_commission_overrides`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key, nullable) - null means applies to all agents
      - `property_type_id` (uuid, foreign key, nullable)
      - `start_date` (date)
      - `end_date` (date)
      - `commission_percentage` (numeric)
      - `description` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `agent_notifications`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key, nullable) - null means for all agents
      - `notification_type` (text) - offer, booking_status, announcement
      - `title` (text)
      - `message` (text)
      - `related_id` (uuid, nullable) - ID of related offer or booking
      - `is_read` (boolean)
      - `created_at` (timestamp)

  3. Updates to Existing Tables
    - `special_offers`
      - Add `target_agent_id` (uuid, nullable) - specific agent or null for all

  4. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Update b2b_agents table to add commission percentage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'b2b_agents' AND column_name = 'commission_percentage'
  ) THEN
    ALTER TABLE b2b_agents ADD COLUMN commission_percentage numeric DEFAULT 10;
  END IF;
END $$;

-- Create b2b_booking_requests table
CREATE TABLE IF NOT EXISTS b2b_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES b2b_agents(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guest_city text NOT NULL,
  number_of_adults integer NOT NULL DEFAULT 1,
  number_of_kids integer NOT NULL DEFAULT 0,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  property_type_id uuid REFERENCES property_types(id) ON DELETE CASCADE,
  number_of_rooms integer NOT NULL DEFAULT 1,
  total_cost numeric NOT NULL DEFAULT 0,
  agent_rate numeric NOT NULL DEFAULT 0,
  advance_amount numeric NOT NULL DEFAULT 0,
  payment_screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  confirmation_number text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by text
);

-- Create agent_commission_overrides table
CREATE TABLE IF NOT EXISTS agent_commission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES b2b_agents(id) ON DELETE CASCADE,
  property_type_id uuid REFERENCES property_types(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  commission_percentage numeric NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create agent_notifications table
CREATE TABLE IF NOT EXISTS agent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES b2b_agents(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Update special_offers table to add target_agent_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'special_offers' AND column_name = 'target_agent_id'
  ) THEN
    ALTER TABLE special_offers ADD COLUMN target_agent_id uuid REFERENCES b2b_agents(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_b2b_booking_requests_agent ON b2b_booking_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_b2b_booking_requests_status ON b2b_booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_commission_overrides_dates ON agent_commission_overrides(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent ON agent_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_special_offers_target_agent ON special_offers(target_agent_id);

-- Enable RLS
ALTER TABLE b2b_booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for b2b_booking_requests
CREATE POLICY "Anyone can view booking requests"
  ON b2b_booking_requests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create booking requests"
  ON b2b_booking_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update booking requests"
  ON b2b_booking_requests FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete booking requests"
  ON b2b_booking_requests FOR DELETE
  TO anon, authenticated
  USING (true);

-- RLS Policies for agent_commission_overrides
CREATE POLICY "Anyone can view commission overrides"
  ON agent_commission_overrides FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create commission overrides"
  ON agent_commission_overrides FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update commission overrides"
  ON agent_commission_overrides FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete commission overrides"
  ON agent_commission_overrides FOR DELETE
  TO anon, authenticated
  USING (true);

-- RLS Policies for agent_notifications
CREATE POLICY "Anyone can view notifications"
  ON agent_notifications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create notifications"
  ON agent_notifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update notifications"
  ON agent_notifications FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete notifications"
  ON agent_notifications FOR DELETE
  TO anon, authenticated
  USING (true);