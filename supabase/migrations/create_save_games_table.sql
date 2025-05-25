-- Create save_games table for cloud save functionality
CREATE TABLE save_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Save metadata
  save_name VARCHAR(100) NOT NULL,
  save_slot INTEGER NOT NULL DEFAULT 1,
  
  -- Save data (compressed JSON)
  save_data JSONB NOT NULL,
  compressed_data TEXT, -- For large saves that exceed JSONB limits
  is_compressed BOOLEAN DEFAULT false,
  
  -- Version information
  game_version VARCHAR(20) NOT NULL,
  save_version INTEGER DEFAULT 1,
  
  -- Save metadata
  save_size INTEGER DEFAULT 0, -- Size in bytes
  checksum VARCHAR(64), -- For data integrity
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, save_slot)
);

-- Indexes for performance
CREATE INDEX idx_save_games_user_id ON save_games(user_id);
CREATE INDEX idx_save_games_user_slot ON save_games(user_id, save_slot);
CREATE INDEX idx_save_games_updated_at ON save_games(updated_at);

-- RLS (Row Level Security) policies
ALTER TABLE save_games ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saves
CREATE POLICY "Users can view own saves" ON save_games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saves" ON save_games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saves" ON save_games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saves" ON save_games FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_save_games_updated_at 
  BEFORE UPDATE ON save_games 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 