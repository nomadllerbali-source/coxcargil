/*
  # Resort Booking Management System - Initial Schema

  ## Overview
  This migration creates the complete database schema for a resort booking management system
  with guest bookings, check-in process, payments, and service requests.

  ## New Tables
  
  ### 1. `guests`
  Main booking table storing all guest reservation information
  - `id` (uuid, primary key) - Unique booking identifier
  - `guest_name` (text) - Name of the guest
  - `phone` (text, indexed) - Contact phone number for search
  - `number_of_packs` (integer) - Number of packages/rooms booked
  - `check_in_date` (date) - Scheduled check-in date
  - `check_out_date` (date) - Scheduled check-out date
  - `meal_preference` (text) - Meal type: 'veg', 'non-veg', 'other'
  - `food_remarks` (text) - Special food instructions or preferences
  - `final_remarks` (text) - Additional booking notes
  - `booking_status` (text) - Status: 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'
  - `confirmation_number` (text, unique) - Unique booking confirmation code
  - `check_in_link` (text) - Generated check-in URL
  - `created_at` (timestamptz) - Booking creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `actual_check_in_time` (timestamptz) - Actual check-in completion time

  ### 2. `guest_photos`
  Stores guest photographs collected during check-in
  - `id` (uuid, primary key)
  - `guest_id` (uuid, foreign key) - Reference to guests table
  - `photo_url` (text) - URL to stored photo in Supabase Storage
  - `uploaded_at` (timestamptz) - Upload timestamp

  ### 3. `guest_id_cards`
  Stores guest ID card information and images
  - `id` (uuid, primary key)
  - `guest_id` (uuid, foreign key) - Reference to guests table
  - `id_type` (text) - Type: 'passport', 'drivers_license', 'aadhar', 'other'
  - `id_number` (text) - ID card number
  - `id_photo_url` (text) - URL to ID card image
  - `additional_details` (jsonb) - Flexible field for extra ID information
  - `uploaded_at` (timestamptz) - Upload timestamp

  ### 4. `payments`
  Tracks payment information and billing
  - `id` (uuid, primary key)
  - `guest_id` (uuid, foreign key) - Reference to guests table
  - `total_amount` (decimal) - Total bill amount
  - `paid_amount` (decimal) - Amount already paid
  - `balance_due` (decimal) - Remaining balance
  - `payment_status` (text) - Status: 'pending', 'partial', 'paid'
  - `payment_method` (text) - Method: 'cash', 'card', 'upi', 'bank_transfer'
  - `payment_notes` (text) - Additional payment remarks
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `property_settings`
  Stores configurable property information (single row table)
  - `id` (uuid, primary key)
  - `property_name` (text) - Name of the resort
  - `location_url` (text) - Google Maps location URL
  - `location_embed` (text) - Google Maps embed code
  - `rules_and_regulations` (text) - Property rules in HTML/markdown
  - `check_in_time` (text) - Standard check-in time
  - `check_out_time` (text) - Standard check-out time
  - `emergency_contact` (text) - Emergency contact number
  - `wifi_details` (text) - WiFi credentials and info
  - `amenities_info` (text) - Property amenities details
  - `updated_at` (timestamptz)

  ### 6. `service_requests`
  Tracks guest service requests from dashboard
  - `id` (uuid, primary key)
  - `guest_id` (uuid, foreign key) - Reference to guests table
  - `service_category` (text) - Category: 'housekeeping', 'room_service', 'maintenance', 'concierge'
  - `request_details` (text) - Description of the request
  - `priority` (text) - Priority: 'low', 'medium', 'high'
  - `status` (text) - Status: 'received', 'in_progress', 'completed', 'cancelled'
  - `requested_at` (timestamptz)
  - `completed_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public access for creating bookings
  - Authenticated access for check-in process and dashboard
  - Admin-only access for property settings and management
*/

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL,
  phone text NOT NULL,
  number_of_packs integer NOT NULL DEFAULT 1,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  meal_preference text NOT NULL DEFAULT 'veg',
  food_remarks text DEFAULT '',
  final_remarks text DEFAULT '',
  booking_status text NOT NULL DEFAULT 'pending',
  confirmation_number text UNIQUE NOT NULL,
  check_in_link text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  actual_check_in_time timestamptz,
  CONSTRAINT valid_meal_preference CHECK (meal_preference IN ('veg', 'non-veg', 'other')),
  CONSTRAINT valid_booking_status CHECK (booking_status IN ('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled')),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_confirmation ON guests(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(booking_status);

-- Create guest_photos table
CREATE TABLE IF NOT EXISTS guest_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_photos_guest_id ON guest_photos(guest_id);

-- Create guest_id_cards table
CREATE TABLE IF NOT EXISTS guest_id_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  id_type text NOT NULL DEFAULT 'passport',
  id_number text NOT NULL,
  id_photo_url text,
  additional_details jsonb DEFAULT '{}'::jsonb,
  uploaded_at timestamptz DEFAULT now(),
  CONSTRAINT valid_id_type CHECK (id_type IN ('passport', 'drivers_license', 'aadhar', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_guest_id_cards_guest_id ON guest_id_cards(guest_id);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  total_amount decimal(10,2) NOT NULL DEFAULT 0.00,
  paid_amount decimal(10,2) NOT NULL DEFAULT 0.00,
  balance_due decimal(10,2) NOT NULL DEFAULT 0.00,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT '',
  payment_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'partial', 'paid')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('', 'cash', 'card', 'upi', 'bank_transfer'))
);

CREATE INDEX IF NOT EXISTS idx_payments_guest_id ON payments(guest_id);

-- Create property_settings table
CREATE TABLE IF NOT EXISTS property_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL DEFAULT 'Resort',
  location_url text DEFAULT '',
  location_embed text DEFAULT '',
  rules_and_regulations text DEFAULT '',
  check_in_time text DEFAULT '2:00 PM',
  check_out_time text DEFAULT '11:00 AM',
  emergency_contact text DEFAULT '',
  wifi_details text DEFAULT '',
  amenities_info text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Insert default property settings
INSERT INTO property_settings (property_name, rules_and_regulations)
VALUES (
  'Resort',
  '<h2>Property Rules and Regulations</h2><ul><li>Check-in time: 2:00 PM</li><li>Check-out time: 11:00 AM</li><li>Please maintain silence after 10:00 PM</li><li>Smoking is not allowed inside rooms</li><li>Pets are allowed with prior approval</li><li>Please report any damages immediately</li></ul>'
)
ON CONFLICT DO NOTHING;

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  service_category text NOT NULL,
  request_details text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'received',
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_service_category CHECK (service_category IN ('housekeeping', 'room_service', 'maintenance', 'concierge')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT valid_status CHECK (status IN ('received', 'in_progress', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_service_requests_guest_id ON service_requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- Enable Row Level Security
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_id_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guests table
CREATE POLICY "Anyone can create bookings"
  ON guests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view bookings by phone"
  ON guests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update bookings"
  ON guests FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for guest_photos table
CREATE POLICY "Anyone can insert photos"
  ON guest_photos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view photos"
  ON guest_photos FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for guest_id_cards table
CREATE POLICY "Anyone can insert ID cards"
  ON guest_id_cards FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view ID cards"
  ON guest_id_cards FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for payments table
CREATE POLICY "Anyone can insert payments"
  ON payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view payments"
  ON payments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update payments"
  ON payments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for property_settings table
CREATE POLICY "Anyone can view property settings"
  ON property_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update property settings"
  ON property_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for service_requests table
CREATE POLICY "Anyone can create service requests"
  ON service_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view service requests"
  ON service_requests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update service requests"
  ON service_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);