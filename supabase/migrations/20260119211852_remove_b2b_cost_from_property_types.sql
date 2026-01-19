/*
  # Remove B2B Cost Column from Property Types
  
  1. Changes
    - Remove `b2b_cost` column from `property_types` table
    - B2B pricing will now be calculated dynamically using agent commission percentages
  
  2. Rationale
    - Eliminates data duplication
    - Enables flexible commission-based pricing
    - Uses existing agent_commission_overrides system for dynamic pricing
    - Single source of truth for property costs
  
  3. Notes
    - Agent commission percentages are stored in `b2b_agents.commission_percentage`
    - Time-based and property-specific overrides available via `agent_commission_overrides`
    - B2B price = Regular cost - (Regular cost × Commission % / 100)
*/

-- Remove b2b_cost column from property_types table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_types' AND column_name = 'b2b_cost'
  ) THEN
    ALTER TABLE property_types DROP COLUMN b2b_cost;
  END IF;
END $$;