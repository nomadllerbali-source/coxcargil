/*
  # Add Rooms Table and Room Prefix System

  ## Overview
  This migration adds a comprehensive room numbering system where each property type
  can have individually numbered rooms (e.g., A1, A2, A3 for Attic Frame Standard).

  ## Changes

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key) - Unique identifier for each room
      - `property_type_id` (uuid, foreign key) - Links to property_types table
      - `room_number` (text) - Room identifier (e.g., "A1", "P1", "C1")
      - `is_available` (boolean) - Tracks room availability status
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Schema Modifications
    - Add `room_prefix` column to `property_types` table
      - Stores the prefix letter for room numbering (e.g., "A", "P", "C")
      - Not null, text type

  3. Security
    - Enable RLS on `rooms` table
    - Add policy for public to read all rooms
    - Add policy for authenticated users to insert rooms
    - Add policy for authenticated users to update rooms
    - Add policy for authenticated users to delete rooms

  4. Important Notes
    - Each room is uniquely identified by its room_number
    - Room numbers are generated using the property type's prefix
    - Rooms can be individually tracked for availability and bookings
    - This enables granular room management per property type
*/

-- Add room_prefix column to property_types table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_types' AND column_name = 'room_prefix'
  ) THEN
    ALTER TABLE property_types ADD COLUMN room_prefix text NOT NULL DEFAULT 'R';
  END IF;
END $$;

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type_id uuid NOT NULL REFERENCES property_types(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_type_id, room_number)
);

-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms table
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_property_type_id ON rooms(property_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_available ON rooms(is_available);