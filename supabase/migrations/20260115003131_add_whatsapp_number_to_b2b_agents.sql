/*
  # Add WhatsApp Number to B2B Agents

  1. Changes
    - Add `whatsapp_number` column to `b2b_agents` table for WhatsApp communication
  
  2. Details
    - Column is optional (nullable) as existing agents may not have this information
    - No default value to allow existing agents to have NULL
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'b2b_agents' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE b2b_agents ADD COLUMN whatsapp_number text;
  END IF;
END $$;
