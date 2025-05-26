-- Antopolis Database Migration Script
-- Complete schema for Supabase production database
-- Run this script in your Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for game saves and progress)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Colonies table (main player entities)
CREATE TABLE IF NOT EXISTS colonies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#8B4513', -- Hex color code
  
  -- Colony stats
  population INTEGER DEFAULT 10,
  max_population INTEGER DEFAULT 100,
  food_storage INTEGER DEFAULT 100,
  food_consumed_per_tick INTEGER DEFAULT 1,
  
  -- Position and territory
  map_seed VARCHAR(50),
  territory_size INTEGER DEFAULT 5,
  
  -- Game state
  game_speed REAL DEFAULT 1.0,
  last_tick TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_ticks INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  difficulty_level VARCHAR(20) DEFAULT 'medium',
  
  -- Evolution system
  evolution_points INTEGER DEFAULT 0,
  total_evolution_points_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ant types/roles enumeration
DO $$ BEGIN
  CREATE TYPE ant_role AS ENUM ('worker', 'soldier', 'forager', 'scout', 'nurse', 'builder');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ant_status AS ENUM ('egg', 'larva', 'pupa', 'adult', 'dead');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ants table (individual ants in colonies)
CREATE TABLE IF NOT EXISTS ants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(50),
  role ant_role NOT NULL DEFAULT 'worker',
  type VARCHAR(20) DEFAULT 'worker',
  status ant_status NOT NULL DEFAULT 'egg',
  
  -- Queen-specific fields
  is_queen BOOLEAN DEFAULT false,
  eggs_laid INTEGER DEFAULT 0,
  last_egg_production TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  max_energy INTEGER DEFAULT 100,
  experience INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  -- Lifecycle
  age_in_ticks INTEGER DEFAULT 0,
  max_age_in_ticks INTEGER DEFAULT 1000,
  
  -- Location and activity
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  current_task VARCHAR(50),
  task_progress REAL DEFAULT 0.0,
  
  -- Parent tracking for breeding
  parent1_id UUID REFERENCES ants(id),
  parent2_id UUID REFERENCES ants(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource types
DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('food', 'wood', 'stone', 'water', 'minerals');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Resources table (colony resources)
CREATE TABLE IF NOT EXISTS colony_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  amount INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 1000,
  production_rate REAL DEFAULT 0.0,
  consumption_rate REAL DEFAULT 0.0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(colony_id, resource_type)
);

-- Building types
DO $$ BEGIN
  CREATE TYPE building_type AS ENUM (
    'nest_chamber', 'food_storage', 'nursery', 'barracks', 
    'workshop', 'tunnel', 'farm', 'wall', 'watchtower'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Buildings/Structures table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  building_type building_type NOT NULL,
  name VARCHAR(100),
  
  -- Position
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  
  -- Status
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  construction_progress REAL DEFAULT 1.0,
  
  -- Effects
  capacity_bonus INTEGER DEFAULT 0,
  production_bonus REAL DEFAULT 0.0,
  defense_bonus INTEGER DEFAULT 0,
  
  -- Costs and requirements
  build_cost JSONB DEFAULT '{}'::jsonb,
  maintenance_cost JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Map territories (procedurally generated tiles)
CREATE TABLE IF NOT EXISTS map_tiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID REFERENCES colonies(id) ON DELETE CASCADE,
  
  -- Position
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  
  -- Tile properties
  terrain_type VARCHAR(20) NOT NULL DEFAULT 'grass',
  elevation INTEGER DEFAULT 0,
  
  -- Resources
  resource_type resource_type,
  resource_amount INTEGER DEFAULT 0,
  resource_regeneration_rate REAL DEFAULT 0.0,
  
  -- Visibility and control
  is_explored BOOLEAN DEFAULT false,
  is_controlled BOOLEAN DEFAULT false,
  control_strength INTEGER DEFAULT 0,
  
  -- Special features
  has_water BOOLEAN DEFAULT false,
  has_obstacles BOOLEAN DEFAULT false,
  danger_level INTEGER DEFAULT 0,
  
  discovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(colony_id, x, y)
);

-- Evolution/Tech tree
CREATE TABLE IF NOT EXISTS technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  
  -- Requirements
  required_research_points INTEGER DEFAULT 100,
  prerequisite_techs JSONB DEFAULT '[]'::jsonb,
  required_buildings JSONB DEFAULT '[]'::jsonb,
  
  -- Effects
  effects JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evolution point transactions (for tracking earning history)
CREATE TABLE IF NOT EXISTS evolution_point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  points_earned INTEGER NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'resource_collection', 'combat_victory', 'milestone', 'manual'
  source_details JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colony tech progress
CREATE TABLE IF NOT EXISTS colony_technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES technologies(id),
  
  research_progress INTEGER DEFAULT 0,
  is_researched BOOLEAN DEFAULT false,
  researched_at TIMESTAMP WITH TIME ZONE,
  evolution_points_spent INTEGER DEFAULT 0,
  
  UNIQUE(colony_id, technology_id)
);

-- Battle system
DO $$ BEGIN
  CREATE TYPE battle_status AS ENUM ('preparing', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE battle_outcome AS ENUM ('victory', 'defeat', 'draw');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants
  attacker_colony_id UUID NOT NULL REFERENCES colonies(id),
  defender_colony_id UUID NOT NULL REFERENCES colonies(id),
  
  -- Battle info
  battle_type VARCHAR(50) DEFAULT 'territory_raid',
  status battle_status DEFAULT 'preparing',
  outcome battle_outcome,
  
  -- Location
  battle_x INTEGER,
  battle_y INTEGER,
  
  -- Forces
  attacker_forces JSONB DEFAULT '[]'::jsonb,
  defender_forces JSONB DEFAULT '[]'::jsonb,
  
  -- Results
  attacker_casualties INTEGER DEFAULT 0,
  defender_casualties INTEGER DEFAULT 0,
  resources_looted JSONB DEFAULT '{}'::jsonb,
  territory_gained INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions/saves
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  session_name VARCHAR(100) NOT NULL,
  game_state JSONB DEFAULT '{}'::jsonb,
  
  -- Progress tracking
  total_play_time INTEGER DEFAULT 0, -- in seconds
  achievements JSONB DEFAULT '[]'::jsonb,
  statistics JSONB DEFAULT '{}'::jsonb,
  
  -- Save info
  is_autosave BOOLEAN DEFAULT false,
  save_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events/Log system for game history
CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  message TEXT,
  importance INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
  
  game_tick INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colony Statistics table for tracking numerical stats
CREATE TABLE IF NOT EXISTS colony_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  -- Stat identification
  stat_type VARCHAR(50) NOT NULL, -- 'population', 'food_harvested', 'battles_won', etc.
  stat_category VARCHAR(30) NOT NULL, -- 'population', 'resources', 'combat', 'construction'
  stat_subtype VARCHAR(50), -- For detailed categorization (e.g., food type, ant type)
  
  -- Stat values
  value_int INTEGER DEFAULT 0, -- For integer stats
  value_float REAL DEFAULT 0.0, -- For decimal stats  
  value_json JSONB DEFAULT '{}'::jsonb, -- For complex stats
  
  -- Metadata
  description TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_tick INTEGER DEFAULT 0,
  
  -- Indexing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colony Events table for timeline/history tracking
CREATE TABLE IF NOT EXISTS colony_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  -- Event identification
  event_type VARCHAR(50) NOT NULL, -- 'milestone', 'combat', 'discovery', 'construction'
  event_subtype VARCHAR(50), -- Detailed event categorization
  
  -- Event details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  importance_level INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
  
  -- Event data
  event_data JSONB DEFAULT '{}'::jsonb, -- Flexible event details
  related_entity_id UUID, -- Reference to related ant, structure, etc.
  related_entity_type VARCHAR(50), -- 'ant', 'structure', 'battle', etc.
  
  -- Location data (if applicable)
  location_x INTEGER,
  location_y INTEGER,
  
  -- Timing
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_tick INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colony Milestones table for special achievements/markers
CREATE TABLE IF NOT EXISTS colony_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  -- Milestone details
  milestone_type VARCHAR(50) NOT NULL, -- 'population', 'territory', 'combat', 'age'
  milestone_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Milestone criteria
  threshold_value INTEGER,
  threshold_type VARCHAR(30), -- 'greater_than', 'equal_to', 'less_than'
  
  -- Achievement tracking
  achieved_at TIMESTAMP WITH TIME ZONE,
  achieved_game_tick INTEGER,
  achievement_value INTEGER, -- The actual value when achieved
  
  -- Metadata
  is_achieved BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true, -- Whether to show in UI
  reward_data JSONB DEFAULT '{}'::jsonb, -- Any rewards given
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(colony_id, milestone_type, milestone_name)
);

-- Colony Session Statistics for comparative analysis
CREATE TABLE IF NOT EXISTS colony_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  -- Session info
  session_name VARCHAR(100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Final statistics snapshot
  final_statistics JSONB DEFAULT '{}'::jsonb,
  session_duration INTEGER, -- in seconds
  total_game_ticks INTEGER DEFAULT 0,
  
  -- Summary metrics
  peak_population INTEGER DEFAULT 0,
  total_food_harvested INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  structures_built INTEGER DEFAULT 0,
  territory_explored REAL DEFAULT 0.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_colonies_user_id ON colonies(user_id);
CREATE INDEX IF NOT EXISTS idx_colonies_active ON colonies(is_active);
CREATE INDEX IF NOT EXISTS idx_ants_colony_id ON ants(colony_id);
CREATE INDEX IF NOT EXISTS idx_ants_role ON ants(role);
CREATE INDEX IF NOT EXISTS idx_ants_type ON ants(type);
CREATE INDEX IF NOT EXISTS idx_ants_status ON ants(status);
CREATE INDEX IF NOT EXISTS idx_ants_is_queen ON ants(is_queen);
CREATE INDEX IF NOT EXISTS idx_colony_resources_colony_id ON colony_resources(colony_id);
CREATE INDEX IF NOT EXISTS idx_buildings_colony_id ON buildings(colony_id);
CREATE INDEX IF NOT EXISTS idx_buildings_position ON buildings(position_x, position_y);
CREATE INDEX IF NOT EXISTS idx_map_tiles_colony_position ON map_tiles(colony_id, x, y);
CREATE INDEX IF NOT EXISTS idx_map_tiles_explored ON map_tiles(is_explored);
CREATE INDEX IF NOT EXISTS idx_battles_colonies ON battles(attacker_colony_id, defender_colony_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_game_events_colony_tick ON game_events(colony_id, game_tick);
CREATE INDEX IF NOT EXISTS idx_evolution_transactions_colony ON evolution_point_transactions(colony_id);
CREATE INDEX IF NOT EXISTS idx_colony_technologies_colony_id ON colony_technologies(colony_id);

-- Statistics and Events indexes
CREATE INDEX IF NOT EXISTS idx_colony_statistics_colony_type ON colony_statistics(colony_id, stat_type);
CREATE INDEX IF NOT EXISTS idx_colony_statistics_category ON colony_statistics(colony_id, stat_category);
CREATE INDEX IF NOT EXISTS idx_colony_statistics_recorded_at ON colony_statistics(colony_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_colony_statistics_game_tick ON colony_statistics(colony_id, game_tick);

CREATE INDEX IF NOT EXISTS idx_colony_events_colony_type ON colony_events(colony_id, event_type);
CREATE INDEX IF NOT EXISTS idx_colony_events_occurred_at ON colony_events(colony_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_colony_events_importance ON colony_events(colony_id, importance_level);
CREATE INDEX IF NOT EXISTS idx_colony_events_game_tick ON colony_events(colony_id, game_tick);

CREATE INDEX IF NOT EXISTS idx_colony_milestones_colony_type ON colony_milestones(colony_id, milestone_type);
CREATE INDEX IF NOT EXISTS idx_colony_milestones_achieved ON colony_milestones(colony_id, is_achieved);

CREATE INDEX IF NOT EXISTS idx_colony_sessions_colony_id ON colony_sessions(colony_id);
CREATE INDEX IF NOT EXISTS idx_colony_sessions_started_at ON colony_sessions(colony_id, started_at);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE colonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ants ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_sessions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow access for now, can be tightened later)
DROP POLICY IF EXISTS "Allow all operations for now" ON users;
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON colonies;
CREATE POLICY "Allow all operations for now" ON colonies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON ants;
CREATE POLICY "Allow all operations for now" ON ants FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON colony_resources;
CREATE POLICY "Allow all operations for now" ON colony_resources FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON buildings;
CREATE POLICY "Allow all operations for now" ON buildings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON map_tiles;
CREATE POLICY "Allow all operations for now" ON map_tiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON technologies;
CREATE POLICY "Allow all operations for now" ON technologies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON colony_technologies;
CREATE POLICY "Allow all operations for now" ON colony_technologies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON evolution_point_transactions;
CREATE POLICY "Allow all operations for now" ON evolution_point_transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON battles;
CREATE POLICY "Allow all operations for now" ON battles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON game_sessions;
CREATE POLICY "Allow all operations for now" ON game_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON game_events;
CREATE POLICY "Allow all operations for now" ON game_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON colony_statistics;
CREATE POLICY "Allow all operations for now" ON colony_statistics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON colony_events;
CREATE POLICY "Allow all operations for now" ON colony_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON colony_milestones;
CREATE POLICY "Allow all operations for now" ON colony_milestones FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for now" ON colony_sessions;
CREATE POLICY "Allow all operations for now" ON colony_sessions FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_colonies_updated_at ON colonies;
CREATE TRIGGER update_colonies_updated_at BEFORE UPDATE ON colonies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ants_updated_at ON ants;
CREATE TRIGGER update_ants_updated_at BEFORE UPDATE ON ants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buildings_updated_at ON buildings;
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 