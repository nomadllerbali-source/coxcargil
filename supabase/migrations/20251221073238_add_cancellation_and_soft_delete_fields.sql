/*
  # Add Cancellation and Soft Delete Fields

  1. New Columns in guests table
    - `country_code` (varchar 10) - Store country calling code (e.g., +91, +971)
    - `is_deleted` (boolean, default false) - Soft delete flag for audit trail
    - `deleted_at` (timestamptz) - Timestamp when booking was deleted
    - `cancellation_message` (text) - Stores formatted cancellation message for admin
    - `cancelled_at` (timestamptz) - Timestamp when booking was cancelled
  
  2. New Columns in payments table
    - `refund_amount` (decimal 10,2) - Amount to be refunded on cancellation
  
  3. Indexes
    - Add index on is_deleted for efficient filtering
    - Add index on cancelled_at for reporting
  
  4. Notes
    - Soft delete preserves booking history for audit and reporting
    - Cancellation message stores formatted text for WhatsApp sharing
    - Refund amount calculated based on 3-day policy (>= 3 days: full refund, < 3 days: no refund)
*/

-- Add new columns to guests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE guests ADD COLUMN country_code varchar(10) DEFAULT '+91';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE guests ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE guests ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'cancellation_message'
  ) THEN
    ALTER TABLE guests ADD COLUMN cancellation_message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE guests ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

-- Add new column to payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'refund_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN refund_amount decimal(10,2) DEFAULT 0.00;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guests_is_deleted ON guests(is_deleted);
CREATE INDEX IF NOT EXISTS idx_guests_cancelled_at ON guests(cancelled_at);

-- Update booking_status constraint to ensure cancelled is a valid status (it should already be there)
-- No change needed as 'cancelled' is already in the constraint