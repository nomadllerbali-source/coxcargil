/*
  # Add Availability Field to Property Types

  ## Overview
  Adds an availability field to track whether each property type is currently available for booking.

  ## Changes
  - Add `is_available` boolean column to property_types table
  - Default value is true (available)
  
  ## Notes
  - This allows admins to mark properties as unavailable without deleting them
  - Useful for seasonal properties or properties under maintenance
*/

-- Add is_available column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_types' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE property_types ADD COLUMN is_available boolean DEFAULT true NOT NULL;
  END IF;
END $$;
