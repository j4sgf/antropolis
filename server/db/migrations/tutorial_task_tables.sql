-- Migration: Tutorial Task Tracking Tables
-- Part of subtask 22.4: Interactive Tutorial Tasks and Rewards

-- Tutorial task attempts table
CREATE TABLE IF NOT EXISTS tutorial_task_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  step_id VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'in_progress',
  task_data JSONB,
  completion_data JSONB,
  time_spent INTEGER, -- in seconds
  efficiency_score INTEGER, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'failed', 'skipped')),
  CONSTRAINT valid_efficiency CHECK (efficiency_score >= 0 AND efficiency_score <= 100)
);

-- Tutorial task completions table (best attempts per user per step)
CREATE TABLE IF NOT EXISTS tutorial_task_completions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  step_id VARCHAR(50) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  best_time INTEGER, -- best completion time in seconds
  best_efficiency INTEGER, -- best efficiency score
  total_attempts INTEGER DEFAULT 1,
  completion_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, step_id),
  CONSTRAINT valid_best_efficiency CHECK (best_efficiency >= 0 AND best_efficiency <= 100)
);

-- Tutorial rewards table
CREATE TABLE IF NOT EXISTS tutorial_rewards (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  step_id VARCHAR(50) NOT NULL,
  reward_type VARCHAR(50) NOT NULL,
  reward_data JSONB NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_reward_type CHECK (reward_type IN ('step_completion', 'efficiency_bonus', 'speed_bonus', 'group_completion', 'tutorial_completion'))
);

-- Tutorial analytics table
CREATE TABLE IF NOT EXISTS tutorial_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  step_id VARCHAR(50),
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN ('step_started', 'step_completed', 'step_skipped', 'help_requested', 'settings_opened', 'tutorial_reset', 'tutorial_abandoned'))
);

-- Indexes for performance
CREATE INDEX idx_tutorial_attempts_user_step ON tutorial_task_attempts(user_id, step_id);
CREATE INDEX idx_tutorial_attempts_status ON tutorial_task_attempts(status);
CREATE INDEX idx_tutorial_attempts_started_at ON tutorial_task_attempts(started_at);

CREATE INDEX idx_tutorial_completions_user ON tutorial_task_completions(user_id);
CREATE INDEX idx_tutorial_completions_step ON tutorial_task_completions(step_id);
CREATE INDEX idx_tutorial_completions_completed_at ON tutorial_task_completions(completed_at);

CREATE INDEX idx_tutorial_rewards_user ON tutorial_rewards(user_id);
CREATE INDEX idx_tutorial_rewards_claimed ON tutorial_rewards(claimed);
CREATE INDEX idx_tutorial_rewards_earned_at ON tutorial_rewards(earned_at);

CREATE INDEX idx_tutorial_analytics_user ON tutorial_analytics(user_id);
CREATE INDEX idx_tutorial_analytics_event_type ON tutorial_analytics(event_type);
CREATE INDEX idx_tutorial_analytics_timestamp ON tutorial_analytics(timestamp);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tutorial_attempts_updated_at 
  BEFORE UPDATE ON tutorial_task_attempts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorial_completions_updated_at 
  BEFORE UPDATE ON tutorial_task_completions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Tutorial progress view
CREATE OR REPLACE VIEW tutorial_user_progress AS
SELECT 
  u.id as user_id,
  u.username,
  COUNT(tc.step_id) as completed_steps,
  AVG(tc.best_efficiency) as avg_efficiency,
  AVG(tc.best_time) as avg_completion_time,
  SUM(tc.total_attempts) as total_attempts,
  MAX(tc.completed_at) as last_activity
FROM users u
LEFT JOIN tutorial_task_completions tc ON u.id = tc.user_id
GROUP BY u.id, u.username;

-- Tutorial funnel view
CREATE OR REPLACE VIEW tutorial_completion_funnel AS
SELECT 
  step_id,
  COUNT(DISTINCT user_id) as users_reached,
  COUNT(*) as total_completions,
  AVG(best_time) as avg_time,
  AVG(best_efficiency) as avg_efficiency
FROM tutorial_task_completions
GROUP BY step_id
ORDER BY step_id;

-- Tutorial analytics summary view
CREATE OR REPLACE VIEW tutorial_analytics_summary AS
SELECT 
  event_type,
  step_id,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', timestamp) as event_date
FROM tutorial_analytics
GROUP BY event_type, step_id, DATE_TRUNC('day', timestamp)
ORDER BY event_date DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tutorial_task_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tutorial_task_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tutorial_rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tutorial_analytics TO authenticated;
GRANT SELECT ON tutorial_user_progress TO authenticated;
GRANT SELECT ON tutorial_completion_funnel TO authenticated;
GRANT SELECT ON tutorial_analytics_summary TO authenticated;

-- RLS policies
ALTER TABLE tutorial_task_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tutorial data
CREATE POLICY tutorial_attempts_user_policy ON tutorial_task_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY tutorial_completions_user_policy ON tutorial_task_completions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY tutorial_rewards_user_policy ON tutorial_rewards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY tutorial_analytics_user_policy ON tutorial_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Insert default tutorial steps for reference
INSERT INTO tutorial_task_completions (user_id, step_id, completed_at, best_time, best_efficiency, total_attempts)
VALUES 
  -- Example default steps (these would be populated by the application)
  ('00000000-0000-0000-0000-000000000000', 'welcome', NOW(), 30, 100, 1),
  ('00000000-0000-0000-0000-000000000000', 'colony_creation', NOW(), 120, 85, 1),
  ('00000000-0000-0000-0000-000000000000', 'colony_naming', NOW(), 60, 90, 1)
ON CONFLICT (user_id, step_id) DO NOTHING; 