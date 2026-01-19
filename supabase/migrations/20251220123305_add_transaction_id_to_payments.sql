/*
  # Add Transaction ID to Payments Table

  1. Changes
    - Add `transaction_id` column to `payments` table
      - Type: text
      - Nullable: true
      - Used to store UPI/online transaction IDs for payment tracking
  
  2. Notes
    - This field is optional and primarily used for UPI payments
    - Allows tracking of payment transactions for reconciliation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN transaction_id text;
  END IF;
END $$;
