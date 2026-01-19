/*
  # Add cost field to property types

  1. Changes
    - Add `cost` column to `property_types` table
      - Type: numeric with 2 decimal places for currency
      - Default value: 0
      - Not null constraint to ensure every property has a cost
  
  2. Notes
    - Existing property types will have cost set to 0 by default
    - Admin should update costs for existing properties after migration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_types' AND column_name = 'cost'
  ) THEN
    ALTER TABLE property_types ADD COLUMN cost numeric(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;