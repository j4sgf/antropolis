-- Migration 004: Colony Statistics and History Timeline
-- Implements database schema for Task 17 - Colony Statistics and History Timeline

-- Colony Statistics table for tracking numerical stats
CREATE TABLE colony_statistics (
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
CREATE TABLE colony_events (
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
CREATE TABLE colony_milestones (
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
CREATE TABLE colony_sessions (
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
CREATE INDEX idx_colony_statistics_colony_type ON colony_statistics(colony_id, stat_type);
CREATE INDEX idx_colony_statistics_category ON colony_statistics(colony_id, stat_category);
CREATE INDEX idx_colony_statistics_recorded_at ON colony_statistics(colony_id, recorded_at);
CREATE INDEX idx_colony_statistics_game_tick ON colony_statistics(colony_id, game_tick);

CREATE INDEX idx_colony_events_colony_type ON colony_events(colony_id, event_type);
CREATE INDEX idx_colony_events_occurred_at ON colony_events(colony_id, occurred_at);
CREATE INDEX idx_colony_events_importance ON colony_events(colony_id, importance_level);
CREATE INDEX idx_colony_events_game_tick ON colony_events(colony_id, game_tick);

CREATE INDEX idx_colony_milestones_colony_type ON colony_milestones(colony_id, milestone_type);
CREATE INDEX idx_colony_milestones_achieved ON colony_milestones(colony_id, is_achieved);

CREATE INDEX idx_colony_sessions_colony_id ON colony_sessions(colony_id);
CREATE INDEX idx_colony_sessions_started_at ON colony_sessions(colony_id, started_at);

-- Trigger function to automatically update milestone achievements
CREATE OR REPLACE FUNCTION check_colony_milestones()
RETURNS TRIGGER AS $$
DECLARE
  milestone_record RECORD;
  current_value INTEGER;
BEGIN
  -- Only process for relevant stat types
  IF NEW.stat_type IN ('population', 'food_harvested', 'battles_won', 'structures_built') THEN
    
    -- Check all unachieved milestones for this colony and stat type
    FOR milestone_record IN 
      SELECT * FROM colony_milestones 
      WHERE colony_id = NEW.colony_id 
      AND milestone_type = NEW.stat_type 
      AND is_achieved = false
    LOOP
      
      current_value := COALESCE(NEW.value_int, 0);
      
      -- Check if milestone threshold is met
      IF (milestone_record.threshold_type = 'greater_than' AND current_value > milestone_record.threshold_value) OR
         (milestone_record.threshold_type = 'equal_to' AND current_value = milestone_record.threshold_value) OR
         (milestone_record.threshold_type = 'greater_equal' AND current_value >= milestone_record.threshold_value) THEN
        
        -- Mark milestone as achieved
        UPDATE colony_milestones 
        SET is_achieved = true,
            achieved_at = NEW.recorded_at,
            achieved_game_tick = NEW.game_tick,
            achievement_value = current_value
        WHERE id = milestone_record.id;
        
        -- Create an event for this milestone
        INSERT INTO colony_events (
          colony_id, event_type, event_subtype, title, description, 
          importance_level, event_data, game_tick, occurred_at
        ) VALUES (
          NEW.colony_id, 'milestone', milestone_record.milestone_type,
          'Milestone Achieved: ' || milestone_record.milestone_name,
          milestone_record.description,
          3, -- High importance
          jsonb_build_object(
            'milestone_id', milestone_record.id,
            'threshold_value', milestone_record.threshold_value,
            'achieved_value', current_value
          ),
          NEW.game_tick, NEW.recorded_at
        );
        
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically check milestones
CREATE TRIGGER colony_statistics_milestone_check
  AFTER INSERT OR UPDATE ON colony_statistics
  FOR EACH ROW
  EXECUTE FUNCTION check_colony_milestones();

-- Insert default milestones for new colonies
CREATE OR REPLACE FUNCTION create_default_milestones()
RETURNS TRIGGER AS $$
BEGIN
  -- Population milestones
  INSERT INTO colony_milestones (colony_id, milestone_type, milestone_name, description, threshold_value, threshold_type) VALUES
  (NEW.id, 'population', 'First Colony', 'Reach 25 ants in your colony', 25, 'greater_equal'),
  (NEW.id, 'population', 'Growing Colony', 'Reach 50 ants in your colony', 50, 'greater_equal'),
  (NEW.id, 'population', 'Thriving Colony', 'Reach 100 ants in your colony', 100, 'greater_equal'),
  (NEW.id, 'population', 'Metropolis', 'Reach 250 ants in your colony', 250, 'greater_equal'),
  (NEW.id, 'population', 'Empire', 'Reach 500 ants in your colony', 500, 'greater_equal');
  
  -- Food harvesting milestones
  INSERT INTO colony_milestones (colony_id, milestone_type, milestone_name, description, threshold_value, threshold_type) VALUES
  (NEW.id, 'food_harvested', 'First Harvest', 'Collect 100 food units', 100, 'greater_equal'),
  (NEW.id, 'food_harvested', 'Experienced Foragers', 'Collect 1,000 food units', 1000, 'greater_equal'),
  (NEW.id, 'food_harvested', 'Master Gatherers', 'Collect 10,000 food units', 10000, 'greater_equal'),
  (NEW.id, 'food_harvested', 'Food Empire', 'Collect 100,000 food units', 100000, 'greater_equal');
  
  -- Combat milestones
  INSERT INTO colony_milestones (colony_id, milestone_type, milestone_name, description, threshold_value, threshold_type) VALUES
  (NEW.id, 'battles_won', 'First Victory', 'Win your first battle', 1, 'greater_equal'),
  (NEW.id, 'battles_won', 'Seasoned Warriors', 'Win 5 battles', 5, 'greater_equal'),
  (NEW.id, 'battles_won', 'War Veterans', 'Win 15 battles', 15, 'greater_equal'),
  (NEW.id, 'battles_won', 'Conquerors', 'Win 50 battles', 50, 'greater_equal');
  
  -- Construction milestones
  INSERT INTO colony_milestones (colony_id, milestone_type, milestone_name, description, threshold_value, threshold_type) VALUES
  (NEW.id, 'structures_built', 'First Builder', 'Build your first structure', 1, 'greater_equal'),
  (NEW.id, 'structures_built', 'Infrastructure Developer', 'Build 5 structures', 5, 'greater_equal'),
  (NEW.id, 'structures_built', 'Master Architect', 'Build 15 structures', 15, 'greater_equal'),
  (NEW.id, 'structures_built', 'City Planner', 'Build 30 structures', 30, 'greater_equal');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default milestones for new colonies
CREATE TRIGGER colony_default_milestones
  AFTER INSERT ON colonies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_milestones();

-- Views for easy access to statistics

-- Recent statistics view
CREATE VIEW recent_colony_statistics AS
SELECT 
  cs.*,
  c.name as colony_name,
  c.user_id
FROM colony_statistics cs
JOIN colonies c ON cs.colony_id = c.id
WHERE cs.recorded_at >= NOW() - INTERVAL '24 hours'
ORDER BY cs.recorded_at DESC;

-- Colony timeline view
CREATE VIEW colony_timeline AS
SELECT 
  ce.*,
  c.name as colony_name,
  c.user_id
FROM colony_events ce
JOIN colonies c ON ce.colony_id = c.id
ORDER BY ce.occurred_at DESC;

-- Achievement progress view
CREATE VIEW colony_achievements AS
SELECT 
  cm.*,
  c.name as colony_name,
  c.user_id,
  CASE 
    WHEN cm.is_achieved THEN 100.0
    ELSE 0.0 
  END as progress_percentage
FROM colony_milestones cm
JOIN colonies c ON cm.colony_id = c.id
ORDER BY cm.achieved_at DESC NULLS LAST, cm.milestone_type, cm.threshold_value; 