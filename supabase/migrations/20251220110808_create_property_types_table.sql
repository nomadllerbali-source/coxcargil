/*
  # Create Property Types Table

  ## Overview
  This migration creates a table to store different property types/room categories
  with their configuration details.

  ## New Tables
  
  ### `property_types`
  Stores different types of properties/rooms available at the resort
  - `id` (uuid, primary key) - Unique identifier
  - `property_name` (text) - Name of the property type (e.g., "Deluxe Suite", "Ocean View Villa")
  - `number_of_rooms` (integer) - Number of rooms available in this type
  - `check_in_time` (text) - Check-in time for this property type
  - `check_out_time` (text) - Check-out time for this property type
  - `map_link` (text) - Google Maps link or location URL
  - `rules_and_regulations` (text) - Specific rules for this property type
  - `wifi_details` (text) - WiFi credentials and information
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on property_types table
  - Anyone can view property types
  - Only authenticated users can create/update property types
*/

-- Create property_types table
CREATE TABLE IF NOT EXISTS property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  number_of_rooms integer NOT NULL DEFAULT 1,
  check_in_time text NOT NULL DEFAULT '2:00 PM',
  check_out_time text NOT NULL DEFAULT '11:00 AM',
  map_link text DEFAULT '',
  rules_and_regulations text DEFAULT '',
  wifi_details text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_room_count CHECK (number_of_rooms > 0)
);

CREATE INDEX IF NOT EXISTS idx_property_types_name ON property_types(property_name);

-- Enable Row Level Security
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view property types"
  ON property_types FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert property types"
  ON property_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update property types"
  ON property_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete property types"
  ON property_types FOR DELETE
  TO authenticated
  USING (true);
