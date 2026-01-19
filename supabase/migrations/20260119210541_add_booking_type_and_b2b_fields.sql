/*
  # Add Booking Type and B2B Fields

  ## Summary
  This migration adds support for different booking types (Normal, Airbnb, MMT, B2B, Promotion, Other) 
  with appropriate fields for each type.

  ## Changes Made

  1. **Property Types Table**
     - Add `b2b_cost` column for B2B pricing

  2. **Guests Table**
     - Add `booking_type` column to track the type of booking
     - Add `agent_id` column for B2B bookings (will store agent phone number)
     - Add `manual_cost` column for Airbnb/MMT bookings where cost is manually entered

  ## Important Notes
  - Default booking type is 'normal' for existing bookings
  - B2B cost defaults to regular cost if not set
  - Manual cost is used for Airbnb and MMT bookings
*/

-- Add b2b_cost to property_types table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_types' AND column_name = 'b2b_cost'
  ) THEN
    ALTER TABLE property_types ADD COLUMN b2b_cost decimal DEFAULT 0;
  END IF;
END $$;

-- Add booking_type to guests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE guests ADD COLUMN booking_type text DEFAULT 'normal';
  END IF;
END $$;

-- Add agent_id to guests table for B2B bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE guests ADD COLUMN agent_id text;
  END IF;
END $$;

-- Add manual_cost to guests table for Airbnb/MMT bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'manual_cost'
  ) THEN
    ALTER TABLE guests ADD COLUMN manual_cost decimal DEFAULT 0;
  END IF;
END $$;

-- Add check constraint for booking_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'guests_booking_type_check'
  ) THEN
    ALTER TABLE guests ADD CONSTRAINT guests_booking_type_check 
      CHECK (booking_type IN ('normal', 'airbnb', 'mmt', 'b2b', 'promotion', 'other'));
  END IF;
END $$;