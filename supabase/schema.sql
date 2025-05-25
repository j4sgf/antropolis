-- Antocracy: War of Colonies Database Schema
-- PostgreSQL/Supabase Schema Definition

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (for game saves and progress)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Colonies table (main player entities)
CREATE TABLE colonies (
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ant types/roles enumeration
CREATE TYPE ant_role AS ENUM ('worker', 'soldier', 'forager', 'scout', 'nurse', 'builder');
CREATE TYPE ant_status AS ENUM ('egg', 'larva', 'pupa', 'adult', 'dead');

-- Ants table (individual ants in colonies)
CREATE TABLE ants (
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
CREATE TYPE resource_type AS ENUM ('food', 'wood', 'stone', 'water', 'minerals');

-- Resources table (colony resources)
CREATE TABLE colony_resources (
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
CREATE TYPE building_type AS ENUM (
  'nest_chamber', 'food_storage', 'nursery', 'barracks', 
  'workshop', 'tunnel', 'farm', 'wall', 'watchtower'
);

-- Buildings/Structures table
CREATE TABLE buildings (
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
CREATE TABLE map_tiles (
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
CREATE TABLE technologies (
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

-- Colony tech progress
CREATE TABLE colony_technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES technologies(id),
  
  research_progress INTEGER DEFAULT 0,
  is_researched BOOLEAN DEFAULT false,
  researched_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(colony_id, technology_id)
);

-- Battle system
CREATE TYPE battle_status AS ENUM ('preparing', 'active', 'completed', 'cancelled');
CREATE TYPE battle_outcome AS ENUM ('victory', 'defeat', 'draw');

CREATE TABLE battles (
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
CREATE TABLE game_sessions (
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
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colony_id UUID NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  message TEXT,
  importance INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
  
  game_tick INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_colonies_user_id ON colonies(user_id);
CREATE INDEX idx_colonies_active ON colonies(is_active);
CREATE INDEX idx_ants_colony_id ON ants(colony_id);
CREATE INDEX idx_ants_role ON ants(role);
CREATE INDEX idx_ants_type ON ants(type);
CREATE INDEX idx_ants_status ON ants(status);
CREATE INDEX idx_ants_is_queen ON ants(is_queen);
CREATE INDEX idx_colony_resources_colony_id ON colony_resources(colony_id);
CREATE INDEX idx_buildings_colony_id ON buildings(colony_id);
CREATE INDEX idx_buildings_position ON buildings(position_x, position_y);
CREATE INDEX idx_map_tiles_colony_position ON map_tiles(colony_id, x, y);
CREATE INDEX idx_map_tiles_explored ON map_tiles(is_explored);
CREATE INDEX idx_battles_colonies ON battles(attacker_colony_id, defender_colony_id);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_game_events_colony_tick ON game_events(colony_id, game_tick);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE colonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ants ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own colonies" ON colonies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own colonies" ON colonies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own colonies" ON colonies FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_colonies_updated_at BEFORE UPDATE ON colonies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ants_updated_at BEFORE UPDATE ON ants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 