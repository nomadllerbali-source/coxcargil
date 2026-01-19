/*
  # Add Kids Count and Property Type to Bookings

  1. Changes
    - Add `number_of_kids` column to `guests` table to track children (age below 8)
    - Add `property_type_id` column to `guests` table to link bookings to specific property types
    - Add foreign key constraint to ensure data integrity
    - Update existing records to have default values

  2. Notes
    - Kids are defined as guests below 8 years of age
    - Adults include guests 8 years and above
    - Property type selection helps manage room inventory
*/

-- Add number_of_kids column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'number_of_kids'
  ) THEN
    ALTER TABLE guests ADD COLUMN number_of_kids integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add property_type_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'property_type_id'
  ) THEN
    ALTER TABLE guests ADD COLUMN property_type_id uuid REFERENCES property_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_guests_property_type_id ON guests(property_type_id);