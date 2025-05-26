-- Migration: Tutorial System Tables
-- Creates tables for tracking tutorial progress and task completion

-- Tutorial progress table for tracking user progress through the tutorial system
CREATE TABLE IF NOT EXISTS user_tutorial_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Progress tracking
    is_completed BOOLEAN DEFAULT false,
    is_skipped BOOLEAN DEFAULT false,
    current_step VARCHAR(50),
    current_group VARCHAR(50),
    completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Step-specific progress data
    step_progress JSONB DEFAULT '{}'::jsonb,
    
    -- Tutorial settings
    settings JSONB DEFAULT '{
        "showTooltips": true,
        "autoProgress": false,
        "skipIntroduction": false,
        "reminderFrequency": "normal"
    }'::jsonb,
    
    -- Rewards tracking
    rewards_earned JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one tutorial progress record per user
    UNIQUE(user_id)
);

-- Tutorial tasks table for tracking completion of specific tutorial tasks
CREATE TABLE IF NOT EXISTS tutorial_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutorial_step VARCHAR(50) NOT NULL,
    
    -- Task details
    task_name VARCHAR(100) NOT NULL,
    task_description TEXT,
    
    -- Completion tracking
    is_completed BOOLEAN DEFAULT false,
    completion_data JSONB DEFAULT '{}'::jsonb,
    
    -- Rewards for this specific task
    rewards JSONB DEFAULT '{}'::jsonb,
    rewards_claimed BOOLEAN DEFAULT false,
    
    -- Performance metrics
    attempts INTEGER DEFAULT 0,
    completion_time_seconds INTEGER,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one task record per user per step
    UNIQUE(user_id, tutorial_step, task_name)
);

-- Tutorial analytics table for tracking usage patterns and improvements
CREATE TABLE IF NOT EXISTS tutorial_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type VARCHAR(50) NOT NULL, -- 'step_started', 'step_completed', 'step_skipped', 'tutorial_abandoned', etc.
    tutorial_step VARCHAR(50),
    
    -- Event data
    event_data JSONB DEFAULT '{}'::jsonb,
    
    -- Context
    session_id UUID,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial feedback table for collecting user feedback on tutorial steps
CREATE TABLE IF NOT EXISTS tutorial_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tutorial_step VARCHAR(50) NOT NULL,
    
    -- Feedback data
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_helpful BOOLEAN,
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    
    -- Suggestions
    suggested_improvements TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_user ON user_tutorial_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_step ON user_tutorial_progress(current_step);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_completed ON user_tutorial_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_active ON user_tutorial_progress(last_active_at);

CREATE INDEX IF NOT EXISTS idx_tutorial_tasks_user ON tutorial_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_tasks_step ON tutorial_tasks(tutorial_step);
CREATE INDEX IF NOT EXISTS idx_tutorial_tasks_completed ON tutorial_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tutorial_tasks_user_step ON tutorial_tasks(user_id, tutorial_step);

CREATE INDEX IF NOT EXISTS idx_tutorial_analytics_user ON tutorial_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_analytics_event ON tutorial_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_tutorial_analytics_step ON tutorial_analytics(tutorial_step);
CREATE INDEX IF NOT EXISTS idx_tutorial_analytics_created ON tutorial_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_tutorial_feedback_user ON tutorial_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_feedback_step ON tutorial_feedback(tutorial_step);
CREATE INDEX IF NOT EXISTS idx_tutorial_feedback_rating ON tutorial_feedback(rating);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_tutorial_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_tutorial_progress_updated_at 
    BEFORE UPDATE ON user_tutorial_progress 
    FOR EACH ROW EXECUTE FUNCTION update_tutorial_updated_at_column();

CREATE TRIGGER update_tutorial_tasks_updated_at 
    BEFORE UPDATE ON tutorial_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_tutorial_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_tutorial_progress IS 'Tracks user progress through the onboarding tutorial system';
COMMENT ON TABLE tutorial_tasks IS 'Tracks completion of specific tutorial tasks and their rewards';
COMMENT ON TABLE tutorial_analytics IS 'Collects analytics data for tutorial usage patterns and optimization';
COMMENT ON TABLE tutorial_feedback IS 'Stores user feedback on tutorial steps for continuous improvement';

COMMENT ON COLUMN user_tutorial_progress.step_progress IS 'JSON object containing detailed progress data for each tutorial step';
COMMENT ON COLUMN user_tutorial_progress.settings IS 'User preferences for tutorial behavior and display';
COMMENT ON COLUMN user_tutorial_progress.rewards_earned IS 'Array of rewards earned throughout the tutorial';

COMMENT ON COLUMN tutorial_tasks.completion_data IS 'JSON object containing task-specific completion data and metrics';
COMMENT ON COLUMN tutorial_tasks.rewards IS 'JSON object describing rewards for completing this task';
COMMENT ON COLUMN tutorial_tasks.completion_time_seconds IS 'Time taken to complete the task in seconds';

COMMENT ON COLUMN tutorial_analytics.event_data IS 'JSON object containing event-specific data for analytics';
COMMENT ON COLUMN tutorial_analytics.session_id IS 'Session identifier for grouping related events';

-- Insert default tutorial steps reference data (for documentation)
INSERT INTO tutorial_analytics (event_type, tutorial_step, event_data) 
VALUES ('system', 'migration', '{"message": "Tutorial system tables created", "version": "003"}')
ON CONFLICT DO NOTHING; 