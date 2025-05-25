-- Migration: Add queen-specific fields to ants table
-- Date: 2024-12-19
-- Description: Add fields needed for queen ant functionality and reproduction mechanics

-- Add queen-specific fields to ants table
ALTER TABLE ants 
ADD COLUMN IF NOT EXISTS is_queen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS eggs_laid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_egg_production TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'worker';

-- Update the type field to match role for existing ants
UPDATE ants SET type = role::text WHERE type = 'worker';

-- Add index for queen queries
CREATE INDEX IF NOT EXISTS idx_ants_is_queen ON ants(is_queen);
CREATE INDEX IF NOT EXISTS idx_ants_type ON ants(type);

-- Add constraint to ensure only one queen per colony (optional, can be relaxed later)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_one_queen_per_colony ON ants(colony_id) WHERE is_queen = true;

-- Update existing queen ants if any exist (based on role)
UPDATE ants SET 
  is_queen = true,
  type = 'queen'
WHERE role = 'nurse' AND name = 'Queen';

-- Add comments for documentation
COMMENT ON COLUMN ants.is_queen IS 'Whether this ant is a queen (can lay eggs)';
COMMENT ON COLUMN ants.eggs_laid IS 'Total number of eggs this queen has laid';
COMMENT ON COLUMN ants.last_egg_production IS 'Timestamp of when this queen last laid an egg';
COMMENT ON COLUMN ants.type IS 'Ant type (worker, scout, soldier, queen, etc.)';

-- Create a view for easy queen queries
CREATE OR REPLACE VIEW colony_queens AS
SELECT 
  c.id as colony_id,
  c.name as colony_name,
  a.id as queen_id,
  a.name as queen_name,
  a.health,
  a.age_in_ticks,
  a.max_age_in_ticks,
  a.eggs_laid,
  a.last_egg_production,
  a.created_at as queen_created_at
FROM colonies c
LEFT JOIN ants a ON c.id = a.colony_id AND a.is_queen = true AND a.status = 'adult'
ORDER BY c.name, a.created_at; 