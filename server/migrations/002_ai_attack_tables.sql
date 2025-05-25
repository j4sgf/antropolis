-- Migration: AI Attack System Tables
-- Creates tables for tracking AI attacks and battle history

-- AI attacks table for tracking scheduled and ongoing attacks
CREATE TABLE IF NOT EXISTS ai_attacks (
    id VARCHAR(255) PRIMARY KEY,
    attacker_id UUID REFERENCES ai_colonies(id) ON DELETE CASCADE,
    target_id UUID REFERENCES colonies(id) ON DELETE CASCADE,
    attack_type VARCHAR(50) NOT NULL CHECK (attack_type IN ('probe', 'skirmish', 'assault', 'raid')),
    forces_sent INTEGER NOT NULL DEFAULT 0,
    estimated_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'incoming' CHECK (status IN ('incoming', 'resolved', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    battle_outcome JSONB
);

-- Battle history table for storing completed battles
CREATE TABLE IF NOT EXISTS battle_history (
    id VARCHAR(255) PRIMARY KEY,
    attacker_id UUID REFERENCES colonies(id) ON DELETE CASCADE,
    defender_id UUID REFERENCES colonies(id) ON DELETE CASCADE,
    battle_type VARCHAR(50) NOT NULL CHECK (battle_type IN ('player_raid', 'ai_attack', 'defense')),
    outcome JSONB NOT NULL,
    forces_involved JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_attacks_target ON ai_attacks(target_id);
CREATE INDEX IF NOT EXISTS idx_ai_attacks_status ON ai_attacks(status);
CREATE INDEX IF NOT EXISTS idx_ai_attacks_arrival ON ai_attacks(estimated_arrival);

CREATE INDEX IF NOT EXISTS idx_battle_history_attacker ON battle_history(attacker_id);
CREATE INDEX IF NOT EXISTS idx_battle_history_defender ON battle_history(defender_id);
CREATE INDEX IF NOT EXISTS idx_battle_history_timestamp ON battle_history(timestamp);

-- Comments for documentation
COMMENT ON TABLE ai_attacks IS 'Tracks scheduled AI attacks on player and AI colonies';
COMMENT ON TABLE battle_history IS 'Stores completed battle records for historical tracking and statistics';

COMMENT ON COLUMN ai_attacks.attack_type IS 'Type of attack: probe (reconnaissance), skirmish (small raid), assault (medium attack), raid (large attack)';
COMMENT ON COLUMN ai_attacks.forces_sent IS 'Number of military units committed to the attack';
COMMENT ON COLUMN ai_attacks.battle_outcome IS 'JSON containing detailed battle simulation results';

COMMENT ON COLUMN battle_history.outcome IS 'JSON containing battle results, casualties, and performance metrics';
COMMENT ON COLUMN battle_history.forces_involved IS 'JSON containing army compositions of both sides'; 